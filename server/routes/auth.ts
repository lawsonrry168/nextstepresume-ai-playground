import type { Express } from "express";
import { getNsrAuth } from "../auth/requestAuth.ts";
import { isSupabaseConfigured } from "../auth/supabaseConfig.ts";
import {
  getClientRecord,
  mergeClientQuota,
  resolveClientId,
} from "../../src/lib/subscription/serverClientStore.ts";
import { isValidClientId } from "../../src/lib/subscription/clientId.ts";
import { writeSubscriptionHeaders } from "./billing.ts";

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/session", (req, res) => {
    const auth = getNsrAuth(req);
    if (!auth) {
      res.json({ authenticated: false, authEnabled: isSupabaseConfigured() });
      return;
    }

    const record = getClientRecord(auth.clientId);
    writeSubscriptionHeaders(res, auth.clientId, record);
    res.json({
      authenticated: true,
      authEnabled: isSupabaseConfigured(),
      user: {
        id: auth.user.id,
        email: auth.user.email ?? null,
      },
      clientId: auth.clientId,
      plan: record.plan,
    });
  });

  app.post("/api/auth/link-client", (req, res) => {
    const auth = getNsrAuth(req);
    if (!auth) {
      res.status(401).json({ error: "auth_required" });
      return;
    }

    const anonymousClientId =
      typeof req.body?.anonymousClientId === "string" ? req.body.anonymousClientId.trim() : "";
    if (!isValidClientId(anonymousClientId)) {
      res.status(400).json({ error: "invalid_anonymous_client_id" });
      return;
    }

    if (anonymousClientId !== auth.clientId) {
      mergeClientQuota(anonymousClientId, auth.clientId);
    }

    const record = getClientRecord(auth.clientId);
    writeSubscriptionHeaders(res, auth.clientId, record);
    res.json({
      ok: true,
      clientId: auth.clientId,
      plan: record.plan,
      usage: record.usage,
      month: record.month,
    });
  });
}

export function resolveBillingClientId(req: Parameters<typeof resolveClientId>[0]): string {
  return resolveClientId(req);
}
