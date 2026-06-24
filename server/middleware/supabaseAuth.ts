import type { Request, Response, NextFunction } from "express";
import { shouldRequireAuthInProduction, isSupabaseConfigured } from "../auth/supabaseConfig.ts";
import {
  getBearerToken,
  isPublicApiPath,
  type NsrAuthedRequest,
} from "../auth/requestAuth.ts";
import { clientIdFromUserId, verifySupabaseAccessToken } from "../lib/supabaseAdmin.ts";
import { resolveClientId } from "../../src/lib/subscription/serverClientStore.ts";

export async function supabaseAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const apiPath = req.originalUrl.split("?")[0];

  if (!apiPath.startsWith("/api")) {
    next();
    return;
  }

  const token = getBearerToken(req);
  if (token && isSupabaseConfigured()) {
    const user = await verifySupabaseAccessToken(token);
    if (user) {
      const authed = req as NsrAuthedRequest;
      authed.nsrAuth = {
        user,
        clientId: clientIdFromUserId(user.id),
      };
    }
  }

  if (shouldRequireAuthInProduction() && !isPublicApiPath(apiPath)) {
    const authed = req as NsrAuthedRequest;
    if (!authed.nsrAuth) {
      res.status(401).json({
        error: "auth_required",
        message: "Sign in required to use this API in production.",
      });
      return;
    }
  }

  const authed = req as NsrAuthedRequest;
  if (authed.nsrAuth) {
    (req as Request & { nsrClientId?: string }).nsrClientId = authed.nsrAuth.clientId;
  } else {
    resolveClientId(req);
  }

  next();
}
