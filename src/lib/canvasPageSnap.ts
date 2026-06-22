import { CANVAS_PAGE_EDGE_SNAP, CANVAS_PAGE_HEIGHT, CANVAS_PAGE_WIDTH } from "./canvasStudioTypes";
import type { FreeLayoutPosition } from "./resumeFreeLayout";
import { FREE_LAYOUT_MIN_HEIGHT, FREE_LAYOUT_MIN_WIDTH, FREE_LAYOUT_MAX_HEIGHT, FREE_LAYOUT_MAX_WIDTH } from "./resumeFreeLayout";

export const CANVAS_A4_SIZE = {
  width: CANVAS_PAGE_WIDTH,
  height: CANVAS_PAGE_HEIGHT,
} as const;

export type PageSnapEdge = "top" | "bottom" | null;

export function detectPageSnapEdge(
  localY: number,
  sectionHeight: number,
  pageHeight = CANVAS_PAGE_HEIGHT,
  threshold = CANVAS_PAGE_EDGE_SNAP,
): PageSnapEdge {
  if (localY < threshold) return "top";
  if (localY + sectionHeight > pageHeight - threshold) return "bottom";
  return null;
}

export interface BoundaryPageCrossResult {
  pageId: string;
  y: number;
}

/** When a section is dragged past a page edge, move it to the adjacent page */
export function resolveBoundaryPageCross(
  localY: number,
  sectionHeight: number,
  pageIndex: number,
  pageIds: string[],
): BoundaryPageCrossResult | null {
  if (pageIds.length <= 1) return null;

  const edge = detectPageSnapEdge(localY, sectionHeight);
  if (edge === "bottom" && pageIndex < pageIds.length - 1) {
    return { pageId: pageIds[pageIndex + 1], y: 48 };
  }
  if (edge === "top" && pageIndex > 0) {
    return {
      pageId: pageIds[pageIndex - 1],
      y: Math.max(48, CANVAS_PAGE_HEIGHT - sectionHeight - 48),
    };
  }
  return null;
}

export function clampSectionYToPage(localY: number, sectionHeight: number, pageHeight = CANVAS_PAGE_HEIGHT): number {
  return Math.max(0, Math.min(localY, Math.max(0, pageHeight - sectionHeight)));
}

/** Clamp section box to fit within a single A4 page */
export function clampPositionToA4Page(pos: FreeLayoutPosition): FreeLayoutPosition {
  const width = Math.min(
    Math.max(pos.width, FREE_LAYOUT_MIN_WIDTH),
    FREE_LAYOUT_MAX_WIDTH,
    CANVAS_PAGE_WIDTH,
  );
  const height = Math.min(
    Math.max(pos.height, FREE_LAYOUT_MIN_HEIGHT),
    FREE_LAYOUT_MAX_HEIGHT,
    CANVAS_PAGE_HEIGHT,
  );
  const x = Math.max(0, Math.min(pos.x, CANVAS_PAGE_WIDTH - width));
  const y = Math.max(0, Math.min(pos.y, CANVAS_PAGE_HEIGHT - height));
  return { ...pos, x, y, width, height };
}

export function maxSectionHeightOnPage(localY: number, pageHeight = CANVAS_PAGE_HEIGHT): number {
  return Math.max(FREE_LAYOUT_MIN_HEIGHT, Math.min(FREE_LAYOUT_MAX_HEIGHT, pageHeight - localY));
}
