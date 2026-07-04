import type { Express } from "express";
import type { GoogleGenAI } from "@google/genai";
import { registerAiRoutes } from "./ai/index.ts";
import { registerAuthRoutes } from "./auth.ts";
import { registerBillingRoutes } from "./billing.ts";
import { registerConfigRoutes } from "./config.ts";
import { registerExportPdfRoutes } from "./exportPdf.ts";
import { registerHealthRoutes } from "./health.ts";
import { registerJdRoutes } from "./jd.ts";
import { registerJobsdbRoutes } from "./jobsdb.ts";
import { registerResumeRoutes } from "./resume.ts";
import { registerSubscriptionRoutes } from "./subscription.ts";
import { registerSyncRoutes } from "./sync.ts";

export function registerCoreRoutes(app: Express, aiEnabled: boolean): void {
  registerHealthRoutes(app, aiEnabled);
  registerConfigRoutes(app);
  registerAuthRoutes(app);
  registerSyncRoutes(app);
  registerSubscriptionRoutes(app);
  registerBillingRoutes(app);
  registerJdRoutes(app);
  registerJobsdbRoutes(app);
}

export function registerAppRoutes(app: Express, ai: GoogleGenAI | null): void {
  registerCoreRoutes(app, !!ai);
  registerResumeRoutes(app);
  registerExportPdfRoutes(app);
  registerAiRoutes(app, ai);
}
