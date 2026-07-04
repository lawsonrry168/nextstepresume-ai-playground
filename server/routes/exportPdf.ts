import type { Express, Request, Response } from "express";

const PRINT_READY_SELECTOR = '[data-print-ready="true"]';
const PRINT_TIMEOUT_MS = 20_000;

async function loadChromium(): Promise<typeof import("playwright-core").chromium | null> {
  try {
    const pw = await import("playwright-core");
    return pw.chromium;
  } catch {
    try {
      const pw = await import("playwright");
      return pw.chromium;
    } catch {
      return null;
    }
  }
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

  const chromium = await loadChromium();
  if (!chromium) {
    res.status(501).json({ error: "PDF renderer unavailable (playwright not installed)" });
    return;
  }

  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    browser = await chromium.launch({ headless: true });
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

    const port = Number(process.env.PORT) || 3000;
    await page.goto(`http://127.0.0.1:${port}/?print=1`, {
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
    await browser?.close().catch(() => undefined);
  }
}
