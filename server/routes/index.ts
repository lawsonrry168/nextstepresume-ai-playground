import type { Express } from "express";
import { registerHealthRoutes } from "./health.ts";
import { registerJdRoutes } from "./jd.ts";
import { registerJobsdbRoutes } from "./jobsdb.ts";
import { registerSubscriptionRoutes } from "./subscription.ts";

export function registerCoreRoutes(app: Express, aiEnabled: boolean): void {
  registerHealthRoutes(app, aiEnabled);
  registerSubscriptionRoutes(app);
  registerJdRoutes(app);
  registerJobsdbRoutes(app);
}
