import type { Express } from "express";

export function registerHealthRoutes(app: Express, aiEnabled: boolean): void {
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      ai_enabled: aiEnabled,
      timestamp: new Date().toISOString(),
    });
  });
}
