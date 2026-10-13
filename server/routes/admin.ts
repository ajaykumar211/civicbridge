import { Router } from "express";
import { db } from "../db/store.ts";
import { AuthenticatedRequest, requireRole } from "../middleware/auth.ts";

export const adminRouter = Router();

// Only admin role allowed
adminRouter.use(requireRole("admin"));

// 1. Get Moderation Queue
adminRouter.get("/queue", (req: AuthenticatedRequest, res) => {
  try {
    const queue = db.getAdminQueue("admin");
    return res.json(queue);
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

// 2. Moderate Problem (Approve, Reject, Merge)
adminRouter.patch("/problems/:id", (req: AuthenticatedRequest, res) => {
  try {
    const problemId = req.params.id;
    const { action, duplicate_of_id } = req.body;

    const problem = db.getProblemById(problemId, req.userId, "admin");
    if (!problem) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Problem not found" } });
    }

    if (action === "approve") {
      problem.status = "open";
      problem.spam_score = 0.05;
      db.problems.set(problemId, problem);
      db.createNotification(problem.created_by, "PROBLEM_APPROVED", {
        problem_id: problem.id,
        problem_title: problem.title,
      });
    } else if (action === "reject") {
      problem.status = "rejected";
      db.problems.set(problemId, problem);
      db.createNotification(problem.created_by, "PROBLEM_REJECTED", {
        problem_id: problem.id,
        problem_title: problem.title,
        reason: req.body.reason || "Violated civic integrity guidelines.",
      });
    } else if (action === "merge") {
      if (!duplicate_of_id) {
        return res.status(400).json({ error: { code: "MISSING_DUPLICATE_ID", message: "Target problem ID required to merge." } });
      }
      problem.duplicate_of = duplicate_of_id;
      problem.status = "rejected";
      db.problems.set(problemId, problem);

      // Transfer support count if needed
      const parentProblem = db.getProblemById(duplicate_of_id);
      if (parentProblem) {
        parentProblem.support_count += problem.support_count;
        db.problems.set(duplicate_of_id, parentProblem);
      }
    } else {
      return res.status(400).json({ error: { code: "INVALID_ACTION", message: "Action must be approve, reject, or merge." } });
    }

    return res.json({ success: true, problem });
  } catch (err) {
    return res.status(500).json({
      error: { code: "MODERATION_ERROR", message: (err as Error).message },
    });
  }
});

// 3. Grant / Revoke Verifier Rights
adminRouter.patch("/users/:id/verifier", (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.params.id;
    const { can_verify } = req.body;

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }

    user.can_verify = Boolean(can_verify);
    db.users.set(userId, user);

    db.createNotification(userId, "VERIFIER_STATUS_UPDATED", {
      can_verify: user.can_verify,
      note: user.can_verify
        ? "You have been granted on-site verifier credentials by platform administration."
        : "Your on-site verifier credentials have been revoked.",
    });

    return res.json({ success: true, user: { id: user.id, name: user.name, can_verify: user.can_verify } });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});

// 4. Admin Platform Stats & Users List
adminRouter.get("/users", (req, res) => {
  try {
    const users = db.getAllUsers().map(({ password_hash: _, ...safe }) => safe);
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: (err as Error).message },
    });
  }
});
