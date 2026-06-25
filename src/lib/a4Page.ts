import {
  LAYOUT_CONTENT_HEIGHT,
  LAYOUT_CONTENT_WIDTH,
  LAYOUT_PAGE_HEIGHT,
  LAYOUT_PAGE_MARGIN,
  LAYOUT_PAGE_WIDTH,
  LAYOUT_SPACING,
} from "./layoutDocument/geometry";

/** A4 page at 96dpi — re-export of layout document geometry */
export const A4_PAGE_WIDTH = LAYOUT_PAGE_WIDTH;
export const A4_PAGE_HEIGHT = LAYOUT_PAGE_HEIGHT;
export const A4_PAGE_MARGIN = LAYOUT_PAGE_MARGIN;

/** Printable content box inside page margins */
export const A4_CONTENT_WIDTH = LAYOUT_CONTENT_WIDTH;
export const A4_CONTENT_HEIGHT = LAYOUT_CONTENT_HEIGHT;

export const A4_PAGE_CLASS = "resume-a4-surface";

export const A4_PAGE_DATA_ATTR = "data-resume-a4-page";

export const A4_PAGE_INLINE_STYLE = {
  width: `${A4_PAGE_WIDTH}px`,
  maxWidth: `${A4_PAGE_WIDTH}px`,
  minHeight: `${A4_PAGE_HEIGHT}px`,
  height: `${A4_PAGE_HEIGHT}px`,
  maxHeight: `${A4_PAGE_HEIGHT}px`,
  boxSizing: "border-box" as const,
};
