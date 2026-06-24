import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredInProduction = [
  "NSR_APP_MODE",
  "APP_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_PRO_MONTHLY",
  "STRIPE_PRICE_MAX_MONTHLY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const recommended = ["NSR_QUOTA_STORE", "NSR_RATE_LIMIT_STORE", "NSR_REDIS_URL", "GEMINI_API_KEY"];

function present(key) {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0;
}

function redisConfigured() {
  return present("NSR_REDIS_URL") || present("REDIS_URL");
}

const mode = process.env.NSR_APP_MODE ?? "playground";
const missing = mode === "production" ? requiredInProduction.filter((key) => !present(key)) : [];
const weak = recommended.filter((key) => {
  if (key === "NSR_REDIS_URL") return !redisConfigured();
  return !present(key);
});

console.log(`NSR_APP_MODE=${mode}`);
if (missing.length > 0) {
  console.error("Missing required production variables:");
  for (const key of missing) console.error(`  - ${key}`);
  process.exit(1);
}
if (weak.length > 0) {
  console.warn("Recommended variables not set (multi-instance / live AI may be degraded):");
  for (const key of weak) console.warn(`  - ${key}`);
}
console.log("Deploy env check passed.");
