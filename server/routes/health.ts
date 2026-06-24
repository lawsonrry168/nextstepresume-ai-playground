import type { Express } from "express";
import { readServerAppMode } from "../../src/lib/appMode.ts";
import { isStripeConfigured } from "../billing/stripeConfig.ts";
import { isSupabaseConfigured } from "../auth/supabaseConfig.ts";

export function registerHealthRoutes(app: Express, aiEnabled: boolean): void {
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      ai_enabled: aiEnabled,
      app_mode: readServerAppMode(),
      stripe_enabled: isStripeConfigured(),
      auth_enabled: isSupabaseConfigured(),
      timestamp: new Date().toISOString(),
    });
  });
}
