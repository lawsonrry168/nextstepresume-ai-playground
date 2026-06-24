import express, { type Express } from "express";
import { readServerAppMode } from "../src/lib/appMode.ts";
import { rateLimit } from "./middleware/rateLimit.ts";
import { subscriptionQuota } from "./middleware/subscriptionQuota.ts";
import { supabaseAuthMiddleware } from "./middleware/supabaseAuth.ts";
import { createGeminiClient } from "./lib/createGeminiClient.ts";
import { registerBillingWebhookRoute } from "./routes/billing.ts";
import { registerAppRoutes } from "./routes/index.ts";

const JSON_BODY_LIMIT = "1mb";

export function createApp(): Express {
  const app = express();

  if (process.env.NODE_ENV === "production" || readServerAppMode() === "production") {
    app.set("trust proxy", 1);
  }

  registerBillingWebhookRoute(app);

  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use("/api", (req, res, next) => {
    void supabaseAuthMiddleware(req, res, next).catch(next);
  });
  app.use("/api", rateLimit);
  app.use("/api", subscriptionQuota);

  const ai = createGeminiClient();
  registerAppRoutes(app, ai);

  return app;
}
