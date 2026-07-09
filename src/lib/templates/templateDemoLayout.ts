import type { ResumeData } from "../../types";
import type { TemplateStyle } from "../resumeTemplateCatalog";
import { getTemplateFamily, isMarginaliaNotebookTemplate } from "../resumeTemplateCatalog";
import { CANVAS_PAGE_MARGIN } from "../canvasAlignTools";
import { estimateSectionHeightForContent, marginaliaSectionChrome } from "../canvasSectionContentSizing";
import { CANVAS_PAGE_HEIGHT, CANVAS_PAGE_WIDTH } from "../canvasStudioTypes";
import {
  clampSectionHeight,
  defaultSectionHeight,
  snapToGrid,
  SNAP_GRID_SIZE,
  type FreeLayoutPosition,
} from "../resumeFreeLayout";
import { getTemplateDefinition } from "./tokens";
import type { CanvasPagesDocument } from "../canvasStudioTypes";
import { formatCanvasPageLabel } from "../sectionLabels";

export const TEMPLATE_DEMO_PAGE_IDS = {
  page1: "demo-page-1",
  page2: "demo-page-2",
} as const;

const M = CANVAS_PAGE_MARGIN;
const PAGE_W = CANVAS_PAGE_WIDTH;
const PAGE_H = CANVAS_PAGE_HEIGHT;
const USABLE_W = PAGE_W - M * 2;
const PAGE_BOTTOM = PAGE_H - M;
const SECTION_GAP = snapToGrid(8, SNAP_GRID_SIZE);
const CENTER_COL_W = snapToGrid(Math.min(600, USABLE_W), SNAP_GRID_SIZE);

