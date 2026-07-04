import type { Express, Request, Response } from "express";
import type { Browser } from "playwright-core";

const PRINT_READY_SELECTOR = '[data-print-ready="true"]';
const PRINT_TIMEOUT_MS = 20_000;

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

/**
 * Launch order:
 * 1. Serverless (Vercel/Lambda): @sparticuz/chromium binary + playwright-core.
 * 2. Local dev: the Playwright-managed Chromium install.
 * Any failure returns null → route responds 501 → client raster fallback.
 */
async function launchChromium(): Promise<Browser | null> {
  if (IS_SERVERLESS) {
    try {
      const sparticuz = (await import("@sparticuz/chromium")).default;
      const { chromium } = await import("playwright-core");
      const executablePath = await sparticuz.executablePath();
      return await chromium.launch({
        headless: true,
        executablePath,
        args: sparticuz.args,
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

/** Print view origin — own deployment URL on serverless, localhost in dev. */
function resolvePrintOrigin(req: Request): string {
  if (IS_SERVERLESS) {
    const host = (req.headers["x-forwarded-host"] ?? req.headers.host) as string | undefined;
    if (host) {
      const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
      return `${proto.split(",")[0]}://${host.split(",")[0]}`;
    }
  }
  const port = Number(process.env.PORT) || 3000;
  return `http://127.0.0.1:${port}`;
}

/**
 * Vector PDF export — renders the SPA print view (?print=1) in headless
 * Chromium and returns page.pdf(). Output is selectable-text, ATS-readable,
 * and pixel-identical to the preview (same React renderer + tokens).
 * Client falls back to the html2canvas raster path when this returns non-200.
 */
export function registerExportPdfRoutes(app: Express): void {
  app.post("/api/export/pdf", (req: Request, res: Response) => {
    void handleExportPdf(req, res);
  });
}

async function handleExportPdf(req: Request, res: Response): Promise<void> {
  const { resumeData, templateStyle, locale, pageFormat, paperMode } = (req.body ?? {}) as {
    resumeData?: unknown;
    templateStyle?: string;
    locale?: string;
    pageFormat?: string;
    paperMode?: string;
  };
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
      paperMode: paperMode === "white" ? "white" : "cream",
    });
    await page.addInitScript((raw: string) => {
      try {
        localStorage.setItem("nsr_print_payload", raw);
      } catch {
        // storage unavailable — print page falls back to defaults
      }
    }, payload);

    await page.goto(`${resolvePrintOrigin(req)}/?print=1`, {
      waitUntil: "domcontentloaded",
      timeout: PRINT_TIMEOUT_MS,
    });
    await page.waitForSelector(PRINT_READY_SELECTOR, { timeout: PRINT_TIMEOUT_MS });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    const pdf = await page.pdf({
      format,
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
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
    await browser.close().catch(() => undefined);
  }
}
