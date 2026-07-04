var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/vercelExport.ts
var vercelExport_exports = {};
__export(vercelExport_exports, {
  default: () => vercelExport_default
});
module.exports = __toCommonJS(vercelExport_exports);

// server/createApp.ts
var import_express2 = __toESM(require("express"), 1);

// src/lib/appMode.ts
function parseAppMode(raw) {
  return raw === "production" ? "production" : "playground";
}
function isProductionAppMode(mode) {
  return mode === "production";
}
function readServerAppMode() {
  return parseAppMode(process.env.NSR_APP_MODE);
}

// server/quota/redisClient.ts
var import_redis = require("redis");
var clients = /* @__PURE__ */ new Map();
function resolveRedisUrl() {
  const raw = process.env.NSR_REDIS_URL?.trim() || process.env.REDIS_URL?.trim();
  return raw || void 0;
}
async function getRedisClient(url) {
  let client = clients.get(url);
  if (!client) {
    client = (0, import_redis.createClient)({ url });
    client.on("error", (err) => {
      console.error("[quota/redis]", err);
    });
    await client.connect();
    clients.set(url, client);
  }
  return client;
}
function createRedisKv(url) {
  return {
    async get(key) {
      const client = await getRedisClient(url);
      return client.get(key);
    },
    async set(key, value, options) {
      const client = await getRedisClient(url);
      if (options?.EX) {
        await client.set(key, value, { EX: options.EX });
        return;
      }
      await client.set(key, value);
    },
    async incr(key) {
      const client = await getRedisClient(url);
      return client.incr(key);
    },
    async expire(key, seconds) {
      const client = await getRedisClient(url);
      await client.expire(key, seconds);
    },
    async keys(pattern) {
      const client = await getRedisClient(url);
      return client.keys(pattern);
    },
    async del(...keys) {
      if (keys.length === 0) return;
      const client = await getRedisClient(url);
      await client.del(keys);
    }
  };
}

// server/rateLimit/inMemoryRateLimitStore.ts
var InMemoryRateLimitStore = class {
  constructor() {
    this.entries = /* @__PURE__ */ new Map();
  }
  async consume(key, windowMs, maxRequests) {
    const now = Date.now();
    let entry = this.entries.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      this.entries.set(key, entry);
    }
    entry.count += 1;
    const allowed = entry.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - entry.count);
    return {
      allowed,
      limit: maxRequests,
      remaining,
      resetAtMs: entry.resetAt
    };
  }
};

// server/rateLimit/redisRateLimitStore.ts
var RedisRateLimitStore = class {
  constructor(kv) {
    this.kv = kv;
  }
  async consume(key, windowMs, maxRequests) {
    const bucket = Math.floor(Date.now() / windowMs);
    const redisKey = `nsr:ratelimit:${key}:${bucket}`;
    const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1e3));
    const count = await this.kv.incr(redisKey);
    if (count === 1) {
      await this.kv.expire(redisKey, ttlSeconds);
    }
    const resetAtMs = (bucket + 1) * windowMs;
    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);
    return {
      allowed,
      limit: maxRequests,
      remaining,
      resetAtMs
    };
  }
};

// server/rateLimit/config.ts
var RATE_LIMIT_WINDOW_MS = 6e4;
function readRateLimitMax() {
  const parsed = Number(process.env.NSR_RATE_LIMIT_MAX);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  if (process.env.NODE_ENV !== "production") return 1e3;
  return 60;
}
var EXEMPT_API_PATHS = /* @__PURE__ */ new Set([
  "/api/health",
  "/api/config",
  "/api/subscription/sync",
  "/api/subscription/status"
]);
function isRateLimitExemptPath(apiPath) {
  if (EXEMPT_API_PATHS.has(apiPath)) return true;
  if (process.env.NSR_JOBSDB_SIMULATE === "1" && apiPath === "/api/jobsdb/search") return true;
  return false;
}
function resolveRateLimitStoreKind() {
  const raw = (process.env.NSR_RATE_LIMIT_STORE ?? "memory").toLowerCase();
  return raw === "redis" ? "redis" : "memory";
}

// server/rateLimit/createRateLimitStore.ts
function createRateLimitStore(kind = resolveRateLimitStoreKind()) {
  if (kind === "redis") {
    const url = resolveRedisUrl();
    if (!url) {
      console.warn(
        "[rate-limit] NSR_RATE_LIMIT_STORE=redis but NSR_REDIS_URL (or REDIS_URL) is missing \u2014 using in-memory store."
      );
      return new InMemoryRateLimitStore();
    }
    return new RedisRateLimitStore(createRedisKv(url));
  }
  return new InMemoryRateLimitStore();
}

// server/middleware/rateLimit.ts
var rateLimitStore = createRateLimitStore();
function writeRateLimitHeaders(res, decision) {
  res.setHeader("RateLimit-Limit", String(decision.limit));
  res.setHeader("RateLimit-Remaining", String(decision.remaining));
  res.setHeader("RateLimit-Reset", String(Math.ceil(decision.resetAtMs / 1e3)));
}
function rateLimit(req, res, next) {
  const apiPath = req.originalUrl.split("?")[0];
  if (isRateLimitExemptPath(apiPath)) {
    next();
    return;
  }
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const maxRequests = readRateLimitMax();
  void rateLimitStore.consume(ip, RATE_LIMIT_WINDOW_MS, maxRequests).then((decision) => {
    writeRateLimitHeaders(res, decision);
    if (!decision.allowed) {
      res.status(429).json({ error: "Too many requests. Please try again later." });
      return;
    }
    next();
  }).catch(next);
}

// src/lib/subscription/creditCosts.ts
var AI_CREDIT_COSTS = {
  tailor: 1,
  match: 1,
  auditBundle: 1,
  coverLetter: 2,
  interviewPrep: 3,
  companyResearch: 3,
  geminiFlash: 1,
  geminiThinking: 2,
  wizard: 5
};
var API_ROUTE_CREDIT_ACTION = {
  "/api/analyze": "tailor",
  "/api/match-analysis": "match",
  "/api/grammar-tone-check": "auditBundle",
  "/api/readability-complexity": "auditBundle",
  "/api/skill-job-consistency": "auditBundle",
  "/api/cover-letter": "coverLetter",
  "/api/interview-prep": "interviewPrep",
  "/api/company-research": "companyResearch",
  "/api/ask-gemini": "geminiFlash"
};

// src/lib/subscription/entitlements.ts
var UNLIMITED = 999999;
function allFeatures(enabled) {
  const ids = [
    "editor.full",
    "ats.liveScore",
    "import.text",
    "import.pdf",
    "import.jdPaste",
    "import.jdUrl",
    "import.jobsdb",
    "templates.all",
    "theme.customize",
    "layout.free",
    "layout.canvasStudio",
    "ai.tailor",
    "ai.match",
    "ai.auditBundle",
    "ai.coverLetter",
    "ai.interviewPrep",
    "ai.companyResearch",
    "ai.geminiChat",
    "ai.geminiThinking",
    "ai.wizard",
    "export.json",
    "export.pdfVisual",
    "export.pdfVisualClean",
    "export.pdfAts",
    "export.docx",
    "export.packageMerged",
    "export.packageFull",
    "tracker",
    "tools.voice",
    "tools.heatmap",
    "tools.salary",
    "tools.atsCrawler",
    "tools.diagnostics",
    "notify.followUp"
  ];
  return Object.fromEntries(ids.map((id) => [id, enabled]));
}
function limits(partial) {
  const base = {
    aiCredits: 0,
    geminiMessages: 0,
    coverLetters: 0,
    interviewPrep: 0,
    companyResearch: 0,
    pdfParse: 0,
    pdfVisualExport: 0,
    pdfAtsExport: 0,
    docxExport: 0,
    mergedExport: 0,
    wizardRuns: 0,
    jobsdbSearch: 0,
    applicationPackages: 0
  };
  return { ...base, ...partial };
}
var STARTER_FEATURES = allFeatures(false);
STARTER_FEATURES["editor.full"] = true;
STARTER_FEATURES["ats.liveScore"] = true;
STARTER_FEATURES["import.text"] = true;
STARTER_FEATURES["import.pdf"] = true;
STARTER_FEATURES["import.jdPaste"] = true;
STARTER_FEATURES["ai.tailor"] = true;
STARTER_FEATURES["ai.match"] = true;
STARTER_FEATURES["ai.auditBundle"] = true;
STARTER_FEATURES["export.json"] = true;
STARTER_FEATURES["export.pdfVisual"] = true;
var PRO_FEATURES = allFeatures(false);
Object.assign(PRO_FEATURES, {
  "editor.full": true,
  "ats.liveScore": true,
  "import.text": true,
  "import.pdf": true,
  "import.jdPaste": true,
  "import.jdUrl": true,
  "import.jobsdb": true,
  "templates.all": true,
  "theme.customize": true,
  "layout.free": true,
  "ai.tailor": true,
  "ai.match": true,
  "ai.auditBundle": true,
  "ai.coverLetter": true,
  "ai.interviewPrep": true,
  "ai.companyResearch": true,
  "ai.geminiChat": true,
  "ai.wizard": true,
  "export.json": true,
  "export.pdfVisual": true,
  "export.pdfVisualClean": true,
  "export.pdfAts": true,
  "export.docx": true,
  "export.packageMerged": true,
  "tracker": true,
  "tools.voice": true,
  "tools.heatmap": true,
  "tools.salary": true,
  "notify.followUp": true
});
var MAX_FEATURES = allFeatures(true);
var PLAN_ENTITLEMENTS = {
  starter: {
    plan: "starter",
    features: STARTER_FEATURES,
    limits: limits({
      aiCredits: 3,
      pdfParse: 2,
      pdfVisualExport: 5,
      applicationPackages: 0
    }),
    templateAllowlist: "starter-modern"
  },
  pro: {
    plan: "pro",
    features: PRO_FEATURES,
    limits: limits({
      aiCredits: 80,
      geminiMessages: 30,
      coverLetters: 15,
      interviewPrep: 5,
      companyResearch: 5,
      pdfParse: UNLIMITED,
      pdfVisualExport: 30,
      pdfAtsExport: 30,
      docxExport: 30,
      mergedExport: 10,
      wizardRuns: 10,
      jobsdbSearch: 30,
      applicationPackages: 20
    }),
    templateAllowlist: "all"
  },
  max: {
    plan: "max",
    features: MAX_FEATURES,
    limits: limits({
      aiCredits: 300,
      geminiMessages: 150,
      coverLetters: UNLIMITED,
      interviewPrep: 50,
      companyResearch: 50,
      pdfParse: UNLIMITED,
      pdfVisualExport: UNLIMITED,
      pdfAtsExport: UNLIMITED,
      docxExport: UNLIMITED,
      mergedExport: UNLIMITED,
      wizardRuns: UNLIMITED,
      jobsdbSearch: 100,
      applicationPackages: UNLIMITED
    }),
    templateAllowlist: "all"
  }
};
function getEntitlements(plan) {
  return PLAN_ENTITLEMENTS[plan] ?? PLAN_ENTITLEMENTS.starter;
}
function hasFeature(plan, feature) {
  return getEntitlements(plan).features[feature] === true;
}
function getUsageLimit(plan, metric) {
  return getEntitlements(plan).limits[metric] ?? 0;
}

