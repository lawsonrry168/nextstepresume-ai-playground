import { describe, expect, it } from "vitest";
import { buildPrintReadyExportLayout, sectionOverflowsPrintPage } from "../lib/layoutExportSurface";
import {
  createFamilyDefaultPositions,
  createFreeLayoutPresetPositions,
} from "../lib/layoutPresets";
import { initialResumeData } from "../data";

const SECTION_IDS = [
  "header",
  "summary",
  "experience",
  "education",
  "projects",
  "skills",
];

describe("layoutExportSurface", () => {
  it("keeps family default presets within a single A4 page", () => {
    for (const family of ["modern", "classic", "minimalist"] as const) {
      const seeded = createFamilyDefaultPositions(family, SECTION_IDS);
      const plan = buildPrintReadyExportLayout(SECTION_IDS, seeded, initialResumeData);
      for (const pageId of plan.pageIds) {
        const onPage = SECTION_IDS.filter((id) => plan.positions[id]?.pageId === pageId);
        for (const id of onPage) {
          expect(sectionOverflowsPrintPage(plan.positions[id]!)).toBe(false);
        }
      }
    }
  });

  it("keeps all layout presets within A4 for sample resume", () => {
    for (const preset of ["modern", "classic", "minimalist", "two-column", "magazine", "compact"] as const) {
      const seeded = createFreeLayoutPresetPositions(preset, SECTION_IDS);
      const plan = buildPrintReadyExportLayout(SECTION_IDS, seeded, initialResumeData);
      for (const pageId of plan.pageIds) {
        const onPage = SECTION_IDS.filter((id) => plan.positions[id]?.pageId === pageId);
        for (const id of onPage) {
          expect(sectionOverflowsPrintPage(plan.positions[id]!)).toBe(false);
        }
      }
    }
  });

  it("buildPrintReadyExportLayout reflows overflow into extra pages when needed", () => {
    const tall = { ...initialResumeData };
    const overflowIds = ["header", "experience"];
    const seeded = {
      header: { x: 48, y: 48, width: 698, height: 220 },
      experience: { x: 48, y: 300, width: 698, height: 920 },
    };

    const plan = buildPrintReadyExportLayout(overflowIds, seeded, tall, {
      manualSizedSections: new Set(overflowIds),
    });

    for (const pageId of plan.pageIds) {
      const onPage = overflowIds.filter((id) => plan.positions[id]?.pageId === pageId);
      for (const id of onPage) {
        expect(sectionOverflowsPrintPage(plan.positions[id]!)).toBe(false);
      }
    }
  });

  it("default resume export fits printable pages without overflow", () => {
    const seeded = createFamilyDefaultPositions("modern", SECTION_IDS, initialResumeData);
    const plan = buildPrintReadyExportLayout(SECTION_IDS, seeded, initialResumeData);
    // Full HK meta (Notice/Expected) can push a dense modern layout to 2 pages.
    expect(plan.pageIds.length).toBeGreaterThanOrEqual(1);
    expect(plan.pageIds.length).toBeLessThanOrEqual(2);
    for (const id of SECTION_IDS) {
      expect(sectionOverflowsPrintPage(plan.positions[id]!)).toBe(false);
    }
  });

  it("preservePlacements keeps editor x/y while fitting heights", () => {
    const seeded = createFreeLayoutPresetPositions("two-column", SECTION_IDS);
    const plan = buildPrintReadyExportLayout(SECTION_IDS, seeded, initialResumeData, {
      preservePlacements: true,
    });
    for (const id of SECTION_IDS) {
      expect(plan.positions[id]?.x).toBe(seeded[id]?.x);
    }
    for (const pageId of plan.pageIds) {
      const onPage = SECTION_IDS.filter((id) => plan.positions[id]?.pageId === pageId);
      for (const id of onPage) {
        expect(sectionOverflowsPrintPage(plan.positions[id]!)).toBe(false);
      }
    }
  });

  it("preservePlacements paginates overflow on multi-page studio assignments", () => {
    const overflowIds = ["header", "summary", "experience", "education"];
    const seeded = {
      header: { x: 48, y: 48, width: 698, height: 180, pageId: "demo-page-1" },
      summary: { x: 48, y: 240, width: 698, height: 120, pageId: "demo-page-1" },
      experience: { x: 48, y: 380, width: 698, height: 720, pageId: "demo-page-1" },
      education: { x: 48, y: 48, width: 698, height: 160, pageId: "demo-page-2" },
    };
    const plan = buildPrintReadyExportLayout(overflowIds, seeded, initialResumeData, {
      preservePlacements: true,
      studioPages: [
        { id: "demo-page-1", label: "Page 1" },
        { id: "demo-page-2", label: "Page 2" },
      ],
      studioSectionPageMap: {
        header: "demo-page-1",
        summary: "demo-page-1",
        experience: "demo-page-1",
        education: "demo-page-2",
      },
    });
    expect(sectionOverflowsPrintPage(plan.positions.experience!)).toBe(false);
    expect(plan.pageIds.length).toBeGreaterThanOrEqual(2);
  });
});
