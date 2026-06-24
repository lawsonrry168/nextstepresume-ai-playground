import type { SubscriptionPlan } from "../../src/lib/subscription/types.ts";
import { resolvePlanFromStripePriceId } from "../billing/stripeConfig.ts";

type StripeLineItem = { price?: { id?: string | null } | string | null };

export function resolvePlanFromCheckoutSession(session: {
  metadata?: Record<string, string> | null;
  line_items?: { data?: StripeLineItem[] } | null;
}): SubscriptionPlan | null {
  const metaPlan = session.metadata?.nsr_plan;
  if (metaPlan === "pro" || metaPlan === "max" || metaPlan === "starter") {
    return metaPlan;
  }

  const items = session.line_items?.data ?? [];
  for (const item of items) {
    const price = item.price;
    const priceId = typeof price === "string" ? price : price?.id;
    if (!priceId) continue;
    const plan = resolvePlanFromStripePriceId(priceId);
    if (plan) return plan;
  }

  return null;
}

export function resolvePlanFromSubscription(subscription: {
  metadata?: Record<string, string> | null;
  items?: { data?: Array<{ price?: { id?: string | null } | string | null }> } | null;
}): SubscriptionPlan | null {
  const metaPlan = subscription.metadata?.nsr_plan;
  if (metaPlan === "pro" || metaPlan === "max") {
    return metaPlan;
  }

  const items = subscription.items?.data ?? [];
  for (const item of items) {
    const price = item.price;
    const priceId = typeof price === "string" ? price : price?.id;
    if (!priceId) continue;
    const plan = resolvePlanFromStripePriceId(priceId);
    if (plan) return plan;
  }

  return null;
}

export function resolveClientIdFromStripeMetadata(
  metadata?: Record<string, string> | null,
): string | null {
  const clientId = metadata?.nsr_client_id?.trim();
  return clientId || null;
}