// src/lib/subscription/routeUsage.ts
var ROUTE_USAGE_METRIC = {
  "/api/resume/parse-pdf": "pdfParse",
  "/api/cover-letter": "coverLetters",
  "/api/interview-prep": "interviewPrep",
  "/api/company-research": "companyResearch",
  "/api/jobsdb/search": "jobsdbSearch"
};
function getUsageDeltasForRoute(path, req) {
  const deltas = [];
  const creditAction = API_ROUTE_CREDIT_ACTION[path];
  if (creditAction) {
    let cost = AI_CREDIT_COSTS[creditAction];
    if (path === "/api/ask-gemini") {
      const body = req.body;
      cost = body?.thinkingMode ? AI_CREDIT_COSTS.geminiThinking : AI_CREDIT_COSTS.geminiFlash;
      deltas.push({ metric: "geminiMessages", amount: 1 });
    }
    deltas.push({ metric: "aiCredits", amount: cost });
    if (creditAction === "coverLetter") deltas.push({ metric: "coverLetters", amount: 1 });
    if (creditAction === "interviewPrep") deltas.push({ metric: "interviewPrep", amount: 1 });
    if (creditAction === "companyResearch") deltas.push({ metric: "companyResearch", amount: 1 });
  }
  const routeMetric = ROUTE_USAGE_METRIC[path];
  if (routeMetric) {
    deltas.push({ metric: routeMetric, amount: 1 });
  }
  return deltas;
}
var QUOTA_PROTECTED_PREFIXES = [
  "/api/resume/parse-pdf",
  "/api/jd/fetch-url",
  "/api/jobsdb/search",
  "/api/analyze",
  "/api/grammar-tone-check",
  "/api/readability-complexity",
  "/api/skill-job-consistency",
  "/api/match-analysis",
  "/api/cover-letter",
  "/api/interview-prep",
  "/api/company-research",
  "/api/ask-gemini"
];
function isQuotaProtectedPath(path) {
  return QUOTA_PROTECTED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

// server/auth/requestAuth.ts
function getBearerToken(req) {
  const header = req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}
function getNsrAuth(req) {
  return req.nsrAuth;
}
var PUBLIC_API_PATHS = /* @__PURE__ */ new Set([
  "/api/health",
  "/api/config",
  "/api/billing/webhook"
]);
function isPublicApiPath(path) {
  return PUBLIC_API_PATHS.has(path);
}

// server/quota/inMemoryQuotaStore.ts
var InMemoryQuotaStore = class {
  constructor() {
    this.records = /* @__PURE__ */ new Map();
  }
  get(clientId, month, emptyUsage2) {
    let record = this.records.get(clientId);
    if (!record || record.month !== month) {
      record = { plan: "starter", month, usage: emptyUsage2() };
      this.records.set(clientId, record);
    }
    return record;
  }
  updatePlan(clientId, plan, month, emptyUsage2) {
    const record = this.get(clientId, month, emptyUsage2);
    record.plan = plan;
    return record;
  }
  replaceRecord(clientId, record) {
    this.records.set(clientId, record);
  }
  applyDeltas(clientId, deltas, getRecord) {
    const record = getRecord(clientId);
    for (const { metric, amount } of deltas) {
      if (amount <= 0) continue;
      record.usage[metric] = (record.usage[metric] ?? 0) + amount;
    }
    return record;
  }
  seed(clientId, record) {
    this.records.set(clientId, record);
  }
  clear() {
    this.records.clear();
  }
  size() {
    return this.records.size;
  }
};

// server/quota/redisQuotaStore.ts
var KEY_PREFIX = "nsr:quota:";
var TTL_SECONDS = 60 * 60 * 24 * 45;
function quotaKey(clientId) {
  return `${KEY_PREFIX}${clientId}`;
}
var RedisQuotaStore = class {
  constructor(kv, onPersistError = (err) => {
    console.error("[quota/redis] persist failed", err);
  }) {
    this.kv = kv;
    this.onPersistError = onPersistError;
    this.l1 = new InMemoryQuotaStore();
    this.hydrated = /* @__PURE__ */ new Set();
    this.hydrationWaiters = /* @__PURE__ */ new Map();
    this.pendingWrites = /* @__PURE__ */ new Map();
  }
  get(clientId, month, emptyUsage2) {
    void this.ensureHydrated(clientId, month, emptyUsage2);
    return this.l1.get(clientId, month, emptyUsage2);
  }
  updatePlan(clientId, plan, month, emptyUsage2) {
    const record = this.l1.updatePlan(clientId, plan, month, emptyUsage2);
    this.persist(clientId, record);
    return record;
  }
  replaceRecord(clientId, record) {
    this.l1.replaceRecord(clientId, record);
    this.persist(clientId, record);
  }
  applyDeltas(clientId, deltas, getRecord) {
    const record = this.l1.applyDeltas(clientId, deltas, getRecord);
    this.persist(clientId, record);
    return record;
  }
  clear() {
    this.l1.clear();
    this.hydrated.clear();
    void this.kv.keys(`${KEY_PREFIX}*`).then((keys) => {
      if (keys.length > 0) {
        void this.kv.del(...keys);
      }
    });
  }
  size() {
    return this.l1.size();
  }
  /** Test helper — wait until background hydrate finishes for a client. */
  waitForHydration(clientId, timeoutMs = 2e3) {
    if (this.hydrated.has(clientId)) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Redis quota hydrate timeout for ${clientId}`));
      }, timeoutMs);
      const finish = () => {
        clearTimeout(timer);
        resolve();
      };
      const waiters = this.hydrationWaiters.get(clientId) ?? [];
      waiters.push(finish);
      this.hydrationWaiters.set(clientId, waiters);
    });
  }
  /** Test helper — wait until a record is written to Redis. */
  async waitForPersist(clientId, timeoutMs = 2e3) {
    const key = quotaKey(clientId);
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const raw = await this.kv.get(key);
      if (raw) return;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    throw new Error(`Redis quota persist timeout for ${clientId}`);
  }
  notifyHydrated(clientId) {
    this.hydrated.add(clientId);
    const waiters = this.hydrationWaiters.get(clientId) ?? [];
    this.hydrationWaiters.delete(clientId);
    for (const resolve of waiters) {
      resolve();
    }
  }
  async ensureHydrated(clientId, month, emptyUsage2) {
    if (this.hydrated.has(clientId)) return;
    try {
      const raw = await this.kv.get(quotaKey(clientId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.month === month) {
          this.l1.seed(clientId, parsed);
        } else {
          this.l1.seed(clientId, {
            plan: parsed.plan,
            month,
            usage: emptyUsage2()
          });
        }
      }
    } catch (err) {
      this.onPersistError(err);
    } finally {
      this.notifyHydrated(clientId);
    }
  }
  persist(clientId, record) {
    const job = this.kv.set(quotaKey(clientId), JSON.stringify(record), { EX: TTL_SECONDS }).catch((err) => {
      this.onPersistError(err);
    });
    this.pendingWrites.set(clientId, job);
  }
};

// server/quota/createQuotaStore.ts
function resolveQuotaStoreKind() {
  const raw = (process.env.NSR_QUOTA_STORE ?? "memory").toLowerCase();
  return raw === "redis" ? "redis" : "memory";
}
function createQuotaStore(kind = resolveQuotaStoreKind()) {
  if (kind === "redis") {
    const url = resolveRedisUrl();
    if (!url) {
      console.warn(
        "[quota] NSR_QUOTA_STORE=redis but NSR_REDIS_URL (or REDIS_URL) is missing \u2014 using in-memory store."
      );
      return new InMemoryQuotaStore();
    }
    return new RedisQuotaStore(createRedisKv(url));
  }
  return new InMemoryQuotaStore();
}

// src/lib/storageKeys.ts
var NSR_STORAGE_KEYS = {
  tourSeen: "nsr_tour_seen",
  appSidebarCollapsed: "nsr_app_sidebar_collapsed",
  playgroundSidebarCollapsed: "nsr_playground_sidebar_collapsed",
  applicationPackages: "nsr_application_packages",
  editorPreviewSplit: "nsr_playground_editor_preview_split",
  followUpPrefs: "nsr_follow_up_notification_prefs",
  followUpNotified: "nsr_follow_up_notified_keys",
  workspaceResume: "nsr_workspace_resume",
  workspaceJd: "nsr_workspace_jd",
  workspaceTemplate: "nsr_workspace_template",
  themeCustomization: "nsr_theme_customization",
  freeLayoutByFamily: "nsr_free_layout_by_family",
  freeLayoutEnabled: "nsr_free_layout_enabled",
  freeLayoutSnap: "nsr_free_layout_snap",
  freeLayoutLivePreview: "nsr_free_layout_live_preview",
  canvasViewport: "nsr_canvas_viewport",
  studioViewMode: "nsr_studio_view_mode",
  canvasPages: "nsr_canvas_pages",
  canvasLayers: "nsr_canvas_layers",
  canvasStudioUi: "nsr_canvas_studio_ui",
  uiLocale: "nsr_ui_locale",
  subscriptionPlan: "nsr_subscription_plan",
  usageLedger: "nsr_usage_ledger",
  clientId: "nsr_client_id",
  workspaceCloudUpdatedAt: "nsr_workspace_cloud_updated_at",
  packagesCloudUpdatedAt: "nsr_packages_cloud_updated_at"
};

// src/lib/subscriptionSnapshot.ts
var snapshot = {
  plan: readStoredPlan(),
  usage: emptyUsage(),
  usageMonth: currentUsageMonth()
};

// src/lib/subscription/usageLedger.ts
function currentUsageMonth() {
  const now = /* @__PURE__ */ new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}
function emptyUsage() {
  return {
    aiCredits: 0,
    geminiMessages: 0,
    coverLetters: 0,
    interviewPrep: 0,
    companyResearch: 0,
    pdfParse: 0,
    pdfVisualExport: 0,
    pdfAtsExport: 0,
    docxExport: 0,
    mergedExport: 0,
    wizardRuns: 0,
    jobsdbSearch: 0,
    applicationPackages: 0
  };
}
function readStoredPlan() {
  if (typeof localStorage === "undefined") return "starter";
  try {
    const raw = localStorage.getItem(NSR_STORAGE_KEYS.subscriptionPlan);
    if (raw === "starter" || raw === "pro" || raw === "max") return raw;
  } catch {
  }
  return "starter";
}
var UNLIMITED_REMAINING = 999999;
function canConsume(plan, metric, usage, amount = 1) {
  const limit = getUsageLimit(plan, metric);
  if (limit <= 0) {
    return { ok: false, reason: "feature_locked", metric, remaining: 0 };
  }
  if (limit >= 999999) {
    return { ok: true, metric, remaining: UNLIMITED_REMAINING };
  }
  const used = usage[metric] ?? 0;
  const remaining = limit - used;
  if (remaining < amount) {
    return { ok: false, reason: "quota_exceeded", metric, remaining: Math.max(0, remaining) };
  }
  return { ok: true, metric, remaining: remaining - amount };
}
function parsePlanHeader(value) {
  if (value === "pro" || value === "max" || value === "starter") return value;
  return "starter";
}

// src/lib/subscription/clientId.ts
var CLIENT_ID_RE = /^[a-zA-Z0-9-]{8,64}$/;
function isValidClientId(value) {
  return Boolean(value && CLIENT_ID_RE.test(value));
}

// src/lib/subscription/serverClientStore.ts
var quotaStore = createQuotaStore();
function resolveClientId(req) {
  const authed = getNsrAuth(req);
  if (authed?.clientId) return authed.clientId;
  const tagged = req;
  if (tagged.nsrClientId) return tagged.nsrClientId;
  const headerId = req.header("X-NSR-Client-Id");
  if (isValidClientId(headerId)) return headerId;
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  return `ip:${ip}`;
}
function getClientRecord(clientId) {
  return quotaStore.get(clientId, currentUsageMonth(), emptyUsage);
}
function setClientPlan(clientId, plan) {
  const month = currentUsageMonth();
  return quotaStore.updatePlan(clientId, plan, month, emptyUsage);
}
function mergeClientQuota(fromClientId, toClientId) {
  if (fromClientId === toClientId) return;
  const month = currentUsageMonth();
  const fromRecord = quotaStore.get(fromClientId, month, emptyUsage);
  const toRecord = quotaStore.get(toClientId, month, emptyUsage);
  const mergedPlan = planRank(fromRecord.plan) >= planRank(toRecord.plan) ? fromRecord.plan : toRecord.plan;
  const mergedUsage = { ...toRecord.usage };
  for (const key of Object.keys(fromRecord.usage)) {
    mergedUsage[key] = Math.max(fromRecord.usage[key] ?? 0, toRecord.usage[key] ?? 0);
  }
  quotaStore.replaceRecord(toClientId, {
    plan: mergedPlan,
    month,
    usage: mergedUsage
  });
}
function planRank(plan) {
  if (plan === "max") return 3;
  if (plan === "pro") return 2;
  return 1;
}
function applyUsageDeltas(clientId, deltas) {
  return quotaStore.applyDeltas(clientId, deltas, getClientRecord);
}

// src/lib/subscription/serverQuota.ts
var ROUTE_FEATURE = {
  "/api/jd/fetch-url": "import.jdUrl",
  "/api/jobsdb/search": "import.jobsdb",
  "/api/analyze": "ai.tailor",
  "/api/match-analysis": "ai.match",
  "/api/grammar-tone-check": "ai.auditBundle",
  "/api/readability-complexity": "ai.auditBundle",
  "/api/skill-job-consistency": "ai.auditBundle",
  "/api/cover-letter": "ai.coverLetter",
  "/api/interview-prep": "ai.interviewPrep",
  "/api/company-research": "ai.companyResearch",
  "/api/ask-gemini": "ai.geminiChat"
};
var ROUTE_USAGE_METRIC2 = {
  "/api/resume/parse-pdf": "pdfParse",
  "/api/cover-letter": "coverLetters",
  "/api/interview-prep": "interviewPrep",
  "/api/company-research": "companyResearch",
  "/api/jobsdb/search": "jobsdbSearch"
};
function attachClientId(req) {
  const existing = getRequestClientId(req);
  if (existing) return existing;
  const clientId = resolveClientId(req);
  req.nsrClientId = clientId;
  return clientId;
}
function getRequestClientId(req) {
  return req.nsrClientId;
}
function checkApiQuota(path, req) {
  const clientId = attachClientId(req);
  const record = getClientRecord(clientId);
  const { plan, usage } = record;
  const feature = ROUTE_FEATURE[path];
  if (feature && !hasFeature(plan, feature)) {
    return {
      ok: false,
      status: 402,
      code: "feature_locked",
      error: "This feature requires a paid plan.",
      plan
    };
  }
  const creditAction = API_ROUTE_CREDIT_ACTION[path];
  if (creditAction) {
    let cost = AI_CREDIT_COSTS[creditAction];
    if (path === "/api/ask-gemini") {
      const body = req.body;
      cost = body?.thinkingMode ? AI_CREDIT_COSTS.geminiThinking : AI_CREDIT_COSTS.geminiFlash;
      if (body?.thinkingMode && !hasFeature(plan, "ai.geminiThinking")) {
        return {
          ok: false,
          status: 402,
          code: "feature_locked",
          error: "Gemini Thinking Mode requires Max plan.",
          plan
        };
      }
      const geminiCheck = canConsume(plan, "geminiMessages", usage, 1);
      if (!geminiCheck.ok) {
        return {
          ok: false,
          status: 402,
          code: geminiCheck.reason,
          error: "Monthly Gemini message limit reached.",
          plan
        };
      }
    }
    const check = canConsume(plan, "aiCredits", usage, cost);
    if (!check.ok) {
      return {
        ok: false,
        status: 402,
        code: check.reason,
        error: check.reason === "quota_exceeded" ? "Monthly AI credit limit reached." : "AI features are not available on your plan.",
        plan
      };
    }
    return { ok: true, plan };
  }
  const metric = ROUTE_USAGE_METRIC2[path];
  if (metric) {
    const check = canConsume(plan, metric, usage, 1);
    if (!check.ok) {
      return {
        ok: false,
        status: 402,
        code: check.reason,
        error: "Monthly usage limit reached for this action.",
        plan
      };
    }
  }
  return { ok: true, plan };
}
function setQuotaHeaders(req, res) {
  const clientId = getRequestClientId(req);
  if (!clientId) return;
  const apiPath = req.originalUrl.split("?")[0];
  if (!isQuotaProtectedPath(apiPath)) return;
  const deltas = getUsageDeltasForRoute(apiPath, req);
  const record = applyUsageDeltas(clientId, deltas);
  res.setHeader("X-NSR-Plan", record.plan);
  res.setHeader("X-NSR-Usage-Month", record.month);
  res.setHeader("X-NSR-Usage", JSON.stringify(record.usage));
}
function wrapQuotaResponse(req, res) {
  const tagged = res;
  if (tagged.__nsrQuotaWrapped) return;
  tagged.__nsrQuotaWrapped = true;
  const maybeApply = () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;
    setQuotaHeaders(req, res);
  };
  const origJson = res.json.bind(res);
  res.json = function jsonWithQuota(...args) {
    maybeApply();
    return origJson(...args);
  };
  const origSend = res.send.bind(res);
  res.send = function sendWithQuota(...args) {
    maybeApply();
    return origSend(...args);
  };
}

// server/middleware/subscriptionQuota.ts
function subscriptionQuota(req, res, next) {
  if (req.method !== "POST") {
    next();
    return;
  }
  const apiPath = req.originalUrl.split("?")[0];
  if (!isQuotaProtectedPath(apiPath)) {
    next();
    return;
  }
  const check = checkApiQuota(apiPath, req);
  if (!check.ok) {
    res.status(check.status ?? 402).json({
      error: check.error,
      code: check.code,
      plan: check.plan
    });
    return;
  }
  wrapQuotaResponse(req, res);
  next();
}

// server/auth/supabaseConfig.ts
function getSupabaseUrl() {
  const value = process.env.SUPABASE_URL?.trim();
  return value || null;
}
function getSupabaseAnonKey() {
  const value = process.env.SUPABASE_ANON_KEY?.trim();
  return value || null;
}
function getSupabaseServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return value || null;
}
function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey() && getSupabaseServiceRoleKey());
}
function isAuthRequired() {
  if (process.env.NSR_AUTH_REQUIRED === "1") return true;
  if (process.env.NSR_AUTH_REQUIRED === "0") return false;
  return false;
}
function shouldRequireAuthInProduction() {
  return isAuthRequired() && isSupabaseConfigured();
}

// server/lib/supabaseAdmin.ts
var import_supabase_js = require("@supabase/supabase-js");
var adminClient = null;
function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) return null;
  if (!adminClient) {
    adminClient = (0, import_supabase_js.createClient)(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return adminClient;
}
async function verifySupabaseAccessToken(token) {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
function clientIdFromUserId(userId) {
  return userId;
}

// server/middleware/supabaseAuth.ts
async function supabaseAuthMiddleware(req, res, next) {
  const apiPath = req.originalUrl.split("?")[0];
  if (!apiPath.startsWith("/api")) {
    next();
    return;
  }
  const token = getBearerToken(req);
  if (token && isSupabaseConfigured()) {
    const user = await verifySupabaseAccessToken(token);
    if (user) {
      const authed2 = req;
      authed2.nsrAuth = {
        user,
        clientId: clientIdFromUserId(user.id)
      };
    }
  }
  if (shouldRequireAuthInProduction() && !isPublicApiPath(apiPath)) {
    const authed2 = req;
    if (!authed2.nsrAuth) {
      res.status(401).json({
        error: "auth_required",
        message: "Sign in required to use this API in production."
      });
      return;
    }
  }
  const authed = req;
  if (authed.nsrAuth) {
    req.nsrClientId = authed.nsrAuth.clientId;
  } else {
    resolveClientId(req);
  }
  next();
}

// server/lib/createGeminiClient.ts
var import_genai = require("@google/genai");
function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.log(
      "\u26A0\uFE0F No GEMINI_API_KEY found or default placeholder detected. Server running with simulation engine fallback."
    );
    return null;
  }
  try {
    const client = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    console.log("\u2705 Gemini API initialized successfully on server-side.");
    return client;
  } catch (err) {
    console.error("\u274C Failed to instantiate GoogleGenAI client:", err);
    return null;
  }
}

// server/routes/billing.ts
var import_express = __toESM(require("express"), 1);

// server/billing/stripeConfig.ts
function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_WEBHOOK_SECRET?.trim() && process.env.STRIPE_PRICE_PRO_MONTHLY?.trim() && process.env.STRIPE_PRICE_MAX_MONTHLY?.trim()
  );
}
function getStripePriceIdForPlan(plan) {
  if (plan === "starter") return null;
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO_MONTHLY?.trim() || null;
  if (plan === "max") return process.env.STRIPE_PRICE_MAX_MONTHLY?.trim() || null;
  return null;
}
function resolvePlanFromStripePriceId(priceId) {
  const normalized = priceId.trim();
  if (normalized === process.env.STRIPE_PRICE_PRO_MONTHLY?.trim()) return "pro";
  if (normalized === process.env.STRIPE_PRICE_MAX_MONTHLY?.trim()) return "max";
  return null;
}
function getStripeSuccessUrl() {
  const base = process.env.APP_URL?.trim() || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/?billing=success`;
}
function getStripeCancelUrl() {
  const base = process.env.APP_URL?.trim() || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/?billing=cancel`;
}

// server/billing/stripePlanResolver.ts
function resolvePlanFromCheckoutSession(session) {
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
function resolvePlanFromSubscription(subscription) {
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
function resolveClientIdFromStripeMetadata(metadata) {
  const clientId = metadata?.nsr_client_id?.trim();
  return clientId || null;
}

// server/lib/stripeClient.ts
var import_stripe = __toESM(require("stripe"), 1);
var stripeClient = null;
function getStripeClient() {
  if (!isStripeConfigured()) return null;
  if (!stripeClient) {
    stripeClient = new import_stripe.default(process.env.STRIPE_SECRET_KEY.trim(), {
      apiVersion: "2025-02-24.acacia"
    });
  }
  return stripeClient;
}

// server/routes/billing.ts
function writeSubscriptionHeaders(res, clientId, record) {
  res.setHeader("X-NSR-Client-Id", clientId);
  res.setHeader("X-NSR-Plan", record.plan);
  res.setHeader("X-NSR-Usage-Month", record.month);
  res.setHeader("X-NSR-Usage", JSON.stringify(record.usage));
}
function applyPlanForClient(clientId, plan) {
  return setClientPlan(clientId, plan);
}
function shouldDowngradeAfterInvoicePaymentFailed(status) {
  return status === "canceled" || status === "incomplete_expired" || status === "unpaid";
}
function registerBillingWebhookRoute(app) {
  app.post(
    "/api/billing/webhook",
    import_express.default.raw({ type: "application/json" }),
    async (req, res) => {
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
      let event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET.trim()
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
    }
  );
}
async function handleStripeEvent(event, stripe) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const clientId = resolveClientIdFromStripeMetadata(session.metadata);
      const plan = resolvePlanFromCheckoutSession({
        metadata: session.metadata ?? void 0,
        line_items: session.line_items ?? void 0
      });
      if (!clientId || !plan) {
        console.warn("[billing/webhook] checkout.session.completed missing client or plan", {
          clientId,
          plan,
          sessionId: session.id
        });
        return;
      }
      applyPlanForClient(clientId, plan);
      return;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      if (subscription.status !== "active" && subscription.status !== "trialing") {
        return;
      }
      const clientId = resolveClientIdFromStripeMetadata(subscription.metadata);
      const plan = resolvePlanFromSubscription({
        metadata: subscription.metadata ?? void 0,
        items: subscription.items
      });
      if (!clientId || !plan) return;
      applyPlanForClient(clientId, plan);
      return;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const clientId = resolveClientIdFromStripeMetadata(subscription.metadata);
      if (!clientId) return;
      applyPlanForClient(clientId, "starter");
      return;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
      if (!subscriptionId) return;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (!shouldDowngradeAfterInvoicePaymentFailed(subscription.status)) {
        return;
      }
      const clientId = resolveClientIdFromStripeMetadata(subscription.metadata);
      if (!clientId) return;
      applyPlanForClient(clientId, "starter");
      return;
    }
    default:
      return;
  }
}
function registerBillingRoutes(app) {
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
    const plan = parsePlanHeader(typeof req.body?.plan === "string" ? req.body.plan : void 0);
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
    const metadata = {
      nsr_client_id: clientId,
      nsr_plan: plan
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
          metadata
        }
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

// src/lib/market/config.ts
var HK_MARKET = {
  id: "hk",
  label: "Hong Kong",
  defaultLocale: "en",
  locales: ["en", "zh-HK"],
  currency: "HKD",
  currencySymbol: "HK$",
  pricing: {
    starter: { monthly: 0, yearly: 0 },
    pro: { monthly: 88, yearly: 688 },
    max: { monthly: 188, yearly: 1688 }
  },
  sprintPassHkd: 128,
  jobs: {
    primaryPlatform: "jobsdb",
    defaultJobsdbCountry: "hk",
    defaultImportMode: "jobsdb",
    platformHints: ["JobsDB HK", "LinkedIn", "CTgoodjobs", "Indeed HK"]
  },
  spelling: "en-GB",
  salaryUnit: "monthly",
  regionLabel: "Hong Kong"
};
function getActiveMarket() {
  return HK_MARKET;
}
function isHongKongMarket() {
  return getActiveMarket().id === "hk";
}

// src/lib/market/aiWritingGuide.ts
function getAiWritingGuide(ctx = {}) {
  const market = getActiveMarket();
  const locale = ctx.locale ?? "en";
  const useChinese = locale === "zh-HK" || locale === "zh-TW";
  const englishBlock = `
Writing standards for ${market.regionLabel} employers:
- Use British English spelling (organise, colour, programme, centre, analyse).
- Professional Hong Kong corporate tone: concise, achievement-led bullets with metrics where reasonable.
- Avoid US-only idioms; prefer internationally understood business English.
- Where visa/right-to-work is relevant, use neutral phrasing (e.g. "Eligible to work in Hong Kong without sponsorship" when applicable).
- Salary references should use HKD per month unless the JD specifies otherwise.
`.trim();
  const chineseBlock = useChinese ? `
\u5982\u8F38\u51FA\u5305\u542B\u4E2D\u6587\uFF1A\u4F7F\u7528\u9999\u6E2F\u7E41\u9AD4\u4E2D\u6587\u66F8\u9762\u8A9E\uFF0C\u907F\u514D\u53F0\u7063\u7528\u8A5E\uFF08\u4F8B\u5982\uFF1A\u8EDF\u9AD4\u2192\u8EDF\u4EF6\u3001\u8CC7\u8A0A\u2192\u4FE1\u606F\u3001\u5C65\u6B77\u2192CV/\u5C65\u6B77\u5747\u53EF\u3001\u5F71\u7247\u2192\u8996\u983B\uFF09\u3002
` : "";
  return `${englishBlock}${chineseBlock}`;
}

// server/lib/aiContext.ts
function withMarketWritingGuide(req, prompt) {
  return `${prompt.trim()}

${getAiWritingGuide({ locale: req.header("X-Locale") ?? void 0 })}`;
}
function contentHash(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function deterministicRange(seed, min, max) {
  const range = max - min + 1;
  return min + contentHash(seed) % range;
}
function deterministicPresent(seed) {
  return contentHash(seed) % 2 === 0;
}
function parseAiJson(text, fallback) {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Invalid JSON shape");
    }
    return parsed;
  } catch {
    return fallback();
  }
}

// server/simulation/engine.ts
function getSimulatedReadability(resumeData) {
  const isString = typeof resumeData === "string";
  const experienceList = isString ? [] : resumeData.experience || [];
  const title = isString ? "Software Engineer" : resumeData.personalInfo?.title || "Professional";
  const suggestions = [
    {
      section: "Professional Summary",
      original: isString ? "Dynamic leader looking to leverage bleeding-edge paradigms to synergize scalable systems." : resumeData.summary?.substring(0, 75) || "A passionate Engineer with experience...",
      suggested: `Results-oriented ${title} with a track record of driving scalable system efficiency and collaborative growth.`,
      reason: "Replaces empty corporate buzzwords ('leveraging bleeding-edge paradigms to synergize') with direct, professional action descriptors.",
      type: "jargon_reduction"
    }
  ];
  if (experienceList.length > 0) {
    const mainJob = experienceList[0];
    const mainTitle = mainJob.role || "Developer";
    const firstBullet = mainJob.bullets && mainJob.bullets[0] || "Helped build features for the website.";
    suggestions.push({
      section: `Experience: ${mainTitle}`,
      original: firstBullet,
      suggested: `Engineered high-performance web components utilizing React and TypeScript, accelerating site loading speed by 25%.`,
      reason: "Simplifies sentence pacing and structure while maintaining vital technical keywords and clear STAR-model metrics.",
      type: "sentence_structure"
    });
    if (mainJob.bullets && mainJob.bullets.length > 1) {
      suggestions.push({
        section: `Experience: ${mainTitle}`,
        original: mainJob.bullets[1],
        suggested: `Optimized database API routing parameters to improve system latency performance by 30%.`,
        reason: "Eliminates redundant technical filler terminology, increasing Flesch scanning velocity for AI indices.",
        type: "jargon_reduction"
      });
    }
  }
  return {
    readabilityScore: 78,
    complexityLevel: "Medium",
    averageSentenceLength: 15,
    jargonDensity: 14,
    summary: `Your resume demonstrates good structure with a readable sentence average of 15 words per bullet. However, your professional summary contains passive corporate fillers which can easily be simplified for optimal ATS scanning and lower human reviewer fatigue.`,
    suggestions
  };
}
function getSimulatedGeminiReply(message, resumeData, jobDescription) {
  const msgLower = message.toLowerCase();
  const title = resumeData?.personalInfo?.title || "Professional Developer";
  const name = resumeData?.personalInfo?.name || "Candidate";
  if (msgLower.includes("hello") || msgLower.includes("hi ") || msgLower.includes("greet")) {
    return `Hello **${name}**! \u{1F44B} I'm your integrated AI Career Advisor.

I have indexed your resume as a **${title}** and analyzed your match options. How can I help you optimize your resume today? You can ask me to:
- **"Rewrite my summary for this job"**
- **"What skills am I missing?"**
- **"How can I emphasize React inside my bullets?"**`;
  }
  if (msgLower.includes("summary") || msgLower.includes("profile") || msgLower.includes("intro")) {
    return `### \u{1F4A1} Optimized Professional Summary for You:
"Dynamic, performance-driven **${title}** with proven experience engineering high-performance systems and managing full-cycle software deployments. Highly skilled in leveraging robust technologies to streamline workflow throughput and implement clean, modular, ATS-optimized code. Adept at driving STAR model impacts which result in recorded scalability enhancements."

**Why this works:**
1. Avoids passive phrases like *"Responsible for"* or *"Looking for"*.
2. Elevates technical keywords directly into first-scan focus.
3. Hints at quantifiable business results which catch recruiters' eyes in < 6 seconds!`;
  }
  if (msgLower.includes("skill") || msgLower.includes("missing") || msgLower.includes("gap") || msgLower.includes("keyword")) {
    const jdTech = [];
    if (jobDescription) {
      const terms = ["react", "typescript", "node.js", "next.js", "aws", "docker", "python", "kubernetes", "tailwind", "sql"];
      terms.forEach((t2) => {
        if (jobDescription.toLowerCase().includes(t2)) {
          jdTech.push(t2.toUpperCase());
        }
      });
    }
    const displayMissing = jdTech.length > 0 ? jdTech.join(", ") : "TypeScript, Kubernetes, and CI/CD Pipelines";
    return `### \u{1F3AF} Technical Keyword Analysis & Optimization:

Recruiting algorithms scanned your profile compared to the job description expectations. Here is how to close the gaps:

1. **Missing Domain Skills:** You should officially list **${displayMissing}** in your Technical Skills ledger.
2. **Contextual Proofing:** Don't just list them in the skills box\u2014integrate them into your employment accomplishments:
   - *Instead of:* "Maintained existing applications."
   - *Write:* "Engineered robust code refactors using **TypeScript**, reducing frontend runtime latency margins by 18%."

Would you like me to rewrite a specific experience bullet to fit these standards?`;
  }
  if (msgLower.includes("rewrite") || msgLower.includes("bullet") || msgLower.includes("experience") || msgLower.includes("work")) {
    return `### \u{1F4DD} Custom STAR-method Bullet Point Rewrite:

Here is how we can transform a standard passive bullet point into a high-impact, professional, data-driven achievement:

*   **Passive / Low-Agency (Before):**
    > *"Helped design components and fixed website performance bugs."*
*   **Active / Metric-Enriched (After):**
    > **"Architected scale-resilient modular components using React and TypeScript, accelerating DOM paint speed by 28% and resolving critical performance bottlenecks."**

**Benefits of this update:**
- Shift from passive action (*"helped"*, *"worked on"*) to premium impact verb (*"Architected"*, *"Optimized"*).
- Incorporates exact technology attributes to satisfy the ATS criteria.
- Outlines clear business metrics (paint speed percentiles) that humans respect.`;
  }
  return `### \u{1F4A1} Advice for your request regarding: "${message}"

Thank you for asking! As your career coach, here are 3 immediate guidelines to raise your profile as a **${title}**:

1. **Assertive Verb Framing:** Replace verbs like *"managed"* with high-agency verbs like *"orchestrated"*, *"spearheaded"*, or *"conceptualized"*.
2. **Quantifiably STAR Proofing:** Always associate your development bullet entries with structured, estimated improvements (e.g. latency reduced, pipeline throughput, client ticket delivery).
3. **Keyword Density Matrix:** Align technical frameworks to matches directly within your experience narrative.

Would you like me to tailor any specific section, suggest custom certification updates, or draft a cover letter outline for this job description?`;
}
function getSimulatedMatchAnalysis(resumeData, jobDescription) {
  const isString = typeof resumeData === "string";
  const title = isString ? "Software Engineer" : (resumeData.personalInfo?.title || "Professional").trim();
  const skillsList = isString ? [] : resumeData.skills || [];
  const jd = jobDescription || "";
  const jdLower = jd.toLowerCase();
  let jobTitle = title;
  const titleMatch = jd.match(/(?:title|role|position):\s*([^\n]+)/i) || jd.match(/(?:looking for a|seeking a)\s+([A-Za-z0-9\s-]{3,40})/i);
  if (titleMatch && titleMatch[1]) {
    jobTitle = titleMatch[1].trim();
  } else {
    if (jdLower.includes("product manager")) jobTitle = "Product Manager";
    else if (jdLower.includes("frontend engineer") || jdLower.includes("frontend developer")) jobTitle = "Frontend Engineer";
    else if (jdLower.includes("backend engineer") || jdLower.includes("backend developer")) jobTitle = "Backend Engineer";
    else if (jdLower.includes("full stack") || jdLower.includes("fullstack")) jobTitle = "Full-Stack Software Engineer";
    else if (jdLower.includes("data scientist") || jdLower.includes("data analyst")) jobTitle = "Data Scientist";
  }
  let matchScore = 72;
  const matchedStrengths = [];
  const gaps = [];
  const missingKeywords = [];
  const actionPlan = [];
  const skillsLower = skillsList.map((s) => s.toLowerCase());
  const standardTechTerms = ["react", "typescript", "node.js", "next.js", "docker", "kubernetes", "aws", "python", "sql", "graphql", "tailwind", "express"];
  const jdTechKeywords = [];
  standardTechTerms.forEach((term) => {
    if (jdLower.includes(term)) {
      jdTechKeywords.push(term);
    }
  });
  const matchedTech = jdTechKeywords.filter((k) => skillsLower.some((s) => s.includes(k)));
  const unmatchedTech = jdTechKeywords.filter((k) => !skillsLower.some((s) => s.includes(k)));
  if (matchedTech.length > 0) {
    matchedStrengths.push(`Direct alignment on core technology assets including: ${matchedTech.map((t2) => t2.toUpperCase()).join(", ")}`);
    matchScore += matchedTech.length * 4;
  } else {
    matchedStrengths.push("Possesses cross-functional foundational technical competency that transfers well across platforms.");
  }
  if (unmatchedTech.length > 0) {
    unmatchedTech.forEach((term) => {
      missingKeywords.push(term.charAt(0).toUpperCase() + term.slice(1));
    });
    gaps.push({
      area: "Core Technologies",
      type: "skills",
      severity: unmatchedTech.length > 3 ? "high" : "medium",
      description: `Target role specifies deep proficiency in ${unmatchedTech.map((t2) => t2.toUpperCase()).join(", ")}, which are currently missing on your resume skills profile.`,
      recommendation: `Incorporate technical descriptors for ${unmatchedTech.slice(0, 3).map((t2) => t2.toUpperCase()).join(", ")} directly into your skills ledger and work history bullets.`
    });
  }
  const expList = isString ? [] : resumeData.experience || [];
  if (expList.length < 2) {
    gaps.push({
      area: "Professional History Density",
      type: "experience",
      severity: "high",
      description: "The job requirements highlight Senior/Staff levels of accountability. Your profile contains fewer than 2 distinct work experience ledger items.",
      recommendation: "Flesh out previous consulting, freelance, or junior projects to demonstrate professional duration and career progression."
    });
    matchScore -= 15;
  } else {
    matchedStrengths.push(`Strong career duration depth with ${expList.length} distinct professional engagements in senior/mid technical capacities.`);
  }
  let hasMetrics = false;
  expList.forEach((exp) => {
    if (exp.bullets) {
      exp.bullets.forEach((b) => {
        if (/\b\d+%\b|\b\d+\s*(?:percent|million|usd|developers|users|kpi|mil)\b/i.test(b)) {
          hasMetrics = true;
        }
      });
    }
  });
  if (hasMetrics) {
    matchedStrengths.push("Uses high-agency, metric-driven achievements (STAR method format) demonstrating business impact.");
  } else {
    gaps.push({
      area: "Performance Metrics & KPIs",
      type: "experience",
      severity: "medium",
      description: "The target job values performance optimization. Currently, your career bullets describe static duties rather than dynamic, quantified business impacts.",
      recommendation: "Rework work history bullet statements to include specific metrics (revenue growth, render efficiency, deployment speed or payload reduction percentiles)."
    });
    matchScore -= 8;
  }
  const eduList = isString ? [] : resumeData.education || [];
  const hasCS = eduList.some((e) => e.field && /computer|science|engineering|tech/i.test(e.field));
  if (jdLower.includes("degree") || jdLower.includes("bachelor") || jdLower.includes("b.s") || jdLower.includes("computer science")) {
    if (eduList.length === 0) {
      gaps.push({
        area: "Academic Credentials",
        type: "education",
        severity: "high",
        description: "The targeted role strictly lists a higher-education degree (B.S./M.S. in Computer Science or related) as preferred, but your profile lacks an Academic Background section.",
        recommendation: "Ensure your primary degrees, diplomas, or bootcamp professional certifications are listed with proper major fields."
      });
      matchScore -= 12;
    } else if (!hasCS) {
      gaps.push({
        area: "Formal STEM Alignment",
        type: "education",
        severity: "low",
        description: "Your academic degree is in a non-traditional STEM field. While industry experience makes up for this, ATS machines prioritize explicit technical degrees.",
        recommendation: "Relocate your skills list to the absolute top of the page index to distract algorithms, emphasizing skills over formal majors."
      });
      matchScore -= 4;
    } else {
      matchedStrengths.push("Direct academic alignment with a formal degree listed in Computer Science / Engineering.");
    }
  }
  actionPlan.push(`Integrate the missing key tech terms (${missingKeywords.slice(0, 3).join(", ") || "TypeScript, Next.js, Docker"}) into your skills ledger.`);
  actionPlan.push("Convert at least 3 career bullet points from passive statements to metric-enriched STAR metrics.");
  actionPlan.push("Optimize the Professional Summary paragraph to target specific pain points mentioned in the JD.");
  matchScore = Math.max(40, Math.min(98, matchScore));
  return {
    overallScore: matchScore,
    jobTitle,
    companyName: jd.match(/at\s+([A-Z][A-Za-z0-9\s.]{1,20})/)?.[1]?.trim() || void 0,
    summary: `Your resume matches ${matchScore}% of the requirements listed in the job description. While you possess direct technical mastery in several core sectors, resolving the highlighted gaps around ${missingKeywords.slice(0, 2).join(" and ") || "industry terms"} and integrating quantified metric achievements will dramatically elevate your interview match probability.`,
    matchedStrengths,
    gaps,
    missingKeywords,
    actionPlan
  };
}
function getSimulatedSkillConsistency(resumeData, jobDescription) {
  const isString = typeof resumeData === "string";
  const title = isString ? "Software Engineer" : (resumeData.personalInfo?.title || "Professional").trim();
  const skillsList = isString ? [] : resumeData.skills || [];
  const titleLower = title.toLowerCase();
  const skillsLower = skillsList.map((s) => s.toLowerCase());
  let consistencyScore = 88;
  const missingCrucialSkills = [];
  const redundantOrMismatchedSkills = [];
  const issues = [];
  if (titleLower.includes("engineer") || titleLower.includes("developer") || titleLower.includes("programmer") || titleLower.includes("architect")) {
    const mustHaves = titleLower.includes("frontend") || titleLower.includes("web") ? ["React", "TypeScript", "Tailwind CSS", "Next.js"] : titleLower.includes("backend") ? ["Node.js", "PostgreSQL", "Docker", "REST APIs"] : ["Git", "Docker", "TypeScript", "CI/CD"];
    mustHaves.forEach((skill) => {
      if (!skillsLower.some((s) => s.includes(skill.toLowerCase()))) {
        missingCrucialSkills.push(skill);
      }
    });
    const genericSkills = ["microsoft office", "word", "excel", "powerpoint", "typing"];
    skillsList.forEach((s) => {
      if (genericSkills.includes(s.toLowerCase())) {
        redundantOrMismatchedSkills.push(s);
        issues.push({
          skill: s,
          severity: "warning",
          message: `Listed skill "${s}" is considered too basic for an Engineering title "${title}". Consider removing it to save valuable resume real estate.`
        });
      }
    });
    if (missingCrucialSkills.length > 0) {
      consistencyScore -= missingCrucialSkills.length * 10;
      issues.push({
        skill: missingCrucialSkills[0],
        severity: "critical",
        message: `Missing key tool: "${missingCrucialSkills[0]}" is a fundamental expectation for contemporary "${title}" roles.`
      });
    }
  } else if (titleLower.includes("manager") || titleLower.includes("product") || titleLower.includes("lead")) {
    const mustHaves = ["Agile Methodology", "Product Roadmap", "Scrum", "SQL", "Jira"];
    mustHaves.forEach((skill) => {
      if (!skillsLower.some((s) => s.includes(skill.toLowerCase()))) {
        missingCrucialSkills.push(skill);
      }
    });
    if (missingCrucialSkills.length > 0) {
      consistencyScore -= missingCrucialSkills.length * 8;
      issues.push({
        skill: missingCrucialSkills[0],
        severity: "warning",
        message: `Strategic competence missing: Target role candidates heavily rely on "${missingCrucialSkills[0]}" for successful cross-team execution.`
      });
    }
  } else {
    if (!skillsLower.some((s) => s.includes("communication") || s.includes("leadership") || s.includes("project management") || s.includes("strategic"))) {
      missingCrucialSkills.push("Project Management");
      missingCrucialSkills.push("Strategic Alignment");
      consistencyScore -= 12;
      issues.push({
        skill: "Project Management",
        severity: "info",
        message: "Consider adding core soft competencies like Strategic Project Management to reinforce senior professional authority."
      });
    }
  }
  consistencyScore = Math.max(35, Math.min(100, consistencyScore));
  const level = consistencyScore >= 80 ? "outstanding" : consistencyScore >= 60 ? "moderate" : "deficient";
  const summary = `Your listed skills demonstrate ${level} alignment in industry standard taxonomy for a "${title}" profile. We detected ${missingCrucialSkills.length} missing industry standard skillsets and successfully audited your skills metadata against the core requirements.`;
  return {
    consistencyScore,
    jobTitleAnalyzed: title,
    missingCrucialSkills,
    redundantOrMismatchedSkills,
    issues,
    summary
  };
}
function getSimulatedGrammarTone(resumeData) {
  const isString = typeof resumeData === "string";
  const experienceList = isString ? [] : resumeData.experience || [];
  const currentTitle = isString ? "Software Engineer" : resumeData.personalInfo?.title || "Professional";
  const fallbackSuggestions = [
    {
      section: "Professional Summary",
      original: isString ? "I am looking for a job" : resumeData.summary?.substring(0, 75) || "A passionate Engineer with experience...",
      suggested: `Results-driven ${currentTitle} with a documented history of engineering premium web systems and accelerating deployment velocity.`,
      explanation: "Shifts the emphasis from basic desire to high-impact achievements. Replaced generic claims with robust metrics-ready phrases.",
      severity: "medium"
    }
  ];
  if (experienceList.length > 0) {
    const mainJob = experienceList[0];
    const mainTitle = mainJob.role || "Developer";
    const firstBullet = mainJob.bullets && mainJob.bullets[0] || "Helped build features for the website.";
    fallbackSuggestions.push({
      section: `Experience: ${mainTitle}`,
      original: firstBullet,
      suggested: `Architected high-performance responsive components using typescript and modern React, increasing workflow throughput by 22%.`,
      explanation: "Converted low-agency verb ('helped build') to an assertive engineering term ('architected') and specified standard stack tooling with a KPI marker.",
      severity: "high"
    });
    if (mainJob.bullets && mainJob.bullets.length > 1) {
      fallbackSuggestions.push({
        section: `Experience: ${mainTitle}`,
        original: mainJob.bullets[1],
        suggested: `Orchestrated diagnostic debug audits, reducing average latency bottlenecks by 31% across API gateway routes.`,
        explanation: "Action-oriented phrasing emphasizing proactive problem resolution and measurable performance gains.",
        severity: "low"
      });
    }
  }
  return {
    score: 82,
    summary: `The resume for ${isString ? "Applicant" : resumeData.personalInfo?.name || "Jane Doe"} possesses modern technical coordinates, but would benefit from a proactive tense alignment. Several segments lean on non-committal support keywords ('worked on', 'helped') rather than direct executive action indicators.`,
    suggestions: fallbackSuggestions
  };
}
function getSimulatedAnalysis(resumeData, jobDescription, intensity = "balanced") {
  const isString = typeof resumeData === "string";
  const name = isString ? "Professional Applicant" : resumeData.personalInfo?.name || "Jane Doe";
  const currentTitle = isString ? "Software Engineer" : resumeData.personalInfo?.title || "Professional";
  const seedBase = `${name}|${currentTitle}|${jobDescription || ""}`;
  const targetKeywords = [
    { word: "ATS Optimization", importance: "high", present: true },
    { word: "STAR Method Metrics", importance: "high", present: false },
    { word: "Full-Stack Development", importance: "high", present: true },
    { word: "System Architecture", importance: "medium", present: false },
    { word: "TypeScript & React", importance: "high", present: true },
    { word: "Cloud Deployment", importance: "medium", present: true },
    { word: "Quantitative Results", importance: "high", present: false },
    { word: "Enterprise Architecture", importance: "low", present: false }
  ];
  if (jobDescription && jobDescription.length > 5) {
    const jdWords = jobDescription.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const uniqueWords = Array.from(new Set(jdWords)).slice(0, 8);
    uniqueWords.forEach((word, idx) => {
      if (idx < targetKeywords.length) {
        targetKeywords[idx].word = word.charAt(0).toUpperCase() + word.slice(1);
        targetKeywords[idx].present = deterministicPresent(`${seedBase}|keyword|${word}`);
      }
    });
  }
  const score1 = deterministicRange(`${seedBase}|cat1`, intensity === "aggressive" ? 14 : 12, intensity === "aggressive" ? 18 : 16);
  const score2 = deterministicRange(`${seedBase}|cat2`, intensity === "aggressive" ? 12 : 10, intensity === "aggressive" ? 16 : 14);
  const score3 = deterministicRange(`${seedBase}|cat3`, intensity === "aggressive" ? 16 : 14, intensity === "aggressive" ? 20 : 18);
  const score4 = deterministicRange(`${seedBase}|cat4`, intensity === "aggressive" ? 13 : 11, intensity === "aggressive" ? 17 : 15);
  const totalScore = Math.min(98, score1 + score2 + score3 + score4);
  const experienceList = isString ? [] : resumeData.experience || [];
  const tailoredBullets = experienceList.map((exp) => {
    const originalBullets = exp.bullets || ["Responsible for coding and fixing bugs.", "Helped design components."];
    const optimized = originalBullets.map((b) => {
      if (b.includes("Responsible for") || b.includes("Worked on") || b.includes("Helped")) {
        return intensity === "aggressive" ? `Spearheaded enterprise-scale architecture initiatives, accelerating deployment pipeline velocity by 38% via Docker/Kubernetes orchestration.` : `Orchestrated scale-resilient architecture, accelerating deployment pipeline velocity by 34% using Docker container workflows.`;
      }
      return intensity === "aggressive" ? `Engineered metric-driven state handlers; boosted rendering KPIs by 45% through React virtualization and TypeScript strict-mode refactors.` : `Engineered metric-driven state-management handlers; enhanced rendering KPIs by 42% through aggressive React virtual list optimization.`;
    });
    return {
      experienceId: exp.id || "1",
      originalBullets,
      optimizedBullets: optimized
    };
  });
  return {
    atsScore: totalScore,
    categories: [
      { name: "Keyword Alignment", score: score1, max: 25, feedback: "Several key technical terms from the JD match your engineering background. Adding explicit metric-driven phrases will bridge remaining holes." },
      { name: "Experience Impact", score: score2, max: 25, feedback: "Work experience statements lack sufficient numerical data. Shift bullets from standard responsibilities to quantitative STAR-format achievements." },
      { name: "Format & ATS Scan", score: score3, max: 25, feedback: "Excellent parsing eligibility. Clean headings and simplified modular dividers ensure faultless modern ATS machine readings." },
      { name: "Skill Relevancy", score: score4, max: 25, feedback: "Skills listed are solid but we recommend re-ordering high importance technologies such as Tailwind CSS near the top of the category." }
    ],
    keywords: targetKeywords,
    weakPhrases: [
      { original: "Responsible for managing products", replacement: "Spearheaded lifecycle execution of 3 product pipelines", reason: "Avoid passive ownership markers. Show leadership, numeric achievements, and quantifiable business scale." },
      { original: "Helped team build features", replacement: "Architected modern modular components with full TypeScript typing", reason: "Strengthen low-agency claims like 'helped' with affirmative developer traits like 'architected' or 'engineered'." }
    ],
    tailoredSummary: `Premium, tech-resilient ${currentTitle} with a documented history of driving user engagement up by 25% and delivering high-quality, ATS-scanned products. Leverages profound systems mastery (TypeScript, React, Cloud Environments) to optimize application delivery, establish unified team protocols, and convert business requirements into optimized, low-latency software assets.`,
    tailoredBulletPoints: tailoredBullets
  };
}
function getSimulatedCoverLetter(resumeData, jobDescription, companyName, jobTitle, tone = "professional") {
  const isString = typeof resumeData === "string";
  const data = isString ? null : resumeData;
  const personalInfo = data?.personalInfo || {};
  const name = personalInfo.name || "Alex Mercer";
  const currentTitle = jobTitle || personalInfo.title || "Software Engineer";
  const company = companyName?.trim() || jobDescription.match(/at\s+([A-Z][A-Za-z0-9\s.&]{2,30})/)?.[1]?.trim() || "your organization";
  const salutation = companyName ? `Dear ${company} Hiring Team,` : "Dear Hiring Manager,";
  const opening = tone === "enthusiastic" ? `I am excited to apply for the ${currentTitle} role at ${company}. Your team's focus on high-impact engineering aligns perfectly with the measurable outcomes I have delivered throughout my career.` : tone === "concise" ? `I am applying for the ${currentTitle} position at ${company}. My background maps directly to your core requirements.` : `I am writing to express my interest in the ${currentTitle} position at ${company}. With a track record of delivering scalable, user-focused solutions, I am confident I can contribute meaningfully to your team from day one.`;
  const body1 = tone === "concise" ? `My experience includes building production-grade applications, collaborating with cross-functional stakeholders, and translating business goals into shippable features with measurable impact.` : `In my recent roles, I have engineered modern web applications, optimized performance-critical workflows, and partnered with product and design teams to ship features that improve engagement and reliability. The responsibilities outlined in your job description closely mirror the strengths I have demonstrated\u2014particularly in technical execution, ownership, and outcome-driven delivery.`;
  const body2 = tone === "enthusiastic" ? `What draws me most to ${company} is the opportunity to solve meaningful problems at scale while continuing to grow as a builder. I would love to bring my energy, craftsmanship, and collaborative mindset to your team.` : `I am particularly interested in this opportunity because of ${company}'s reputation for thoughtful product development. I would welcome the chance to discuss how my skills can support your immediate roadmap and longer-term engineering goals.`;
  const closing = tone === "concise" ? `Thank you for your time. I am available for an interview at your convenience.` : `Thank you for considering my application. I look forward to the opportunity to discuss how my experience can support ${company}'s objectives, and I am available for an interview at your convenience.`;
  const signature = `Sincerely,
${name}`;
  const fullText = [salutation, "", opening, "", body1, "", body2, "", closing, "", signature].join(
    "\n"
  );
  return {
    salutation,
    opening,
    bodyParagraphs: [body1, body2],
    closing,
    signature,
    fullText,
    tone
  };
}
function getSimulatedInterviewPrep(resumeData, jobDescription, companyName, jobTitle, matchAnalysis) {
  const isString = typeof resumeData === "string";
  const data = isString ? null : resumeData;
  const personalInfo = data?.personalInfo || {};
  const name = personalInfo.name || "the candidate";
  const gaps = matchAnalysis?.gaps?.slice(0, 2).map((g) => g.area) || ["System Design", "Metrics"];
  const keywords = matchAnalysis?.missingKeywords?.slice(0, 3) || ["TypeScript", "React", "CI/CD"];
  return {
    jobTitle,
    companyName,
    focusAreas: [
      `Demonstrate ownership in ${jobTitle} responsibilities`,
      `Address gaps around ${gaps.join(" and ")}`,
      `Weave in keywords: ${keywords.join(", ")}`
    ],
    categories: [
      {
        type: "behavioral",
        label: "Behavioral (STAR)",
        questions: [
          {
            question: `Tell me about a time you delivered impact relevant to this ${jobTitle} role.`,
            tips: "Use STAR: Situation, Task, Action, Result. Quantify the outcome.",
            sampleAnswerOutline: `${name} led a cross-functional initiative, reduced delivery time by 20%, and aligned stakeholders on measurable KPIs.`
          },
          {
            question: "Describe a challenging technical decision you made under ambiguity.",
            tips: "Show trade-off analysis, not perfection. Mention collaboration.",
            sampleAnswerOutline: "Chose architecture X over Y due to latency constraints; documented ADR; validated with A/B metrics."
          }
        ]
      },
      {
        type: "technical",
        label: "Technical Depth",
        questions: [
          {
            question: `How would you approach a core responsibility listed in the ${companyName} JD?`,
            tips: "Map JD requirements to your stack experience; mention testing and observability.",
            sampleAnswerOutline: "Break problem into components \u2192 define interfaces \u2192 ship iteratively \u2192 monitor with dashboards."
          },
          {
            question: "Walk through debugging a production incident you resolved.",
            tips: "Emphasize calm triage, root cause, prevention.",
            sampleAnswerOutline: "Detected via alerts \u2192 isolated regression \u2192 hotfix \u2192 postmortem \u2192 added guardrails."
          }
        ]
      },
      {
        type: "company",
        label: "Company Fit",
        questions: [
          {
            question: `Why ${companyName} and why this role now?`,
            tips: "Connect company mission/products to your career narrative.",
            sampleAnswerOutline: `Excited by ${companyName}'s product direction; role matches my strength in shipping user-facing systems.`
          }
        ]
      }
    ],
    preparationChecklist: [
      "Review JD and map each requirement to 1 resume bullet",
      "Prepare 3 STAR stories with metrics",
      "Research company products and recent initiatives",
      `Prepare thoughtful questions for ${companyName} interviewers`,
      "Practice 60-second intro pitch",
      "Prepare talking points for identified skill gaps",
      "Test video/audio setup if remote interview"
    ]
  };
}
function getSimulatedCompanyResearch(jobDescription, companyName, jobTitle) {
  const jdLower = jobDescription.toLowerCase();
  const isTech = jdLower.includes("engineer") || jdLower.includes("developer") || jdLower.includes("software");
  const products = isTech ? ["Core platform product", "Developer tooling", "Customer-facing web applications"] : ["Primary service offering", "Enterprise solutions", "Customer success programs"];
  return {
    companyName,
    overview: `${companyName} operates in a competitive market, hiring for ${jobTitle} to scale delivery, improve product quality, and drive measurable business outcomes. Candidates should emphasize alignment with team velocity and customer impact.`,
    mission: "Deliver reliable, user-centric solutions while fostering innovation and cross-functional collaboration.",
    products,
    culture: [
      "Ownership and accountability",
      "Data-informed decision making",
      "Collaborative engineering culture",
      jdLower.includes("remote") ? "Remote-friendly async communication" : "In-office collaboration",
      "Continuous learning mindset"
    ],
    recentNews: [
      "Expanded hiring in core product engineering",
      "Focus on performance, reliability, and AI-assisted workflows",
      "Emphasis on customer retention and product-led growth"
    ],
    interviewTips: [
      `Research ${companyName}'s primary product and who uses it`,
      "Prepare examples showing measurable impact, not just responsibilities",
      "Ask about team structure, on-call expectations, and success metrics for the role",
      "Be ready to discuss trade-offs in recent projects",
      "Show curiosity about roadmap and how this role contributes"
    ],
    talkingPoints: [
      `Excited about ${companyName}'s product direction and user base`,
      `My experience maps to the ${jobTitle} requirements around delivery and quality`,
      "Comfortable collaborating with product, design, and stakeholders",
      "Track record of improving reliability and developer experience",
      "Interested in growing with a team that values ownership"
    ]
  };
}

// server/routes/ai/audit.ts
function registerAiAuditRoutes(app, ai) {
  app.post("/api/analyze", async (req, res) => {
    const { resumeData, jobDescription, intensity = "balanced" } = req.body;
    const tailorIntensity = intensity === "aggressive" ? "aggressive" : "balanced";
    if (!resumeData) {
      return res.status(400).json({ error: "resumeData is required" });
    }
    if (!ai) {
      return res.json({
        ...getSimulatedAnalysis(resumeData, jobDescription, tailorIntensity),
        meta: { source: "simulation", simulated: true }
      });
    }
    try {
      const resumeText = typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);
      const jdText = jobDescription || "General Professional ATS Resume Optimization";
      const intensityGuide = tailorIntensity === "aggressive" ? "Use AGGRESSIVE tailoring: maximize keyword density, rewrite ALL bullets with bold metrics (even estimated), and push atsScore adjustments toward stronger alignment." : "Use BALANCED tailoring: preserve factual tone, add metrics where reasonable, and avoid over-stuffing keywords.";
      const prompt = `
You are a highly advanced Applicant Tracking System (ATS), HR Recruiter, and Career Success AI specialized in reverse engineering premium resume optimizations like nextstepresume.ai.
Your objective is to analyze the user's resume, compare it to the target Job Description, score it, identify gaps, keywords, weak phrases, and provide tailormade summary and bullet points.

Tailoring intensity: ${tailorIntensity.toUpperCase()}
${intensityGuide}

Return a JSON object that adheres EXACTLY to this schema structure and no other text:
{
  "atsScore": number (0 to 100 representing percentage match),
  "categories": [
    { "name": "Keyword Alignment", "score": number (0-25), "max": 25, "feedback": "feedback string" },
    { "name": "Experience Impact", "score": number (0-25), "max": 25, "feedback": "feedback string" },
    { "name": "Format & ATS Scan", "score": number (0-25), "max": 25, "feedback": "feedback string" },
    { "name": "Skill Relevancy", "score": number (0-25), "max": 25, "feedback": "feedback string" }
  ],
  "keywords": [
    { "word": "string", "importance": "high" | "medium" | "low", "present": boolean }
  ],
  "weakPhrases": [
    { "original": "string", "replacement": "string", "reason": "string" }
  ],
  "tailoredSummary": "A highly premium tailored professional summary paragraph fitting the resume's history and targeted JD.",
  "tailoredBulletPoints": [
    { "experienceId": "string", "originalBullets": ["string"], "optimizedBullets": ["string"] }
  ]
}

Ensure the "keywords" array has at least 6 critical technical/skill terms from the Job Description. Indicate the ones present vs missing.
Ensure the "weakPhrases" lists 2-3 weak or clich\xE9 phrases in the resume with high-impact data-driven (STAR method) suggestions.
Ensure the "tailoredBulletPoints" optimizes work experience bullets for ALL experiences, replacing passive verbs with strong action verbs (e.g., 'managed' -> 'orchestrated', 'worked on' -> 'engineered') and adding quantifiable outcomes where appropriate.

Here is the user's Resume Data:
${resumeText}

Here is the target Job Description:
${jdText}
    `;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: withMarketWritingGuide(req, prompt),
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an ATS compliance and Resume optimization expert. Return raw JSON matching the requested schema strictly.",
          temperature: 0.2
        }
      });
      const textOutput = response.text?.trim() || "{}";
      const result = parseAiJson(textOutput, () => getSimulatedAnalysis(resumeData, jobDescription, tailorIntensity));
      return res.json({ ...result, meta: { source: "gemini", simulated: false } });
    } catch (error) {
      console.error("Gemini tailoring error:", error);
      return res.status(500).json({
        error: "Failed to generate AI Tailor response",
        fallback: getSimulatedAnalysis(resumeData, jobDescription, tailorIntensity),
        meta: { source: "simulation", simulated: true }
      });
    }
  });
  app.post("/api/grammar-tone-check", async (req, res) => {
    const { resumeData } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: "resumeData is required" });
    }
    if (!ai) {
      return res.json({ ...getSimulatedGrammarTone(resumeData), meta: { source: "simulation", simulated: true } });
    }
    try {
      const resumeText = typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);
      const prompt = `
You are an elite executive resume editor, grammar expert, and professional copywriter.
Analyze the following resume data for spelling mistakes, grammatical errors, active vs passive voice issues, formatting inconsistencies, and overall professional tone (it should be authoritative, result-oriented, and active).

Resume Data:
${resumeText}

Provide a comprehensive, detailed grammar and tone analysis. Return a JSON object matching this schema exactly, and no other text:
{
  "score": number (0 to 100 representing overall tone/grammar quality),
  "summary": "A concise professional assessment (2-3 sentences) of the resume's grammar, proofreading, and vocabulary clarity.",
  "suggestions": [
    {
      "section": "string representing section names: e.g., 'Summary', 'Experience: <Job Title>', etc.",
      "original": "The exact original sentence or bullet point that has room for improvement",
      "suggested": "The corrected, polished, high-impact version",
      "explanation": "Detailed explanation of why this update makes it superior (e.g., grammatical correction, active tone shift, clarity enhancement)",
      "severity": "high" | "medium" | "low"
    }
  ]
}

Ensure you scan the professional summary and ALL experience bullet points thoroughly! List up to 4-6 valuable, precise suggestions. Limit original and suggested properties to specific sentences or bullets, not entire pages, to make them easy to compare.
    `;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: withMarketWritingGuide(req, prompt),
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an elite proofreader and resume consulting editor. Return raw JSON matching the requested schema strictly.",
          temperature: 0.3
        }
      });
      const textOutput = response.text?.trim() || "{}";
      const result = parseAiJson(textOutput, () => getSimulatedGrammarTone(resumeData));
      return res.json({ ...result, meta: { source: "gemini", simulated: false } });
    } catch (error) {
      console.error("Gemini grammar checking error:", error);
      return res.status(500).json({
        error: "Failed to generate AI Grammar check response",
        fallback: getSimulatedGrammarTone(resumeData),
        meta: { source: "simulation", simulated: true }
      });
    }
  });
  app.post("/api/readability-complexity", async (req, res) => {
    const { resumeData } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: "resumeData is required" });
    }
    if (!ai) {
      return res.json({ ...getSimulatedReadability(resumeData), meta: { source: "simulation", simulated: true } });
    }
    try {
      const resumeText = typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);
      const prompt = `
You are an advanced Applicant Tracking System (ATS) algorithmic parser, readability consultant, and expert resume consultant.
Analyze the following resume data for readability, sentence structure complexity, and technical jargon/buzzword density. Keep in mind that heavy technical jargon and overly long complex sentences make resumes hard to parse for both ATS and human reviewers.

Resume Data:
${resumeText}

Provide a detailed readability and complexity analysis. Return a JSON object matching this schema exactly, and no other text:
{
  "readabilityScore": number (0 to 100 representing Flesch-like readability ease, layout balance, and parser accessibility),
  "complexityLevel": "High" | "Medium" | "Low" (cognitive load level),
  "averageSentenceLength": number (estimated average word count per sentence/bullet point),
  "jargonDensity": number (percentage 0 to 100 of academic/corporate jargon, buzzwords, or ungrounded qualifiers),
  "summary": "A concise assessment (2-3 sentences) summarizing how easily an ATS parses the structures, the clarity of sentence lengths, and the buzzword density.",
  "suggestions": [
    {
      "section": "string representing section names: e.g., 'Summary', 'Experience: <Job Title>', etc.",
      "original": "The exact original complex or jargon-loaded statement that has room for simplification",
      "suggested": "The simplified, high-impact version that maintains target keywords but is significantly easier to parse",
      "reason": "Detailed explanation of why this style shift reduces reader cognitive load or improves parser regex matching",
      "type": "sentence_structure" | "jargon_reduction"
    }
  ]
}

Identify 3-5 specific, strong suggestions for simplifying sentence structures or reducing ungrounded jargon clauses. Ensure suggestions can be easily compared.
    `;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: withMarketWritingGuide(req, prompt),
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an expert resume parsing readability consultant. Return raw JSON matching the requested schema strictly.",
          temperature: 0.3
        }
      });
      const textOutput = response.text?.trim() || "{}";
      const result = parseAiJson(textOutput, () => getSimulatedReadability(resumeData));
      return res.json({ ...result, meta: { source: "gemini", simulated: false } });
    } catch (error) {
      console.error("Gemini readability checking error:", error);
      return res.status(500).json({
        error: "Failed to generate AI Readability check response",
        fallback: getSimulatedReadability(resumeData),
        meta: { source: "simulation", simulated: true }
      });
    }
  });
  app.post("/api/skill-job-consistency", async (req, res) => {
    const { resumeData, jobDescription } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: "resumeData is required" });
    }
    if (!ai) {
      return res.json({ ...getSimulatedSkillConsistency(resumeData, jobDescription), meta: { source: "simulation", simulated: true } });
    }
    try {
      const title = resumeData.personalInfo?.title || "Staff Member";
      const skillsList = resumeData.skills || [];
      const resumeText = typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);
      const prompt = `
You are an expert tech recruiter, ATS indexing algorithm debugger, and veteran resume taxonomist.
Your job is to analyze the relationship between the candidate's target job title "${title}" (and optional target job description context below) and their currently declared list of skills.

Current Listed Skills:
${JSON.stringify(skillsList, null, 2)}

Full Resume Details (for deep sector context, work history, or technology references):
${resumeText}

Target Job Description (for matching context if relevant):
${jobDescription || "None provided"}

Analyze any misalignment, missing standards, or outdated keywords, and return a single valid JSON object matching this schema exactly with no other conversational markdown wrappers:
{
  "consistencyScore": number (0 to 100 representing how well aligned, accurate, up-to-date, and strong the currently listed skills are for the target job title; if important required skills are completely missing for the target job title, decrease the score),
  "jobTitleAnalyzed": "${title}",
  "missingCrucialSkills": ["list 2-4 crucial skills that are industry-standard requirements or highly relevant for this specific role/title, but missing in this resume's skills list"],
  "redundantOrMismatchedSkills": ["list 1-3 skills that are highly outdated, generic buzzwords, or completely mismatched/irrelevant for this target role"],
  "issues": [
    {
      "skill": "Name of the mismatched, missing or weak skill",
      "severity": "critical" | "warning" | "info",
      "message": "Clear explanation of the mismatch, why it fails machine ATS checks, and the recommended integration approach."
    }
  ],
  "summary": "A concise, professional 2-3 sentence overview highlighting the alignment health of the candidate's skills taxonomy relative to the target career sector."
}
    `;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: withMarketWritingGuide(req, prompt),
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an expert developer-recruitment resume auditor. Return raw JSON matching the requested schema strictly.",
          temperature: 0.3
        }
      });
      const textOutput = response.text?.trim() || "{}";
      const result = parseAiJson(textOutput, () => getSimulatedSkillConsistency(resumeData, jobDescription));
      return res.json({ ...result, meta: { source: "gemini", simulated: false } });
    } catch (error) {
      console.error("Gemini skill consistency checking error:", error);
      return res.status(500).json({
        error: "Failed to generate AI Skill Consistency check response",
        fallback: getSimulatedSkillConsistency(resumeData, jobDescription),
        meta: { source: "simulation", simulated: true }
      });
    }
  });
  app.post("/api/match-analysis", async (req, res) => {
    const { resumeData, jobDescription } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: "resumeData is required" });
    }
    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({ error: "jobDescription is required for matching" });
    }
    if (!ai) {
      return res.json({ ...getSimulatedMatchAnalysis(resumeData, jobDescription), meta: { source: "simulation", simulated: true } });
    }
    try {
      const resumeText = typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);
      const prompt = `
You are an elite Applicant Tracking System (ATS) matching algorithm, Senior Recruiter, and Career Success Coach.
Your task is to perform an extensive 'Gap Analysis' and Match Audit comparing the candidate's Resume against their target Job Description (JD).

Resume Data:
${resumeText}

Target Job Description:
${jobDescription}

Perform a rigorous comparison. Assess technology fit, years of experience, chronological depth, industry-standard expectations, academic background, and quantifiable performance evidence (STAR-format achievements with metrics).
Identify precise strengths they have, exact professional or technical gaps (missing skills, certification mismatches, soft competency voids, layout details, lack of metrics), missing keywords, an overall match percentage score, and a 3-4 step Action Plan to bridge these gaps.

Return a response in strict JSON format matching this schema exactly, and no other text wrappers:
{
  "overallScore": number (0 to 100 representing overall suitability/match level based on requirements),
  "jobTitle": "Estimated / Extracted target job title from the job description",
  "companyName": "Extracted target company name, if declared, or default to empty string",
  "summary": "A high-quality 3-4 sentence professional evaluation of the candidate's alignment relative to this specific job description, explaining the match tier clearly.",
  "matchedStrengths": ["List 2-4 strong matching characteristics, competencies, or achievements the candidate already possesses that match the JD requirements perfectly"],
  "gaps": [
    {
      "area": "Specific technology, skill, section or metric block (e.g. 'Advanced Frontend Frameworks', 'STAR KPI metrics')",
      "type": "skills" | "experience" | "education" | "credentials",
      "severity": "high" | "medium" | "low",
      "description": "Clear explanation of what is missing or weak compared to standard requirements",
      "recommendation": "Step-by-step guidance on how to fix this gap in their resume details"
    }
  ],
  "missingKeywords": ["List 3-6 critical keywords, technology names, or domain terminology present in the job description but missing/unacknowledged in the candidate's resume"],
  "actionPlan": ["3-4 clear, actionable, specific instructions on what edits we highly advise the candidate to execute right now to elevate their match score"]
}
    `;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: withMarketWritingGuide(req, prompt),
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an expert resume developer and recruiter. Output raw JSON matching the exact schema specified.",
          temperature: 0.3
        }
      });
      const textOutput = response.text?.trim() || "{}";
      const result = parseAiJson(textOutput, () => getSimulatedMatchAnalysis(resumeData, jobDescription));
      return res.json({ ...result, meta: { source: "gemini", simulated: false } });
    } catch (error) {
      console.error("Gemini Match Analysis call failed:", error);
      return res.status(500).json({
        error: "Failed to generate AI Match analysis response",
        fallback: getSimulatedMatchAnalysis(resumeData, jobDescription),
        meta: { source: "simulation", simulated: true }
      });
    }
  });
}

