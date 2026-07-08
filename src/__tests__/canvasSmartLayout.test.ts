// @vitest-environment node
import { describe, expect, it } from "vitest";
import { initialResumeData } from "../data";
import { analyzeSmartLayout, runSmartLayoutPipeline } from "../lib/canvasSmartLayout";
import type { FreeLayoutPosition } from "../lib/resumeFreeLayout";

describe("canvasSmartLayout", () => {
  it("recommends two-column layout for dense experience", () => {
    const positions: Record<string, FreeLayoutPosition> = {
      header: { x: 48, y: 48, width: 680, height: 140 },
      experience: { x: 48, y: 220, width: 680, height: 900, pageId: "page-1" },
    };
    const analysis = analyzeSmartLayout({
      sectionIds: ["header", "experience"],
      positions,
      pageIds: ["page-1"],
      getPageId: (id) => positions[id]?.pageId ?? "page-1",
      resumeData: {
        ...initialResumeData,
        experience: Array.from({ length: 5 }, (_, i) => ({
          id: `exp-${i}`,
          company: `Company ${i}`,
          role: "Engineer",
          location: "HK",
          startDate: "2020",
          endDate: "2024",
          bullets: ["Did important work with measurable outcomes", "Led cross-functional delivery"],
        })),
      },
    });
    expect(analysis.recommendedAction).toBe("two-column");
    expect(analysis.overflowingSections).toContain("experience");
  });

  it("keeps a short single-page resume on one page after smart layout", () => {
    const sectionIds = [
      "header",
      "summary",
      "experience",
      "education",
      "skills",
      "projects",
      "languages",
    ];
    const positions: Record<string, FreeLayoutPosition> = {
      header: { x: 48, y: 48, width: 698, height: 160, pageId: "page-1" },
      summary: { x: 48, y: 220, width: 698, height: 80, pageId: "page-1" },
      experience: { x: 280, y: 320, width: 466, height: 220, pageId: "page-1" },
      education: { x: 48, y: 320, width: 210, height: 100, pageId: "page-1" },
      skills: { x: 48, y: 440, width: 210, height: 140, pageId: "page-1" },
      languages: { x: 48, y: 600, width: 210, height: 100, pageId: "page-1" },
      projects: { x: 280, y: 560, width: 466, height: 100, pageId: "page-1" },
    };

    const result = runSmartLayoutPipeline({
      sectionIds,
      positions,
      // Stale empty page must not force a 2-page plan for short content.
      pageIds: ["page-1", "page-2-empty"],
      getPageId: (id) => positions[id]?.pageId ?? "page-1",
      resumeData: initialResumeData,
    });

    expect(result.pageIds).toHaveLength(1);
    expect(result.analysis.density).not.toBe("high");
    const primary = result.pageIds[0]!;
    for (const id of sectionIds) {
      expect(result.editorPositions[id], id).toBeTruthy();
      const pageId = result.editorPositions[id]!.pageId;
      // Single-page plans may omit pageId or stamp the primary page.
      if (pageId) expect(pageId).toBe(primary);
    }
    expect(result.pageIds).not.toContain("page-2-empty");
  });
});
