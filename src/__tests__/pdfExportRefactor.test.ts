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
});
