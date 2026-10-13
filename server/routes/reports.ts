import { Router } from "express";
import { db } from "../db/store.ts";
import { AuthenticatedRequest, requireAuth, requireRole } from "../middleware/auth.ts";
import { validateBody } from "../middleware/validate.ts";
import { reportRequestSchema } from "../../shared/schemas.ts";
import { csrNarrativePrompt } from "../ai/prompts/csr-narrative.ts";

export const reportsRouter = Router();

// 1. Generate Auto CSR Report (Industry Users)
reportsRouter.post(
  "/reports/csr",
  requireAuth,
  requireRole("industry"),
  validateBody(reportRequestSchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { period_start, period_end } = req.body;
      const sponsorId = req.userId!;
      const sponsor = req.user!;

      const userSponsorships = db.getUserSponsorships(sponsorId);

      // Filter sponsorships within or active in period
      const relevantSponsorships = userSponsorships.filter((sp) => {
        const d = sp.created_at;
        return d >= period_start && d <= period_end;
      });

      // Calculate totals
      let totalFunding = 0;
      let totalBeneficiaries = 0;
      const sponsoredProjects: Array<{
        title: string;
        category: string;
        area_name: string;
        status: string;
        beneficiaries: number;
        impact_summary?: string;
      }> = [];

      for (const sp of relevantSponsorships) {
        if (sp.type === "funding" && sp.amount) {
          totalFunding += Number(sp.amount);
        }
        const problem = db.getProblemById(sp.problem_id);
        const project = sp.project_id ? db.getProjectById(sp.project_id) : undefined;
        const bCount = project?.beneficiaries_count || (problem?.status === "solved" ? 650 : 250);
        totalBeneficiaries += bCount;

        if (problem) {
          sponsoredProjects.push({
            title: problem.title,
            category: problem.category,
            area_name: problem.area_name,
            status: project?.status || problem.status,
            beneficiaries: bCount,
            impact_summary: project?.impact_summary,
          });
        }
      }

      // If no sponsorships found in custom range, fallback gracefully to all sponsor projects
      if (sponsoredProjects.length === 0) {
        for (const sp of userSponsorships) {
          if (sp.type === "funding" && sp.amount) totalFunding += Number(sp.amount);
          const problem = db.getProblemById(sp.problem_id);
          const project = sp.project_id ? db.getProjectById(sp.project_id) : undefined;
          const bCount = project?.beneficiaries_count || 500;
          totalBeneficiaries += bCount;
          if (problem) {
            sponsoredProjects.push({
              title: problem.title,
              category: problem.category,
              area_name: problem.area_name,
              status: project?.status || problem.status,
              beneficiaries: bCount,
              impact_summary: project?.impact_summary,
            });
          }
        }
      }

      // AI-drafted CSR compliance narrative
      const aiNarrative = await csrNarrativePrompt({
        sponsor_name: sponsor.organisation || sponsor.name,
        period_start,
        period_end,
        total_funding: totalFunding,
        total_problems_sponsored: sponsoredProjects.length,
        total_beneficiaries: totalBeneficiaries,
        projects: sponsoredProjects,
      });

      const reportContent = {
        sponsor_name: sponsor.organisation || sponsor.name,
        period_start,
        period_end,
        total_funding: totalFunding,
        total_problems_sponsored: sponsoredProjects.length,
        total_beneficiaries: totalBeneficiaries,
        projects: sponsoredProjects,
        narrative: aiNarrative,
      };

      const savedReport = db.createCsrReport(
        sponsorId,
        period_start,
        period_end,
        reportContent,
        aiNarrative.executive_summary
      );

      return res.status(201).json({ report: savedReport });
    } catch (err) {
      return res.status(500).json({
        error: { code: "CSR_REPORT_ERROR", message: (err as Error).message },
      });
    }
  }
);

// 2. Get Sponsor CSR Reports
reportsRouter.get("/reports", requireAuth, requireRole("industry"), (req: AuthenticatedRequest, res) => {
  try {
    const list = db.getCsrReports(req.userId!);
    return res.json({ reports: list });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

// 3. Get Certificate by Code (Public verification route)
reportsRouter.get("/certificates/:code", (req, res) => {
  try {
    const cert = db.getCertificateByCode(req.params.code);
    if (!cert) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Certificate not found or verification code invalid." },
      });
    }
    return res.json({ certificate: cert, verified: true });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

// 4. Leaderboards
reportsRouter.get("/leaderboards/:type", (req, res) => {
  try {
    const type = req.params.type as "teams" | "universities" | "sponsors";
    if (!["teams", "universities", "sponsors"].includes(type)) {
      return res.status(400).json({ error: { code: "INVALID_TYPE", message: "Type must be teams, universities, or sponsors." } });
    }
    const data = db.getLeaderboards(type);
    return res.json({ leaderboards: data });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

// 5. In-App Notifications
reportsRouter.get("/notifications", requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const notifications = db.getNotifications(req.userId!);
    return res.json({ notifications });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

reportsRouter.patch("/notifications/:id/read", requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const success = db.markNotificationRead(req.params.id, req.userId!);
    return res.json({ success });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

// 6. User Badges
reportsRouter.get("/badges/me", requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const badges = db.getUserBadges(req.userId!);
    const certs = db.getUserCertificates(req.userId!);
    return res.json({ badges, certificates: certs });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});
