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

  it("single-page export stays on one page for default resume", () => {
    const seeded = createFamilyDefaultPositions("modern", SECTION_IDS);
    const plan = buildPrintReadyExportLayout(SECTION_IDS, seeded, initialResumeData);
    expect(plan.pageIds).toHaveLength(1);
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
});
