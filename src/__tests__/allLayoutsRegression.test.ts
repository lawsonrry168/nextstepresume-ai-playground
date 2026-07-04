import { describe, expect, it } from "vitest";
import { initialResumeData } from "../data";
import { CANVAS_PAGE_MARGIN } from "../lib/canvasAlignTools";
import { CANVAS_PAGE_HEIGHT, CANVAS_PAGE_WIDTH } from "../lib/canvasStudioTypes";
import { A4_PAGE_HEIGHT, A4_PAGE_WIDTH } from "../lib/a4Page";
import { A4_CONTENT_WIDTH } from "../lib/a4Page";
import {
  buildPrintReadyExportLayout,
  sectionOverflowsPrintPage,
} from "../lib/layoutExportSurface";
import {
  createFamilyDefaultPositions,
  createFreeLayoutPresetPositions,
  mergeFreeLayoutPositions,
} from "../lib/layoutPresets";
import {
  buildFreeLayoutSections,
  type FreeLayoutPosition,
  type FreeLayoutPresetId,
} from "../lib/resumeFreeLayout";
import {
  getResumeTemplateTheme,
  getTemplateFamily,
  getTemplatesByFamily,
  isMarginaliaNotebookTemplate,
  RESUME_TEMPLATE_CATALOG,
  TEMPLATE_FAMILIES,
  type TemplateFamily,
  type TemplateStyle,
} from "../lib/resumeTemplateCatalog";

const ALL_PRESETS: FreeLayoutPresetId[] = [
  "modern",
  "classic",
  "minimalist",
  "two-column",
  "magazine",
  "compact",
];

/** Presets that fit sample resume on one A4 page without export reflow */
const SINGLE_PAGE_PRESETS: FreeLayoutPresetId[] = ["modern", "two-column"];

const SECTION_IDS = buildFreeLayoutSections(initialResumeData).map((s) => s.id);

function sectionsOverlap(a: FreeLayoutPosition, b: FreeLayoutPosition, gap = 2): boolean {
  return !(
    a.x + a.width <= b.x + gap ||
    b.x + b.width <= a.x + gap ||
    a.y + a.height <= b.y + gap ||
    b.y + b.height <= a.y + gap
  );
}

function assertWithinA4(pos: FreeLayoutPosition): void {
  expect(pos.x).toBeGreaterThanOrEqual(0);
  expect(pos.y).toBeGreaterThanOrEqual(0);
  expect(pos.width).toBeGreaterThan(0);
  expect(pos.height).toBeGreaterThan(0);
  expect(pos.x + pos.width).toBeLessThanOrEqual(CANVAS_PAGE_WIDTH + 2);
  expect(pos.y + pos.height).toBeLessThanOrEqual(CANVAS_PAGE_HEIGHT - CANVAS_PAGE_MARGIN + 8);
}

function assertNoOverlaps(positions: Record<string, FreeLayoutPosition>, sectionIds: string[]): void {
  const ids = sectionIds.filter((id) => positions[id]);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = positions[ids[i]!]!;
      const b = positions[ids[j]!]!;
      expect(sectionsOverlap(a, b), `overlap: ${ids[i]} vs ${ids[j]}`).toBe(false);
    }
  }
}

function assertExportPlan(
  label: string,
  plan: ReturnType<typeof buildPrintReadyExportLayout>,
  sectionIds: string[],
): void {
  expect(plan.pageIds.length).toBeGreaterThanOrEqual(1);
  expect(plan.pageIds.length).toBeLessThanOrEqual(3);

  for (const pageId of plan.pageIds) {
    const onPage = sectionIds.filter((id) => plan.positions[id]?.pageId === pageId);
    for (const id of onPage) {
      const pos = plan.positions[id]!;
      assertWithinA4(pos);
      expect(sectionOverflowsPrintPage(pos), `${label}/${pageId}/${id}`).toBe(false);
    }
    assertNoOverlaps(
      Object.fromEntries(onPage.map((id) => [id, plan.positions[id]!])),
      onPage,
    );
  }
}

