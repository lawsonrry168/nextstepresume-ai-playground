import type { ResumeData } from "../types";
import type { FreeLayoutPosition } from "./resumeFreeLayout";
import {
  clampSectionHeight,
  clampSectionWidth,
  defaultSectionHeight,
  snapToGrid,
  SNAP_GRID_SIZE,
} from "./resumeFreeLayout";
import { estimateSectionHeightForContent } from "./canvasSectionContentSizing";
import { CANVAS_PAGE_HEIGHT, CANVAS_PAGE_WIDTH } from "./canvasStudioTypes";
import { clampPositionToA4Page } from "./canvasPageSnap";
import { CANVAS_PAGE_MARGIN } from "./canvasAlignTools";
import {
  reflowPageColumnsNatural,
  sectionsOnPage,
  type PageLayoutContentContext,
} from "./canvasLayoutTools";

/** Build print-ready positions: content-fitted heights unless manually locked. */
export function buildExportLayoutPositions(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  resumeData: ResumeData,
  manualSizedSections?: ReadonlySet<string>,
): Record<string, FreeLayoutPosition> {
  return buildPrintReadyExportLayout(sectionIds, positions, resumeData, { manualSizedSections }).positions;
}

export const EXPORT_SURFACE_ROOT_ID = "resume-export-surface";
export const EXPORT_SURFACE_HOST_ID = "resume-export-surface-host";
export const EXPORT_STATIC_ATTR = "data-export-static";

const EXPORT_PAGE_PREFIX = "export-page-";

export interface PrintExportPlan {
  positions: Record<string, FreeLayoutPosition>;
  pageIds: string[];
}

export interface PrintExportOptions {
  manualSizedSections?: ReadonlySet<string>;
  layerOrder?: string[];
  themeFontScale?: number;
  studioPages?: Array<{ id: string }>;
  studioSectionPageMap?: Record<string, string>;
  /** Keep editor x/y — only fit heights and paginate overflow (free-layout WYSIWYG) */
  preservePlacements?: boolean;
}

export function sectionPageBottom(pos: FreeLayoutPosition): number {
  return pos.y + pos.height;
}

export function sectionOverflowsPrintPage(
  pos: FreeLayoutPosition,
  pageHeight = CANVAS_PAGE_HEIGHT,
  margin = CANVAS_PAGE_MARGIN,
): boolean {
  return sectionPageBottom(pos) > pageHeight - margin;
}

function createExportPageId(index: number): string {
  return `${EXPORT_PAGE_PREFIX}${index + 1}`;
}

function fitSectionHeightForExport(
  sectionId: string,
  pos: FreeLayoutPosition,
  resumeData: ResumeData,
  themeFontScale: number,
): number {
  let height = estimateSectionHeightForContent(sectionId, resumeData, pos.width);
  if (themeFontScale !== 1) {
    height = Math.round(height * themeFontScale);
  }
  return snapToGrid(clampSectionHeight(height), SNAP_GRID_SIZE);
}

function studioUsesMultiplePages(
  sectionIds: string[],
  studioPages: Array<{ id: string }>,
  studioSectionPageMap: Record<string, string>,
  positions: Record<string, FreeLayoutPosition>,
): boolean {
  if (studioPages.length <= 1) return false;
  const primary = studioPages[0]!.id;
  return sectionIds.some((id) => {
    const pid = studioSectionPageMap[id] ?? positions[id]?.pageId;
    return pid && pid !== primary;
  });
}

const PRESERVE_PAGE_GAP = 12;

