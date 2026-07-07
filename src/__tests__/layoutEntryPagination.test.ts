// @vitest-environment node
import { describe, expect, it } from "vitest";
import { initialResumeData } from "../data";
import {
  applyEntryLevelPagination,
  makeFragmentId,
  shouldSplitSectionAtEntryLevel,
  splitSectionIntoEntryFragments,
} from "../lib/layoutEntryPagination";
import type { FreeLayoutPosition } from "../lib/resumeFreeLayout";
import { CANVAS_PAGE_HEIGHT } from "../lib/canvasStudioTypes";
import { CANVAS_PAGE_MARGIN } from "../lib/canvasAlignTools";

describe("layoutEntryPagination", () => {
  const overflowingExperience: FreeLayoutPosition = {
    x: 48,
    y: 900,
    width: 680,
    height: 200,
    pageId: "page-1",
  };

  const resumeData = {
    ...initialResumeData,
    experience: Array.from({ length: 4 }, (_, i) => ({
      id: `exp-${i}`,
      company: `Company ${i}`,
      role: "Senior Engineer",
      location: "HK",
      startDate: "2020",
      endDate: "2024",
      bullets: [
        "Led migration of payment platform serving 2M users with measurable outcomes",
        "Reduced API latency by 40% through caching redesign and observability",
        "Mentored junior engineers across two product squads",
        "Shipped SOC2-compliant audit trail for finance workflows",
        "Drove quarterly planning and cross-team architecture reviews",
      ],
    })),
  };

  it("detects overflowing splittable sections", () => {
    expect(shouldSplitSectionAtEntryLevel("experience", overflowingExperience, resumeData)).toBe(true);
    expect(shouldSplitSectionAtEntryLevel("summary", overflowingExperience, resumeData)).toBe(false);
  });

  it("splits experience into multiple fragments when overflowing", () => {
    const fragments = splitSectionIntoEntryFragments(
      "experience",
      overflowingExperience,
      resumeData,
      1,
      ["export-page-2"],
    );
    expect(fragments.length).toBeGreaterThan(1);
    expect(fragments[0]!.fragmentId).toBe(makeFragmentId("experience", 0));
    expect(fragments[0]!.slice.experience?.length).toBeGreaterThan(0);
  });

  it("applyEntryLevelPagination replaces base section with fragments", () => {
    const result = applyEntryLevelPagination(
      ["experience", "summary"],
      { experience: overflowingExperience, summary: { x: 48, y: 48, width: 680, height: 120 } },
      ["page-1"],
      resumeData,
    );
    expect(result.positions.experience).toBeUndefined();
    expect(Object.keys(result.sectionSlices).some((id) => id.startsWith("experience@f"))).toBe(true);
    expect(result.pageIds.length).toBeGreaterThanOrEqual(1);
  });

  it("does not split sections that fit on the page", () => {
    const fit: FreeLayoutPosition = { x: 48, y: 120, width: 680, height: 200, pageId: "page-1" };
    expect(shouldSplitSectionAtEntryLevel("experience", fit, resumeData)).toBe(false);
    const result = applyEntryLevelPagination(["experience"], { experience: fit }, ["page-1"], resumeData);
    expect(result.positions.experience).toBeDefined();
    expect(Object.keys(result.sectionSlices)).toHaveLength(0);
  });
});
