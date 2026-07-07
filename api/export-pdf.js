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

// server/exportPdfStandalone.ts
var exportPdfStandalone_exports = {};
__export(exportPdfStandalone_exports, {
  default: () => handler
});
module.exports = __toCommonJS(exportPdfStandalone_exports);

// server/exportPdfHandler.ts
var PRINT_READY_SELECTOR = '[data-print-ready="true"]';
var PRINT_TIMEOUT_MS = 45e3;
var FONT_READY_TIMEOUT_MS = 12e3;
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
        args: [...sparticuz.args, "--disable-dev-shm-usage"]
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
async function handleExportPdf(req, res) {
  const body = req.body ?? {};
  const format = body.pageFormat === "Letter" ? "Letter" : "A4";
  if (!body.resumeData || typeof body.resumeData !== "object" || !("personalInfo" in body.resumeData)) {
    res.status(400).json({ error: "resumeData is required", code: "MISSING_RESUME_DATA" });
    return;
  }
  const browser = await launchChromium();
  if (!browser) {
    res.status(501).json({
      error: "PDF renderer unavailable in this environment",
      code: "CHROMIUM_UNAVAILABLE"
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
      watermark: typeof body.watermark === "string" ? body.watermark : void 0,
      layout: body.layout
    });
    await page.addInitScript((raw) => {
      try {
        localStorage.setItem("nsr_print_payload", raw);
      } catch {
      }
    }, payload);
    const printUrl = `${resolvePrintOrigin(req)}/?print=1`;
    await page.goto(printUrl, {
      waitUntil: "domcontentloaded",
      timeout: PRINT_TIMEOUT_MS
    });
    await page.waitForSelector(PRINT_READY_SELECTOR, { timeout: PRINT_TIMEOUT_MS });
    await page.evaluate(async (fontTimeoutMs) => {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, fontTimeoutMs))
      ]);
    }, FONT_READY_TIMEOUT_MS);
    const pdf = await page.pdf({
      format,
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      preferCSSPageSize: true
    });
    if (!pdf || pdf.byteLength < 2e3) {
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
    await browser.close().catch(() => void 0);
  }
}

// server/exportPdfStandalone.ts
async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  await handleExportPdf(req, res);
}
module.exports = module.exports.default ?? module.exports;
//# sourceMappingURL=export-pdf.js.map
