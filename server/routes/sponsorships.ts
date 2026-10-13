import { Router } from "express";
import { db } from "../db/store.ts";
import { AuthenticatedRequest, requireAuth, requireRole } from "../middleware/auth.ts";
import { validateBody } from "../middleware/validate.ts";
import { sponsorSchema } from "../../shared/schemas.ts";

export const sponsorshipsRouter = Router();

// 1. Sponsor a Problem
sponsorshipsRouter.post(
  "/problems/:id/sponsor",
  requireAuth,
  requireRole("industry"),
  validateBody(sponsorSchema),
  (req: AuthenticatedRequest, res) => {
    try {
      const problemId = req.params.id;
      const problem = db.getProblemById(problemId);
      if (!problem) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Problem not found" } });

      const project = db.getProjectByProblemId(problemId);

      const sponsorship = db.createSponsorship({
        sponsor_id: req.userId!,
        problem_id: problemId,
        project_id: project?.id || null,
        type: req.body.type,
        amount: req.body.amount,
        note: req.body.note,
      });

      return res.status(201).json({ sponsorship });
    } catch (err) {
      return res.status(400).json({
        error: { code: "SPONSOR_ERROR", message: (err as Error).message },
      });
    }
  }
);

// 2. Get My Sponsorships (Industry Dashboard)
sponsorshipsRouter.get("/me/sponsorships", requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const list = db.getUserSponsorships(req.userId!);
    const enriched = list.map((sp) => {
      const problem = db.getProblemById(sp.problem_id);
      const project = sp.project_id ? db.getProjectById(sp.project_id) : undefined;
      return {
        ...sp,
        problem_title: problem?.title || "Civic Problem",
        problem_area: problem?.area_name || "Regional",
        project_status: project?.status || "open",
        beneficiaries: project?.beneficiaries_count || 0,
      };
    });
    return res.json({ sponsorships: enriched });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

// 3. Update Sponsorship
sponsorshipsRouter.patch("/sponsorships/:id", requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const updated = db.updateSponsorship(req.params.id, req.body);
    return res.json({ sponsorship: updated });
  } catch (err) {
    return res.status(400).json({
      error: { code: "UPDATE_ERROR", message: (err as Error).message },
    });
  }
});
