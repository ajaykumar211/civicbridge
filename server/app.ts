import express from "express";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middleware/auth.ts";
import { authRouter } from "./routes/auth.ts";
import { problemsRouter } from "./routes/problems.ts";
import { projectsRouter } from "./routes/projects.ts";
import { sponsorshipsRouter } from "./routes/sponsorships.ts";
import { analyticsRouter } from "./routes/analytics.ts";
import { reportsRouter } from "./routes/reports.ts";
import { adminRouter } from "./routes/admin.ts";

export const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(authMiddleware);

// API Router
const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "CivicBridge API", time: new Date().toISOString() });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/problems", problemsRouter);
apiRouter.use(projectsRouter);
apiRouter.use(sponsorshipsRouter);
apiRouter.use(analyticsRouter);
apiRouter.use(reportsRouter);
apiRouter.use("/admin", adminRouter);

apiRouter.post("/upload", (req, res) => {
  const { data_url, filename } = req.body;
  if (!data_url) {
    return res.status(400).json({ error: { code: "NO_FILE", message: "Data URL is required" } });
  }
  return res.json({ url: data_url, filename: filename || "upload.png" });
});

// Mount router under /api AND under root to handle Vercel serverless function rewrites seamlessly
app.use("/api", apiRouter);
app.use(apiRouter);

// Centralized error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[API Error]", err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.message || "An unexpected error occurred.",
    },
  });
});
