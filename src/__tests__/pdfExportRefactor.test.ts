import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildServerPrintPayload } from "../lib/printExportPayload";
import { initialResumeData } from "../data";

const root = path.resolve(import.meta.dirname, "../..");

describe("pdf export router refactor", () => {
  it("uses server PDF only without raster fallback", () => {
    const source = readFileSync(path.join(root, "src/lib/resumePdfExportRouter.ts"), "utf8");
    expect(source).toContain("downloadServerVisualPdf");
    expect(source).not.toContain("allowRasterPdfFallback");
    expect(source).not.toContain("downloadResumeVisualPdf");
    expect(source).not.toContain("studioLayoutActive");
  });

  it("server export returns structured errors", () => {
    const source = readFileSync(path.join(root, "src/lib/resumeServerPdfExport.ts"), "utf8");
    expect(source).toContain("ServerPdfExportResult");
    expect(source).toContain("parseServerError");
    expect(source).not.toMatch(/return false;\s*$/m);
  });

  it("buildServerPrintPayload includes layout and watermark", () => {
    const payload = buildServerPrintPayload({
      resumeData: initialResumeData,
      templateStyle: "modern-01",
      watermark: "NextStepResume.ai",
      layout: {
        enabled: true,
        sections: [{ id: "header" }],
        positions: { header: { x: 0, y: 0, width: 400, height: 120 } },
      },
    });
    expect(payload.watermark).toBe("NextStepResume.ai");
    expect(payload.layout?.enabled).toBe(true);
    expect(payload.layout?.sections).toHaveLength(1);
  });
});

describe("export pdf handler", () => {
  it("extracts shared handler for standalone Vercel function", () => {
    const route = readFileSync(path.join(root, "server/routes/exportPdf.ts"), "utf8");
    const handler = readFileSync(path.join(root, "server/exportPdfHandler.ts"), "utf8");
    const standalone = readFileSync(path.join(root, "server/exportPdfStandalone.ts"), "utf8");
    expect(route).toContain('from "../exportPdfHandler.ts"');
    expect(handler).toContain("layout");
    expect(handler).toContain("watermark");
    expect(standalone).toContain("handleExportPdf");
  });

  it("detects SSO-protected Vercel deployment hosts", async () => {
    const { isProtectedVercelDeploymentHost, resolvePrintOrigin } = await import(
      "../../server/exportPdfHandler.ts"
    );
    expect(
      isProtectedVercelDeploymentHost(
        "nextstepresume-ai-playground-7rf37naw6-aiden-s-projects8.vercel.app",
      ),
    ).toBe(true);
    expect(isProtectedVercelDeploymentHost("nextstepresume-ai-playground.vercel.app")).toBe(false);
    expect(isProtectedVercelDeploymentHost("example.com")).toBe(false);

    const prevVercel = process.env.VERCEL;
    const prevProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    const prevPrint = process.env.PRINT_ORIGIN;
    process.env.VERCEL = "1";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "nextstepresume-ai-playground.vercel.app";
    delete process.env.PRINT_ORIGIN;
    try {
      // Public production URL wins over any inbound Host (independent render origin).
      expect(
        resolvePrintOrigin({
          headers: {
            host: "nextstepresume-ai-playground-7rf37naw6-aiden-s-projects8.vercel.app",
            "x-forwarded-proto": "https",
          },
        } as never),
      ).toBe("https://nextstepresume-ai-playground.vercel.app");
      expect(
        resolvePrintOrigin({
          headers: {
            host: "some-preview.example.com",
            "x-forwarded-proto": "https",
          },
        } as never),
      ).toBe("https://nextstepresume-ai-playground.vercel.app");
    } finally {
      if (prevVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = prevVercel;
      if (prevProd === undefined) delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      else process.env.VERCEL_PROJECT_PRODUCTION_URL = prevProd;
      if (prevPrint === undefined) delete process.env.PRINT_ORIGIN;
      else process.env.PRINT_ORIGIN = prevPrint;
    }
  });

  it("prefers PRINT_ORIGIN over Vercel production URL for independent PDF render", async () => {
    const { resolvePrintOrigin } = await import("../../server/exportPdfHandler.ts");
    const prevVercel = process.env.VERCEL;
    const prevProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    const prevPrint = process.env.PRINT_ORIGIN;
    process.env.VERCEL = "1";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "nextstepresume-ai-playground.vercel.app";
    process.env.PRINT_ORIGIN = "https://pdf-cdn.example.com";
    try {
      expect(
        resolvePrintOrigin({
          headers: { host: "nextstepresume-ai-playground.vercel.app", "x-forwarded-proto": "https" },
        } as never),
      ).toBe("https://pdf-cdn.example.com");
    } finally {
      if (prevVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = prevVercel;
      if (prevProd === undefined) delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      else process.env.VERCEL_PROJECT_PRODUCTION_URL = prevProd;
      if (prevPrint === undefined) delete process.env.PRINT_ORIGIN;
      else process.env.PRINT_ORIGIN = prevPrint;
    }
  });
});
