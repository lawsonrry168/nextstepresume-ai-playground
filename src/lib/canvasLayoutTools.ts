import { CANVAS_PAGE_HEIGHT, CANVAS_PAGE_WIDTH } from "./canvasStudioTypes";
import { clampPositionToA4Page } from "./canvasPageSnap";
import { CANVAS_PAGE_MARGIN, snapPositionToGrid, type CanvasAlignHorizontal } from "./canvasAlignTools";
import type { FreeLayoutPosition } from "./resumeFreeLayout";
import { clampSectionPosition, defaultSectionHeight, FREE_LAYOUT_MAX_WIDTH, FREE_LAYOUT_MIN_HEIGHT, snapToGrid, SNAP_GRID_SIZE, clampSectionHeight } from "./resumeFreeLayout";
import type { ResumeData } from "../types";
import {
  estimateContentAwareGap,
  estimateSectionHeightForContent,
  estimateSectionWidthForContent,
  fitSectionPositionToContent,
  pageInnerWidth,
  CANVAS_SECTION_MAX_HEIGHT,
} from "./canvasSectionContentSizing";

export interface PageLayoutContentContext {
  resumeData?: ResumeData;
  /** layersDoc.order — back-to-front z-order */
  layerOrder?: string[];
  /** Theme base font size scale (16px = 1) */
  themeFontScale?: number;
  /** Preserve compact / fill modes when reflowing a single-column stack */
  stackFillMode?: A4StackFillMode;
}

export interface PageLayoutOptions {
  margin?: number;
  gap?: number;
  pageWidth?: number;
  pageHeight?: number;
  resumeData?: ResumeData;
  layerOrder?: string[];
}

const DEFAULT_OPTS: Required<Omit<PageLayoutOptions, "resumeData">> = {
  margin: CANVAS_PAGE_MARGIN,
  gap: 16,
  pageWidth: CANVAS_PAGE_WIDTH,
  pageHeight: CANVAS_PAGE_HEIGHT,
  layerOrder: [],
};

export function resolveOpts(options?: PageLayoutOptions): Required<Omit<PageLayoutOptions, "resumeData">> & {
  resumeData?: ResumeData;
} {
  return { ...DEFAULT_OPTS, ...options };
}

function mergeLayoutOptions(
  options?: PageLayoutOptions,
  content?: PageLayoutContentContext,
): PageLayoutOptions | undefined {
  const resumeData = content?.resumeData ?? options?.resumeData;
  const layerOrder = content?.layerOrder ?? options?.layerOrder;
  if (!options && !resumeData && !layerOrder) return undefined;
  return { ...options, resumeData, layerOrder };
}

/** Panel top → bottom (matches CanvasLayerPanel visual order) */
export function sortSectionsByPanelOrder(sectionIds: string[], layerOrder: string[]): string[] {
  const panelOrder = [...layerOrder].reverse();
  const rank = new Map(panelOrder.map((id, index) => [id, index]));
  return [...sectionIds].sort((a, b) => {
    const ra = rank.get(a);
    const rb = rank.get(b);
    if (ra !== undefined && rb !== undefined) return ra - rb;
    if (ra !== undefined) return -1;
    if (rb !== undefined) return 1;
    return a.localeCompare(b);
  });
}

/** Section ids on a page — top → bottom by layer panel order when available */
export function sectionsOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  layerOrder?: string[],
): string[] {
  const onPage = sectionIds.filter((id) => getPageId(id) === pageId);
  if (layerOrder?.length) {
    return sortSectionsByPanelOrder(onPage, layerOrder);
  }
  return onPage.sort((a, b) => {
    const ya = positions[a]?.y ?? 0;
    const yb = positions[b]?.y ?? 0;
    if (ya !== yb) return ya - yb;
    return a.localeCompare(b);
  });
}

/** Pick the page that should receive layout tools — active page when it has sections, else the fullest page */
export function resolveLayoutTargetPageId(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pages: Array<{ id: string }>,
  activePageId: string,
  getPageId: (id: string) => string,
): string {
  if (sectionsOnPage(sectionIds, positions, activePageId, getPageId).length > 0) {
    return activePageId;
  }
  let bestPageId = activePageId;
  let bestCount = 0;
  for (const page of pages) {
    const count = sectionsOnPage(sectionIds, positions, page.id, getPageId).length;
    if (count > bestCount) {
      bestCount = count;
      bestPageId = page.id;
    }
  }
  return bestPageId;
}

/** Assign every section to a page when layout tools need a non-empty target page */
export function assignAllSectionsToPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
): Record<string, FreeLayoutPosition> {
  const patches: Record<string, FreeLayoutPosition> = {};
  for (const id of sectionIds) {
    const pos = positions[id];
    if (!pos) continue;
    if (pos.pageId === pageId) continue;
    patches[id] = { ...pos, pageId };
  }
  return patches;
}

function sectionLayoutSize(
  id: string,
  positions: Record<string, FreeLayoutPosition>,
  columnWidth: number,
  resumeData?: ResumeData,
): { width: number; height: number } {
  const width = snapToGrid(columnWidth, SNAP_GRID_SIZE);
  if (resumeData) {
    return {
      width,
      height: estimateSectionHeightForContent(id, resumeData, width),
    };
  }
  const current = positions[id];
  return {
    width,
    height: current?.height ?? defaultSectionHeight(id),
  };
}

