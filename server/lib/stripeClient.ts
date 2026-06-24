import Stripe from "stripe";
import { isStripeConfigured } from "../billing/stripeConfig.ts";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  if (!isStripeConfigured()) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return stripeClient;
}

export function resetStripeClientForTests(): void {
  stripeClient = null;
}
