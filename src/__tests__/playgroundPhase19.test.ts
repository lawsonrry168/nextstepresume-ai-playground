import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../..");

describe("phase 19 studio export", () => {
  it("exposes studio export trigger in fullscreen header", () => {
    const header = readFileSync(
      path.join(root, "src/components/playground/StudioPreviewHeader.tsx"),
      "utf8",
    );
    const preview = readFileSync(
      path.join(root, "src/components/playground/ResumeLivePreviewPanel.tsx"),
      "utf8",
    );
    expect(header).toContain('id="studio-btn-export-menu"');
    expect(preview).toContain('id="immersive-preview-studio"');
  });

  it("covers studio export in dedicated e2e spec", () => {
    const spec = readFileSync(path.join(root, "e2e/playground.studio-export.spec.ts"), "utf8");
    expect(spec).toContain("clickStudioExportOption");
    expect(spec).toContain("export-pdf-visual");
  });
});