/** Pick vertical gap that fits A4 printable area when possible */
function resolveStackGap(
  heights: number[],
  opts: ReturnType<typeof resolveOpts>,
  preferredGap?: number,
): number {
  if (heights.length <= 1) return preferredGap ?? opts.gap;
  const totalH = heights.reduce((a, b) => a + b, 0);
  const usable = opts.pageHeight - opts.margin * 2;
  let gap = preferredGap ?? (opts.resumeData ? estimateContentAwareGap(heights) : opts.gap);
  if (totalH + gap * (heights.length - 1) > usable) {
    gap = Math.floor((usable - totalH) / (heights.length - 1));
  } else if (opts.resumeData && totalH < usable * 0.88) {
    const fillGap = Math.floor((usable - totalH) / (heights.length - 1));
    gap = Math.min(48, Math.max(gap, fillGap));
  }
  return Math.max(8, gap);
}

/** A4 printable band (794×1123, 48px margins → 1027px usable height) */
export const A4_PRINTABLE_HEIGHT = CANVAS_PAGE_HEIGHT - CANVAS_PAGE_MARGIN * 2;
export const A4_MIN_SECTION_GAP = 8;

export type A4StackFillMode = "natural" | "fill-page" | "fill-page-exact" | "align-bottom" | "compact";

/** Tight vertical gap for compact stack layout */
export const A4_COMPACT_SECTION_GAP = 8;

function a4UsableHeight(opts: ReturnType<typeof resolveOpts>): number {
  return opts.pageHeight - opts.margin * 2;
}

/** Reflow vertical stack within A4 printable band */
function computeA4VerticalStack(
  orderedIds: string[],
  patches: Record<string, FreeLayoutPosition>,
  opts: ReturnType<typeof resolveOpts>,
  mode: A4StackFillMode,
  preferredGap?: number,
  startY?: number,
): Record<string, FreeLayoutPosition> {
  if (!orderedIds.length) return patches;

  const stackTop = startY ?? opts.margin;
  const next: Record<string, FreeLayoutPosition> = { ...patches };
  const heights = orderedIds.map((id) => next[id]?.height ?? 0);
  const totalH = heights.reduce((a, b) => a + b, 0);
  const usable = opts.pageHeight - stackTop - opts.margin;
  const count = orderedIds.length;

  let gap: number;
  const gaps: number[] = [];
  if (mode === "compact" && count > 1) {
    gap = snapToGrid(Math.max(A4_MIN_SECTION_GAP, preferredGap ?? opts.gap ?? A4_COMPACT_SECTION_GAP), SNAP_GRID_SIZE);
  } else if (mode === "fill-page-exact" && count > 1) {
    const slack = Math.max(0, usable - totalH);
    if (slack <= 0) {
      gap = A4_MIN_SECTION_GAP;
    } else {
      const base = Math.floor(slack / (count - 1));
      const remainder = slack - base * (count - 1);
      for (let i = 0; i < count - 1; i++) {
        gaps.push(Math.max(A4_MIN_SECTION_GAP, base + (i < remainder ? 1 : 0)));
      }
      gap = gaps[0] ?? A4_MIN_SECTION_GAP;
    }
  } else if (mode === "fill-page" && count > 1) {
    const slack = Math.max(0, usable - totalH);
    gap = slack <= 0 ? A4_MIN_SECTION_GAP : Math.max(A4_MIN_SECTION_GAP, Math.floor(slack / (count - 1)));
  } else if (mode === "align-bottom") {
    gap =
      count > 1
        ? snapToGrid(Math.max(A4_MIN_SECTION_GAP, preferredGap ?? estimateContentAwareGap(heights)), SNAP_GRID_SIZE)
        : 0;
  } else {
    gap = resolveStackGap(heights, opts, preferredGap);
    if (count > 1 && totalH + gap * (count - 1) > usable) {
      gap = Math.max(A4_MIN_SECTION_GAP, Math.floor((usable - totalH) / (count - 1)));
    }
  }

  let y: number;
  if (mode === "align-bottom") {
    let bottomY = opts.pageHeight - opts.margin;
    for (let i = count - 1; i >= 0; i--) {
      const id = orderedIds[i];
      const pos = next[id];
      if (!pos) continue;
      bottomY -= pos.height;
      next[id] = { ...pos, y: bottomY };
      if (i > 0) bottomY -= gap;
    }
    return next;
  }

  y = stackTop;

  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i];
    const pos = next[id];
    if (!pos) continue;
    next[id] = { ...pos, y };
    const stepGap = mode === "fill-page-exact" && gaps.length ? gaps[i] ?? gap : gap;
    y += pos.height + stepGap;
  }

  return next;
}

/** Cluster section x positions into columns (tolerant of grid snap / slight drift) */
function groupIdsByColumnX(
  patches: Record<string, FreeLayoutPosition>,
): Map<number, string[]> {
  const entries = Object.entries(patches);
  if (!entries.length) return new Map();

  const xs = [...new Set(entries.map(([, pos]) => pos.x))].sort((a, b) => a - b);
  const anchors: number[] = [];
  for (const x of xs) {
    if (anchors.some((anchor) => Math.abs(anchor - x) <= SNAP_GRID_SIZE * 2)) continue;
    anchors.push(x);
  }

  const byColumn = new Map<number, string[]>();
  for (const [id, pos] of entries) {
    let anchor = anchors[0];
    let best = Infinity;
    for (const candidate of anchors) {
      const dist = Math.abs(pos.x - candidate);
      if (dist < best) {
        best = dist;
        anchor = candidate;
      }
    }
    const bucket = byColumn.get(anchor) ?? [];
    bucket.push(id);
    byColumn.set(anchor, bucket);
  }
  return byColumn;
}

/** Width threshold above which a section counts as a full-width band spanning all columns */
const FULL_WIDTH_BAND_RATIO = 0.7;
const BAND_TO_COLUMN_GAP = 16;

