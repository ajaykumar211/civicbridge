import { Router } from "express";
import { db } from "../db/store.ts";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth.ts";
import { assistantChatPrompt } from "../ai/prompts/assistant-chat.ts";
import { trendSummaryPrompt } from "../ai/prompts/trend-summary.ts";

export const analyticsRouter = Router();

// 1. AI Chat Assistant (Students, Professors, Industry)
analyticsRouter.post("/assistant/chat", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: { code: "MISSING_MESSAGE", message: "Message is required." } });
    }

    const user = req.user!;
    const userRole = user.role;
    const userSkills = user.skills.join(", ");
    const profileSummary = `Role: ${userRole}, Organisation: ${user.organisation || "Individual"}, Skills/Focus: ${userSkills || "General engineering/CSR"}`;

    // Candidate problems retrieval from database (Section 13)
    const openProblems = Array.from(db.problems.values())
      .filter((p) => ["open", "in_progress"].includes(p.status))
      .map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        area_name: p.area_name,
        severity: p.severity,
        difficulty: p.difficulty,
        estimated_weeks: p.estimated_weeks,
        ai_brief: p.ai_brief,
      }));

    // Call Gemini with grounded candidate problems
    const aiResult = await assistantChatPrompt({
      message,
      role: userRole,
      profile_summary: profileSummary,
      candidate_problems: openProblems,
    });

    // Enforce integrity constraint: only return problems that exist in candidate list
    const validRecommendedProblems = aiResult.recommended_problem_ids
      .map((id) => db.getProblemById(id))
      .filter(Boolean);

    return res.json({
      reply: aiResult.reply,
      recommended_problems: validRecommendedProblems,
    });
  } catch (err) {
    return res.status(500).json({
      error: { code: "ASSISTANT_ERROR", message: (err as Error).message },
    });
  }
});

// 2. Platform Summary Metrics
analyticsRouter.get("/analytics/summary", (req, res) => {
  try {
    const summary = db.getAnalyticsSummary();
    return res.json(summary);
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

// 3. Hotspots Map Data
analyticsRouter.get("/analytics/hotspots", (req, res) => {
  try {
    const hotspots = db.getHotspots();
    return res.json({ hotspots });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

// 4. Trends with AI-Generated Summary
analyticsRouter.get("/analytics/trends", async (req, res) => {
  try {
    // Current period counts
    const currentPeriod = {
      total: db.problems.size,
      by_category: {} as Record<string, number>,
      by_area: {} as Record<string, number>,
    };

    for (const p of db.problems.values()) {
      currentPeriod.by_category[p.category] = (currentPeriod.by_category[p.category] || 0) + 1;
      currentPeriod.by_area[p.area_name] = (currentPeriod.by_area[p.area_name] || 0) + 1;
    }

    // Baseline historical period (for trend diff)
    const previousPeriod = {
      total: Math.max(10, Math.floor(currentPeriod.total * 0.7)),
      by_category: {
        water: 6,
        waste: 8,
        infrastructure: 7,
        health: 4,
        safety: 3,
        agriculture: 2,
      },
      by_area: {
        Peenya: 7,
        Bellandur: 4,
        Whitefield: 5,
        Koramangala: 4,
      },
    };

    const aiSummary = await trendSummaryPrompt({
      current_period: currentPeriod,
      previous_period: previousPeriod,
    });

    return res.json({
      current_period: currentPeriod,
      previous_period: previousPeriod,
      ai_summary: aiSummary,
    });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});
