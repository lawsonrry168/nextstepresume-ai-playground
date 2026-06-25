import { CANVAS_PAGE_HEIGHT, CANVAS_PAGE_WIDTH } from "./canvasStudioTypes";
import { clampPositionToA4Page } from "./canvasPageSnap";
import type { FreeLayoutPosition } from "./resumeFreeLayout";
import {
  clampSectionHeight,
  clampSectionWidth,
  defaultSectionHeight,
  FREE_LAYOUT_MAX_WIDTH,
  SNAP_GRID_SIZE,
  snapToGrid,
} from "./resumeFreeLayout";

export type CanvasAlignHorizontal = "left" | "center" | "right";
export type CanvasAlignVertical = "top" | "middle" | "bottom";

import { LAYOUT_PAGE_MARGIN } from "./layoutDocument/geometry";

/** Standard printable margin on A4 canvas pages */
export const CANVAS_PAGE_MARGIN = LAYOUT_PAGE_MARGIN;

export function alignPositionOnPage(
  pos: FreeLayoutPosition,
  horizontal?: CanvasAlignHorizontal,
  vertical?: CanvasAlignVertical,
  pageWidth = CANVAS_PAGE_WIDTH,
  pageHeight = CANVAS_PAGE_HEIGHT,
): FreeLayoutPosition {
  let x = pos.x;
  let y = pos.y;

  if (horizontal === "left") x = 0;
  else if (horizontal === "center") x = Math.round((pageWidth - pos.width) / 2);
  else if (horizontal === "right") x = pageWidth - pos.width;

  if (vertical === "top") y = 0;
  else if (vertical === "middle") y = Math.round((pageHeight - pos.height) / 2);
  else if (vertical === "bottom") y = pageHeight - pos.height;

  return clampPositionToA4Page({ ...pos, x, y });
}

export function nudgePosition(
  pos: FreeLayoutPosition,
  dx: number,
  dy: number,
): FreeLayoutPosition {
  return clampPositionToA4Page({ ...pos, x: pos.x + dx, y: pos.y + dy });
}

export function centerOnPage(pos: FreeLayoutPosition): FreeLayoutPosition {
  return alignPositionOnPage(pos, "center", "middle");
}

export function fillPageWidth(
  pos: FreeLayoutPosition,
  margin = CANVAS_PAGE_MARGIN,
  pageWidth = CANVAS_PAGE_WIDTH,
): FreeLayoutPosition {
  const width = Math.min(pageWidth - margin * 2, FREE_LAYOUT_MAX_WIDTH);
  return clampPositionToA4Page({ ...pos, x: margin, width });
}

export const CANVAS_NUDGE_FINE = 1;
export const CANVAS_NUDGE_GRID = SNAP_GRID_SIZE;

export function snapPositionToGrid(pos: FreeLayoutPosition): FreeLayoutPosition {
  return clampPositionToA4Page({
    ...pos,
    x: snapToGrid(pos.x),
    y: snapToGrid(pos.y),
    width: snapToGrid(pos.width),
    height: snapToGrid(pos.height),
  });
}

export function resizeSection(
  pos: FreeLayoutPosition,
  deltaWidth: number,
  deltaHeight: number,
  step = SNAP_GRID_SIZE,
): FreeLayoutPosition {
  const width = clampSectionWidth(pos.width + deltaWidth * step, pos.x, CANVAS_PAGE_WIDTH);
  const height = clampSectionHeight(pos.height + deltaHeight * step);
  return clampPositionToA4Page({ ...pos, width, height });
}

export function resetSectionPosition(
  sectionId: string,
  pos: FreeLayoutPosition,
  defaults: FreeLayoutPosition,
): FreeLayoutPosition {
  return clampPositionToA4Page({
    ...pos,
    x: defaults.x,
    y: defaults.y,
    width: defaults.width,
    height: defaults.height ?? defaultSectionHeight(sectionId),
  });
}
