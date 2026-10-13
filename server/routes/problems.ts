import { Router } from "express";
import crypto from "crypto";
import { db } from "../db/store.ts";
import { AuthenticatedRequest, requireAuth, requireVerifier } from "../middleware/auth.ts";
import { validateBody } from "../middleware/validate.ts";
import { createProblemSchema, commentSchema, verificationSchema, ProblemDifficulty } from "../../shared/schemas.ts";
import { structureProblemPrompt } from "../ai/prompts/structure-problem.ts";
import { spamCheckPrompt } from "../ai/prompts/spam-check.ts";
import { difficultyAndPlanPrompt } from "../ai/prompts/difficulty-and-plan.ts";
import { embedText, cosineSimilarity } from "../ai/embeddings.ts";

export const problemsRouter = Router();

// 1. Get Problems Feed
problemsRouter.get("/", (req: AuthenticatedRequest, res) => {
  try {
    const { search, category, status, severity, verified, area, sort, page, limit } = req.query;

    const parsedVerified =
      verified === "true" ? true : verified === "false" ? false : undefined;

    const result = db.getProblems({
      search: search as string,
      category: category as string,
      status: status as string,
      severity: severity as string,
      verified: parsedVerified,
      area: area as string,
      sort: sort as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50,
      currentUserId: req.userId,
      currentUserRole: req.userRole,
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

// 2. AI Preview Before Submit (Section 17: "Always show the AI-drafted brief to the user for editing before final submit")
problemsRouter.post("/preview-ai", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, description, language, address_text, category } = req.body;
    if (!title || !description) {
      return res.status(400).json({
        error: { code: "MISSING_FIELDS", message: "Title and description are required for AI analysis." },
      });
    }

    // Heuristics checks
    const hash = crypto.createHash("sha256").update(description.toLowerCase().trim()).digest("hex");
    let contentHashMatch = false;
    for (const p of db.problems.values()) {
      if (p.content_hash === hash) {
        contentHashMatch = true;
        break;
      }
    }

    const isShort = description.trim().split(/\s+/).length < 5;
    const bannedWords = ["viagra", "casino", "crypto giveaway", "instant loan", "whatsapp now"];
    const hasBannedWords = bannedWords.some((w) => description.toLowerCase().includes(w));

    // Parallel AI structuring and spam check
    const [structured, spamResult, difficultyPlan] = await Promise.all([
      structureProblemPrompt({
        title,
        description,
        language,
        location_text: address_text,
      }),
      spamCheckPrompt({
        title,
        description,
        poster_history_summary: `User reputation: ${req.user?.reputation || 0}`,
        rule_checks: {
          is_repeated: false,
          is_short: isShort,
          has_banned_words: hasBannedWords,
          content_hash_match: contentHashMatch,
        },
      }),
      difficultyAndPlanPrompt({
        brief: description,
        category: category || "infrastructure",
        severity: "medium",
      }),
    ]);

    // Check for near duplicates among existing problems
    const similarProblems: Array<{ id: string; title: string; area_name: string; similarity: number }> = [];
    const qDesc = description.toLowerCase();
    for (const p of db.problems.values()) {
      if (["pending_review", "rejected"].includes(p.status)) continue;
      // Word overlap heuristic
      const wordsA = new Set(title.toLowerCase().split(/\s+/));
      const wordsB = p.title.toLowerCase().split(/\s+/);
      const overlap = wordsB.filter((w) => wordsA.has(w)).length;
      if (overlap >= 3 || (p.content_hash && p.content_hash === hash)) {
        similarProblems.push({
          id: p.id,
          title: p.title,
          area_name: p.area_name,
          similarity: p.content_hash === hash ? 1.0 : Math.min(0.9, 0.4 + overlap * 0.15),
        });
      }
    }

    return res.json({
      ai_brief: structured.brief,
      category: structured.category,
      severity: structured.severity,
      summary_one_line: structured.summary_one_line,
      difficulty: difficultyPlan.difficulty,
      estimated_weeks: difficultyPlan.estimated_weeks,
      spam_score: spamResult.spam_score,
      spam_flags: spamResult.flags,
      reasoning: spamResult.reasoning,
      similar_problems: similarProblems.slice(0, 3),
    });
  } catch (err) {
    return res.status(500).json({
      error: { code: "AI_ANALYSIS_FAILED", message: (err as Error).message },
    });
  }
});

// 3. Create Problem (Full pipeline: structure, spam check, duplicate check, difficulty)
problemsRouter.post("/", requireAuth, validateBody(createProblemSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const data = req.body;
    const userId = req.userId!;

    // Rule checks
    const hash = crypto.createHash("sha256").update(data.description.toLowerCase().trim()).digest("hex");
    let duplicateOfId: string | null = null;
    for (const p of db.problems.values()) {
      if (p.content_hash === hash) {
        duplicateOfId = p.id;
        break;
      }
    }

    const isShort = data.description.trim().split(/\s+/).length < 6;
    const bannedWords = ["viagra", "casino", "free loan", "whatsapp now"];
    const hasBannedWords = bannedWords.some((w) => data.description.toLowerCase().includes(w));

    // Run AI checks if not provided or pre-reviewed
    const [structured, spamResult, difficultyPlan, embedding] = await Promise.all([
      structureProblemPrompt({
        title: data.title,
        description: data.description,
        language: data.language,
        location_text: data.address_text,
      }),
      spamCheckPrompt({
        title: data.title,
        description: data.description,
        poster_history_summary: `User reputation: ${req.user?.reputation || 0}`,
        rule_checks: {
          is_repeated: Boolean(duplicateOfId),
          is_short: isShort,
          has_banned_words: hasBannedWords,
          content_hash_match: Boolean(duplicateOfId),
        },
      }),
      difficultyAndPlanPrompt({
        brief: data.ai_brief || data.description,
        category: data.category,
        severity: data.severity || "medium",
      }),
      embedText(data.description),
    ]);

    // Spam score determination:
    // "Scores of 0.7 or above go to pending_review for admin moderation; below that, the problem is published as open."
    const spamScore = spamResult.spam_score;
    const isSpammy = spamScore >= 0.7 || hasBannedWords;
    const status = isSpammy ? "pending_review" : "open";

    const problem = db.createProblem({
      created_by: userId,
      title: data.title,
      description: data.description,
      ai_brief: data.ai_brief || structured.brief,
      category: data.category || structured.category,
      severity: data.severity || structured.severity,
      difficulty: difficultyPlan.difficulty as ProblemDifficulty,
      estimated_weeks: difficultyPlan.estimated_weeks,
      latitude: data.latitude || 12.9716,
      longitude: data.longitude || 77.5946,
      address_text: data.address_text || "",
      area_name: data.area_name || "Central",
      language: data.language || "en",
      photo_urls: data.photo_urls || [],
      status,
      verified: false,
      spam_score: spamScore,
      spam_flags: spamResult.flags,
      duplicate_of: duplicateOfId,
      embedding,
    });

    return res.status(201).json({
      problem,
      is_pending_review: isSpammy,
      spam_score: spamScore,
      spam_flags: spamResult.flags,
    });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

// 4. Get Problem by ID
problemsRouter.get("/:id", (req: AuthenticatedRequest, res) => {
  try {
    const problem = db.getProblemById(req.params.id, req.userId, req.userRole);
    if (!problem) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Problem not found or pending review." },
      });
    }

    const creator = db.getUserById(problem.created_by);
    const hasSupported = req.userId ? db.hasUserSupported(req.userId, problem.id) : false;
    const verifications = db.getVerifications(problem.id);
    const sponsorships = db.getSponsorshipsForProblem(problem.id, req.userId, req.userRole);
    const project = db.getProjectByProblemId(problem.id);

    return res.json({
      problem: {
        ...problem,
        creator: creator ? { id: creator.id, name: creator.name, organisation: creator.organisation } : null,
      },
      has_supported: hasSupported,
      verifications,
      sponsorships,
      project: project
        ? {
            id: project.id,
            status: project.status,
            beneficiaries_count: project.beneficiaries_count,
            team: db.getTeamById(project.team_id),
          }
        : null,
    });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

// 5. Update Problem
problemsRouter.patch("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const updated = db.updateProblem(req.params.id, req.body, req.userId!, req.userRole!);
    return res.json({ problem: updated });
  } catch (err) {
    return res.status(403).json({
      error: { code: "FORBIDDEN", message: (err as Error).message },
    });
  }
});

// 6. Support Problem (One-click "I face this too")
problemsRouter.post("/:id/support", requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const result = db.supportProblem(req.userId!, req.params.id);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({
      error: { code: "SUPPORT_ERROR", message: (err as Error).message },
    });
  }
});

