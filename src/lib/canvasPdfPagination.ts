import { CANVAS_PAGE_HEIGHT } from "./canvasStudioTypes";

export function estimatePdfPageCount(contentHeightPx: number, captureScale: number): number {
  const pageHeightPx = CANVAS_PAGE_HEIGHT * captureScale;
  return Math.max(1, Math.ceil(contentHeightPx / pageHeightPx));
}