const READING_ORDER = [
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

function sortForPagination(sectionIds: string[]): string[] {
  const rank = new Map(READING_ORDER.map((id, index) => [id, index]));
  return [...sectionIds].sort((a, b) => (rank.get(a) ?? 99) - (rank.get(b) ?? 99));
}

function columnForFamily(family: string): { x: number; width: number } {
  if (family === "classic") {
    const x = snapToGrid(Math.round((PAGE_W - CENTER_COL_W) / 2), SNAP_GRID_SIZE);
    return { x, width: CENTER_COL_W };
  }
  return { x: M, width: USABLE_W };
}

function sectionHeight(
  id: string,
  width: number,
  resumeData: ResumeData,
  style?: TemplateStyle,
): number {
  let height = estimateSectionHeightForContent(id, resumeData, width);
  if (style && isMarginaliaNotebookTemplate(style)) {
    height = snapToGrid(height + marginaliaSectionChrome(id), SNAP_GRID_SIZE);
  }
  return height;
}

function stackHeight(
  sizes: Array<{ id: string; height: number }>,
  from: number,
  to: number,
): number {
  let total = M;
  for (let i = from; i < to; i++) {
    if (i > from) total += SECTION_GAP;
    total += sizes[i]!.height;
  }
  return total;
}

function findBalancedSplit(sizes: Array<{ id: string; height: number }>): number {
  const count = sizes.length;
  if (count <= 1) return count;

  for (let split = 1; split < count; split++) {
    if (stackHeight(sizes, 0, split) <= PAGE_BOTTOM && stackHeight(sizes, split, count) <= PAGE_BOTTOM) {
      return split;
    }
  }

  let bestSplit = 1;
  let bestOverflow = Infinity;
  for (let split = 1; split < count; split++) {
    const page1Over = Math.max(0, stackHeight(sizes, 0, split) - PAGE_BOTTOM);
    const page2Over = Math.max(0, stackHeight(sizes, split, count) - PAGE_BOTTOM);
    const overflow = Math.max(page1Over, page2Over);
    if (overflow < bestOverflow) {
      bestOverflow = overflow;
      bestSplit = split;
    }
  }
  return bestSplit;
}

function stackHeightForIds(
  sizes: Array<{ id: string; height: number }>,
  ids: string[],
): number {
  const heightById = new Map(sizes.map((entry) => [entry.id, entry.height]));
  let total = M;
  for (let index = 0; index < ids.length; index++) {
    if (index > 0) total += SECTION_GAP;
    total += heightById.get(ids[index]!) ?? 0;
  }
  return total;
}

/**
 * Two-page demo layout: single-column stack per page (no sidebar x coords).
 * Never uses clampPositionToA4Page — upward y clamp caused same-page overlaps.
 */
export function paginateLayoutToTwoPages(
  sectionIds: string[],
  resumeData: ResumeData,
  family: string,
  style?: TemplateStyle,
): Record<string, FreeLayoutPosition> {
  const ordered = sortForPagination(sectionIds);
  const column = columnForFamily(family);
  const sizes = ordered.map((id) => ({
    id,
    height: sectionHeight(id, column.width, resumeData, style),
  }));

  if (!sizes.length) return {};

  const splitAt = findBalancedSplit(sizes);
  const page1Ids = ordered.slice(0, splitAt);
  const page2Ids = ordered.slice(splitAt);

  while (page2Ids.length > 0 && stackHeightForIds(sizes, page2Ids) > PAGE_BOTTOM) {
    const movedId = page2Ids.pop()!;
    const nextPage1 = [...page1Ids, movedId];
    if (stackHeightForIds(sizes, nextPage1) <= PAGE_BOTTOM) {
      page1Ids.push(movedId);
      continue;
    }
    page2Ids.push(movedId);
    break;
  }

  while (page1Ids.length > 1 && stackHeightForIds(sizes, page1Ids) > PAGE_BOTTOM) {
    const movedId = page1Ids.pop()!;
    page2Ids.unshift(movedId);
  }

  const result: Record<string, FreeLayoutPosition> = {};
  const layoutPage = (ids: string[], pageId: string) => {
    let cursorY = M;
    for (const id of ids) {
      const height = sizes.find((entry) => entry.id === id)?.height ?? defaultSectionHeight(id);
      result[id] = {
        x: column.x,
        y: cursorY,
        width: column.width,
        height,
        pageId,
      };
      cursorY += height + SECTION_GAP;
    }
  };

  layoutPage(page1Ids, TEMPLATE_DEMO_PAGE_IDS.page1);
  layoutPage(page2Ids, TEMPLATE_DEMO_PAGE_IDS.page2);
  return result;
}

export function createTemplateDemoLayoutPositions(
  style: TemplateStyle,
  sectionIds: string[],
  resumeData: ResumeData,
): Record<string, FreeLayoutPosition> {
  const def = getTemplateDefinition(style);
  return createTemplateDemoLayoutPositionsForFamily(def.family, sectionIds, resumeData, style);
}

export function createTemplateDemoLayoutPositionsForFamily(
  family: string,
  sectionIds: string[],
  resumeData: ResumeData,
  style?: TemplateStyle,
): Record<string, FreeLayoutPosition> {
  return paginateLayoutToTwoPages(sectionIds, resumeData, family, style);
}

/** True when stored demo page ids diverge from the canonical two-page demo stack. */
export function demoLayoutPageAssignmentDriftForFamily(
  positions: Record<string, FreeLayoutPosition>,
  family: string,
  sectionIds: string[],
  resumeData: ResumeData,
): boolean {
  if (!isDemoPageLayout(positions)) return false;
  const expected = createTemplateDemoLayoutPositionsForFamily(family, sectionIds, resumeData);
  return sectionIds.some((id) => expected[id]?.pageId !== positions[id]?.pageId);
}

export function healDemoStoredLayoutPositions(
  positions: Record<string, FreeLayoutPosition> | null | undefined,
  family: string,
  sectionIds: string[],
  resumeData: ResumeData,
): Record<string, FreeLayoutPosition> | null {
  if (!positions || !isDemoPageLayout(positions)) return positions ?? null;
  if (
    !demoLayoutMissingSecondPage(positions) &&
    !demoLayoutPageAssignmentDriftForFamily(positions, family, sectionIds, resumeData) &&
    !demoLayoutHasPageOverflow(positions)
  ) {
    return positions;
  }
  return createTemplateDemoLayoutPositionsForFamily(family, sectionIds, resumeData);
}

export function buildTemplateDemoPagesDocument(): CanvasPagesDocument {
  return {
    pages: [
      { id: TEMPLATE_DEMO_PAGE_IDS.page1, label: formatCanvasPageLabel(1) },
      { id: TEMPLATE_DEMO_PAGE_IDS.page2, label: formatCanvasPageLabel(2) },
    ],
    activePageId: TEMPLATE_DEMO_PAGE_IDS.page1,
  };
}

export function layoutUsesTwoDemoPages(positions: Record<string, FreeLayoutPosition>): boolean {
  const pageIds = new Set<string>();
  for (const pos of Object.values(positions)) {
    if (pos.pageId) pageIds.add(pos.pageId);
  }
  return pageIds.has(TEMPLATE_DEMO_PAGE_IDS.page1) && pageIds.has(TEMPLATE_DEMO_PAGE_IDS.page2);
}

/** True when demo page-1 is used but page-2 assignments were lost (stale single-page collapse). */
export function demoLayoutMissingSecondPage(
  positions: Record<string, FreeLayoutPosition>,
): boolean {
  const usesDemoPage1 = Object.values(positions).some(
    (pos) => pos.pageId === TEMPLATE_DEMO_PAGE_IDS.page1,
  );
  if (!usesDemoPage1) return false;
  return !layoutUsesTwoDemoPages(positions);
}

/** True when stored demo page ids diverge from the canonical two-page demo stack. */
export function demoLayoutPageAssignmentDrift(
  positions: Record<string, FreeLayoutPosition>,
  style: TemplateStyle,
  sectionIds: string[],
  resumeData: ResumeData,
): boolean {
  const def = getTemplateDefinition(style);
  return demoLayoutPageAssignmentDriftForFamily(positions, def.family, sectionIds, resumeData);
}

export function getTemplateDemoFamily(style: TemplateStyle) {
  return getTemplateFamily(style);
}

/** True when any section uses demo pagination page ids. */
export function isDemoPageLayout(positions: Record<string, FreeLayoutPosition>): boolean {
  return Object.values(positions).some(
    (pos) =>
      pos.pageId === TEMPLATE_DEMO_PAGE_IDS.page1 || pos.pageId === TEMPLATE_DEMO_PAGE_IDS.page2,
  );
}

function sectionsOverlap(a: FreeLayoutPosition, b: FreeLayoutPosition, gap = 2): boolean {
  return !(
    a.x + a.width <= b.x + gap ||
    b.x + b.width <= a.x + gap ||
    a.y + a.height <= b.y + gap ||
    b.y + b.height <= a.y + gap
  );
}

export function demoLayoutHasOverlaps(positions: Record<string, FreeLayoutPosition>): boolean {
  const ids = Object.keys(positions);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = positions[ids[i]!]!;
      const b = positions[ids[j]!]!;
      if (a.pageId !== b.pageId) continue;
      if (sectionsOverlap(a, b)) return true;
    }
  }
  return false;
}

export function demoLayoutHasPageOverflow(
  positions: Record<string, FreeLayoutPosition>,
  pageHeight = PAGE_H,
): boolean {
  for (const pos of Object.values(positions)) {
    if (pos.y + pos.height > pageHeight - M + 1) return true;
  }
  return false;
}
