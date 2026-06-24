import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { readServerAppMode } from "./src/lib/appMode.ts";
import { rateLimit } from "./server/middleware/rateLimit.ts";
import { subscriptionQuota } from "./server/middleware/subscriptionQuota.ts";
import { supabaseAuthMiddleware } from "./server/middleware/supabaseAuth.ts";
import { createGeminiClient } from "./server/lib/createGeminiClient.ts";
import { registerBillingWebhookRoute } from "./server/routes/billing.ts";
import { registerAppRoutes } from "./server/routes/index.ts";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JSON_BODY_LIMIT = "1mb";

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

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("🛠️ Starting Express App in DEVELOPER mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("🚀 Starting Express App in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`📡 NextStepResume.ai Analyzer Node listening on port ${PORT}`);
  });
}

startServer();