/** Move overflowing sections to the next page without reflowing column stacks */
function paginatePreservePlacements(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageIds: string[],
  content: PageLayoutContentContext,
): { positions: Record<string, FreeLayoutPosition>; pageIds: string[] } {
  let current = { ...positions };
  let pages = [...pageIds];
  const maxBottom = CANVAS_PAGE_HEIGHT - CANVAS_PAGE_MARGIN;
  const maxIterations = Math.max(4, sectionIds.length * 4);

  for (let iter = 0; iter < maxIterations; iter++) {
    let moved = false;
    const getPageId = (id: string) => current[id]?.pageId ?? pages[0]!;

    for (const pageId of [...pages]) {
      const onPage = sectionsOnPage(sectionIds, current, pageId, getPageId, content.layerOrder);
      const sorted = [...onPage].sort(
        (a, b) =>
          sectionPageBottom(current[b] ?? { x: 0, y: 0, width: 0, height: 0 }) -
          sectionPageBottom(current[a] ?? { x: 0, y: 0, width: 0, height: 0 }),
      );

      for (const id of sorted) {
        const pos = current[id];
        if (!pos || pos.y + pos.height <= maxBottom) continue;

        const pageIndex = pages.indexOf(pageId);
        let targetPageId = pages[pageIndex + 1];
        if (!targetPageId) {
          targetPageId = createExportPageId(pages.length);
          pages.push(targetPageId);
        }

        const onTarget = sectionsOnPage(sectionIds, current, targetPageId, getPageId, content.layerOrder).filter(
          (sid) => {
            if (sid === id) return false;
            const peer = current[sid];
            return peer ? Math.abs(peer.x - pos.x) <= SNAP_GRID_SIZE * 2 : false;
          },
        );

        let nextY = CANVAS_PAGE_MARGIN;
        for (const sid of onTarget) {
          const peer = current[sid];
          if (peer) nextY = Math.max(nextY, peer.y + peer.height + PRESERVE_PAGE_GAP);
        }

        current[id] = clampPositionToA4Page({
          ...pos,
          pageId: targetPageId,
          y: nextY,
        });
        moved = true;
      }
    }

    if (!moved) break;
  }

  const getPageId = (id: string) => current[id]?.pageId ?? pages[0]!;
  const usedPages = pages.filter(
    (pid) => sectionsOnPage(sectionIds, current, pid, getPageId, content.layerOrder).length > 0,
  );

  return { positions: current, pageIds: usedPages.length ? usedPages : [pages[0]!] };
}

function paginateExportOverflow(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageIds: string[],
  content: PageLayoutContentContext,
): { positions: Record<string, FreeLayoutPosition>; pageIds: string[] } {
  let current = { ...positions };
  let pages = [...pageIds];
  const maxIterations = Math.max(4, sectionIds.length * 4);

  for (let iter = 0; iter < maxIterations; iter++) {
    let moved = false;
    const getPageId = (id: string) => current[id]?.pageId ?? pages[0]!;

    for (const pageId of [...pages]) {
      const onPage = sectionsOnPage(sectionIds, current, pageId, getPageId, content.layerOrder);
      const sorted = [...onPage].sort((a, b) => {
        const posA = current[a];
        const posB = current[b];
        return sectionPageBottom(posB ?? { x: 0, y: 0, width: 0, height: 0 }) -
          sectionPageBottom(posA ?? { x: 0, y: 0, width: 0, height: 0 });
      });

      for (const id of sorted) {
        const pos = current[id];
        if (!pos || !sectionOverflowsPrintPage(pos)) continue;

        const pageIndex = pages.indexOf(pageId);
        let targetPageId = pages[pageIndex + 1];
        if (!targetPageId) {
          targetPageId = createExportPageId(pages.length);
          pages.push(targetPageId);
        }

        current[id] = clampPositionToA4Page({
          ...pos,
          pageId: targetPageId,
          y: CANVAS_PAGE_MARGIN,
        });
        moved = true;
      }
    }

    if (!moved) break;

    const getPageIdAfterMove = (id: string) => current[id]?.pageId ?? pages[0]!;
    for (const pageId of pages) {
      current = { ...current, ...reflowPageColumnsNatural(sectionIds, current, pageId, getPageIdAfterMove, content) };
    }
  }

  const getPageId = (id: string) => current[id]?.pageId ?? pages[0]!;
  const usedPages = pages.filter(
    (pid) => sectionsOnPage(sectionIds, current, pid, getPageId, content.layerOrder).length > 0,
  );

  return { positions: current, pageIds: usedPages.length ? usedPages : [pages[0]!] };
}