/** Per-column A4 fill for multi-column layouts.
 * Full-width bands (e.g. header/summary spanning all columns) stack first at the top;
 * each column then flows below the last band instead of overlapping it. */
function fillColumnsToA4(
  patches: Record<string, FreeLayoutPosition>,
  opts: ReturnType<typeof resolveOpts>,
  mode: A4StackFillMode = "fill-page-exact",
): Record<string, FreeLayoutPosition> {
  const printableWidth = opts.pageWidth - opts.margin * 2;
  const bandIds: string[] = [];
  const columnPatches: Record<string, FreeLayoutPosition> = {};
  for (const [id, pos] of Object.entries(patches)) {
    if (pos.width >= printableWidth * FULL_WIDTH_BAND_RATIO) {
      bandIds.push(id);
    } else {
      columnPatches[id] = pos;
    }
  }

  let next = { ...patches };
  bandIds.sort((a, b) => (patches[a]?.y ?? 0) - (patches[b]?.y ?? 0));
  let bandBottom = opts.margin;
  for (const id of bandIds) {
    const pos = next[id];
    if (!pos) continue;
    next[id] = { ...pos, y: bandBottom };
    bandBottom += pos.height + A4_MIN_SECTION_GAP;
  }
  const columnStartY = bandIds.length ? bandBottom - A4_MIN_SECTION_GAP + BAND_TO_COLUMN_GAP : opts.margin;

  const byColumn = groupIdsByColumnX(columnPatches);
  for (const [columnX, ids] of byColumn.entries()) {
    // Reflow preserves the visual (y) order — layer order is z-depth, and
    // sorting by it vertically inverts the document (header ends up at the bottom).
    const ordered = [...ids].sort((a, b) => (patches[a]?.y ?? 0) - (patches[b]?.y ?? 0));
    for (const id of ordered) {
      const pos = next[id];
      if (pos) next[id] = { ...pos, x: columnX };
    }
    next = computeA4VerticalStack(ordered, next, opts, mode, undefined, columnStartY);
  }
  return next;
}

/** Reflow y positions within each column after height changes (preserves widths and column x) */
export function reflowPageColumnsNatural(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  content?: PageLayoutContentContext,
): Record<string, FreeLayoutPosition> {
  const opts = resolveOpts(mergeLayoutOptions(undefined, content));
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, opts.layerOrder);
  if (!onPage.length) return positions;

  const patches: Record<string, FreeLayoutPosition> = {};
  for (const id of onPage) {
    const pos = positions[id];
    if (pos) patches[id] = { ...pos, pageId };
  }

  const xs = onPage.map((id) => patches[id]?.x ?? opts.margin);
  const xSpread = xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
  const centers = onPage.map((id) => {
    const pos = patches[id];
    return pos ? pos.x + pos.width / 2 : opts.pageWidth / 2;
  });
  const centerSpread = centers.length ? Math.max(...centers) - Math.min(...centers) : 0;
  const isSingleColumnStack = xSpread <= SNAP_GRID_SIZE || centerSpread < 96;

  if (isSingleColumnStack) {
    const stackMode = content?.stackFillMode ?? "natural";
    const orderedByY = [...onPage].sort((a, b) => (patches[a]?.y ?? 0) - (patches[b]?.y ?? 0));
    const reflowed = computeA4VerticalStack(orderedByY, patches, opts, stackMode);
    return patchPositions(positions, reflowed);
  }

  const reflowed = fillColumnsToA4(patches, opts, "natural");
  return patchPositions(positions, reflowed);
}

function reflowPageStackAfterSizing(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  patches: Record<string, FreeLayoutPosition>,
  opts: ReturnType<typeof resolveOpts>,
  mode: A4StackFillMode,
): Record<string, FreeLayoutPosition> {
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, opts.layerOrder);
  const merged = { ...positions, ...patches };
  const stackPatches: Record<string, FreeLayoutPosition> = {};
  for (const id of onPage) {
    if (merged[id]) stackPatches[id] = merged[id];
  }
  const reflowed = computeA4VerticalStack(onPage, stackPatches, opts, mode);
  return patchPositions(positions, reflowed);
}

function innerPrintableWidth(opts: ReturnType<typeof resolveOpts>): number {
  return Math.min(opts.pageWidth - opts.margin * 2, FREE_LAYOUT_MAX_WIDTH);
}

function patchPositions(
  positions: Record<string, FreeLayoutPosition>,
  patches: Record<string, FreeLayoutPosition>,
): Record<string, FreeLayoutPosition> {
  const next: Record<string, FreeLayoutPosition> = {};
  for (const [id, pos] of Object.entries(patches)) {
    // Clamp horizontally only — pulling an overflowing stack back inside the
    // A4 band stacks the tail sections on top of each other. Vertical overflow
    // extends the draft sheet; export pagination splits it into pages.
    next[id] = clampSectionPosition({ ...positions[id], ...pos });
  }
  return next;
}

/** Single-column stack within page safe area */
export function stackSectionsVerticallyOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  options?: PageLayoutOptions,
): Record<string, FreeLayoutPosition> {
  const opts = resolveOpts(options);
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, opts.layerOrder);
  const width = innerPrintableWidth(opts);
  const sizes = onPage.map((id) => sectionLayoutSize(id, positions, width, opts.resumeData));
  const patches: Record<string, FreeLayoutPosition> = {};

  for (let i = 0; i < onPage.length; i++) {
    const id = onPage[i];
    const current = positions[id];
    if (!current) continue;
    const { width: w, height } = sizes[i];
    patches[id] = { ...current, pageId, x: opts.margin, y: opts.margin, width: w, height };
  }

  const mode: A4StackFillMode = opts.resumeData ? "fill-page-exact" : "natural";
  const reflowed = computeA4VerticalStack(onPage, patches, opts, mode, options?.gap);
  return patchPositions(positions, reflowed);
}

