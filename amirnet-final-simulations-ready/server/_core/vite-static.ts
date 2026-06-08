import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Serve static files from the built client directory.
 * This is used in production (including Vercel) and does NOT depend on Vite dev server.
 */
export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "..", "dist", "public");
  
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to run 'npm run build' first`
    );
  }

  app.use(express.static(distPath));

  // Fall through to index.html for SPA routing
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