// server/routes/ai/application.ts
function registerAiApplicationRoutes(app, ai) {
  app.post("/api/cover-letter", async (req, res) => {
    const {
      resumeData,
      jobDescription,
      companyName = "",
      jobTitle = "",
      tone = "professional"
    } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: "resumeData is required" });
    }
    if (!jobDescription || String(jobDescription).trim().length === 0) {
      return res.status(400).json({ error: "jobDescription is required" });
    }
    const coverTone = tone === "enthusiastic" || tone === "concise" ? tone : "professional";
    if (!ai) {
      return res.json({
        ...getSimulatedCoverLetter(resumeData, jobDescription, companyName, jobTitle, coverTone),
        meta: { source: "simulation", simulated: true }
      });
    }
    try {
      const resumeText = typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);
      const toneGuide = coverTone === "enthusiastic" ? "Use an enthusiastic but professional tone with confident energy." : coverTone === "concise" ? "Use a concise, direct tone \u2014 shorter paragraphs, no filler." : "Use a polished, professional corporate tone.";
      const prompt = `
You are an elite career coach and cover letter writer for premium job applications (nextstepresume.ai style).
Write a tailored cover letter comparing the candidate resume to the target job description.

Tone: ${coverTone.toUpperCase()}
${toneGuide}

Target company: ${companyName || "Not specified \u2014 infer from JD if possible"}
Target role: ${jobTitle || "Not specified \u2014 infer from JD"}

Return strict JSON only, matching this schema:
{
  "salutation": "Dear Hiring Manager," or personalized if company known,
  "opening": "First paragraph hook \u2014 role interest + 1-line value proposition",
  "bodyParagraphs": ["2-3 paragraphs bridging resume strengths to JD requirements with specifics"],
  "closing": "Call to action + gratitude paragraph",
  "signature": "Sincerely,\\n[Candidate Name]",
  "fullText": "Complete letter as plain text with paragraph breaks",
  "tone": "${coverTone}"
}

Resume:
${resumeText}

Job Description:
${jobDescription}
    `;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: withMarketWritingGuide(req, prompt),
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an expert cover letter writer. Return raw JSON matching the schema exactly.",
          temperature: 0.35
        }
      });
      const textOutput = response.text?.trim() || "{}";
      const result = parseAiJson(
        textOutput,
        () => getSimulatedCoverLetter(resumeData, jobDescription, companyName, jobTitle, coverTone)
      );
      return res.json({ ...result, meta: { source: "gemini", simulated: false } });
    } catch (error) {
      console.error("Gemini cover letter error:", error);
      return res.status(500).json({
        error: "Failed to generate cover letter",
        fallback: getSimulatedCoverLetter(
          resumeData,
          jobDescription,
          companyName,
          jobTitle,
          coverTone
        ),
        meta: { source: "simulation", simulated: true }
      });
    }
  });
  app.post("/api/interview-prep", async (req, res) => {
    const {
      resumeData,
      jobDescription,
      companyName = "",
      jobTitle = "",
      matchAnalysis
    } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: "resumeData is required" });
    }
    if (!jobDescription || String(jobDescription).trim().length === 0) {
      return res.status(400).json({ error: "jobDescription is required" });
    }
    const company = companyName?.trim() || jobDescription.match(/at\s+([A-Z][A-Za-z0-9\s.&]{2,30})/)?.[1]?.trim() || "Target Company";
    const role = jobTitle?.trim() || typeof resumeData === "object" && resumeData?.personalInfo?.title || "Target Role";
    if (!ai) {
      return res.json({
        ...getSimulatedInterviewPrep(resumeData, jobDescription, company, role, matchAnalysis),
        meta: { source: "simulation", simulated: true }
      });
    }
    try {
      const resumeText = typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);
      const matchContext = matchAnalysis ? JSON.stringify(matchAnalysis, null, 2) : "No prior match analysis provided.";
      const prompt = `
You are an elite interview coach for software and professional roles (nextstepresume.ai style).
Generate tailored interview preparation based on the candidate resume, job description, and optional gap analysis.

Company: ${company}
Role: ${role}

Return strict JSON only:
{
  "jobTitle": "${role}",
  "companyName": "${company}",
  "focusAreas": ["3-5 areas to emphasize in interview"],
  "categories": [
    {
      "type": "technical" | "behavioral" | "company" | "role",
      "label": "Category display name",
      "questions": [
        {
          "question": "Likely interview question",
          "tips": "How to approach answering",
          "sampleAnswerOutline": "STAR or bullet outline using candidate's real experience"
        }
      ]
    }
  ],
  "preparationChecklist": ["5-7 actionable prep steps before the interview"]
}

Include at least 2 categories with 2-3 questions each. Ground answers in the resume.

Resume:
${resumeText}

Job Description:
${jobDescription}

Match / Gap Analysis:
${matchContext}
    `;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: withMarketWritingGuide(req, prompt),
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an expert interview coach. Return raw JSON matching the schema exactly.",
          temperature: 0.35
        }
      });
      const textOutput = response.text?.trim() || "{}";
      const result = parseAiJson(
        textOutput,
        () => getSimulatedInterviewPrep(resumeData, jobDescription, company, role, matchAnalysis)
      );
      return res.json({ ...result, meta: { source: "gemini", simulated: false } });
    } catch (error) {
      console.error("Gemini interview prep error:", error);
      return res.status(500).json({
        error: "Failed to generate interview prep",
        fallback: getSimulatedInterviewPrep(
          resumeData,
          jobDescription,
          company,
          role,
          matchAnalysis
        ),
        meta: { source: "simulation", simulated: true }
      });
    }
  });
  app.post("/api/company-research", async (req, res) => {
    const { jobDescription, companyName = "", jobTitle = "" } = req.body;
    if (!jobDescription || String(jobDescription).trim().length === 0) {
      return res.status(400).json({ error: "jobDescription is required" });
    }
    const company = companyName?.trim() || jobDescription.match(/at\s+([A-Z][A-Za-z0-9\s.&]{2,30})/)?.[1]?.trim() || "Target Company";
    const role = jobTitle?.trim() || "Target Role";
    if (!ai) {
      return res.json({
        ...getSimulatedCompanyResearch(jobDescription, company, role),
        meta: { source: "simulation", simulated: true }
      });
    }
    try {
      const prompt = `
You are a career research analyst helping candidates prepare for applications (nextstepresume.ai style).
Research the target company based on the job description context. If exact company facts are unknown, infer reasonable industry-standard insights and label uncertainties implicitly in neutral language.

Company: ${company}
Role: ${role}

Return strict JSON only:
{
  "companyName": "${company}",
  "overview": "2-3 sentence company overview",
  "mission": "Likely mission or value proposition",
  "products": ["2-4 products/services or focus areas"],
  "culture": ["3-5 culture signals from JD or industry norms"],
  "recentNews": ["2-3 plausible recent themes or initiatives to mention"],
  "interviewTips": ["3-5 company-specific interview tips"],
  "talkingPoints": ["4-6 talking points linking candidate interest to company"]
}

Job Description:
${jobDescription}
    `;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: withMarketWritingGuide(req, prompt),
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are a company research analyst for job seekers. Return raw JSON matching the schema.",
          temperature: 0.4
        }
      });
      const textOutput = response.text?.trim() || "{}";
      const result = parseAiJson(
        textOutput,
        () => getSimulatedCompanyResearch(jobDescription, company, role)
      );
      return res.json({ ...result, meta: { source: "gemini", simulated: false } });
    } catch (error) {
      console.error("Gemini company research error:", error);
      return res.status(500).json({
        error: "Failed to generate company research",
        fallback: getSimulatedCompanyResearch(jobDescription, company, role),
        meta: { source: "simulation", simulated: true }
      });
    }
  });
}

