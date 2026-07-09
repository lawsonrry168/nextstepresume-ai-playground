import type { Request, Response } from "express";
import type { Browser } from "playwright-core";
import { healDemoPrintLayoutPayload, normalizePrintLayoutPayload } from "../src/lib/printExportBridge.ts";
import type { PrintLayoutPayload } from "../src/lib/printExportPayload.ts";
import { normalizeTemplateStyle, type TemplateStyle } from "../src/lib/resumeTemplateCatalog.ts";
import type { ResumeData } from "../src/types.ts";

const PRINT_READY_SELECTOR = '[data-print-ready="true"]';
const PRINT_TIMEOUT_MS = 45_000;
const FONT_READY_TIMEOUT_MS = 18_000;

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

async function launchChromium(): Promise<Browser | null> {
  if (IS_SERVERLESS) {
    try {
      const sparticuz = (await import("@sparticuz/chromium")).default;
      const { chromium } = await import("playwright-core");
      const executablePath = await sparticuz.executablePath();
      return await chromium.launch({
    headless: true,
        executablePath,
        args: [...sparticuz.args, "--disable-dev-shm-usage"],
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

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  return raw.split(",")[0]?.trim() || undefined;
}

/**
 * Vercel Deployment Protection SSO-gates per-deployment hosts
 * (`{project}-{hash}-{scope}.vercel.app`). Chromium cannot complete login, so
 * print export must never navigate there — use the public production alias.
 */
export function isProtectedVercelDeploymentHost(host: string): boolean {
  const hostname = host.trim().toLowerCase().split(":")[0] ?? "";
  if (!hostname.endsWith(".vercel.app")) return false;
  const sub = hostname.slice(0, -".vercel.app".length);
  // e.g. nextstepresume-ai-playground-7rf37naw6-aiden-s-projects8
  return /-[a-z0-9]{8,}-[a-z0-9-]+$/i.test(sub);
}

function configuredPublicOrigin(): string | undefined {
  const raw =
    process.env.PRINT_ORIGIN ||
    process.env.PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined);
  if (!raw) return undefined;
  return raw.replace(/\/$/, "");
}

/**
 * PDF Chromium must open a stable public origin — never the request's
 * per-deployment host (SSO-gated) and never whatever Host header the API
 * happened to receive. Prefer PRINT_ORIGIN / PUBLIC_APP_URL /
 * VERCEL_PROJECT_PRODUCTION_URL so export is independent of the inbound host.
 */
export function resolvePrintOrigin(req: Request): string {
  const serverless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (serverless) {
    const publicOrigin = configuredPublicOrigin();
    if (publicOrigin) return publicOrigin;

    const host = firstHeaderValue(req.headers["x-forwarded-host"]) ?? firstHeaderValue(req.headers.host);
    const proto = firstHeaderValue(req.headers["x-forwarded-proto"]) ?? "https";
    if (host && !isProtectedVercelDeploymentHost(host)) {
      return `${proto}://${host}`;
    }
    if (host) return `${proto}://${host}`;
  }
  const port = Number(process.env.PORT) || 3000;
  return `http://127.0.0.1:${port}`;
}

function buildPrintUrl(origin: string): string {
  const url = new URL("/?print=1", origin.endsWith("/") ? origin : `${origin}/`);
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypass) {
    url.searchParams.set("x-vercel-protection-bypass", bypass);
    url.searchParams.set("x-vercel-set-bypass-cookie", "true");
  }
  return url.toString();
}

export async function handleExportPdf(req: Request, res: Response): Promise<void> {
  const body = (req.body ?? {}) as {
    resumeData?: unknown;
    templateStyle?: string;
    locale?: string;
    pageFormat?: string;
    paperMode?: string;
    watermark?: string;
    layout?: unknown;
  };
  const format = body.pageFormat === "Letter" ? "Letter" : "A4";

  if (!body.resumeData || typeof body.resumeData !== "object" || !("personalInfo" in body.resumeData)) {
    res.status(400).json({ error: "resumeData is required", code: "MISSING_RESUME_DATA" });
    return;
  }

  const browser = await launchChromium();
  if (!browser) {
    res.status(501).json({
      error: "PDF renderer unavailable in this environment",
      code: "CHROMIUM_UNAVAILABLE",
    });
    return;
  }

  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });

    let normalizedLayout =
      body.layout &&
      typeof body.layout === "object" &&
      (body.layout as PrintLayoutPayload).enabled === true
        ? (body.layout as PrintLayoutPayload)
        : body.layout;

    if (
      normalizedLayout &&
      typeof normalizedLayout === "object" &&
      (normalizedLayout as PrintLayoutPayload).enabled === true
    ) {
      const healed = healDemoPrintLayoutPayload(
        body.resumeData as ResumeData,
        normalizeTemplateStyle(body.templateStyle) as TemplateStyle,
        normalizedLayout as PrintLayoutPayload,
      );
      normalizedLayout = normalizePrintLayoutPayload(healed);
    }

    const payload = JSON.stringify({
      resumeData: body.resumeData,
      templateStyle: body.templateStyle,
      locale: body.locale,
      pageFormat: format,
      paperMode: body.paperMode === "white" ? "white" : "cream",
      watermark: typeof body.watermark === "string" ? body.watermark : undefined,
      layout: normalizedLayout,
    });

    await page.addInitScript((raw: string) => {
      try {
        localStorage.setItem("nsr_print_payload", raw);
      } catch {
        // storage unavailable
      }
    }, payload);

    const printUrl = buildPrintUrl(resolvePrintOrigin(req));
    // Use domcontentloaded (not networkidle) so long-lived font/asset connections
    // can't stall navigation — readiness is gated explicitly below.
    await page.goto(printUrl, {
      waitUntil: "domcontentloaded",
      timeout: PRINT_TIMEOUT_MS,
    });

    await page.waitForSelector(PRINT_READY_SELECTOR, { timeout: PRINT_TIMEOUT_MS });
    await page.evaluate(async (fontTimeoutMs: number) => {
      await Promise.race([
        document.fonts.ready,
        new Promise<void>((resolve) => setTimeout(resolve, fontTimeoutMs)),
      ]);
    }, FONT_READY_TIMEOUT_MS);

    const pdf = await page.pdf({
      format,
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      preferCSSPageSize: true,
    });

    if (!pdf || pdf.byteLength < 2_000) {
      res.status(500).json({ error: "PDF render produced empty output", code: "EMPTY_PDF" });
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=resume.pdf");
    res.send(Buffer.from(pdf));
  } catch (error) {
    console.error("[export/pdf] render failed:", error);
    if (!res.headersSent) {
      const message = error instanceof Error ? error.message : "PDF render failed";
      res.status(500).json({ error: message, code: "RENDER_FAILED" });
    }
  } finally {
    await browser.close().catch(() => undefined);
  }
}
