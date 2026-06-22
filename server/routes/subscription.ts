import type { Express } from "express";
import {
  getClientRecord,
  resolveClientId,
  setClientPlan,
} from "../../src/lib/subscription/serverClientStore.ts";
import { parsePlanHeader } from "../../src/lib/subscription/usageLedger.ts";

export function registerSubscriptionRoutes(app: Express): void {
  app.post("/api/subscription/sync", (req, res) => {
    const clientId = resolveClientId(req);
    const plan = parsePlanHeader(typeof req.body?.plan === "string" ? req.body.plan : undefined);
    const record = setClientPlan(clientId, plan);
    res.setHeader("X-NSR-Client-Id", clientId);
    res.setHeader("X-NSR-Plan", record.plan);
    res.setHeader("X-NSR-Usage-Month", record.month);
    res.setHeader("X-NSR-Usage", JSON.stringify(record.usage));
    res.json({
      ok: true,
      clientId,
      plan: record.plan,
      usage: record.usage,
      month: record.month,
    });
  });

  app.get("/api/subscription/status", (req, res) => {
    const clientId = resolveClientId(req);
    const record = getClientRecord(clientId);
    res.setHeader("X-NSR-Client-Id", clientId);
    res.setHeader("X-NSR-Plan", record.plan);
    res.setHeader("X-NSR-Usage-Month", record.month);
    res.setHeader("X-NSR-Usage", JSON.stringify(record.usage));
    res.json({
      clientId,
      plan: record.plan,
      usage: record.usage,
      month: record.month,
    });
  });
}