// server/routes/ai/geminiChat.ts
var import_genai2 = require("@google/genai");
function registerAiGeminiRoutes(app, ai) {
  app.post("/api/ask-gemini", async (req, res) => {
    const { message, resumeData, jobDescription, history = [], thinkingMode = false } = req.body;
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }
    if (!ai) {
      const reply = getSimulatedGeminiReply(message, resumeData, jobDescription);
      return res.json({ reply, meta: { source: "simulation", simulated: true } });
    }
    try {
      const resumeText = typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2);
      const jdText = jobDescription || "Not provided";
      const preamble = `You are NextStepResume.ai's Elite Career Coach, ATS optimiser, and Expert Resume Editor.
Your job is to answer candidates' questions with brilliant, precise, highly actionable, and professional advising.
Always provide concrete advice, specific keywords, or bullet point rewrites using the STAR methodology (Situation, Task, Action, Result) when asked.
Keep answers concise, scannable (with bold text or bullet points), and highly encouraging!

Here is the candidate's Resume Profile:
${resumeText}

Here is the Target Job Description:
${jdText}
`;
      const chatContents = [
        { text: preamble },
        ...history.map((msg) => ({
          text: `${msg.role === "user" ? "Candidate" : "Assistant"}: ${msg.content}`
        })),
        { text: `Candidate Question: ${message}

Please response directly and professionally as their elite Career Coach:` }
      ];
      const finalModel = thinkingMode ? "gemini-3.1-pro-preview" : "gemini-3.5-flash";
      const finalConfig = {
        systemInstruction: `You are an elite career development strategist for Hong Kong job seekers. Give realistic, professional, highly actionable guidance.

${getAiWritingGuide({ locale: req.header("X-Locale") ?? void 0 })}`,
        temperature: thinkingMode ? 0.7 : 0.7
      };
      if (thinkingMode) {
        finalConfig.thinkingConfig = {
          thinkingLevel: import_genai2.ThinkingLevel.HIGH
        };
      }
      const response = await ai.models.generateContent({
        model: finalModel,
        contents: chatContents.map((c) => c.text).join("\n\n"),
        config: finalConfig
      });
      const reply = response.text || "I was unable to analyze your request. Please try rephrasing.";
      return res.json({ reply, meta: { source: "gemini", simulated: false } });
    } catch (error) {
      console.error("Gemini chatbot error:", error);
      return res.status(500).json({
        error: "Failed to reach Gemini Career Advisor core",
        reply: getSimulatedGeminiReply(message, resumeData, jobDescription),
        meta: { source: "simulation", simulated: true }
      });
    }
  });
}

