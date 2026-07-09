import type { ResumeData } from "../types";
import type { TemplateFamily } from "./resumeTemplateCatalog";
import type { TemplateLayoutArchetype } from "./templates/tokens";
import { CANVAS_PAGE_MARGIN } from "./canvasAlignTools";
import { clampPositionToA4Page } from "./canvasPageSnap";
import { estimateSectionHeightForContent } from "./canvasSectionContentSizing";
import {
  defaultSectionHeight,
  normalizeFreeLayoutPosition,
  snapToGrid,
  SNAP_GRID_SIZE,
  type FreeLayoutPosition,
  type FreeLayoutPresetId,
} from "./resumeFreeLayout";

const M = CANVAS_PAGE_MARGIN;
const PAGE_W = 794;
const PAGE_H = 1123;
const USABLE_W = PAGE_W - M * 2;
const USABLE_H = PAGE_H - M * 2;
const GAP = snapToGrid(8, SNAP_GRID_SIZE);
const COL_GAP = snapToGrid(16, SNAP_GRID_SIZE);
const SIDEBAR_W = snapToGrid(224, SNAP_GRID_SIZE);

const SECTION_ORDER = [
  "header",
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
  "languages",
  "certifications",
  "volunteer",
];

const SIDEBAR_SECTIONS = new Set(["skills", "languages", "education", "certifications", "volunteer"]);
const MAIN_SECTIONS = new Set(["experience", "projects"]);

type Placement = { id: string; x: number; y: number; w: number; h: number };
type PresetLayoutFn = (sectionIds: string[], resumeData?: ResumeData) => Record<string, FreeLayoutPosition>;

function sortSections(sectionIds: string[]): string[] {
  const rank = new Map(SECTION_ORDER.map((id, index) => [id, index]));
  return [...sectionIds].sort((a, b) => (rank.get(a) ?? 99) - (rank.get(b) ?? 99));
}

function sectionH(id: string, width: number, resumeData?: ResumeData): number {
  return resumeData ? estimateSectionHeightForContent(id, resumeData, width) : defaultSectionHeight(id);
}

function clampGap(totalHeight: number, count: number, availableHeight: number, fallback = GAP): number {
  if (count <= 1) return 0;
  const slack = availableHeight - totalHeight;
  if (slack <= 0) return fallback;
  return Math.max(GAP, Math.min(48, Math.floor(slack / (count - 1))));
}

function buildPositions(placements: Placement[]): Record<string, FreeLayoutPosition> {
  return Object.fromEntries(
    placements.map((placement) => [
      placement.id,
      normalizeFreeLayoutPosition(
        {
          x: placement.x,
          y: placement.y,
          width: placement.w,
          height: placement.h,
        },
        placement.id,
      ),
    ]),
  );
}

/**
 * Draft layouts must NEVER paginate: the layout functions already stack
 * sections sequentially (content-fitted, no overlaps), and the single-sheet
 * canvas renders every position on one sheet — a section assigned to
 * "export-page-2" at y=48 would draw on top of the header. Overflow past the
 * A4 band simply extends the sheet (the red page-break guide marks it);
 * pagination happens later in the export pipeline (buildPrintReadyExportLayout).
 */
function finalizeLayout(
  _sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  resumeData?: ResumeData,
): Record<string, FreeLayoutPosition> {
  if (!resumeData) {
    return Object.fromEntries(
      Object.entries(positions).map(([id, pos]) => [id, clampPositionToA4Page(pos)]),
    );
  }
  return positions;
}

function layoutStack(sectionIds: string[], resumeData?: ResumeData): Record<string, FreeLayoutPosition> {
  const sorted = sortSections(sectionIds);
  const heights = sorted.map((id) => sectionH(id, USABLE_W, resumeData));
  const gap = clampGap(heights.reduce((sum, value) => sum + value, 0), sorted.length, USABLE_H);
  const placements: Placement[] = [];
  let y = M;
  for (const [index, id] of sorted.entries()) {
    const h = heights[index] ?? defaultSectionHeight(id);
    placements.push({ id, x: M, y, w: USABLE_W, h });
    y += h + gap;
  }
  return buildPositions(placements);
}

