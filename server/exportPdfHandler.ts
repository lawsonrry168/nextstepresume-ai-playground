import type { Request, Response } from "express";
import type { Browser } from "playwright-core";

const PRINT_READY_SELECTOR = '[data-print-ready="true"]';
const PRINT_TIMEOUT_MS = 45_000;
const FONT_READY_TIMEOUT_MS = 12_000;

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

    const payload = JSON.stringify({
      resumeData: body.resumeData,
      templateStyle: body.templateStyle,
      locale: body.locale,
      pageFormat: format,
      paperMode: body.paperMode === "white" ? "white" : "cream",
      watermark: typeof body.watermark === "string" ? body.watermark : undefined,
      layout: body.layout,
    });

    await page.addInitScript((raw: string) => {
      try {
        localStorage.setItem("nsr_print_payload", raw);
      } catch {
        // storage unavailable
      }
    }, payload);

    const printUrl = `${resolvePrintOrigin(req)}/?print=1`;
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