// server/routes/ai/index.ts
function registerAiRoutes(app, ai) {
  registerAiAuditRoutes(app, ai);
  registerAiApplicationRoutes(app, ai);
  registerAiGeminiRoutes(app, ai);
}

// server/routes/auth.ts
function registerAuthRoutes(app) {
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
        email: auth.user.email ?? null
      },
      clientId: auth.clientId,
      plan: record.plan
    });
  });
  app.post("/api/auth/link-client", (req, res) => {
    const auth = getNsrAuth(req);
    if (!auth) {
      res.status(401).json({ error: "auth_required" });
      return;
    }
    const anonymousClientId = typeof req.body?.anonymousClientId === "string" ? req.body.anonymousClientId.trim() : "";
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
      month: record.month
    });
  });
}

// server/sync/postgresSyncStore.ts
function rowToWorkspace(row) {
  return {
    resumeData: row.resume_data && typeof row.resume_data === "object" ? row.resume_data : {},
    jobDescription: row.job_description ?? "",
    templateId: row.template_id ?? "modern-01",
    updatedAt: row.updated_at
  };
}
var SupabasePostgresSyncStore = class {
  async getWorkspace(userId) {
    const admin = getSupabaseAdmin();
    if (!admin) return null;
    const { data, error } = await admin.from("resume_workspaces").select("resume_data, job_description, template_id, updated_at").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowToWorkspace(data);
  }
  async upsertWorkspace(userId, record) {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error("supabase_not_configured");
    const updatedAt = record.updatedAt || (/* @__PURE__ */ new Date()).toISOString();
    const { data, error } = await admin.from("resume_workspaces").upsert({
      user_id: userId,
      resume_data: record.resumeData,
      job_description: record.jobDescription,
      template_id: record.templateId,
      updated_at: updatedAt
    }).select("resume_data, job_description, template_id, updated_at").single();
    if (error) throw error;
    return rowToWorkspace(data);
  }
  async getApplicationPackages(userId) {
    const admin = getSupabaseAdmin();
    if (!admin) return null;
    const { data, error } = await admin.from("user_application_packages").select("packages, updated_at").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const packages = Array.isArray(data.packages) ? data.packages : [];
    return {
      packages,
      updatedAt: data.updated_at
    };
  }
  async upsertApplicationPackages(userId, record) {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error("supabase_not_configured");
    const updatedAt = record.updatedAt || (/* @__PURE__ */ new Date()).toISOString();
    const { data, error } = await admin.from("user_application_packages").upsert({
      user_id: userId,
      packages: record.packages,
      updated_at: updatedAt
    }).select("packages, updated_at").single();
    if (error) throw error;
    return {
      packages: Array.isArray(data.packages) ? data.packages : [],
      updatedAt: data.updated_at
    };
  }
};
var syncStore = new SupabasePostgresSyncStore();
function getPostgresSyncStore() {
  return syncStore;
}
function isPostgresSyncConfigured() {
  return isSupabaseConfigured();
}