/** Spread sections within each column to fill A4 printable height */
function balanceColumnLayoutToA4(
  patches: Record<string, FreeLayoutPosition>,
  opts: ReturnType<typeof resolveOpts>,
  mode: A4StackFillMode = "fill-page-exact",
): Record<string, FreeLayoutPosition> {
  return fillColumnsToA4(patches, opts, mode);
}

/** Magazine-style two columns — follows layer panel order, fills shorter column next */
export function layoutTwoColumnsOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  options?: PageLayoutOptions,
): Record<string, FreeLayoutPosition> {
  const opts = resolveOpts(options);
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, opts.layerOrder);
  const colGap = snapToGrid(20, SNAP_GRID_SIZE);
  const inner = opts.pageWidth - opts.margin * 2;
  const leftW = snapToGrid(Math.floor((inner - colGap) / 2), SNAP_GRID_SIZE);
  const rightW = snapToGrid(inner - colGap - leftW, SNAP_GRID_SIZE);
  const leftX = opts.margin;
  const rightX = opts.margin + leftW + colGap;

  const planned: Array<{ id: string; useRight: boolean; width: number; height: number }> = [];
  const gap = resolveStackGap(
    onPage.map((id) => sectionLayoutSize(id, positions, leftW, opts.resumeData).height),
    opts,
  );
  let leftY = opts.margin;
  let rightY = opts.margin;

  for (const id of onPage) {
    const current = positions[id];
    if (!current) continue;
    const useRight = rightY <= leftY;
    const { width, height } = sectionLayoutSize(id, positions, useRight ? rightW : leftW, opts.resumeData);
    planned.push({ id, useRight, width, height });
    if (useRight) rightY += height + gap;
    else leftY += height + gap;
  }

  leftY = opts.margin;
  rightY = opts.margin;
  const patches: Record<string, FreeLayoutPosition> = {};

  for (const plan of planned) {
    const current = positions[plan.id];
    if (!current) continue;
    if (plan.useRight) {
      patches[plan.id] = {
        ...current,
        pageId,
        x: rightX,
        y: rightY,
        width: plan.width,
        height: plan.height,
      };
      rightY += plan.height + gap;
    } else {
      patches[plan.id] = {
        ...current,
        pageId,
        x: leftX,
        y: leftY,
        width: plan.width,
        height: plan.height,
      };
      leftY += plan.height + gap;
    }
  }

  return patchPositions(positions, balanceColumnLayoutToA4(patches, opts));
}

/** Narrow sidebar + main content — follows layer panel order */
export function layoutSidebarOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  options?: PageLayoutOptions,
): Record<string, FreeLayoutPosition> {
  const opts = resolveOpts(options);
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, opts.layerOrder);
  const railGap = snapToGrid(16, SNAP_GRID_SIZE);
  const sidebarW = snapToGrid(248, SNAP_GRID_SIZE);
  const mainW = snapToGrid(Math.min(innerPrintableWidth(opts) - sidebarW - railGap, FREE_LAYOUT_MAX_WIDTH), SNAP_GRID_SIZE);
  const leftX = opts.margin;
  const rightX = opts.margin + sidebarW + railGap;

  const planned: Array<{ id: string; useMain: boolean; width: number; height: number }> = [];
  const gap = resolveStackGap(
    onPage.map((id) => sectionLayoutSize(id, positions, sidebarW, opts.resumeData).height),
    opts,
  );
  let leftY = opts.margin;
  let rightY = opts.margin;

  for (const id of onPage) {
    const current = positions[id];
    if (!current) continue;
    const useMain = rightY <= leftY;
    const { width, height } = sectionLayoutSize(id, positions, useMain ? mainW : sidebarW, opts.resumeData);
    planned.push({ id, useMain, width, height });
    if (useMain) rightY += height + gap;
    else leftY += height + gap;
  }

  leftY = opts.margin;
  rightY = opts.margin;
  const patches: Record<string, FreeLayoutPosition> = {};

  for (const plan of planned) {
    const current = positions[plan.id];
    if (!current) continue;
    if (plan.useMain) {
      patches[plan.id] = {
        ...current,
        pageId,
        x: rightX,
        y: rightY,
        width: plan.width,
        height: plan.height,
      };
      rightY += plan.height + gap;
    } else {
      patches[plan.id] = {
        ...current,
        pageId,
        x: leftX,
        y: leftY,
        width: plan.width,
        height: plan.height,
      };
      leftY += plan.height + gap;
    }
  }

  return patchPositions(positions, balanceColumnLayoutToA4(patches, opts));
}

function sectionHeightForLayout(
  id: string,
  positions: Record<string, FreeLayoutPosition>,
  resumeData?: ResumeData,
  width?: number,
): number {
  const current = positions[id];
  const w = width ?? current?.width ?? pageInnerWidth();
  if (resumeData) {
    return estimateSectionHeightForContent(id, resumeData, w);
  }
  return current?.height ?? defaultSectionHeight(id);
}

function fitHeightsToContentOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  resumeData: ResumeData,
  content?: PageLayoutContentContext,
): Record<string, FreeLayoutPosition> {
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, content?.layerOrder);
  const patches: Record<string, FreeLayoutPosition> = {};
  for (const id of onPage) {
    const current = positions[id];
    if (!current) continue;
    const height = estimateSectionHeightForContent(id, resumeData, current.width);
    patches[id] = { ...current, pageId, height };
  }
  const fitted = patchPositions(positions, patches);
  return reflowStackOnPage(sectionIds, fitted, pageId, getPageId, "fill-page-exact", { resumeData, layerOrder: content?.layerOrder });
}

function fitWidthsToContentOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  resumeData: ResumeData,
  referenceId?: string,
  content?: PageLayoutContentContext,
): Record<string, FreeLayoutPosition> {
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, content?.layerOrder);
  if (!onPage.length) return {};

  const inner = pageInnerWidth();
  const patches: Record<string, FreeLayoutPosition> = {};

  if (referenceId && positions[referenceId]) {
    const ref = positions[referenceId];
    const targetW = snapToGrid(
      estimateSectionWidthForContent(referenceId, resumeData, inner, ref.x),
      SNAP_GRID_SIZE,
    );
    for (const id of onPage) {
      const current = positions[id];
      if (!current) continue;
      const height = estimateSectionHeightForContent(id, resumeData, targetW);
      patches[id] = clampPositionToA4Page({ ...current, pageId, width: targetW, height });
    }
  } else {
    for (const id of onPage) {
      const current = positions[id];
      if (!current) continue;
      patches[id] = clampPositionToA4Page(
        fitSectionPositionToContent(id, { ...current, pageId }, resumeData),
      );
    }
  }
  const fitted = patchPositions(positions, patches);
  return reflowStackOnPage(sectionIds, fitted, pageId, getPageId, "fill-page-exact", { resumeData, layerOrder: content?.layerOrder });
}

/** Fit each section on page to its own content width and height */
export function fitSectionsToContentOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  resumeData: ResumeData,
): Record<string, FreeLayoutPosition> {
  return fitWidthsToContentOnPage(sectionIds, positions, pageId, getPageId, resumeData);
}

export function fitSectionsToContentAllPages(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageIds: string[],
  getPageId: (id: string) => string,
  resumeData: ResumeData,
): Record<string, FreeLayoutPosition> {
  let next = positions;
  for (const pageId of pageIds) {
    next = fitSectionsToContentOnPage(sectionIds, next, pageId, getPageId, resumeData);
  }
  return next;
}

/** Sync each section's width/height to content, optionally reflow y within current column layout */
export function syncSectionSizesToContentAllPages(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageIds: string[],
  getPageId: (id: string) => string,
  content?: PageLayoutContentContext,
  options?: { reflow?: boolean; resizeWidth?: boolean },
): Record<string, FreeLayoutPosition> {
  if (!content?.resumeData) return positions;

  const opts = resolveOpts(mergeLayoutOptions(undefined, content));
  const inner = innerPrintableWidth(opts);
  const resizeWidth = options?.resizeWidth !== false;
  const themeScale = content.themeFontScale && content.themeFontScale > 0 ? content.themeFontScale : 1;
  let next = positions;

  for (const pageId of pageIds) {
    const onPage = sectionsOnPage(sectionIds, next, pageId, getPageId, opts.layerOrder);
    const patches: Record<string, FreeLayoutPosition> = {};
    for (const id of onPage) {
      const current = next[id];
      if (!current) continue;
      const width = resizeWidth
        ? estimateSectionWidthForContent(id, content.resumeData, inner, current.x)
        : current.width;
      let height = estimateSectionHeightForContent(id, content.resumeData, width);
      if (themeScale !== 1) {
        height = snapToGrid(
          clampSectionHeight(Math.round(height * themeScale), CANVAS_SECTION_MAX_HEIGHT),
          SNAP_GRID_SIZE,
        );
      }
      patches[id] = clampPositionToA4Page({ ...current, pageId, width, height });
    }
    next = patchPositions(next, patches);
    if (options?.reflow !== false) {
      next = reflowStackOnPage(sectionIds, next, pageId, getPageId, "fill-page-exact", content);
    }
  }

  return next;
}

/** Height-only sync — preserves manual widths and x/y positions */
export function syncSectionHeightsToContentAllPages(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageIds: string[],
  getPageId: (id: string) => string,
  content?: PageLayoutContentContext,
): Record<string, FreeLayoutPosition> {
  return syncSectionSizesToContentAllPages(sectionIds, positions, pageIds, getPageId, content, {
    reflow: false,
    resizeWidth: false,
  });
}

/** @deprecated Use A4 fill-page reflow — kept for legacy imports */
export const DISTRIBUTE_MAX_GAP = 20;

function reflowStackOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  mode: A4StackFillMode,
  content?: PageLayoutContentContext,
): Record<string, FreeLayoutPosition> {
  const opts = resolveOpts(mergeLayoutOptions(undefined, content));
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, opts.layerOrder);
  if (!onPage.length) return positions;

  const stackPatches: Record<string, FreeLayoutPosition> = {};
  for (const id of onPage) {
    const pos = positions[id];
    if (pos) stackPatches[id] = { ...pos, pageId };
  }

  const xs = new Set(onPage.map((id) => stackPatches[id]?.x ?? opts.margin));
  const reflowed =
    xs.size > 1
      ? fillColumnsToA4(stackPatches, opts, mode)
      : computeA4VerticalStack(onPage, stackPatches, opts, mode);
  return patchPositions(positions, reflowed);
}

/** Equal vertical gaps — fills A4 printable height (1027px) */
export function distributeVerticalOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  options?: PageLayoutOptions,
  content?: PageLayoutContentContext,
): Record<string, FreeLayoutPosition> {
  const opts = resolveOpts(mergeLayoutOptions(options, content));
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, opts.layerOrder);
  if (onPage.length <= 1) return {};

  const patches: Record<string, FreeLayoutPosition> = {};
  for (const id of onPage) {
    const current = positions[id];
    if (!current) continue;
    const height = sectionHeightForLayout(id, positions, content?.resumeData, current.width);
    patches[id] = { ...current, pageId, height };
  }

  const xs = new Set(onPage.map((id) => patches[id]?.x ?? opts.margin));
  const reflowed =
    xs.size > 1
      ? fillColumnsToA4(patches, opts, "fill-page")
      : computeA4VerticalStack(onPage, patches, opts, "fill-page");
  return patchPositions(positions, reflowed);
}

