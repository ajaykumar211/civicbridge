import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { app } from "./server/app.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

// Serve static built client
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback
app.get("*", (req, res, next) => {
  if (req.url.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`CivicBridge production server running on http://0.0.0.0:${PORT}`);
});
