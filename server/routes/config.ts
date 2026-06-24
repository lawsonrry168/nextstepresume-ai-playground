import type { Express } from "express";
import { readServerAppMode } from "../../src/lib/appMode.ts";
import { isStripeConfigured } from "../billing/stripeConfig.ts";
import { isAuthRequired, isSupabaseConfigured, getSupabaseAnonKey, getSupabaseUrl } from "../auth/supabaseConfig.ts";
import { isPostgresSyncConfigured } from "../sync/postgresSyncStore.ts";

export function registerConfigRoutes(app: Express): void {
  app.get("/api/config", (_req, res) => {
    const appMode = readServerAppMode();
    const stripeReady = isStripeConfigured();
    const productionBilling = appMode === "production" && stripeReady;
    const supabaseReady = isSupabaseConfigured();

    res.json({
      appMode,
      billing: {
        provider: productionBilling ? "stripe" : "demo",
        checkoutEnabled: productionBilling,
      },
      auth: {
        enabled: supabaseReady,
        required: isAuthRequired() && supabaseReady,
        supabaseUrl: supabaseReady ? getSupabaseUrl() : null,
        supabaseAnonKey: supabaseReady ? getSupabaseAnonKey() : null,
      },
      sync: {
        enabled: isPostgresSyncConfigured(),
      },
    });
  });
}