problemsRouter.delete("/:id/support", requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const result = db.unsupportProblem(req.userId!, req.params.id);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({
      error: { code: "UNSUPPORT_ERROR", message: (err as Error).message },
    });
  }
});

// 7. Comments
problemsRouter.get("/:id/comments", (req, res) => {
  try {
    const comments = db.getComments(req.params.id);
    return res.json({ comments });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

problemsRouter.post("/:id/comments", requireAuth, validateBody(commentSchema), (req: AuthenticatedRequest, res) => {
  try {
    const comment = db.addComment(req.params.id, req.userId!, req.body.body);
    return res.status(201).json({ comment });
  } catch (err) {
    return res.status(400).json({
      error: { code: "COMMENT_ERROR", message: (err as Error).message },
    });
  }
});

// 8. Ground Verification (can_verify or admin)
problemsRouter.post("/:id/verify", requireVerifier, validateBody(verificationSchema), (req: AuthenticatedRequest, res) => {
  try {
    const verification = db.verifyProblem(req.params.id, req.userId!, req.body.note || "");
    return res.status(201).json({ verification, verified: true });
  } catch (err) {
    return res.status(403).json({
      error: { code: "VERIFICATION_FAILED", message: (err as Error).message },
    });
  }
});

// 9. Similar Problems & Duplicate Detection
problemsRouter.get("/:id/similar", async (req, res) => {
  try {
    const problem = db.getProblemById(req.params.id);
    if (!problem) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Problem not found" } });
    }

    const similar: Array<{ id: string; title: string; category: string; status: string; similarity: number }> = [];

    for (const other of db.problems.values()) {
      if (other.id === problem.id || ["pending_review", "rejected"].includes(other.status)) continue;

      let score = 0;
      if (other.category === problem.category) score += 0.3;
      if (other.area_name === problem.area_name) score += 0.2;

      // Word overlap
      const wordsA = new Set(problem.title.toLowerCase().split(/\s+/));
      const wordsB = other.title.toLowerCase().split(/\s+/);
      const overlap = wordsB.filter((w) => wordsA.has(w)).length;
      score += Math.min(0.4, overlap * 0.1);

      if (problem.embedding && other.embedding && problem.embedding.length && other.embedding.length) {
        const cos = cosineSimilarity(problem.embedding, other.embedding);
        score = cos * 0.7 + score * 0.3;
      }

      if (score >= 0.45 || other.duplicate_of === problem.id || problem.duplicate_of === other.id) {
        similar.push({
          id: other.id,
          title: other.title,
          category: other.category,
          status: other.status,
          similarity: Math.round(score * 100) / 100,
        });
      }
    }

    similar.sort((a, b) => b.similarity - a.similarity);
    return res.json({ similar: similar.slice(0, 5) });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});
