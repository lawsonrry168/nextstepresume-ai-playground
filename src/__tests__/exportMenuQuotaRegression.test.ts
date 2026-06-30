import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../..");

describe("export quota regression", () => {
  it("checks quota before export and deducts after awaited success", () => {
    const source = readFileSync(
      path.join(root, "src/components/playground/ExportMenuButton.tsx"),
      "utf8",
    );

    expect(source).toContain('if (!canConsume("pdfVisualExport", 1))');
    expect(source).toContain('await exportToPDF("visual")');
    expect(source).toContain('consumeUsage("pdfVisualExport", 1);');

    expect(source).toContain('if (!canConsume("pdfAtsExport", 1))');
    expect(source).toContain('await exportToPDF("ats")');
    expect(source).toContain('consumeUsage("pdfAtsExport", 1);');

    expect(source).toContain('if (!canConsume("docxExport", 1))');
    expect(source).toContain("await exportToDocx()");
    expect(source).toContain('consumeUsage("docxExport", 1);');
  });
});