// server/routes/config.ts
function registerConfigRoutes(app) {
  app.get("/api/config", (_req, res) => {
    const appMode = readServerAppMode();
    const stripeReady = isStripeConfigured();
    const productionBilling = appMode === "production" && stripeReady;
    const supabaseReady = isSupabaseConfigured();
    res.json({
      appMode,
      billing: {
        provider: productionBilling ? "stripe" : "demo",
        checkoutEnabled: productionBilling
      },
      auth: {
        enabled: supabaseReady,
        required: isAuthRequired() && supabaseReady,
        supabaseUrl: supabaseReady ? getSupabaseUrl() : null,
        supabaseAnonKey: supabaseReady ? getSupabaseAnonKey() : null
      },
      sync: {
        enabled: isPostgresSyncConfigured()
      }
    });
  });
}

// server/routes/exportPdf.ts
var PRINT_READY_SELECTOR = '[data-print-ready="true"]';
var PRINT_TIMEOUT_MS = 2e4;
var IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
async function launchChromium() {
  if (IS_SERVERLESS) {
    try {
      const sparticuz = (await import("@sparticuz/chromium")).default;
      const { chromium } = await import("playwright-core");
      const executablePath = await sparticuz.executablePath();
      return await chromium.launch({
        headless: true,
        executablePath,
        args: sparticuz.args
      });
    } catch (error) {
      console.error("[export/pdf] serverless chromium launch failed:", error);
      return null;
    }
  }
  try {
    const pw = await import("playwright-core");
    return await pw.chromium.launch({ headless: true });
  } catch {
    try {
      const pw = await import("playwright");
      return await pw.chromium.launch({ headless: true });
    } catch {
      return null;
    }
  }
}
function resolvePrintOrigin(req) {
  if (IS_SERVERLESS) {
    const host = req.headers["x-forwarded-host"] ?? req.headers.host;
    if (host) {
      const proto = req.headers["x-forwarded-proto"] ?? "https";
      return `${proto.split(",")[0]}://${host.split(",")[0]}`;
    }
  }
  const port = Number(process.env.PORT) || 3e3;
  return `http://127.0.0.1:${port}`;
}
function registerExportPdfRoutes(app) {
  app.post("/api/export/pdf", (req, res) => {
    void handleExportPdf(req, res);
  });
}
async function handleExportPdf(req, res) {
  const { resumeData, templateStyle, locale, pageFormat, paperMode } = req.body ?? {};
  const format = pageFormat === "Letter" ? "Letter" : "A4";
  if (!resumeData || typeof resumeData !== "object" || !("personalInfo" in resumeData)) {
    res.status(400).json({ error: "resumeData is required" });
    return;
  }
  const browser = await launchChromium();
  if (!browser) {
    res.status(501).json({ error: "PDF renderer unavailable in this environment" });
    return;
  }
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });
    const payload = JSON.stringify({
      resumeData,
      templateStyle,
      locale,
      paperMode: paperMode === "white" ? "white" : "cream"
    });
    await page.addInitScript((raw) => {
      try {
        localStorage.setItem("nsr_print_payload", raw);
      } catch {
      }
    }, payload);
    await page.goto(`${resolvePrintOrigin(req)}/?print=1`, {
      waitUntil: "domcontentloaded",
      timeout: PRINT_TIMEOUT_MS
    });
    await page.waitForSelector(PRINT_READY_SELECTOR, { timeout: PRINT_TIMEOUT_MS });
    await page.evaluate(() => document.fonts.ready.then(() => void 0));
    const pdf = await page.pdf({
      format,
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" }
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=resume.pdf");
    res.send(Buffer.from(pdf));
  } catch (error) {
    console.error("[export/pdf] render failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "PDF render failed" });
    }
  } finally {
    await browser.close().catch(() => void 0);
  }
}

// server/routes/health.ts
function registerHealthRoutes(app, aiEnabled) {
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      ai_enabled: aiEnabled,
      app_mode: readServerAppMode(),
      stripe_enabled: isStripeConfigured(),
      auth_enabled: isSupabaseConfigured(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
}

// src/lib/atsKeywords.ts
var TECH_KEYWORDS_POOL = [
  "react",
  "typescript",
  "javascript",
  "tailwind",
  "next.js",
  "node.js",
  "node",
  "docker",
  "kubernetes",
  "aws",
  "python",
  "graphql",
  "sql",
  "postgresql",
  "vite",
  "performance",
  "metrics",
  "star",
  "spa",
  "hooks",
  "redux",
  "express",
  "developer",
  "engineer",
  "engineering",
  "quantifiable",
  "quantitative",
  "optimization",
  "optimize",
  "responsive",
  "profiling",
  "analytics",
  "database",
  "drizzle",
  "supabase",
  "git",
  "github",
  "ci/cd",
  "agile",
  "scrum"
];
function extractJdKeywords(jobDescription) {
  const jdLower = (jobDescription || "").toLowerCase();
  const matched = TECH_KEYWORDS_POOL.filter((word) => jdLower.includes(word));
  if (matched.length > 0) return matched;
  const tokens = jdLower.match(/\b[a-z][a-z0-9+#./-]{2,}\b/g) || [];
  const unique = Array.from(new Set(tokens)).filter((t2) => t2.length >= 4 && !["with", "this", "that", "will", "your", "have", "role"].includes(t2)).slice(0, 12);
  return unique.length > 0 ? unique : ["react", "typescript", "javascript", "tailwind", "metrics", "performance"];
}

// src/lib/jdHtmlExtract.ts
function stripHtmlToText(html) {
  let text = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<noscript[\s\S]*?<\/noscript>/gi, "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<\/div>/gi, "\n").replace(/<\/li>/gi, "\n").replace(/<\/h[1-6]>/gi, "\n\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
  text = text.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
  return text;
}
function extractHtmlPageHints(html) {
  const pick = (pattern) => {
    const m = html.match(pattern);
    return m?.[1]?.trim().replace(/\s+/g, " ") ?? "";
  };
  const pageTitle = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const ogTitle = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  const ogDescription = pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) || pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
  const h1 = pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, "").trim();
  return { pageTitle, ogTitle, ogDescription, h1 };
}
function buildJobDescriptionFromHtml(html) {
  const hints = extractHtmlPageHints(html);
  const bodyText = stripHtmlToText(html);
  const headline = hints.ogTitle || (hints.pageTitle && /[|\-–—]/.test(hints.pageTitle) ? hints.pageTitle : "") || hints.h1 || hints.pageTitle;
  const intro = [headline, hints.ogDescription].filter(Boolean).join("\n\n");
  let jobDescription = bodyText;
  if (bodyText.length > 8e3) {
    jobDescription = bodyText.slice(0, 8e3).trim() + "\n\n[\u2026\u5167\u5BB9\u5DF2\u622A\u65B7]";
  }
  if (intro && !jobDescription.startsWith(intro.slice(0, 40))) {
    jobDescription = intro ? `${intro}

${jobDescription}` : jobDescription;
  }
  return {
    jobDescription: jobDescription.trim(),
    pageTitle: hints.pageTitle,
    headline
  };
}

// src/lib/extractJobMeta.ts
function extractJobMeta(jobDescription) {
  const jd = jobDescription.trim();
  if (!jd) {
    return { jobTitle: "", companyName: "" };
  }
  const titlePatterns = [
    /(?:job title|position|role|職務名稱|職缺名稱|職稱|工作內容)\s*[：:\-]\s*([^\n]{2,80})/i,
    /^([A-Z\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff\s/&\-().]{2,60})\s*(?:\(|（|–|—|-|\|)/m,
    /(?:hiring|seeking|looking for|誠徵|招募)\s*(?:a\s+)?([A-Za-z0-9\u4e00-\u9fff\s/&\-().]{2,60})/i,
    /【([^】\n]{2,40})】/
  ];
  let jobTitle = "";
  for (const pattern of titlePatterns) {
    const match = jd.match(pattern);
    if (match?.[1]?.trim()) {
      jobTitle = match[1].trim().replace(/\s{2,}/g, " ");
      break;
    }
  }
  const companyPatterns = [
    /(?:company|employer|organization|公司名稱|雇主|企業)\s*[：:\-]\s*([^\n]{2,60})/i,
    /(?:at|@|於)\s+([A-Z\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff\s.&]{2,40})(?:\s|,|\.|\n|，)/,
    /^([A-Z\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff\s.&]{2,40})\s+(?:is\s+(?:hiring|seeking|looking)|誠徵|招募)/m
  ];
  let companyName = "";
  for (const pattern of companyPatterns) {
    const match = jd.match(pattern);
    if (match?.[1]?.trim()) {
      companyName = match[1].trim().replace(/\s{2,}/g, " ");
      break;
    }
  }
  return { jobTitle, companyName };
}

// src/i18n/types.ts
var DEFAULT_LOCALE = getActiveMarket().defaultLocale;

// src/lib/createDraftApplicationPackage.ts
function mergeImportedJobMeta(headline, extracted) {
  let jobTitle = extracted.jobTitle;
  let companyName = extracted.companyName;
  if (!jobTitle && headline) {
    const parts = headline.split(/\s*[|\-–—]\s*/);
    if (parts.length >= 2) {
      jobTitle = parts[0]?.trim() || jobTitle;
      companyName = companyName || parts[parts.length - 1]?.trim() || "";
    } else {
      jobTitle = headline.trim();
    }
  }
  return { jobTitle, companyName };
}

// src/lib/security/urlPolicy.ts
var PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^::1$/i,
  /^\[::1\]$/,
  /^fc[0-9a-f:]+$/i,
  /^fd[0-9a-f:]+$/i,
  /^fe8[0-9a-f:]*$/i,
  /^fe9[0-9a-f:]*$/i,
  /^fea[0-9a-f:]*$/i,
  /^feb[0-9a-f:]*$/i
];
function parsePublicHttpUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "URL is required" };
  }
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false, error: "Only http/https URLs are allowed" };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: "URLs with embedded credentials are not allowed" };
  }
  const host = parsed.hostname.toLowerCase();
  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(host))) {
    return { ok: false, error: "Private or local URLs are not allowed" };
  }
  return { ok: true, url: parsed };
}
function validateJobsdbStartUrl(raw, country) {
  const base = parsePublicHttpUrl(raw);
  if (!base.ok) return base;
  if (base.url.protocol !== "https:") {
    return { ok: false, error: "JobsDB URLs must use HTTPS" };
  }
  const host = base.url.hostname.toLowerCase();
  const countryHosts = /* @__PURE__ */ new Set([
    `${country}.jobsdb.com`,
    `www.${country}.jobsdb.com`
  ]);
  if (!countryHosts.has(host)) {
    return { ok: false, error: "startUrl must match the selected JobsDB country" };
  }
  return base;
}

// server/lib/outboundUrlSafety.ts
var import_promises = require("node:dns/promises");
var import_node_net = require("node:net");
function isPrivateIpv4(address) {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10 || a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  if (a === 0) return true;
  return false;
}
function expandIpv6(address) {
  const normalized = address.toLowerCase().split("%")[0];
  if (!normalized.includes(":")) return null;
  const halves = normalized.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":").filter(Boolean) : [];
  const right = halves[1] ? halves[1].split(":").filter(Boolean) : [];
  if (left.length + right.length > 8) return null;
  const fill = new Array(8 - left.length - right.length).fill("0");
  const groups = halves.length === 2 ? [...left, ...fill, ...right] : left;
  if (groups.length !== 8) return null;
  return groups.map((group) => group.padStart(4, "0"));
}
function isPrivateIpv6(address) {
  const groups = expandIpv6(address);
  if (!groups) return false;
  const first = parseInt(groups[0], 16);
  const second = parseInt(groups[1], 16);
  if (first === 0 && second === 0 && groups.slice(2, 7).every((group) => parseInt(group, 16) === 0)) {
    const last = parseInt(groups[7], 16);
    if (last === 0 || last === 1) return true;
  }
  if ((first & 65024) === 64512) return true;
  if ((first & 65472) === 65152) return true;
  return false;
}
function isPrivateIpAddress(address) {
  const version = (0, import_node_net.isIP)(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return false;
}
async function assertSafeOutboundUrl(url) {
  const resolved = await (0, import_promises.lookup)(url.hostname, { all: true, verbatim: true });
  if (resolved.length === 0) {
    throw new Error("Unable to resolve remote host");
  }
  const blocked = resolved.find((entry) => isPrivateIpAddress(entry.address));
  if (blocked) {
    throw new Error("Private or local URLs are not allowed");
  }
}

// server/routes/jd.ts
var JD_FETCH_TIMEOUT_MS = 12e3;
var JD_FETCH_MAX_BYTES = 512 * 1024;
var JD_FETCH_MAX_REDIRECTS = 5;
var JD_FETCH_ACCEPT_HEADER = "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8";
function isRedirectStatus(status) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}
async function fetchJobDescriptionPage(startUrl, signal) {
  let currentUrl = startUrl;
  for (let redirectCount = 0; redirectCount <= JD_FETCH_MAX_REDIRECTS; redirectCount += 1) {
    await assertSafeOutboundUrl(currentUrl);
    const response = await fetch(currentUrl, {
      signal,
      redirect: "manual",
      headers: {
        "User-Agent": "NextStepResume-Playground-JD-Fetch/1.0 (+local dev; job description import)",
        Accept: JD_FETCH_ACCEPT_HEADER,
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8"
      }
    });
    if (!isRedirectStatus(response.status)) {
      return response;
    }
    const location = response.headers.get("location");
    if (!location) {
      throw new Error(`Redirect missing location header (HTTP ${response.status})`);
    }
    const nextUrl = new URL(location, currentUrl);
    const parsedRedirect = parsePublicHttpUrl(nextUrl.toString());
    if (parsedRedirect.ok === false) {
      throw new Error(parsedRedirect.error);
    }
    currentUrl = parsedRedirect.url;
  }
  throw new Error("Too many redirects while fetching job description");
}
function registerJdRoutes(app) {
  app.post("/api/jd/extract-keywords", (req, res) => {
    const { jobDescription } = req.body;
    if (!jobDescription || typeof jobDescription !== "string") {
      return res.status(400).json({ error: "jobDescription is required" });
    }
    const keywords = extractJdKeywords(jobDescription);
    return res.json({ keywords, meta: { source: "parser", simulated: false } });
  });
  app.post("/api/jd/fetch-url", async (req, res) => {
    const { url } = req.body ?? {};
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url is required" });
    }
    const parsed = parsePublicHttpUrl(url);
    if (parsed.ok === false) {
      return res.status(400).json({ error: parsed.error });
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), JD_FETCH_TIMEOUT_MS);
    try {
      const response = await fetchJobDescriptionPage(parsed.url, controller.signal);
      if (!response.ok) {
        return res.status(422).json({
          error: `\u7121\u6CD5\u6293\u53D6\u9801\u9762\uFF08HTTP ${response.status}\uFF09\u3002\u82E5\u70BA\u767B\u5165\u7246\u6216 SPA \u7DB2\u7AD9\uFF0C\u8ACB\u6539\u8CBC JD \u5168\u6587\u3002`
        });
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
        return res.status(422).json({ error: "URL \u56DE\u50B3\u7684\u4E0D\u662F HTML \u9801\u9762" });
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength > JD_FETCH_MAX_BYTES) {
        return res.status(422).json({ error: "\u9801\u9762\u904E\u5927\uFF0C\u8ACB\u6539\u8CBC JD \u5168\u6587" });
      }
      const html = buffer.toString("utf-8");
      const { jobDescription, pageTitle, headline } = buildJobDescriptionFromHtml(html);
      if (jobDescription.length < 20) {
        return res.status(422).json({
          error: "\u7121\u6CD5\u5F9E\u9801\u9762\u63D0\u53D6\u8DB3\u5920\u6587\u5B57\u3002\u6B64\u7AD9\u53EF\u80FD\u9700\u767B\u5165\u6216\u7531 JavaScript \u6E32\u67D3\uFF0C\u8ACB\u6539\u8CBC JD \u5168\u6587\u3002"
        });
      }
      const meta = extractJobMeta(jobDescription);
      const merged = mergeImportedJobMeta(headline || pageTitle, meta);
      return res.json({
        jobDescription,
        jobTitle: merged.jobTitle,
        companyName: merged.companyName,
        sourceUrl: parsed.url.toString(),
        pageTitle,
        extractedChars: jobDescription.length,
        meta: { source: "fetch-url", simulated: false }
      });
    } catch (err) {
      const message = err instanceof Error && err.name === "AbortError" ? "\u6293\u53D6\u903E\u6642\uFF0C\u8ACB\u7A0D\u5F8C\u518D\u8A66\u6216\u6539\u8CBC JD \u5168\u6587" : err instanceof Error ? err.message : "Fetch failed";
      return res.status(422).json({ error: message });
    } finally {
      clearTimeout(timeout);
    }
  });
}

// src/lib/apify/client.ts
async function runApifyActorSync(options) {
  const { actorId, token, input, signal } = options;
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input),
    signal
  });
  const rawText = await response.text();
  let payload;
  try {
    payload = JSON.parse(rawText);
  } catch {
    payload = rawText;
  }
  return {
    ok: response.ok,
    status: response.status,
    payload,
    rawText
  };
}
function extractApifyErrorMessage(payload, status) {
  if (typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "object" && payload.error?.message) {
    return payload.error.message;
  }
  return `Apify request failed (${status})`;
}