/** Fill entire A4 printable band — content-aware sizes + exact vertical fill */
export function fillPageHeightOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  content?: PageLayoutContentContext,
): Record<string, FreeLayoutPosition> {
  const opts = resolveOpts(mergeLayoutOptions(undefined, content));
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, opts.layerOrder);
  if (!onPage.length) return {};

  const inner = innerPrintableWidth(opts);
  const patches: Record<string, FreeLayoutPosition> = {};
  for (const id of onPage) {
    const current = positions[id];
    if (!current) continue;
    if (opts.resumeData) {
      const colW = current.width <= inner ? current.width : inner;
      const { width, height } = sectionLayoutSize(id, positions, colW, opts.resumeData);
      patches[id] = { ...current, pageId, width, height };
    } else {
      patches[id] = { ...current, pageId };
    }
  }

  const xs = new Set(onPage.map((id) => patches[id]?.x ?? opts.margin));
  const reflowed =
    xs.size > 1
      ? fillColumnsToA4(patches, opts, "fill-page-exact")
      : computeA4VerticalStack(onPage, patches, opts, "fill-page-exact");
  return patchPositions(positions, reflowed);
}

/** Align stack to printable page bottom — last section sits on lower safe edge */
export function alignPageBottomOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  content?: PageLayoutContentContext,
): Record<string, FreeLayoutPosition> {
  return reflowStackOnPage(sectionIds, positions, pageId, getPageId, "align-bottom", content);
}

/** Match all sections on page to content-optimal unified width */
export function equalizeWidthsOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  referenceId?: string,
  content?: PageLayoutContentContext,
): Record<string, FreeLayoutPosition> {
  if (content?.resumeData) {
    return fitWidthsToContentOnPage(sectionIds, positions, pageId, getPageId, content.resumeData, referenceId, content);
  }

  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, content?.layerOrder);
  if (!onPage.length) return {};

  let targetW = referenceId && positions[referenceId] ? positions[referenceId].width : 0;
  if (!targetW) {
    targetW = Math.max(...onPage.map((id) => positions[id]?.width ?? 0));
  }

  const patches: Record<string, FreeLayoutPosition> = {};
  for (const id of onPage) {
    const current = positions[id];
    if (!current) continue;
    patches[id] = clampPositionToA4Page({ ...current, pageId, width: targetW });
  }
  const fitted = patchPositions(positions, patches);
  return reflowStackOnPage(sectionIds, fitted, pageId, getPageId, "fill-page-exact", content);
}

/** Align all sections to printable safe zone (margin + full inner width) */
export function snapAllToSafeZoneOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  options?: PageLayoutOptions,
): Record<string, FreeLayoutPosition> {
  const opts = resolveOpts(options);
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, opts.layerOrder);
  const width = Math.min(opts.pageWidth - opts.margin * 2, FREE_LAYOUT_MAX_WIDTH);
  const patches: Record<string, FreeLayoutPosition> = {};

  for (const id of onPage) {
    const current = positions[id];
    if (!current) continue;
    patches[id] = clampPositionToA4Page({
      ...current,
      pageId,
      x: opts.margin,
      width,
    });
  }

  return patchPositions(positions, patches);
}

/** Compact stack with tighter gap for dense layouts */
export function stackCompactOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  options?: PageLayoutOptions,
): Record<string, FreeLayoutPosition> {
  const opts = resolveOpts({
    ...options,
    gap: A4_COMPACT_SECTION_GAP,
    margin: CANVAS_PAGE_MARGIN,
  });
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, opts.layerOrder);
  const width = innerPrintableWidth(opts);
  const sizes = onPage.map((id) => sectionLayoutSize(id, positions, width, opts.resumeData));
  const patches: Record<string, FreeLayoutPosition> = {};

  for (let i = 0; i < onPage.length; i++) {
    const id = onPage[i];
    const current = positions[id];
    if (!current) continue;
    const { width: w, height } = sizes[i];
    patches[id] = { ...current, pageId, x: opts.margin, y: opts.margin, width: w, height };
  }

  const reflowed = computeA4VerticalStack(onPage, patches, opts, "compact", A4_COMPACT_SECTION_GAP);
  return patchPositions(positions, reflowed);
}

/** Centered single column (classic resume) */
export function stackCenteredOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  options?: PageLayoutOptions,
): Record<string, FreeLayoutPosition> {
  const opts = resolveOpts({ gap: 14, ...options });
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, opts.layerOrder);
  const inner = innerPrintableWidth(opts);
  const defaultWidth = snapToGrid(Math.min(594, inner), SNAP_GRID_SIZE);
  const sizes = onPage.map((id) => {
    if (opts.resumeData) {
      const contentW = estimateSectionWidthForContent(id, opts.resumeData, inner, opts.margin);
      const width = snapToGrid(Math.min(defaultWidth, contentW, inner), SNAP_GRID_SIZE);
      return sectionLayoutSize(id, positions, width, opts.resumeData);
    }
    return sectionLayoutSize(id, positions, defaultWidth, undefined);
  });
  const gap = resolveStackGap(
    sizes.map((s) => s.height),
    opts,
    14,
  );
  let y = opts.margin;
  const patches: Record<string, FreeLayoutPosition> = {};

  for (let i = 0; i < onPage.length; i++) {
    const id = onPage[i];
    const current = positions[id];
    if (!current) continue;
    const { width, height } = sizes[i];
    const x = snapToGrid(Math.round((opts.pageWidth - width) / 2), SNAP_GRID_SIZE);
    patches[id] = { ...current, pageId, x, y, width, height };
    y += height + gap;
  }

  return patchPositions(positions, patches);
}

