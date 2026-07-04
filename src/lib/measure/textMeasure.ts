/**
 * Unified text measurement — the single source of truth for line wrapping.
 * Uses canvas measureText in the browser so preview and export agree on heights;
 * falls back to the legacy char-width heuristic where no DOM exists (tests/SSR).
 */

export interface MeasureFont {
  /** CSS font-family list */
  family: string;
  /** Font size in px */
  size: number;
  weight?: number | string;
}

/**
 * Calibrated to the actual canvas rendering (body text is 11–12px).
 * Measuring at 14px inflated every wrap count ~25%, so one page of content
 * was judged to overflow and defaults/auto-tidy split into two pages.
 */
export const RESUME_BODY_FONT: MeasureFont = {
  family: 'Georgia, "Times New Roman", "Noto Serif TC", serif',
  size: 12,
};

/** Legacy heuristic glyph width at resume body size (fallback only) */
export const FALLBACK_CHAR_WIDTH = 7.2;

let measureCtx: CanvasRenderingContext2D | null | undefined;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (measureCtx !== undefined) return measureCtx;
  try {
    if (typeof document === "undefined") {
      measureCtx = null;
      return null;
    }
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    measureCtx = ctx && typeof ctx.measureText === "function" ? ctx : null;
  } catch {
    measureCtx = null;
  }
  return measureCtx;
}

export function isPixelMeasureAvailable(): boolean {
  return getMeasureContext() !== null;
}

/** Test hook — force the fallback path or reset detection. */
export function __resetMeasureContextForTests(force?: "fallback"): void {
  measureCtx = force === "fallback" ? null : undefined;
}

export function measureTextWidth(text: string, font: MeasureFont = RESUME_BODY_FONT): number {
  const ctx = getMeasureContext();
  if (!ctx) {
    return text.length * FALLBACK_CHAR_WIDTH * (font.size / 14);
  }
  ctx.font = `${font.weight ?? 400} ${font.size}px ${font.family}`;
  return ctx.measureText(text).width;
}

/**
 * Count wrapped lines for text inside maxWidth px.
 * Mirrors CSS word wrapping: break on whitespace, hard-split words wider than the box.
 */
export function countWrappedLines(
  text: string,
  maxWidth: number,
  font: MeasureFont = RESUME_BODY_FONT,
): number {
  const trimmed = text.trim();
  if (!trimmed || maxWidth <= 0) return 0;

  const ctx = getMeasureContext();
  if (!ctx) {
    const charWidth = FALLBACK_CHAR_WIDTH * (font.size / 14);
    const charsPerLine = Math.max(18, Math.floor(maxWidth / charWidth));
    return fallbackWrappedLineCount(trimmed, charsPerLine);
  }

  ctx.font = `${font.weight ?? 400} ${font.size}px ${font.family}`;
  const spaceWidth = ctx.measureText(" ").width;
  const words = trimmed.split(/\s+/);

  let lines = 1;
  let lineWidth = 0;
  for (const word of words) {
    const wordWidth = ctx.measureText(word).width;
    if (wordWidth > maxWidth) {
      // Hard-split overlong tokens (URLs, CJK runs without spaces)
      const remaining = lineWidth > 0 ? maxWidth - lineWidth - spaceWidth : maxWidth;
      const overflow = Math.max(0, wordWidth - Math.max(0, remaining));
      lines += Math.ceil(overflow / maxWidth);
      lineWidth = wordWidth % maxWidth;
      continue;
    }
    if (lineWidth === 0) {
      lineWidth = wordWidth;
    } else if (lineWidth + spaceWidth + wordWidth > maxWidth) {
      lines += 1;
      lineWidth = wordWidth;
    } else {
      lineWidth += spaceWidth + wordWidth;
    }
  }
  return lines;
}

/** Legacy char-count wrap (kept for the no-DOM fallback path) */
export function fallbackWrappedLineCount(text: string, charsPerLine: number): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const words = trimmed.split(/\s+/);
  let lines = 1;
  let col = 0;
  for (const word of words) {
    const token = word.length;
    if (token >= charsPerLine) {
      lines += Math.ceil(token / charsPerLine);
      col = 0;
      continue;
    }
    if (col === 0) {
      col = token;
    } else if (col + 1 + token > charsPerLine) {
      lines += 1;
      col = token;
    } else {
      col += 1 + token;
    }
  }
  return lines;
}
