import { CANVAS_PAGE_HEIGHT } from "./canvasStudioTypes";

/** Split a captured canvas into A4-height slices (pixel height at capture scale) */
export function sliceCanvasVertically(canvas: HTMLCanvasElement, sliceHeightPx: number): HTMLCanvasElement[] {
  if (sliceHeightPx <= 0 || canvas.height <= sliceHeightPx) {
    return [canvas];
  }

  const slices: HTMLCanvasElement[] = [];
  let offsetY = 0;

  while (offsetY < canvas.height) {
    const sliceH = Math.min(sliceHeightPx, canvas.height - offsetY);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceH;
    const ctx = slice.getContext("2d");
    if (!ctx) break;
    ctx.drawImage(canvas, 0, offsetY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
    slices.push(slice);
    offsetY += sliceH;
  }

  return slices.length ? slices : [canvas];
}

export function estimatePdfPageCount(contentHeightPx: number, captureScale: number): number {
  const pageHeightPx = CANVAS_PAGE_HEIGHT * captureScale;
  return Math.max(1, Math.ceil(contentHeightPx / pageHeightPx));
}