/** Align every section on page to same horizontal edge */
export function alignAllHorizontalOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  horizontal: CanvasAlignHorizontal,
  pageWidth = CANVAS_PAGE_WIDTH,
): Record<string, FreeLayoutPosition> {
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId);
  const patches: Record<string, FreeLayoutPosition> = {};
  for (const id of onPage) {
    const current = positions[id];
    if (!current) continue;
    let x = current.x;
    if (horizontal === "left") x = CANVAS_PAGE_MARGIN;
    else if (horizontal === "center") x = Math.round((pageWidth - current.width) / 2);
    else if (horizontal === "right") x = pageWidth - CANVAS_PAGE_MARGIN - current.width;
    patches[id] = { ...current, pageId, x };
  }
  return patchPositions(positions, patches);
}

/** Fit each section height to its content (字數) at current width */
export function equalizeHeightsOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  referenceId?: string,
  content?: PageLayoutContentContext,
): Record<string, FreeLayoutPosition> {
  if (content?.resumeData) {
    return fitHeightsToContentOnPage(sectionIds, positions, pageId, getPageId, content.resumeData, content);
  }

  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, content?.layerOrder);
  if (!onPage.length) return {};
  let targetH = referenceId && positions[referenceId] ? positions[referenceId].height : 0;
  if (!targetH) {
    targetH = Math.max(...onPage.map((id) => positions[id]?.height ?? 0));
  }
  const patches: Record<string, FreeLayoutPosition> = {};
  for (const id of onPage) {
    const current = positions[id];
    if (!current) continue;
    patches[id] = { ...current, pageId, height: targetH };
  }
  const fitted = patchPositions(positions, patches);
  return reflowStackOnPage(sectionIds, fitted, pageId, getPageId, "fill-page-exact", content);
}

/** Mirror section positions horizontally across page center */
export function mirrorColumnsOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  pageWidth = CANVAS_PAGE_WIDTH,
): Record<string, FreeLayoutPosition> {
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId);
  const patches: Record<string, FreeLayoutPosition> = {};
  for (const id of onPage) {
    const current = positions[id];
    if (!current) continue;
    const x = pageWidth - current.x - current.width;
    patches[id] = { ...current, pageId, x };
  }
  return patchPositions(positions, patches);
}

/** Snap all sections on page to 24px grid */
export function snapAllToGridOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
): Record<string, FreeLayoutPosition> {
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId);
  const patches: Record<string, FreeLayoutPosition> = {};
  for (const id of onPage) {
    const current = positions[id];
    if (!current) continue;
    patches[id] = snapPositionToGrid({ ...current, pageId });
  }
  return patchPositions(positions, patches);
}

/** Three equal columns — follows layer panel order into shortest column */
export function layoutThreeColumnsOnPage(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  options?: PageLayoutOptions,
): Record<string, FreeLayoutPosition> {
  const opts = resolveOpts(options);
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, opts.layerOrder);
  const colGap = snapToGrid(12, SNAP_GRID_SIZE);
  const inner = opts.pageWidth - opts.margin * 2 - colGap * 2;
  const colW = snapToGrid(Math.floor(inner / 3), SNAP_GRID_SIZE);
  const cols = [
    opts.margin,
    opts.margin + colW + colGap,
    opts.margin + (colW + colGap) * 2,
  ];
  const planned: Array<{ id: string; col: number; width: number; height: number }> = [];
  const colY = [opts.margin, opts.margin, opts.margin];

  for (const id of onPage) {
    const current = positions[id];
    if (!current) continue;
    let col = 0;
    if (colY[1] < colY[col]) col = 1;
    if (colY[2] < colY[col]) col = 2;
    const { width, height } = sectionLayoutSize(id, positions, colW, opts.resumeData);
    planned.push({ id, col, width, height });
    colY[col] += height;
  }

  const gap = resolveStackGap(
    planned.map((p) => p.height),
    opts,
  );
  colY[0] = opts.margin;
  colY[1] = opts.margin;
  colY[2] = opts.margin;
  const patches: Record<string, FreeLayoutPosition> = {};

  for (const plan of planned) {
    const current = positions[plan.id];
    if (!current) continue;
    patches[plan.id] = {
      ...current,
      pageId,
      x: cols[plan.col],
      y: colY[plan.col],
      width: plan.width,
      height: plan.height,
    };
    colY[plan.col] += plan.height + gap;
  }

  return patchPositions(positions, balanceColumnLayoutToA4(patches, opts));
}

