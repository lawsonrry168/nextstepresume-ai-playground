// @vitest-environment node
import { describe, expect, it } from "vitest";
import { initialResumeData } from "../data";
import { analyzeSmartLayout } from "../lib/canvasSmartLayout";
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
});
