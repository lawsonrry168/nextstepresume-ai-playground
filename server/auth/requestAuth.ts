import type { Request } from "express";
import type { User } from "@supabase/supabase-js";

export interface NsrAuthContext {
  user: User;
  clientId: string;
}

export type NsrAuthedRequest = Request & { nsrAuth?: NsrAuthContext };

export function getBearerToken(req: Pick<Request, "header">): string | null {
  const header = req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export function getNsrAuth(req: Request): NsrAuthContext | undefined {
  return (req as NsrAuthedRequest).nsrAuth;
}

export const PUBLIC_API_PATHS = new Set([
  "/api/health",
  "/api/config",
  "/api/billing/webhook",
]);

export function isPublicApiPath(path: string): boolean {
  return PUBLIC_API_PATHS.has(path);
}
