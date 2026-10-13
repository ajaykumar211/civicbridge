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

// Base healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", service: "CivicBridge API", time: new Date().toISOString() });
});

// Mount Routes
app.use("/api/auth", authRouter);
app.use("/api/problems", problemsRouter);
app.use("/api", projectsRouter);
app.use("/api", sponsorshipsRouter);
app.use("/api", analyticsRouter);
app.use("/api", reportsRouter);
app.use("/api/admin", adminRouter);

// File Upload endpoint (data URL / local media storage)
app.post("/api/upload", (req, res) => {
  const { data_url, filename } = req.body;
  if (!data_url) {
    return res.status(400).json({ error: { code: "NO_FILE", message: "Data URL is required" } });
  }
  // Returns safe persistent URL (the data url itself or hosted URI)
  return res.json({ url: data_url, filename: filename || "upload.png" });
});

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
