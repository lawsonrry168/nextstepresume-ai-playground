import type { SubscriptionPlan } from "../../src/lib/subscription/types.ts";

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_WEBHOOK_SECRET?.trim() &&
      process.env.STRIPE_PRICE_PRO_MONTHLY?.trim() &&
      process.env.STRIPE_PRICE_MAX_MONTHLY?.trim(),
  );
}

export function getStripePriceIdForPlan(plan: SubscriptionPlan): string | null {
  if (plan === "starter") return null;
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO_MONTHLY?.trim() || null;
  if (plan === "max") return process.env.STRIPE_PRICE_MAX_MONTHLY?.trim() || null;
  return null;
}

export function resolvePlanFromStripePriceId(priceId: string): SubscriptionPlan | null {
  const normalized = priceId.trim();
  if (normalized === process.env.STRIPE_PRICE_PRO_MONTHLY?.trim()) return "pro";
  if (normalized === process.env.STRIPE_PRICE_MAX_MONTHLY?.trim()) return "max";
  return null;
}

export function getStripeSuccessUrl(): string {
  const base = process.env.APP_URL?.trim() || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/?billing=success`;
}

export function getStripeCancelUrl(): string {
  const base = process.env.APP_URL?.trim() || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/?billing=cancel`;
}