// src/lib/jobsdbApifyScraper.ts
function normalizeJobsdbListings(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item) => item !== null && typeof item === "object").map((item) => ({
    id: String(item.id ?? ""),
    url: String(item.url ?? ""),
    title: String(item.title ?? ""),
    company: String(item.company ?? ""),
    location: String(item.location ?? ""),
    workType: item.workType ? String(item.workType) : void 0,
    classification: item.classification ? String(item.classification) : void 0,
    salary: item.salary ? String(item.salary) : void 0,
    postedAt_relative: item.postedAt_relative ? String(item.postedAt_relative) : void 0,
    postedAt_iso: item.postedAt_iso ? String(item.postedAt_iso) : void 0,
    description_text: item.description_text ? String(item.description_text) : void 0,
    teaser: item.teaser ? String(item.teaser) : void 0,
    bulletPoints: Array.isArray(item.bulletPoints) ? item.bulletPoints.map((p) => String(p)) : void 0,
    source: item.source ? String(item.source) : void 0
  })).filter((job) => job.title.trim() || job.url.trim());
}

// server/simulation/jobsdb.ts
function shouldSimulateJobsdbSearch() {
  const flag = process.env.NSR_JOBSDB_SIMULATE?.trim().toLowerCase();
  if (flag === "1" || flag === "true" || flag === "yes") {
    return true;
  }
  if (flag === "0" || flag === "false" || flag === "no") {
    return false;
  }
  return !process.env.APIFY_API_TOKEN?.trim();
}
function buildSimulatedJobsdbListings(keyword, limit = 10) {
  const query = keyword?.trim() || "software engineer";
  const count = Math.min(Math.max(1, limit), 3);
  return Array.from({ length: count }, (_, index) => ({
    id: `sim-${index + 1}`,
    url: `https://hk.jobsdb.com/job/sim-${index + 1}`,
    title: `${query} (Sim ${index + 1})`,
    company: "NextStep Demo Co.",
    location: "Hong Kong",
    workType: "Full-time",
    salary: "HK$ 35,000 \u2013 45,000",
    postedAt_relative: "2d ago",
    description_text: `Simulated JobsDB listing for E2E and playground demos.
Keyword: ${query}.`,
    bulletPoints: ["React", "TypeScript", "Playwright"],
    source: "simulation"
  }));
}

// server/routes/jobsdb.ts
var JOBSDB_ACTOR_ID = "shahidirfan~jobsdb-scraper";
var JOBSDB_SEARCH_MAX_RESULTS = 30;
var JOBSDB_SEARCH_TIMEOUT_MS = 12e4;
function parseJobsdbCountry(value) {
  return value === "hk" || value === "th" ? value : null;
}
function parsePostedDate(value) {
  if (value === "anytime" || value === "24h" || value === "7d" || value === "30d") {
    return value;
  }
  return "anytime";
}
function registerJobsdbRoutes(app) {
  app.post("/api/jobsdb/search", async (req, res) => {
    const {
      keyword,
      location,
      startUrl,
      country: countryRaw = "hk",
      posted_date: postedDateRaw = "anytime",
      results_wanted = 10
    } = req.body ?? {};
    const country = parseJobsdbCountry(countryRaw);
    if (!country) {
      return res.status(400).json({ error: "country \u5FC5\u9808\u70BA hk \u6216 th" });
    }
    const posted_date = parsePostedDate(postedDateRaw);
    const hasStartUrl = typeof startUrl === "string" && startUrl.trim().length > 0;
    const hasKeyword = typeof keyword === "string" && keyword.trim().length > 0;
    if (!hasStartUrl && !hasKeyword) {
      return res.status(400).json({ error: "\u8ACB\u63D0\u4F9B keyword \u6216 startUrl" });
    }
    if (hasStartUrl) {
      const validated = validateJobsdbStartUrl(String(startUrl), country);
      if (validated.ok === false) {
        return res.status(400).json({ error: validated.error });
      }
    }
    const limit = Math.min(
      Math.max(1, Number(results_wanted) || 10),
      JOBSDB_SEARCH_MAX_RESULTS
    );
    if (shouldSimulateJobsdbSearch()) {
      const jobs = buildSimulatedJobsdbListings(
        hasKeyword ? String(keyword) : "JobsDB search",
        limit
      );
      return res.json({
        jobs,
        meta: { source: "jobsdb-simulation", count: jobs.length, simulated: true }
      });
    }
    const apifyToken = process.env.APIFY_API_TOKEN?.trim();
    if (!apifyToken) {
      return res.status(503).json({
        error: "\u672A\u8A2D\u5B9A APIFY_API_TOKEN\u3002\u8ACB\u5728 .env \u52A0\u5165 Apify API Token\uFF08https://console.apify.com/account/integrations\uFF09"
      });
    }
    const actorInput = {
      country,
      posted_date,
      results_wanted: limit,
      maxPagesPerList: Math.min(10, Math.ceil(limit / 20) + 1),
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"]
      }
    };
    if (hasStartUrl) {
      actorInput.startUrl = String(startUrl).trim();
    } else {
      actorInput.keyword = String(keyword).trim();
      if (typeof location === "string" && location.trim()) {
        actorInput.location = location.trim();
      }
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), JOBSDB_SEARCH_TIMEOUT_MS);
    try {
      const apifyRes = await runApifyActorSync({
        actorId: JOBSDB_ACTOR_ID,
        token: apifyToken,
        input: actorInput,
        signal: controller.signal
      });
      if (!apifyRes.ok) {
        return res.status(502).json({
          error: extractApifyErrorMessage(apifyRes.payload, apifyRes.status)
        });
      }
      const jobs = normalizeJobsdbListings(apifyRes.payload).slice(0, limit);
      return res.json({
        jobs,
        meta: { source: "jobsdb-apify", count: jobs.length, simulated: false }
      });
    } catch (err) {
      const message = err instanceof Error && err.name === "AbortError" ? "JobsDB \u641C\u5C0B\u903E\u6642\uFF0C\u8ACB\u7A0D\u5F8C\u518D\u8A66" : err instanceof Error ? err.message : "JobsDB search failed";
      return res.status(502).json({ error: message });
    } finally {
      clearTimeout(timeout);
    }
  });
}

// server/routes/resume.ts
var import_multer = __toESM(require("multer"), 1);

// src/data.ts
var HK_RESUME = {
  personalInfo: {
    name: "Alex Chan",
    title: "Frontend Product Engineer",
    email: "alex.chan@email.com",
    phone: "+852 9123 4567",
    website: "https://alexchan.dev",
    location: "Hong Kong SAR",
    linkedin: "linkedin.com/in/alexchan",
    rightToWork: "Permanent Hong Kong Resident",
    noticePeriod: "1 month",
    expectedSalary: "HK$42,000 / month"
  },
  summary: "Frontend product engineer with 4 years of experience shipping React and TypeScript workflows for Hong Kong and APAC teams.",
  experience: [
    {
      id: "exp-1",
      company: "Harbour Digital Solutions",
      role: "Frontend Product Engineer",
      startDate: "2022-08",
      endDate: "Present",
      location: "Quarry Bay, Hong Kong (Hybrid)",
      bullets: [
        "Led the rebuild of a merchant operations workspace in React and TypeScript, reducing daily task completion time for support teams by 22%.",
        "Created a shared component library and token system used across admin, onboarding, and analytics surfaces."
      ]
    },
    {
      id: "exp-2",
      company: "Kowloon Commerce Cloud",
      role: "Software Engineer",
      startDate: "2020-07",
      endDate: "2022-07",
      location: "Kowloon Bay, Hong Kong (Hybrid)",
      bullets: [
        "Built internal order and catalog tooling with React, Node.js, and REST APIs for operations and merchandising teams across three markets.",
        "Delivered dashboard reporting modules that replaced manual spreadsheet workflows and saved analyst time each week."
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      institution: "The Hong Kong Polytechnic University",
      degree: "BSc",
      field: "Computing",
      gradDate: "2021-06",
      location: "Hung Hom, Hong Kong"
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "Sprintboard HK",
      description: "Kanban planning tool with drag-and-drop boards and keyboard shortcuts.",
      techStack: "React, TypeScript, Tailwind CSS, Zustand",
      url: "https://github.com/alexchan/sprintboard-hk"
    }
  ],
  skills: [
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Tailwind CSS",
    "Design Systems",
    "Accessibility",
    "REST APIs",
    "Cantonese",
    "English"
  ],
  languages: ["English (Fluent)", "Cantonese (Native)", "Mandarin (Conversational)"]
};
var DEFAULT_RESUME = {
  personalInfo: {
    name: "Morgan Keats",
    title: "Senior Frontend Developer",
    email: "morgan.keats@proton.me",
    phone: "+1 (312) 847-1928",
    website: "https://morgankeats.dev",
    location: "Chicago, Illinois",
    linkedin: "linkedin.com/in/morgan-keats"
  },
  summary: "Frontend developer with 5 years building React dashboards, ecommerce journeys, and internal tools for product-led teams.",
  experience: [
    {
      id: "exp-1",
      company: "Northline Digital",
      role: "Senior Frontend Developer",
      startDate: "2022-02",
      endDate: "Present",
      location: "Chicago, IL (Hybrid)",
      bullets: [
        "Owned frontend delivery for a B2B operations suite used by sales and finance teams, shipping roadmap items across onboarding, reporting, and approvals workflows.",
        "Introduced reusable React patterns, table primitives, and token-based styling that made new feature delivery more predictable."
      ]
    },
    {
      id: "exp-2",
      company: "Harborstack Labs",
      role: "Frontend Developer",
      startDate: "2020-06",
      endDate: "2022-01",
      location: "Remote",
      bullets: [
        "Built and maintained client-facing marketing sites, lead-capture journeys, and lightweight dashboards for startup clients.",
        "Helped migrate legacy UI to TypeScript and reusable Tailwind patterns, improving consistency across new builds."
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of Illinois Chicago",
      degree: "Bachelor of Science",
      field: "Computer Science",
      gradDate: "2023-05",
      location: "Chicago, IL"
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "Sprintboard",
      description: "Kanban planning tool with drag-and-drop columns and command palette actions.",
      techStack: "React, TypeScript, Tailwind, DnD Kit",
      url: "https://github.com/morgankeats/sprintboard"
    }
  ],
  skills: [
    "JavaScript",
    "React.js",
    "TypeScript",
    "Next.js",
    "Tailwind CSS",
    "Design Systems",
    "Accessibility",
    "Git & GitHub",
    "REST APIs",
    "Jira",
    "Node.js"
  ],
  languages: ["English (Native)", "Spanish (Professional Working Proficiency)"]
};
var initialResumeData = isHongKongMarket() ? HK_RESUME : DEFAULT_RESUME;
var HK_JOB_DESCRIPTION = `
Software Engineer (React / TypeScript) \u2014 Hong Kong

About the role:
We are hiring an engineer to grow our regional dashboard platform serving Hong Kong and APAC clients. You will build performant, accessible UI components and improve large data views.

Requirements:
- 3+ years building responsive SPAs in production.
- Strong TypeScript, React, and modern CSS (Tailwind preferred).
- Track record of measurable impact (performance, quality, or delivery metrics).
- Eligible to work in Hong Kong; fluent English; Cantonese a plus.
- Comfortable in Agile teams with cross-functional stakeholders.

Nice to have:
- Fintech or regulated industry experience.
- Experience with Vite, Node.js, and CI/CD pipelines.
`;
var initialJobDescription = isHongKongMarket() ? HK_JOB_DESCRIPTION : `
Senior Frontend Engineer (React/TypeScript)

Job Description:
We are looking for an engineer to grow our enterprise dashboard platform. You will build fast, accessible UI components and help resolve performance bottlenecks on large data views.

Required Qualifications:
- 3+ years building responsive SPAs at product scale.
- Strong TypeScript, React Hooks, and Tailwind CSS experience.
- Track record of measurable impact (performance, velocity, or quality metrics).
- Comfort with modular architecture, profiling, and Vite-based builds.
`;
var COMPILED_ENDPOINTS = [
  { path: "/api/resume/parse", method: "POST", localeKey: "parse" },
  { path: "/api/resume/parse-pdf", method: "POST", localeKey: "parsePdf" },
  { path: "/api/analyze", method: "POST", localeKey: "analyze" },
  { path: "/api/jobsdb/search", method: "POST", localeKey: "jobsdb" },
  { path: "/api/health", method: "GET", localeKey: "health" }
];
var reverseEngineeringOverview = {
  compiledEndpoints: COMPILED_ENDPOINTS.map(({ path, method }) => ({ path, method }))
};

// src/lib/resumeTextParser.ts
var SECTION_PATTERNS = [
  { key: "summary", regex: /^(professional\s+)?summary|profile|about\s+me|個人簡介|自我介紹/i },
  { key: "experience", regex: /^(work\s+)?experience|employment|professional\s+experience|工作經歷|經歷/i },
  { key: "education", regex: /^education|academic|學歷|教育/i },
  { key: "skills", regex: /^(technical\s+)?skills|core\s+competencies|technologies|技能/i },
  { key: "projects", regex: /^projects|portfolio|專案/i }
];
function detectEmail(text) {
  return text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/)?.[0] || "";
}
function detectPhone(text) {
  return text.match(/(\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() || "";
}
function detectUrl(text) {
  return text.match(/https?:\/\/[^\s]+/)?.[0] || "";
}
function splitSections(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const sections = /* @__PURE__ */ new Map();
  let current = "header";
  sections.set(current, []);
  for (const line of lines) {
    if (!line) continue;
    const matched = SECTION_PATTERNS.find((p) => p.regex.test(line.replace(/[#:*]/g, "").trim()));
    if (matched && line.length < 60) {
      current = matched.key;
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }
    sections.get(current)?.push(line);
  }
  return sections;
}
function parseExperienceBlocks(lines) {
  const blocks = [];
  let current = null;
  for (const line of lines) {
    const isBullet = /^[-•*●▪]/.test(line);
    if (!isBullet) {
      if (current) blocks.push(current);
      const dateMatch = line.match(/(\d{4}(?:-\d{2})?)\s*[-–—]\s*(\d{4}(?:-\d{2})?|present|current|現在)/i);
      const roleCompany = line.replace(/\d{4}.*$/i, "").trim();
      const parts = roleCompany.split(/\s+[-@|]\s+|\s+at\s+/i);
      current = {
        id: `exp-${blocks.length + 1}`,
        company: parts.length > 1 ? parts[parts.length - 1] : "",
        role: parts[0] || line,
        startDate: dateMatch?.[1] || "",
        endDate: dateMatch?.[2] || "",
        location: "",
        bullets: []
      };
    } else if (current) {
      current.bullets.push(line.replace(/^[-•*●▪]\s*/, "").trim());
    }
  }
  if (current) blocks.push(current);
  return blocks.length > 0 ? blocks : initialResumeData.experience;
}
function parseEducation(lines) {
  if (lines.length === 0) return initialResumeData.education;
  return lines.slice(0, 3).map((line, i) => {
    const degreeMatch = line.match(/(b\.?s\.?|m\.?s\.?|bachelor|master|ph\.?d\.?)/i);
    const yearMatch = line.match(/\b(19|20)\d{2}\b/);
    return {
      id: `edu-${i + 1}`,
      institution: line.split(/,|\|/)[0]?.trim() || line,
      degree: degreeMatch?.[0] || "Degree",
      field: line.includes("Science") || line.includes("Engineering") ? "Computer Science" : "",
      gradDate: yearMatch?.[0] || "",
      location: ""
    };
  });
}
function parseResumeText(rawText) {
  const text = rawText.trim();
  if (text.length < 20) {
    throw new Error("Resume text is too short to parse");
  }
  const sections = splitSections(text);
  const headerLines = sections.get("header") || [];
  const fullHeader = headerLines.join("\n");
  const name = headerLines.find((l) => !l.includes("@") && !/^\+?\d/.test(l) && l.length < 50) || "Imported Candidate";
  const title = headerLines.find((l) => /developer|engineer|manager|designer|analyst/i.test(l)) || headerLines[1] || "Professional";
  const summaryLines = sections.get("summary") || [];
  const summary = summaryLines.length > 0 ? summaryLines.join(" ") : headerLines.slice(2, 5).join(" ");
  const skillLines = sections.get("skills") || [];
  const skills = skillLines.join(", ").split(/[,;|•]/).map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 40);
  const experience = parseExperienceBlocks(sections.get("experience") || []);
  const education = parseEducation(sections.get("education") || []);
  return {
    personalInfo: {
      name: name.replace(/[|•]/g, "").trim(),
      title: title.replace(/[|•]/g, "").trim(),
      email: detectEmail(fullHeader + "\n" + text),
      phone: detectPhone(fullHeader + "\n" + text),
      website: detectUrl(text),
      location: headerLines.find((l) => /,\s*[A-Z]{2}\b|taiwan|taipei|austin|remote/i.test(l)) || "",
      linkedin: text.match(/linkedin\.com\/[^\s]+/i)?.[0] || ""
    },
    summary: summary || initialResumeData.summary,
    experience,
    education,
    projects: initialResumeData.projects,
    skills: skills.length > 0 ? skills : initialResumeData.skills
  };
}

// src/lib/pdfExtract.ts
var MAX_PDF_BYTES = 5 * 1024 * 1024;
function validatePdfBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error("Empty PDF file");
  }
  if (buffer.length > MAX_PDF_BYTES) {
    throw new Error("PDF exceeds 5MB limit");
  }
  const header = buffer.subarray(0, 5).toString("utf8");
  if (!header.startsWith("%PDF")) {
    throw new Error("Invalid PDF file format");
  }
}
async function extractTextFromPdfBuffer(buffer) {
  validatePdfBuffer(buffer);
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return (result.text || "").replace(/\r\n/g, "\n").trim();
  } finally {
    await parser.destroy();
  }
}

// server/routes/resume.ts
var pdfUpload = (0, import_multer.default)({
  storage: import_multer.default.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
    if (isPdf) cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  }
});
function registerResumeRoutes(app) {
  app.post("/api/resume/parse", (req, res) => {
    const { text, resumeData } = req.body;
    if (resumeData && typeof resumeData === "object") {
      return res.json({
        success: true,
        resumeData,
        meta: { source: "parser", simulated: false }
      });
    }
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return res.status(400).json({ error: "text is required (min 20 characters) or provide resumeData" });
    }
    try {
      const parsed = parseResumeText(text);
      return res.json({
        success: true,
        resumeData: parsed,
        meta: { source: "parser", simulated: false }
      });
    } catch (err) {
      console.error("Resume parse error:", err);
      return res.status(422).json({
        error: "Could not parse resume text. Try clearer section headers (SUMMARY, EXPERIENCE, SKILLS)."
      });
    }
  });
  app.post("/api/resume/parse-pdf", pdfUpload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required (form field: file)" });
    }
    try {
      const text = await extractTextFromPdfBuffer(req.file.buffer);
      if (!text || text.length < 20) {
        return res.status(422).json({
          error: "PDF contains insufficient extractable text. Use a text-based PDF or paste content manually."
        });
      }
      const parsed = parseResumeText(text);
      return res.json({
        success: true,
        resumeData: parsed,
        extractedTextLength: text.length,
        meta: { source: "parser", simulated: false }
      });
    } catch (err) {
      console.error("PDF parse error:", err);
      const message = err instanceof Error ? err.message : "Failed to parse PDF resume";
      return res.status(422).json({ error: message });
    }
  });
}

// server/billing/subscriptionSyncPolicy.ts
function canClientSyncPlan(requested, current) {
  if (!isProductionAppMode(readServerAppMode())) {
    return { ok: true };
  }
  if (requested === "starter" || requested === current) {
    return { ok: true };
  }
  return { ok: false, code: "billing_required" };
}

