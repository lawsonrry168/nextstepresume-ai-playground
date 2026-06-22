import type { Express, Request } from "express";
import { extractApifyErrorMessage, runApifyActorSync } from "../../src/lib/apify/client.ts";
import { normalizeJobsdbListings, type JobsdbPostedDate } from "../../src/lib/jobsdbApifyScraper.ts";
import { validateJobsdbStartUrl } from "../../src/lib/security/urlPolicy.ts";

const JOBSDB_ACTOR_ID = "shahidirfan~jobsdb-scraper";
const JOBSDB_SEARCH_MAX_RESULTS = 30;
const JOBSDB_SEARCH_TIMEOUT_MS = 120_000;

type JobsdbCountry = "hk" | "th";

interface JobsdbSearchBody {
  keyword?: unknown;
  location?: unknown;
  startUrl?: unknown;
  country?: unknown;
  posted_date?: unknown;
  results_wanted?: unknown;
}

function parseJobsdbCountry(value: unknown): JobsdbCountry | null {
  return value === "hk" || value === "th" ? value : null;
}

function parsePostedDate(value: unknown): JobsdbPostedDate {
  if (value === "anytime" || value === "24h" || value === "7d" || value === "30d") {
    return value;
  }
  return "anytime";
}

export function registerJobsdbRoutes(app: Express): void {
  app.post("/api/jobsdb/search", async (req: Request<object, unknown, JobsdbSearchBody>, res) => {
    const apifyToken = process.env.APIFY_API_TOKEN?.trim();
    if (!apifyToken) {
      return res.status(503).json({
        error:
          "未設定 APIFY_API_TOKEN。請在 .env 加入 Apify API Token（https://console.apify.com/account/integrations）",
      });
    }

    const {
      keyword,
      location,
      startUrl,
      country: countryRaw = "hk",
      posted_date: postedDateRaw = "anytime",
      results_wanted = 10,
    } = req.body ?? {};

    const country = parseJobsdbCountry(countryRaw);
    if (!country) {
      return res.status(400).json({ error: "country 必須為 hk 或 th" });
    }

    const posted_date = parsePostedDate(postedDateRaw);
    const hasStartUrl = typeof startUrl === "string" && startUrl.trim().length > 0;
    const hasKeyword = typeof keyword === "string" && keyword.trim().length > 0;

    if (!hasStartUrl && !hasKeyword) {
      return res.status(400).json({ error: "請提供 keyword 或 startUrl" });
    }

    if (hasStartUrl) {
      const validated = validateJobsdbStartUrl(String(startUrl), country);
      if (validated.ok === false) {
        return res.status(400).json({ error: validated.error });
      }
    }
    const limit = Math.min(
      Math.max(1, Number(results_wanted) || 10),
      JOBSDB_SEARCH_MAX_RESULTS,
    );

    const actorInput: Record<string, unknown> = {
      country,
      posted_date,
      results_wanted: limit,
      maxPagesPerList: Math.min(10, Math.ceil(limit / 20) + 1),
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"],
      },
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
      const apifyRes = await runApifyActorSync<unknown>({
        actorId: JOBSDB_ACTOR_ID,
        token: apifyToken,
        input: actorInput,
        signal: controller.signal,
      });

      if (!apifyRes.ok) {
        return res.status(502).json({
          error: extractApifyErrorMessage(apifyRes.payload, apifyRes.status),
        });
      }

      const jobs = normalizeJobsdbListings(apifyRes.payload).slice(0, limit);

      return res.json({
        jobs,
        meta: { source: "jobsdb-apify", count: jobs.length, simulated: false },
      });
    } catch (err) {
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "JobsDB 搜尋逾時，請稍後再試"
          : err instanceof Error
            ? err.message
            : "JobsDB search failed";
      return res.status(502).json({ error: message });
    } finally {
      clearTimeout(timeout);
    }
  });
}
