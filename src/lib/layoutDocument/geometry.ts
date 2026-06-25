/**
 * Layout Document — canonical page geometry (96dpi A4).
 * All preview, studio, template, and PDF modules MUST import from here
 * (directly or via a4Page / canvasStudioTypes re-exports).
 */
export const LAYOUT_PAGE_WIDTH = 794;
export const LAYOUT_PAGE_HEIGHT = 1123;
export const LAYOUT_PAGE_MARGIN = 48;
export const LAYOUT_PAGE_GAP = 48;

export const LAYOUT_CONTENT_WIDTH = LAYOUT_PAGE_WIDTH - LAYOUT_PAGE_MARGIN * 2;
export const LAYOUT_CONTENT_HEIGHT = LAYOUT_PAGE_HEIGHT - LAYOUT_PAGE_MARGIN * 2;

/** Minimum vertical gap between stacked sections (compact stack) */
export const LAYOUT_MIN_SECTION_GAP = 8;

/** Default vertical gap between sections in studio reflow */
export const LAYOUT_DEFAULT_SECTION_GAP = 16;

/** A4 layout rhythm tokens — keep in sync with src/styles/a4-layout.css */
export const LAYOUT_SPACING = {
  padTop: 36,
  padBottom: 40,
  padX: LAYOUT_PAGE_MARGIN,
  sectionGap: 20,
  blockGap: 10,
  itemGap: 6,
  headerGap: 14,
  columnGap: 20,
  sidebarWidth: 228,
  bodySize: 11,
  lineHeight: 1.48,
} as const;