describe("all layout presets — export-ready regression", () => {
  it.each(ALL_PRESETS)("preset %s export plan fits A4 per page", (presetId) => {
    const positions = createFreeLayoutPresetPositions(presetId, SECTION_IDS, initialResumeData);
    const plan = buildPrintReadyExportLayout(SECTION_IDS, positions, initialResumeData);
    assertExportPlan(`preset:${presetId}`, plan, SECTION_IDS);
  });

  it.each(TEMPLATE_FAMILIES)("family %s export plan fits A4 per page", (family: TemplateFamily) => {
    const positions = createFamilyDefaultPositions(family, SECTION_IDS, initialResumeData);
    const plan = buildPrintReadyExportLayout(SECTION_IDS, positions, initialResumeData);
    assertExportPlan(`family:${family}`, plan, SECTION_IDS);
  });

  it.each(SINGLE_PAGE_PRESETS)("preset %s raw layout fits single A4 without overlap", (presetId) => {
    const positions = createFreeLayoutPresetPositions(presetId, SECTION_IDS, initialResumeData);
    for (const id of SECTION_IDS) {
      const pos = positions[id];
      if (!pos) continue;
      assertWithinA4(pos);
      expect(sectionOverflowsPrintPage(pos)).toBe(false);
    }
    assertNoOverlaps(positions, SECTION_IDS);
  });

  it("repairs legacy stored overflow layouts back to valid family defaults", () => {
    const brokenStored = {
      header: { x: 48, y: 48, width: 698, height: 150 },
      summary: { x: 48, y: 1180, width: 698, height: 240, pageId: "page-overflow" },
    };
    const merged = mergeFreeLayoutPositions(brokenStored, SECTION_IDS, "modern", initialResumeData);

    for (const id of SECTION_IDS) {
      const pos = merged[id];
      if (!pos) continue;
      assertWithinA4(pos);
      expect(pos.pageId).not.toBe("page-overflow");
    }
  });

  it("repairs layouts corrupted by the z-order stacking bug (header off page 1)", () => {
    // Signature: minor section alone on page 1, header pushed to page 2
    const corruptPaged = {
      languages: { x: 48, y: 48, width: 320, height: 96, pageId: "export-page-1" },
      header: { x: 48, y: 48, width: 698, height: 216, pageId: "export-page-2" },
      summary: { x: 48, y: 280, width: 698, height: 120, pageId: "export-page-2" },
    };
    const repaired = mergeFreeLayoutPositions(corruptPaged, SECTION_IDS, "classic", initialResumeData);
    expect(repaired.header!.y).toBeLessThan(200);
    const pages = new Set(Object.values(repaired).map((pos) => pos.pageId ?? ""));
    expect(pages.size).toBe(1);

    // Signature: header crushed into the bottom band of the page
    const corruptBottom = {
      header: { x: 48, y: 907, width: 600, height: 216 },
      summary: { x: 48, y: 1003, width: 600, height: 120 },
    };
    const repairedBottom = mergeFreeLayoutPositions(corruptBottom, SECTION_IDS, "classic", initialResumeData);
    expect(repairedBottom.header!.y).toBeLessThan(200);

    // A legitimate custom layout (header near the top) is preserved
    const legit = {
      header: { x: 48, y: 64, width: 500, height: 220 },
    };
    const kept = mergeFreeLayoutPositions(legit, SECTION_IDS, "classic", initialResumeData);
    expect(kept.header!.y).toBe(64);
    expect(kept.header!.width).toBe(500);
  });
});

describe("resume template catalog regression", () => {
  it("catalog has 31 template themes", () => {
    expect(RESUME_TEMPLATE_CATALOG).toHaveLength(31);
  });

  it.each(RESUME_TEMPLATE_CATALOG.map((t) => t.id))(
    "template %s resolves theme and family",
    (style: TemplateStyle) => {
      const theme = getResumeTemplateTheme(style);
      expect(theme.id).toBe(style);
      expect(TEMPLATE_FAMILIES).toContain(theme.family);
      expect(getTemplateFamily(style)).toBe(theme.family);
      expect(getTemplatesByFamily(theme.family).some((t) => t.id === style)).toBe(true);
    },
  );

  it("marginalia notebook is modern-01 only", () => {
    expect(isMarginaliaNotebookTemplate("modern-01")).toBe(true);
    expect(isMarginaliaNotebookTemplate("modern-02")).toBe(false);
    expect(isMarginaliaNotebookTemplate("classic-01")).toBe(false);
  });

  it("A4 page constants match canvas studio dimensions", () => {
    expect(A4_PAGE_WIDTH).toBe(CANVAS_PAGE_WIDTH);
    expect(A4_PAGE_HEIGHT).toBe(CANVAS_PAGE_HEIGHT);
    expect(A4_PAGE_WIDTH).toBe(794);
    expect(A4_PAGE_HEIGHT).toBe(1123);
  });

  it("A4 content width matches printable area inside margins", () => {
    expect(A4_PAGE_WIDTH - 96).toBe(A4_CONTENT_WIDTH);
    expect(A4_CONTENT_WIDTH).toBe(698);
  });

  it("marginalia bullet list uses Unicode bullet not corrupted placeholder", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const css = fs.readFileSync(path.join(process.cwd(), "src/index.css"), "utf8");
    const layoutCss = fs.readFileSync(path.join(process.cwd(), "src/styles/a4-layout.css"), "utf8");
    expect(css + layoutCss).toMatch(/resume-marginalia-list > li::before[\s\S]*content:\s*"\\2022"/);
    expect(css).not.toMatch(/resume-marginalia-list > li::before[\s\S]*content:\s*"\?"/);
  });

  it("a4 layout stylesheet defines unified template families", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const layoutCss = fs.readFileSync(path.join(process.cwd(), "src/styles/a4-layout.css"), "utf8");
    expect(layoutCss).toContain("resume-template-classic");
    expect(layoutCss).toContain("resume-template-modern");
    expect(layoutCss).toContain("resume-template-minimalist");
    expect(layoutCss).toContain("resume-a4-flow");
    expect(layoutCss).toContain("resume-marginalia-a4-compact");
  });
});