function layoutStackCenter(sectionIds: string[], resumeData?: ResumeData): Record<string, FreeLayoutPosition> {
  const sorted = sortSections(sectionIds);
  const colW = snapToGrid(Math.min(600, USABLE_W), SNAP_GRID_SIZE);
  const x = snapToGrid(Math.round((PAGE_W - colW) / 2), SNAP_GRID_SIZE);
  const heights = sorted.map((id) => sectionH(id, colW, resumeData));
  const gap = clampGap(heights.reduce((sum, value) => sum + value, 0), sorted.length, USABLE_H);
  const placements: Placement[] = [];
  let y = M;
  for (const [index, id] of sorted.entries()) {
    const h = heights[index] ?? defaultSectionHeight(id);
    placements.push({ id, x, y, w: colW, h });
    y += h + gap;
  }
  return buildPositions(placements);
}

function layoutStackCompact(sectionIds: string[], resumeData?: ResumeData): Record<string, FreeLayoutPosition> {
  const sorted = sortSections(sectionIds);
  const placements: Placement[] = [];
  let y = M;
  for (const id of sorted) {
    const h = sectionH(id, USABLE_W, resumeData);
    placements.push({ id, x: M, y, w: USABLE_W, h });
    y += h + GAP;
  }
  return buildPositions(placements);
}

function layoutEditorial(sectionIds: string[], resumeData?: ResumeData): Record<string, FreeLayoutPosition> {
  const sorted = sortSections(sectionIds);
  const sidebarIds = sorted.filter((id) => SIDEBAR_SECTIONS.has(id));
  const mainIds = sorted.filter((id) => !SIDEBAR_SECTIONS.has(id) && id !== "header" && id !== "summary");
  const sideW = SIDEBAR_W;
  const mainW = snapToGrid(USABLE_W - sideW - COL_GAP, SNAP_GRID_SIZE);
  const sideX = M;
  const mainX = M + sideW + COL_GAP;
  const placements: Placement[] = [];

  let cursorY = M;
  if (sorted.includes("header")) {
    const headerHeight = sectionH("header", USABLE_W, resumeData);
    placements.push({ id: "header", x: M, y: cursorY, w: USABLE_W, h: headerHeight });
    cursorY += headerHeight + GAP;
  }
  if (sorted.includes("summary")) {
    const summaryHeight = sectionH("summary", USABLE_W, resumeData);
    placements.push({ id: "summary", x: M, y: cursorY, w: USABLE_W, h: summaryHeight });
    cursorY += summaryHeight + COL_GAP;
  }

  const remainingHeight = Math.max(240, PAGE_H - cursorY - M);
  const sideHeights = sidebarIds.map((id) => sectionH(id, sideW, resumeData));
  const mainHeights = mainIds.map((id) => sectionH(id, mainW, resumeData));
  const sideGap = clampGap(sideHeights.reduce((sum, value) => sum + value, 0), sidebarIds.length, remainingHeight);
  const mainGap = clampGap(mainHeights.reduce((sum, value) => sum + value, 0), mainIds.length, remainingHeight, COL_GAP);

  let sideY = cursorY;
  for (const [index, id] of sidebarIds.entries()) {
    const h = sideHeights[index] ?? defaultSectionHeight(id);
    placements.push({ id, x: sideX, y: sideY, w: sideW, h });
    sideY += h + sideGap;
  }

  let mainY = cursorY;
  const orderedMainIds = [
    ...mainIds.filter((id) => MAIN_SECTIONS.has(id)),
    ...mainIds.filter((id) => !MAIN_SECTIONS.has(id)),
  ];
  const orderedMainHeights = orderedMainIds.map((id) => sectionH(id, mainW, resumeData));
  for (const [index, id] of orderedMainIds.entries()) {
    const h = orderedMainHeights[index] ?? defaultSectionHeight(id);
    placements.push({ id, x: mainX, y: mainY, w: mainW, h });
    mainY += h + mainGap;
  }

  return buildPositions(placements);
}