/** Shrink tallest sections and reflow until the page fits A4 printable height */
export function compressStackToFitA4Page(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  content?: PageLayoutContentContext,
): Record<string, FreeLayoutPosition> {
  const limit = CANVAS_PAGE_HEIGHT - CANVAS_PAGE_MARGIN;
  let current = { ...positions, ...reflowPageColumnsNatural(sectionIds, positions, pageId, getPageId, content) };

  for (let iter = 0; iter < 12; iter++) {
    const onPage = sectionsOnPage(sectionIds, current, pageId, getPageId, content?.layerOrder);
    if (!onPage.length) return current;

    const bottom = Math.max(
      ...onPage.map((id) => {
        const pos = current[id];
        return pos ? pos.y + pos.height : 0;
      }),
    );
    if (bottom <= limit) return current;

    const tallest = onPage.reduce((best, id) => {
      const height = current[id]?.height ?? 0;
      const bestHeight = current[best]?.height ?? 0;
      return height > bestHeight ? id : best;
    }, onPage[0]!);

    const pos = current[tallest];
    if (!pos) return current;

    const trim = Math.min(
      pos.height - FREE_LAYOUT_MIN_HEIGHT,
      snapToGrid(bottom - limit + SNAP_GRID_SIZE, SNAP_GRID_SIZE),
    );
    if (trim <= 0) return current;

    const patches: Record<string, FreeLayoutPosition> = {
      [tallest]: {
        ...pos,
        height: snapToGrid(clampSectionHeight(pos.height - trim), SNAP_GRID_SIZE),
      },
    };
    current = { ...current, ...patchPositions(current, patches) };
    current = { ...current, ...reflowPageColumnsNatural(sectionIds, current, pageId, getPageId, content) };
  }

  return current;
}

export type CanvasPageLayoutAction =
  | "stack"
  | "stack-center"
  | "stack-compact"
  | "two-column"
  | "three-column"
  | "sidebar"
  | "distribute"
  | "fill-page-height"
  | "align-page-bottom"
  | "equalize-width"
  | "equalize-height"
  | "page-align-left"
  | "page-align-center"
  | "page-align-right"
  | "mirror-columns"
  | "snap-grid"
  | "safe-zone";

export function applyPageLayoutAction(
  action: CanvasPageLayoutAction,
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageId: string,
  getPageId: (id: string) => string,
  referenceId?: string,
  content?: PageLayoutContentContext,
): Record<string, FreeLayoutPosition> {
  const layoutOpts = mergeLayoutOptions(undefined, content);
  switch (action) {
    case "stack":
      return stackSectionsVerticallyOnPage(sectionIds, positions, pageId, getPageId, layoutOpts);
    case "stack-center":
      return stackCenteredOnPage(sectionIds, positions, pageId, getPageId, layoutOpts);
    case "stack-compact":
      return stackCompactOnPage(sectionIds, positions, pageId, getPageId, layoutOpts);
    case "two-column":
      return layoutTwoColumnsOnPage(sectionIds, positions, pageId, getPageId, layoutOpts);
    case "three-column":
      return layoutThreeColumnsOnPage(sectionIds, positions, pageId, getPageId, layoutOpts);
    case "sidebar":
      return layoutSidebarOnPage(sectionIds, positions, pageId, getPageId, layoutOpts);
    case "distribute":
      return distributeVerticalOnPage(sectionIds, positions, pageId, getPageId, undefined, content);
    case "fill-page-height":
      return fillPageHeightOnPage(sectionIds, positions, pageId, getPageId, content);
    case "align-page-bottom":
      return alignPageBottomOnPage(sectionIds, positions, pageId, getPageId, content);
    case "equalize-width":
      return equalizeWidthsOnPage(sectionIds, positions, pageId, getPageId, referenceId, content);
    case "equalize-height":
      return equalizeHeightsOnPage(sectionIds, positions, pageId, getPageId, referenceId, content);
    case "page-align-left":
      return alignAllHorizontalOnPage(sectionIds, positions, pageId, getPageId, "left");
    case "page-align-center":
      return alignAllHorizontalOnPage(sectionIds, positions, pageId, getPageId, "center");
    case "page-align-right":
      return alignAllHorizontalOnPage(sectionIds, positions, pageId, getPageId, "right");
    case "mirror-columns":
      return mirrorColumnsOnPage(sectionIds, positions, pageId, getPageId);
    case "snap-grid":
      return snapAllToGridOnPage(sectionIds, positions, pageId, getPageId);
    case "safe-zone":
      return snapAllToSafeZoneOnPage(sectionIds, positions, pageId, getPageId);
    default:
      return {};
  }
}

/** Map layout toolbar action → single-column stack fill mode for reflow */
export function stackFillModeForLayoutAction(action: CanvasPageLayoutAction): A4StackFillMode | undefined {
  switch (action) {
    case "stack-compact":
      return "compact";
    case "stack":
      return "fill-page-exact";
    case "stack-center":
      return "natural";
    case "align-page-bottom":
      return "align-bottom";
    default:
      return undefined;
  }
}

/** Layout actions that already compute final geometry — skip column reflow */
export function shouldSkipColumnReflowAfterLayout(action: CanvasPageLayoutAction): boolean {
  return (
    action === "stack" ||
    action === "stack-center" ||
    action === "stack-compact" ||
    action === "two-column" ||
    action === "three-column" ||
    action === "sidebar" ||
    action === "distribute" ||
    action === "fill-page-height" ||
    action === "align-page-bottom" ||
    action === "page-align-left" ||
    action === "page-align-center" ||
    action === "page-align-right" ||
    action === "snap-grid" ||
    action === "safe-zone" ||
    action === "mirror-columns"
  );
}

/** Apply a structural layout to every page and merge patches (A4-aware) */
export function applyA4AutoLayoutAllPages(
  action: Extract<CanvasPageLayoutAction, "stack" | "stack-center" | "stack-compact" | "two-column" | "three-column" | "sidebar">,
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageIds: string[],
  getPageId: (id: string) => string,
  content?: PageLayoutContentContext,
): Record<string, FreeLayoutPosition> {
  let current = positions;
  const merged: Record<string, FreeLayoutPosition> = {};
  for (const pageId of pageIds) {
    const patches = applyPageLayoutAction(action, sectionIds, current, pageId, getPageId, undefined, content);
    Object.assign(merged, patches);
    current = { ...current, ...patches };
  }
  return merged;
}