// server/routes/subscription.ts
function registerSubscriptionRoutes(app) {
  app.post("/api/subscription/sync", (req, res) => {
    const clientId = resolveClientId(req);
    const plan = parsePlanHeader(typeof req.body?.plan === "string" ? req.body.plan : void 0);
    const current = getClientRecord(clientId);
    const policy = canClientSyncPlan(plan, current.plan);
    if (policy.ok === false) {
      res.status(403).json({
        error: policy.code,
        message: "Paid plans require Stripe checkout in production.",
        plan: current.plan
      });
      return;
    }
    const record = setClientPlan(clientId, plan);
    writeSubscriptionHeaders(res, clientId, record);
    res.json({
      ok: true,
      clientId,
      plan: record.plan,
      usage: record.usage,
      month: record.month
    });
  });
  app.get("/api/subscription/status", (req, res) => {
    const clientId = resolveClientId(req);
    const record = getClientRecord(clientId);
    writeSubscriptionHeaders(res, clientId, record);
    res.json({
      clientId,
      plan: record.plan,
      usage: record.usage,
      month: record.month
    });
  });
}

// src/lib/resumeTemplateCatalog.ts
var MODERN_PRESETS = [
  {
    accentBar: "resume-marginalia-accent-bar",
    accentText: "text-[#c0392b]",
    accentBg: "bg-[#c0392b]",
    accentBgSoft: "bg-[#d4edda]",
    accentBorder: "border-[#c5d9e8]",
    sectionHeading: "text-[#535c68] font-sans tracking-widest",
    skillChip: "bg-[#d4edda]/90 text-[#1a2438] border-[#c5d9e8]",
    langChip: "bg-[#f5d76e]/45 text-[#1a2438] border-[#c5d9e8]",
    tailoredBg: "bg-[#f5d76e]/30",
    tailoredBorder: "border-[#c0392b]",
    expHighlightBg: "bg-[#f5d76e]/25",
    expHighlightBorder: "border-[#c0392b]",
    headerBorder: "border-[#c5d9e8]",
    nameClass: "font-display text-[#1a2438]",
    sectionTitle: "border-b border-[#c5d9e8]",
    sidebarDot: "bg-[#c0392b]",
    sidebarTitle: "text-[#535c68]",
    roleAccent: "text-[#c0392b]",
    sheetFont: "font-serif"
  },
  // notebook-02 Legal Pad — 黃箋紙 + 雙紅邊線
  { accentBar: "from-[#C0392B] to-[#A93226]", roleAccent: "text-[#C0392B]", sectionTitle: "border-b-2 border-[#C0392B]/40" },
  // notebook-03 Graph Paper — 深湖水綠 accent
  { accentBar: "from-[#2E7D74] to-[#1F5B54]", accentText: "text-[#2E7D74]", accentBg: "bg-[#2E7D74]", tailoredBorder: "border-[#2E7D74]", expHighlightBorder: "border-[#2E7D74]", sidebarDot: "bg-[#2E7D74]", roleAccent: "text-[#2E7D74]", sectionTitle: "border-b border-[#2E7D74]/35" },
  // notebook-04 Index Card — 紅頂線卡片
  { accentBar: "from-[#C0392B] to-[#A93226]", sectionTitle: "border-b-2 border-[#C0392B]/30" },
  // notebook-05 Composition — 置中 + 雙紅底線
  { accentBar: "from-[#C0392B] to-[#A93226]", nameClass: "font-display text-[#1A2438] tracking-normal", sectionTitle: "border-b-4 border-double border-[#C0392B]/50" },
  // notebook-06 Sticky Note — mint/marker 便利貼 chip
  { accentBar: "from-[#C0392B] to-[#A93226]", skillChip: "bg-[#D4EDDA] text-[#1A2438] border-[#C5D9E8]", langChip: "bg-[#F5D76E]/60 text-[#1A2438] border-[#C5D9E8]" },
  // notebook-07 Highlighter — 螢光掃字重點
  { accentBar: "from-[#F5D76E] to-[#C0392B]", tailoredBg: "bg-[#F5D76E]/45", expHighlightBg: "bg-[#F5D76E]/35" },
  // notebook-08 Red Thread — 紅線裝訂時間軸
  { accentBar: "from-[#C0392B] to-[#A93226]", headerBorder: "border-dashed border-[#C0392B]/60", sectionTitle: "border-b border-[#C0392B]/30" },
  // notebook-09 Blueprint — 藍格線深階 accent
  { accentBar: "from-[#5B8FB9] to-[#3E6E93]", accentText: "text-[#5B8FB9]", accentBg: "bg-[#5B8FB9]", tailoredBorder: "border-[#5B8FB9]", expHighlightBorder: "border-[#5B8FB9]", sidebarDot: "bg-[#5B8FB9]", roleAccent: "text-[#5B8FB9]", sectionTitle: "border-b border-[#5B8FB9]/40" },
  // notebook-10 Teal Ledger — 湖水帳簿隔行底紋
  { accentBar: "from-[#2E7D74] to-[#1F5B54]", accentText: "text-[#2E7D74]", accentBg: "bg-[#2E7D74]", expHighlightBg: "bg-[#D4EDDA]/55", tailoredBorder: "border-[#2E7D74]", expHighlightBorder: "border-[#2E7D74]", sidebarDot: "bg-[#2E7D74]", sectionTitle: "border-b border-[#2E7D74]/35" },
  // notebook-11 Draft Stamp — 石墨為主、紅印章點綴
  { accentBar: "from-[#535C68] to-[#1A2438]", accentText: "text-[#535C68]", accentBg: "bg-[#535C68]", nameClass: "font-display text-[#1A2438]", sidebarDot: "bg-[#535C68]", roleAccent: "text-[#535C68]", sectionTitle: "border-b border-[#535C68]/30" }
];
var CLASSIC_PRESETS = [
  // bureau-01 Bureau Classic — 置中經典文書
  { accentText: "text-[#C0392B]", headerBorder: "border-[#C5D9E8]", nameClass: "tracking-tight", sectionTitle: "border-b border-[#C5D9E8]" },
  // bureau-02 Barrister — 英式編年體
  { accentText: "text-[#C0392B]", headerBorder: "border-[#1A2438]/30", nameClass: "uppercase tracking-wide", sectionTitle: "border-b-2 border-[#C5D9E8]" },
  // bureau-03 Registrar — 寬字距大寫
  { accentText: "text-[#C0392B]", headerBorder: "border-[#535C68]/40", nameClass: "uppercase tracking-widest", sectionTitle: "border-b border-double border-[#C5D9E8]" },
  // bureau-04 Broadsheet — 大報墨色
  { accentText: "text-[#1A2438]", headerBorder: "border-[#1A2438]/40", nameClass: "uppercase tracking-tight", sectionTitle: "border-b-4 border-double border-[#1A2438]/45" },
  // bureau-05 Minute Book — 紅色節序號
  { accentText: "text-[#C0392B]", headerBorder: "border-[#C5D9E8]", nameClass: "tracking-normal", sectionTitle: "border-b border-[#C5D9E8]" },
  // bureau-06 Treasury — 深湖水標題 + 字母磚
  { accentText: "text-[#2E7D74]", headerBorder: "border-[#C5D9E8]", nameClass: "uppercase tracking-wide", sectionTitle: "border-b border-[#2E7D74]/35" },
  // bureau-07 Chancery — 衡平斜體
  { accentText: "text-[#C0392B]", headerBorder: "border-[#C5D9E8]", nameClass: "italic", sectionTitle: "border-b border-[#C5D9E8]" },
  // bureau-08 Docket — 案卷緊湊 + 點線引導
  { accentText: "text-[#C0392B]", headerBorder: "border-[#535C68]/30", nameClass: "tracking-widest uppercase text-xl", sectionTitle: "border-b border-dotted border-[#C0392B]/50" },
  // bureau-09 Archive — 檔案室紅頂線
  { accentText: "text-[#C0392B]", headerBorder: "border-[#C0392B]/60", nameClass: "uppercase", sectionTitle: "border-b border-[#C5D9E8]" },
  // bureau-10 Signet — 印鑑置中
  { accentText: "text-[#C0392B]", headerBorder: "border-[#C5D9E8]", nameClass: "uppercase tracking-widest", sectionTitle: "border-b border-[#C5D9E8]" }
];
var MINIMAL_PRESETS = [
  // studio-01 Studio Grid — 深湖水 + mint 圓點
  { accentText: "text-[#2E7D74]", sidebarDot: "bg-[#2E7D74]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#2E7D74]" },
  // studio-02 Whiteboard — teal 左邊線
  { accentText: "text-[#2E7D74]", sidebarDot: "bg-[#2E7D74]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#1A2438]" },
  // studio-03 Marker One — 全墨 + 螢光一筆
  { accentText: "text-[#1A2438]", sidebarDot: "bg-[#F5D76E]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#1A2438]" },
  // studio-04 Mint Tab — 薄荷標籤
  { accentText: "text-[#2E7D74]", sidebarDot: "bg-[#D4EDDA]", sidebarTitle: "text-[#2E7D74]", roleAccent: "text-[#2E7D74]" },
  // studio-05 Redline — 紅細線
  { accentText: "text-[#C0392B]", sidebarDot: "bg-[#C0392B]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#C0392B]" },
  // studio-06 Graphite — 全石墨無彩
  { accentText: "text-[#535C68]", sidebarDot: "bg-[#535C68]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#535C68]" },
  // studio-07 Two-Track — 石墨雙欄 + 紅摺角
  { accentText: "text-[#535C68]", sidebarDot: "bg-[#C0392B]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#1A2438]" },
  // studio-08 Eraser — mint/粉 chip
  { accentText: "text-[#2E7D74]", sidebarDot: "bg-[#F2C1C1]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#2E7D74]" },
  // studio-09 Console — mono + teal 游標
  { accentText: "text-[#2E7D74]", sidebarDot: "bg-[#2E7D74]", sidebarTitle: "text-[#2E7D74]", roleAccent: "text-[#2E7D74]" },
  // studio-10 Gallery — 紅點畫廊
  { accentText: "text-[#C0392B]", sidebarDot: "bg-[#C0392B]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#C0392B]" }
];
function buildFamilyThemes(family, presets, defaults) {
  return presets.map((preset, index) => {
    const id = `${family}-${String(index + 1).padStart(2, "0")}`;
    return {
      ...defaults,
      ...preset,
      id,
      family
    };
  });
}
var MODERN_DEFAULTS = {
  accentBar: "resume-marginalia-accent-bar",
  accentText: "text-[#c0392b]",
  accentBg: "bg-[#c0392b]",
  accentBgSoft: "bg-[#d4edda]",
  accentBorder: "border-[#c5d9e8]",
  sectionHeading: "text-[#535c68]",
  skillChip: "bg-[#d4edda]/90 text-[#1a2438] border-[#c5d9e8]",
  langChip: "bg-[#f5d76e]/45 text-[#1a2438] border-[#c5d9e8]",
  tailoredBg: "bg-[#f5d76e]/35",
  tailoredBorder: "border-[#c0392b]",
  expHighlightBg: "bg-[#f5d76e]/30",
  expHighlightBorder: "border-[#c0392b]",
  headerBorder: "border-[#c5d9e8]",
  nameClass: "font-display",
  sectionTitle: "border-b border-[#c5d9e8]",
  sidebarDot: "bg-[#c0392b]",
  sidebarTitle: "text-[#535c68]",
  roleAccent: "text-[#c0392b]",
  sheetFont: "font-serif"
};
var CLASSIC_DEFAULTS = {
  ...MODERN_DEFAULTS,
  accentBar: "from-[#C0392B] to-[#A93226]",
  accentText: "text-[#C0392B]",
  accentBg: "bg-[#1A2438]",
  accentBgSoft: "bg-[#FAF6EB]",
  accentBorder: "border-[#C5D9E8]",
  sectionHeading: "text-[#1A2438]",
  skillChip: "text-[#535C68]",
  langChip: "text-[#535C68]",
  tailoredBg: "bg-[#F5D76E]/30",
  tailoredBorder: "border-[#C0392B]",
  expHighlightBg: "bg-[#D4EDDA]/55",
  expHighlightBorder: "border-[#2E7D74]",
  headerBorder: "border-[#C5D9E8]",
  nameClass: "uppercase tracking-tight",
  sectionTitle: "border-b border-[#C5D9E8]",
  sheetFont: "font-serif"
};
var MINIMAL_DEFAULTS = {
  ...MODERN_DEFAULTS,
  sheetFont: "font-sans"
};
var DEFAULT_A4_TEMPLATE = "classic-02";
var RESUME_TEMPLATE_CATALOG = [
  ...buildFamilyThemes("modern", MODERN_PRESETS, MODERN_DEFAULTS),
  ...buildFamilyThemes("classic", CLASSIC_PRESETS, CLASSIC_DEFAULTS),
  ...buildFamilyThemes("minimalist", MINIMAL_PRESETS, MINIMAL_DEFAULTS)
];
var LEGACY_TEMPLATE_MAP = {
  modern: "modern-01",
  academic: "classic-01",
  classic: "classic-01",
  minimalist: "minimalist-01"
};
function normalizeTemplateStyle(value) {
  if (!value) return DEFAULT_A4_TEMPLATE;
  if (value in LEGACY_TEMPLATE_MAP) return LEGACY_TEMPLATE_MAP[value];
  const found = RESUME_TEMPLATE_CATALOG.find((t2) => t2.id === value);
  return found?.id ?? DEFAULT_A4_TEMPLATE;
}

// server/routes/sync.ts
function requireAuthedUser(req) {
  const auth = getNsrAuth(req);
  if (!auth) return null;
  return auth;
}
function isApplicationPackageArray(value) {
  return Array.isArray(value);
}
function registerSyncRoutes(app) {
  app.get("/api/sync/workspace", async (req, res) => {
    if (!isPostgresSyncConfigured()) {
      res.status(503).json({ error: "sync_not_configured" });
      return;
    }
    const auth = requireAuthedUser(req);
    if (!auth) {
      res.status(401).json({ error: "auth_required" });
      return;
    }
    try {
      const record = await getPostgresSyncStore().getWorkspace(auth.user.id);
      if (!record) {
        res.status(404).json({ error: "not_found" });
        return;
      }
      res.json({
        resumeData: record.resumeData,
        jobDescription: record.jobDescription,
        activeTemplate: normalizeTemplateStyle(record.templateId),
        updatedAt: record.updatedAt
      });
    } catch (err) {
      console.error("[sync/workspace] get failed", err);
      res.status(500).json({ error: "sync_read_failed" });
    }
  });
  app.put("/api/sync/workspace", async (req, res) => {
    if (!isPostgresSyncConfigured()) {
      res.status(503).json({ error: "sync_not_configured" });
      return;
    }
    const auth = requireAuthedUser(req);
    if (!auth) {
      res.status(401).json({ error: "auth_required" });
      return;
    }
    const resumeData = req.body?.resumeData;
    const jobDescription = typeof req.body?.jobDescription === "string" ? req.body.jobDescription : "";
    const activeTemplate = normalizeTemplateStyle(
      typeof req.body?.activeTemplate === "string" ? req.body.activeTemplate : void 0
    );
    const updatedAt = typeof req.body?.updatedAt === "string" ? req.body.updatedAt : (/* @__PURE__ */ new Date()).toISOString();
    if (!resumeData || typeof resumeData !== "object") {
      res.status(400).json({ error: "invalid_resume_data" });
      return;
    }
    try {
      const saved = await getPostgresSyncStore().upsertWorkspace(auth.user.id, {
        resumeData,
        jobDescription,
        templateId: activeTemplate,
        updatedAt
      });
      res.json({
        ok: true,
        updatedAt: saved.updatedAt,
        activeTemplate: normalizeTemplateStyle(saved.templateId)
      });
    } catch (err) {
      console.error("[sync/workspace] put failed", err);
      res.status(500).json({ error: "sync_write_failed" });
    }
  });
  app.get("/api/sync/application-packages", async (req, res) => {
    if (!isPostgresSyncConfigured()) {
      res.status(503).json({ error: "sync_not_configured" });
      return;
    }
    const auth = requireAuthedUser(req);
    if (!auth) {
      res.status(401).json({ error: "auth_required" });
      return;
    }
    try {
      const record = await getPostgresSyncStore().getApplicationPackages(auth.user.id);
      if (!record) {
        res.json({ packages: [], updatedAt: null });
        return;
      }
      res.json({
        packages: record.packages,
        updatedAt: record.updatedAt
      });
    } catch (err) {
      console.error("[sync/application-packages] get failed", err);
      res.status(500).json({ error: "sync_read_failed" });
    }
  });
  app.put("/api/sync/application-packages", async (req, res) => {
    if (!isPostgresSyncConfigured()) {
      res.status(503).json({ error: "sync_not_configured" });
      return;
    }
    const auth = requireAuthedUser(req);
    if (!auth) {
      res.status(401).json({ error: "auth_required" });
      return;
    }
    const packages = req.body?.packages;
    if (!isApplicationPackageArray(packages)) {
      res.status(400).json({ error: "invalid_packages" });
      return;
    }
    const updatedAt = typeof req.body?.updatedAt === "string" ? req.body.updatedAt : (/* @__PURE__ */ new Date()).toISOString();
    try {
      const saved = await getPostgresSyncStore().upsertApplicationPackages(auth.user.id, {
        packages,
        updatedAt
      });
      res.json({
        ok: true,
        packages: saved.packages,
        updatedAt: saved.updatedAt
      });
    } catch (err) {
      console.error("[sync/application-packages] put failed", err);
      res.status(500).json({ error: "sync_write_failed" });
    }
  });
}

// server/routes/index.ts
function registerCoreRoutes(app, aiEnabled) {
  registerHealthRoutes(app, aiEnabled);
  registerConfigRoutes(app);
  registerAuthRoutes(app);
  registerSyncRoutes(app);
  registerSubscriptionRoutes(app);
  registerBillingRoutes(app);
  registerJdRoutes(app);
  registerJobsdbRoutes(app);
}
function registerAppRoutes(app, ai) {
  registerCoreRoutes(app, !!ai);
  registerResumeRoutes(app);
  registerExportPdfRoutes(app);
  registerAiRoutes(app, ai);
}

// server/createApp.ts
var JSON_BODY_LIMIT = "1mb";
function createApp() {
  const app = (0, import_express2.default)();
  if (process.env.NODE_ENV === "production" || readServerAppMode() === "production") {
    app.set("trust proxy", 1);
  }
  registerBillingWebhookRoute(app);
  app.use(import_express2.default.json({ limit: JSON_BODY_LIMIT }));
  app.use("/api", (req, res, next) => {
    void supabaseAuthMiddleware(req, res, next).catch(next);
  });
  app.use("/api", rateLimit);
  app.use("/api", subscriptionQuota);
  const ai = createGeminiClient();
  registerAppRoutes(app, ai);
  return app;
}

// server/vercelExport.ts
var vercelExport_default = createApp();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
module.exports = module.exports.default ?? module.exports;
//# sourceMappingURL=index.js.map
