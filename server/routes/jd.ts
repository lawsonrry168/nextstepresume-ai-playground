import type { Express } from "express";
import { extractJdKeywords } from "../../src/lib/atsKeywords.ts";
import { buildJobDescriptionFromHtml } from "../../src/lib/jdHtmlExtract.ts";
import { extractJobMeta } from "../../src/lib/extractJobMeta.ts";
import { mergeImportedJobMeta } from "../../src/lib/createDraftApplicationPackage.ts";
import { parsePublicHttpUrl } from "../../src/lib/security/urlPolicy.ts";
import { assertSafeOutboundUrl } from "../lib/outboundUrlSafety.ts";

const JD_FETCH_TIMEOUT_MS = 12_000;
const JD_FETCH_MAX_BYTES = 512 * 1024;
const JD_FETCH_MAX_REDIRECTS = 5;
const JD_FETCH_ACCEPT_HEADER = "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8";

function isRedirectStatus(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

async function fetchJobDescriptionPage(startUrl: URL, signal: AbortSignal): Promise<Response> {
  let currentUrl = startUrl;

  for (let redirectCount = 0; redirectCount <= JD_FETCH_MAX_REDIRECTS; redirectCount += 1) {
    await assertSafeOutboundUrl(currentUrl);

    const response = await fetch(currentUrl, {
      signal,
      redirect: "manual",
      headers: {
        "User-Agent":
          "NextStepResume-Playground-JD-Fetch/1.0 (+local dev; job description import)",
        Accept: JD_FETCH_ACCEPT_HEADER,
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      },
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

export function registerJdRoutes(app: Express): void {
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
          error: `無法抓取頁面（HTTP ${response.status}）。若為登入牆或 SPA 網站，請改貼 JD 全文。`,
        });
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
        return res.status(422).json({ error: "URL 回傳的不是 HTML 頁面" });
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength > JD_FETCH_MAX_BYTES) {
        return res.status(422).json({ error: "頁面過大，請改貼 JD 全文" });
      }

      const html = buffer.toString("utf-8");
      const { jobDescription, pageTitle, headline } = buildJobDescriptionFromHtml(html);

      if (jobDescription.length < 20) {
        return res.status(422).json({
          error: "無法從頁面提取足夠文字。此站可能需登入或由 JavaScript 渲染，請改貼 JD 全文。",
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
        meta: { source: "fetch-url", simulated: false },
      });
    } catch (err) {
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "抓取逾時，請稍後再試或改貼 JD 全文"
          : err instanceof Error
            ? err.message
            : "Fetch failed";
      return res.status(422).json({ error: message });
    } finally {
      clearTimeout(timeout);
    }
  });
}
