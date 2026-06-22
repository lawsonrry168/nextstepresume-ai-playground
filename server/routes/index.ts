import type { Express } from "express";
import type { GoogleGenAI } from "@google/genai";
import { registerAiRoutes } from "./ai/index.ts";
import { registerHealthRoutes } from "./health.ts";
import { registerJdRoutes } from "./jd.ts";
import { registerJobsdbRoutes } from "./jobsdb.ts";
import { registerResumeRoutes } from "./resume.ts";
import { registerSubscriptionRoutes } from "./subscription.ts";

export function registerCoreRoutes(app: Express, aiEnabled: boolean): void {
  registerHealthRoutes(app, aiEnabled);
  registerSubscriptionRoutes(app);
  registerJdRoutes(app);
  registerJobsdbRoutes(app);
}

export function registerAppRoutes(app: Express, ai: GoogleGenAI | null): void {
  registerCoreRoutes(app, !!ai);
  registerResumeRoutes(app);
  registerAiRoutes(app, ai);
}
