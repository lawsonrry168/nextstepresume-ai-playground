import type { Express, Request, Response } from "express";
import express from "express";
import type Stripe from "stripe";
import {
  getStripeCancelUrl,
  getStripePriceIdForPlan,
  getStripeSuccessUrl,
  isStripeConfigured,
} from "../billing/stripeConfig.ts";
import {
  resolveClientIdFromStripeMetadata,
  resolvePlanFromCheckoutSession,
  resolvePlanFromSubscription,
} from "../billing/stripePlanResolver.ts";
import { getStripeClient } from "../lib/stripeClient.ts";
import { getNsrAuth } from "../auth/requestAuth.ts";
import { resolveClientId, setClientPlan } from "../../src/lib/subscription/serverClientStore.ts";
import { parsePlanHeader } from "../../src/lib/subscription/usageLedger.ts";
import type { SubscriptionPlan } from "../../src/lib/subscription/types.ts";

function writeSubscriptionHeaders(
  res: Response,
  clientId: string,
  record: ReturnType<typeof setClientPlan>,
): void {
  res.setHeader("X-NSR-Client-Id", clientId);
  res.setHeader("X-NSR-Plan", record.plan);
  res.setHeader("X-NSR-Usage-Month", record.month);
  res.setHeader("X-NSR-Usage", JSON.stringify(record.usage));
}

function applyPlanForClient(clientId: string, plan: SubscriptionPlan) {
  return setClientPlan(clientId, plan);
}

export function registerBillingWebhookRoute(app: Express): void {
  app.post(
    "/api/billing/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      if (!isStripeConfigured()) {
        res.status(503).json({ error: "stripe_not_configured" });
        return;
      }

      const stripe = getStripeClient();
      if (!stripe) {
        res.status(503).json({ error: "stripe_not_configured" });
        return;
      }

      const signature = req.header("stripe-signature");
      if (!signature) {
        res.status(400).json({ error: "missing_stripe_signature" });
        return;
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body as Buffer,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET!.trim(),
        );
      } catch (err) {
        console.error("[billing/webhook] signature verification failed", err);
        res.status(400).json({ error: "invalid_stripe_signature" });
        return;
      }

      try {
        await handleStripeEvent(event, stripe);
        res.json({ received: true });
      } catch (err) {
        console.error("[billing/webhook] handler failed", err);
        res.status(500).json({ error: "webhook_handler_failed" });
      }
    },
  );
}

async function handleStripeEvent(event: Stripe.Event, stripe: Stripe): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const clientId = resolveClientIdFromStripeMetadata(session.metadata);
      const plan = resolvePlanFromCheckoutSession({
        metadata: session.metadata ?? undefined,
        line_items: session.line_items ?? undefined,
      });
      if (!clientId || !plan) {
        console.warn("[billing/webhook] checkout.session.completed missing client or plan", {
          clientId,
          plan,
          sessionId: session.id,
        });
        return;
      }
      applyPlanForClient(clientId, plan);
      return;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.status !== "active" && subscription.status !== "trialing") {
        return;
      }
      const clientId = resolveClientIdFromStripeMetadata(subscription.metadata);
      const plan = resolvePlanFromSubscription({
        metadata: subscription.metadata ?? undefined,
        items: subscription.items,
      });
      if (!clientId || !plan) return;
      applyPlanForClient(clientId, plan);
      return;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const clientId = resolveClientIdFromStripeMetadata(subscription.metadata);
      if (!clientId) return;
      applyPlanForClient(clientId, "starter");
      return;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
      if (!subscriptionId) return;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const clientId = resolveClientIdFromStripeMetadata(subscription.metadata);
      if (!clientId) return;
      applyPlanForClient(clientId, "starter");
      return;
    }
    default:
      return;
  }
}

export function registerBillingRoutes(app: Express): void {
  app.post("/api/billing/checkout", async (req, res) => {
    if (!isStripeConfigured()) {
      res.status(503).json({ error: "stripe_not_configured" });
      return;
    }

    const stripe = getStripeClient();
    if (!stripe) {
      res.status(503).json({ error: "stripe_not_configured" });
      return;
    }

    const plan = parsePlanHeader(typeof req.body?.plan === "string" ? req.body.plan : undefined);
    if (plan === "starter") {
      res.status(400).json({ error: "starter_checkout_not_supported" });
      return;
    }

    const priceId = getStripePriceIdForPlan(plan);
    if (!priceId) {
      res.status(400).json({ error: "unknown_plan" });
      return;
    }

    const clientId = resolveClientId(req);
    const auth = getNsrAuth(req);
    const metadata: Record<string, string> = {
      nsr_client_id: clientId,
      nsr_plan: plan,
    };
    if (auth?.user.id) {
      metadata.nsr_user_id = auth.user.id;
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: getStripeSuccessUrl(),
        cancel_url: getStripeCancelUrl(),
        client_reference_id: clientId,
        metadata,
        subscription_data: {
          metadata,
        },
      });

      if (!session.url) {
        res.status(500).json({ error: "checkout_url_missing" });
        return;
      }

      res.json({ url: session.url, sessionId: session.id });
    } catch (err) {
      console.error("[billing/checkout] failed", err);
      res.status(500).json({ error: "checkout_failed" });
    }
  });
}

export { writeSubscriptionHeaders, applyPlanForClient };
