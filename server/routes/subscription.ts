import type { Express } from "express";
import {
  getClientRecord,
  resolveClientId,
  setClientPlan,
} from "../../src/lib/subscription/serverClientStore.ts";
import { parsePlanHeader } from "../../src/lib/subscription/usageLedger.ts";
import { canClientSyncPlan } from "../billing/subscriptionSyncPolicy.ts";
import { writeSubscriptionHeaders } from "./billing.ts";

export function registerSubscriptionRoutes(app: Express): void {
  app.post("/api/subscription/sync", (req, res) => {
    const clientId = resolveClientId(req);
    const plan = parsePlanHeader(typeof req.body?.plan === "string" ? req.body.plan : undefined);
    const current = getClientRecord(clientId);
    const policy = canClientSyncPlan(plan, current.plan);

    if (policy.ok === false) {
      res.status(403).json({
        error: policy.code,
        message: "Paid plans require Stripe checkout in production.",
        plan: current.plan,
      });
      return;
    }

    const record = setClientPlan(clientId, plan);
    writeSubscriptionHeaders(res, clientId, record);
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
    writeSubscriptionHeaders(res, clientId, record);
    res.json({
      clientId,
      plan: record.plan,
      usage: record.usage,
      month: record.month,
    });
  });
}
