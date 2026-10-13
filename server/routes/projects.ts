import { Router } from "express";
import { db } from "../db/store.ts";
import { AuthenticatedRequest, requireAuth, requireRole, requireVerifier } from "../middleware/auth.ts";
import { validateBody } from "../middleware/validate.ts";
import { createTeamSchema, addTeamMemberSchema, claimProblemSchema, milestoneSchema, proofSchema } from "../../shared/schemas.ts";
import { difficultyAndPlanPrompt } from "../ai/prompts/difficulty-and-plan.ts";
import { impactSummaryPrompt } from "../ai/prompts/impact-summary.ts";

export const projectsRouter = Router();

// 1. Create Team
projectsRouter.post("/teams", requireAuth, validateBody(createTeamSchema), (req: AuthenticatedRequest, res) => {
  try {
    const team = db.createTeam(req.body.name, req.body.institution, req.userId!);
    return res.status(201).json({ team });
  } catch (err) {
    return res.status(400).json({
      error: { code: "CREATE_TEAM_ERROR", message: (err as Error).message },
    });
  }
});

// 2. Add Team Member
projectsRouter.post("/teams/:id/members", requireAuth, validateBody(addTeamMemberSchema), (req: AuthenticatedRequest, res) => {
  try {
    db.addTeamMember(req.params.id, req.body.user_id, req.body.member_role);
    const members = db.getTeamMembers(req.params.id);
    return res.json({ members });
  } catch (err) {
    return res.status(400).json({
      error: { code: "ADD_MEMBER_ERROR", message: (err as Error).message },
    });
  }
});

// 3. Claim Problem (Student or Professor)
projectsRouter.post(
  "/problems/:id/claim",
  requireAuth,
  requireRole("student", "professor"),
  validateBody(claimProblemSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const problemId = req.params.id;
      const problem = db.getProblemById(problemId);
      if (!problem) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Problem not found" } });
      }

      // Check or create team
      let teamId = req.body.team_id;
      if (!teamId) {
        const teamName = req.body.team_name || `${req.user?.name || "Student"} Innovation Lab`;
        const institution = req.body.institution || req.user?.organisation || "University Engineering Faculty";
        const team = db.createTeam(teamName, institution, req.userId!);
        teamId = team.id;
      }

      // AI Draft Project Plan with 4-6 verifiable milestones
      let milestonesToCreate = req.body.custom_milestones;
      let planJson: any[] = [];

      if (!milestonesToCreate || milestonesToCreate.length === 0) {
        const aiPlan = await difficultyAndPlanPrompt({
          brief: problem.ai_brief || problem.description,
          category: problem.category,
          severity: problem.severity,
        });
        milestonesToCreate = aiPlan.milestones;
        planJson = aiPlan.milestones;
      } else {
        planJson = milestonesToCreate;
      }

      const project = db.claimProblem(problemId, teamId, planJson, milestonesToCreate, req.userId!);
      const milestones = db.getMilestones(project.id);

      return res.status(201).json({
        project,
        milestones,
        team: db.getTeamById(teamId),
      });
    } catch (err) {
      return res.status(400).json({
        error: { code: "CLAIM_ERROR", message: (err as Error).message },
      });
    }
  }
);

// 4. Get Project Workspace
projectsRouter.get("/projects/:id", (req: AuthenticatedRequest, res) => {
  try {
    const project = db.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Project not found" } });
    }

    const milestones = db.getMilestones(project.id);
    const milestonesWithProofs = milestones.map((m) => ({
      ...m,
      proofs: db.getProofs(m.id),
    }));

    const members = db.getTeamMembers(project.team_id);
    const sponsorships = project.problem_id
      ? db.getSponsorshipsForProblem(project.problem_id, req.userId, req.userRole)
      : [];

    return res.json({
      project,
      milestones: milestonesWithProofs,
      team_members: members,
      sponsorships,
    });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

// 5. Add Milestone to Project
projectsRouter.post(
  "/projects/:id/milestones",
  requireAuth,
  validateBody(milestoneSchema),
  (req: AuthenticatedRequest, res) => {
    try {
      const project = db.getProjectById(req.params.id);
      if (!project) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Project not found" } });

      const newMilestoneId = `m${Date.now()}`;
      const milestone = {
        id: newMilestoneId,
        project_id: project.id,
        title: req.body.title,
        description: req.body.description,
        due_date: req.body.due_date,
        status: "pending" as const,
        order_index: req.body.order_index || 0,
      };
      db.milestones.set(newMilestoneId, milestone);

      return res.status(201).json({ milestone });
    } catch (err) {
      return res.status(400).json({
        error: { code: "ADD_MILESTONE_ERROR", message: (err as Error).message },
      });
    }
  }
);

// 6. Update Milestone
projectsRouter.patch("/milestones/:id", requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const updated = db.updateMilestone(req.params.id, req.body, req.userId!, req.userRole!);
    return res.json({ milestone: updated });
  } catch (err) {
    return res.status(400).json({
      error: { code: "UPDATE_MILESTONE_ERROR", message: (err as Error).message },
    });
  }
});

// 7. Upload Proof (Section 7: "Every milestone needs at least one proof upload before it can be submitted")
projectsRouter.post("/milestones/:id/proofs", requireAuth, validateBody(proofSchema), (req: AuthenticatedRequest, res) => {
  try {
    const { file_url, file_type, note } = req.body;
    const proof = db.addProof(req.params.id, req.userId!, file_url, file_type, note || "");
    const updatedMilestone = db.milestones.get(req.params.id);

    return res.status(201).json({ proof, milestone: updatedMilestone });
  } catch (err) {
    return res.status(400).json({
      error: { code: "PROOF_UPLOAD_ERROR", message: (err as Error).message },
    });
  }
});

// 8. Verify Milestone (Verifier, Mentor, or Admin)
projectsRouter.post("/milestones/:id/verify", requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const updated = db.updateMilestone(req.params.id, { status: "verified" }, req.userId!, req.userRole!);
    return res.json({ milestone: updated, verified: true });
  } catch (err) {
    return res.status(403).json({
      error: { code: "VERIFY_ERROR", message: (err as Error).message },
    });
  }
});

// 9. Complete Project (Triggers AI impact evaluation, certificate generation, and badges)
projectsRouter.post("/projects/:id/complete", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const project = db.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Project not found" } });

    const problem = db.getProblemById(project.problem_id);
    if (!problem) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Problem not found" } });

    const milestones = db.getMilestones(project.id);
    const unverified = milestones.filter((m) => m.status !== "verified");

    // Prepare milestone summary for AI impact assessment
    const milestoneSummary = milestones.map((m) => ({
      title: m.title,
      description: m.description,
      proof_notes: db.getProofs(m.id).map((p) => p.note).join("; "),
      verified: m.status === "verified",
    }));

    const aiImpact = await impactSummaryPrompt({
      problem_title: problem.title,
      category: problem.category,
      area_name: problem.area_name,
      milestones: milestoneSummary,
    });

    const beneficiariesEstimate = req.body.beneficiaries_count || 1200;
    const impactSummaryText = req.body.impact_summary || aiImpact.impact_summary;

    const result = db.completeProject(project.id, impactSummaryText, beneficiariesEstimate, req.userId!, req.userRole!);

    return res.json({
      success: true,
      project: result.project,
      certificates: result.certificates,
      ai_reasoning: aiImpact.beneficiaries_estimate_reasoning,
    });
  } catch (err) {
    return res.status(400).json({
      error: { code: "COMPLETE_ERROR", message: (err as Error).message },
    });
  }
});