/**
 * Print-ready layout: content heights, A4 reflow, auto-pagination when a page overflows.
 * Respects explicit multi-page studio assignments when sections span multiple studio pages.
 */
export function buildPrintReadyExportLayout(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  resumeData: ResumeData,
  options?: PrintExportOptions,
): PrintExportPlan {
  const content: PageLayoutContentContext = {
    resumeData,
    layerOrder: options?.layerOrder,
    themeFontScale: options?.themeFontScale ?? 1,
  };
  const themeFontScale = options?.themeFontScale ?? 1;
  const studioPages = options?.studioPages ?? [];
  const studioMap = options?.studioSectionPageMap ?? {};
  const useStudioPages = studioUsesMultiplePages(sectionIds, studioPages, studioMap, positions);

  let pageIds: string[] = useStudioPages ? studioPages.map((p) => p.id) : [createExportPageId(0)];
  const current: Record<string, FreeLayoutPosition> = {};

  for (const id of sectionIds) {
    const pos = positions[id];
    if (!pos) continue;
    const pageId = useStudioPages
      ? studioMap[id] ?? pos.pageId ?? studioPages[0]!.id
      : pageIds[0]!;
    current[id] = { ...pos, pageId };
  }

  for (const id of sectionIds) {
    if (options?.manualSizedSections?.has(id)) continue;
    const pos = current[id];
    if (!pos) continue;
    current[id] = clampPositionToA4Page({
      ...pos,
      height: fitSectionHeightForExport(id, pos, resumeData, themeFontScale),
    });
  }

  let laid = { ...current };
  const getPageId = (id: string) => laid[id]?.pageId ?? pageIds[0]!;
  const preservePlacements = options?.preservePlacements === true;

  if (!preservePlacements) {
    for (const pageId of pageIds) {
      laid = { ...laid, ...reflowPageColumnsNatural(sectionIds, laid, pageId, getPageId, content) };
    }
  }

  if (!useStudioPages) {
    const paginated = preservePlacements
      ? paginatePreservePlacements(sectionIds, laid, pageIds, content)
      : paginateExportOverflow(sectionIds, laid, pageIds, content);
    laid = paginated.positions;
    pageIds = paginated.pageIds;
  } else {
    pageIds = pageIds.filter(
      (pid) => sectionsOnPage(sectionIds, laid, pid, (id) => laid[id]?.pageId ?? pid, content.layerOrder).length > 0,
    );
    if (!preservePlacements) {
      for (const pageId of pageIds) {
        laid = { ...laid, ...reflowPageColumnsNatural(sectionIds, laid, pageId, (id) => laid[id]?.pageId ?? pageId, content) };
      }
    }
  }

  return { positions: laid, pageIds: pageIds.length ? pageIds : [createExportPageId(0)] };
}

/** Clamp every section bottom to the printable A4 band (export safety net). */
export function clampExportPositionsToPrintablePage(
  positions: Record<string, FreeLayoutPosition>,
): Record<string, FreeLayoutPosition> {
  const next: Record<string, FreeLayoutPosition> = {};
  const maxBottom = CANVAS_PAGE_HEIGHT - CANVAS_PAGE_MARGIN;

  for (const [id, pos] of Object.entries(positions)) {
    let { y, height, width, x } = pos;
    width = clampSectionWidth(width, x, CANVAS_PAGE_WIDTH);
    if (y + height > maxBottom) {
      height = Math.max(defaultSectionHeight(id), maxBottom - y);
      height = snapToGrid(clampSectionHeight(height), SNAP_GRID_SIZE);
    }
    next[id] = clampPositionToA4Page({ ...pos, x, y, width, height });
  }
  return next;
}