function layoutTwoColumn(sectionIds: string[], resumeData?: ResumeData): Record<string, FreeLayoutPosition> {
  const sorted = sortSections(sectionIds);
  const colW = snapToGrid(Math.floor((USABLE_W - COL_GAP) / 2), SNAP_GRID_SIZE);
  const leftX = M;
  const rightX = M + colW + COL_GAP;
  const leftIds: string[] = [];
  const rightIds: string[] = [];
  let leftTotal = 0;
  let rightTotal = 0;

  for (const id of sorted) {
    const h = sectionH(id, colW, resumeData);
    if (leftTotal <= rightTotal) {
      leftIds.push(id);
      leftTotal += h;
    } else {
      rightIds.push(id);
      rightTotal += h;
    }
  }

  const leftHeights = leftIds.map((id) => sectionH(id, colW, resumeData));
  const rightHeights = rightIds.map((id) => sectionH(id, colW, resumeData));
  const leftGap = clampGap(leftHeights.reduce((sum, value) => sum + value, 0), leftIds.length, USABLE_H);
  const rightGap = clampGap(rightHeights.reduce((sum, value) => sum + value, 0), rightIds.length, USABLE_H);
  const placements: Placement[] = [];

  let leftY = M;
  for (const [index, id] of leftIds.entries()) {
    const h = leftHeights[index] ?? defaultSectionHeight(id);
    placements.push({ id, x: leftX, y: leftY, w: colW, h });
    leftY += h + leftGap;
  }

  let rightY = M;
  for (const [index, id] of rightIds.entries()) {
    const h = rightHeights[index] ?? defaultSectionHeight(id);
    placements.push({ id, x: rightX, y: rightY, w: colW, h });
    rightY += h + rightGap;
  }

  return buildPositions(placements);
}

function layoutSidebar(sectionIds: string[], resumeData?: ResumeData): Record<string, FreeLayoutPosition> {
  const sorted = sortSections(sectionIds);
  const sideIds = sorted.filter((id) => SIDEBAR_SECTIONS.has(id));
  const mainIds = sorted.filter((id) => !SIDEBAR_SECTIONS.has(id));
  if (!sideIds.length) return layoutStack(sectionIds, resumeData);

  const mainW = snapToGrid(USABLE_W - SIDEBAR_W - COL_GAP, SNAP_GRID_SIZE);
  const sideX = M;
  const mainX = M + SIDEBAR_W + COL_GAP;
  const sideHeights = sideIds.map((id) => sectionH(id, SIDEBAR_W, resumeData));
  const mainHeights = mainIds.map((id) => sectionH(id, mainW, resumeData));
  const sideGap = clampGap(sideHeights.reduce((sum, value) => sum + value, 0), sideIds.length, USABLE_H);
  const mainGap = clampGap(mainHeights.reduce((sum, value) => sum + value, 0), mainIds.length, USABLE_H);
  const placements: Placement[] = [];

  let sideY = M;
  for (const [index, id] of sideIds.entries()) {
    const h = sideHeights[index] ?? defaultSectionHeight(id);
    placements.push({ id, x: sideX, y: sideY, w: SIDEBAR_W, h });
    sideY += h + sideGap;
  }

  let mainY = M;
  for (const [index, id] of mainIds.entries()) {
    const h = mainHeights[index] ?? defaultSectionHeight(id);
    placements.push({ id, x: mainX, y: mainY, w: mainW, h });
    mainY += h + mainGap;
  }

  return buildPositions(placements);
}

const PRESET_FN: Record<FreeLayoutPresetId, PresetLayoutFn> = {
  modern: layoutEditorial,
  classic: layoutStackCenter,
  minimalist: layoutSidebar,
  "two-column": layoutTwoColumn,
  magazine: layoutSidebar,
  compact: layoutStackCompact,
};

const FAMILY_FN: Record<TemplateFamily, PresetLayoutFn> = {
  modern: layoutEditorial,
  classic: layoutStackCenter,
  minimalist: layoutSidebar,
};

function usesLegacyOverflowPage(pos?: FreeLayoutPosition): boolean {
  return Boolean(pos?.pageId && /^page-overflow/i.test(pos.pageId));
}

/** Horizontal overflow / negative coords are corrupt; vertical overflow is a
 * legitimate long draft (sheet extends past the A4 band until export paginates). */
function isClearlyOutOfBounds(pos?: FreeLayoutPosition): boolean {
  if (!pos) return false;
  return pos.x < 0 || pos.y < 0 || pos.x + pos.width > PAGE_W + 24;
}

export function createFreeLayoutPresetPositions(
  presetId: FreeLayoutPresetId,
  sectionIds: string[],
  resumeData?: ResumeData,
): Record<string, FreeLayoutPosition> {
  const fn = PRESET_FN[presetId] ?? layoutStack;
  return finalizeLayout(sectionIds, fn(sectionIds, resumeData), resumeData);
}

export function createFamilyDefaultPositions(
  family: TemplateFamily,
  sectionIds: string[],
  resumeData?: ResumeData,
): Record<string, FreeLayoutPosition> {
  const fn = FAMILY_FN[family] ?? layoutStack;
  return finalizeLayout(sectionIds, fn(sectionIds, resumeData), resumeData);
}

export function createArchetypeLayoutPositions(
  archetype: TemplateLayoutArchetype,
  family: TemplateFamily,
  sectionIds: string[],
  resumeData?: ResumeData,
): Record<string, FreeLayoutPosition> {
  let fn: PresetLayoutFn = FAMILY_FN[family] ?? layoutStack;
  switch (archetype) {
    case "sidebar-left":
    case "header-band":
      fn = family === "minimalist" ? layoutSidebar : layoutEditorial;
      break;
    case "sidebar-right":
      fn = layoutSidebar;
      break;
    case "two-column":
      fn = layoutTwoColumn;
      break;
    case "timeline":
      fn = family === "classic" ? layoutStackCenter : layoutStack;
      break;
    case "single":
    default:
      fn = family === "classic" ? layoutStackCenter : family === "minimalist" ? layoutSidebar : layoutStack;
      break;
  }
  return finalizeLayout(sectionIds, fn(sectionIds, resumeData), resumeData);
}

/** @deprecated Use createFamilyDefaultPositions */
export function createDefaultFreeLayoutPositions(
  sectionIds: string[],
  family: TemplateFamily = "modern",
): Record<string, FreeLayoutPosition> {
  return createFamilyDefaultPositions(family, sectionIds);
}

/**
 * Signature of layouts corrupted by the old z-order stacking bug: the header
 * pushed off the first page (or to the bottom band) while minor sections sit
 * alone on page 1. A resume header belongs at the top of the first page —
 * anything else came from the inverted reflow and should self-heal.
 */
function sectionsOverlap(a: FreeLayoutPosition, b: FreeLayoutPosition, gap = 2): boolean {
  return !(
    a.x + a.width <= b.x + gap ||
    b.x + b.width <= a.x + gap ||
    a.y + a.height <= b.y + gap ||
    b.y + b.height <= a.y + gap
  );
}

/** True when two sections on the same page occupy overlapping bounding boxes. */
export function freeLayoutHasSamePageOverlaps(
  positions: Record<string, FreeLayoutPosition>,
): boolean {
  const ids = Object.keys(positions);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = positions[ids[i]!]!;
      const b = positions[ids[j]!]!;
      if ((a.pageId ?? "") !== (b.pageId ?? "")) continue;
      if (sectionsOverlap(a, b)) return true;
    }
  }
  return false;
}

function hasCorruptHeaderPlacement(merged: Record<string, FreeLayoutPosition>): boolean {
  const header = merged.header;
  if (!header) return false;
  if (header.y > PAGE_H * 0.6) return true;

  const headerPage = header.pageId ?? "";
  const pages = new Set<string>();
  for (const pos of Object.values(merged)) {
    pages.add(pos.pageId ?? "");
  }
  if (pages.size <= 1) return false;
  const firstPage = [...pages].sort()[0]!;
  return headerPage !== firstPage;
}

export function mergeFreeLayoutPositions(
  stored: Record<string, Partial<FreeLayoutPosition>> | null,
  sectionIds: string[],
  family: TemplateFamily = "modern",
  resumeData?: ResumeData,
): Record<string, FreeLayoutPosition> {
  const defaults = createFamilyDefaultPositions(family, sectionIds, resumeData);
  if (!stored) return defaults;

  const merged: Record<string, FreeLayoutPosition> = {};
  let shouldResetToDefaults = false;

  for (const id of sectionIds) {
    merged[id] = normalizeFreeLayoutPosition({ ...defaults[id], ...stored[id] }, id);
    if (usesLegacyOverflowPage(merged[id]) || isClearlyOutOfBounds(merged[id])) {
      shouldResetToDefaults = true;
    }
  }

  if (hasCorruptHeaderPlacement(merged)) {
    shouldResetToDefaults = true;
  }

  if (stored && freeLayoutHasSamePageOverlaps(stored as Record<string, FreeLayoutPosition>)) {
    shouldResetToDefaults = true;
  }

  return shouldResetToDefaults ? defaults : merged;
}
