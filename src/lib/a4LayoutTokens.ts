import { LAYOUT_PAGE_MARGIN, LAYOUT_SPACING } from "./layoutDocument/geometry";
import {
  A4_CONTENT_HEIGHT,
  A4_CONTENT_WIDTH,
  A4_PAGE_HEIGHT,
  A4_PAGE_MARGIN,
  A4_PAGE_WIDTH,
} from "./a4Page";

/** 8px baseline grid */
export const A4_UNIT = 8;

export const A4_LAYOUT = {
  pageWidth: A4_PAGE_WIDTH,
  pageHeight: A4_PAGE_HEIGHT,
  contentWidth: A4_CONTENT_WIDTH,
  contentHeight: A4_CONTENT_HEIGHT,
  margin: A4_PAGE_MARGIN,
  padTop: LAYOUT_SPACING.padTop,
  padBottom: LAYOUT_SPACING.padBottom,
  padX: LAYOUT_SPACING.padX,
  sectionGap: LAYOUT_SPACING.sectionGap,
  blockGap: LAYOUT_SPACING.blockGap,
  itemGap: LAYOUT_SPACING.itemGap,
  headerGap: LAYOUT_SPACING.headerGap,
  columnGap: LAYOUT_SPACING.columnGap,
  sidebarWidth: LAYOUT_SPACING.sidebarWidth,
  bodySize: LAYOUT_SPACING.bodySize,
  bodySm: 10,
  h1Size: 24,
  h2Size: 10,
  lineHeight: LAYOUT_SPACING.lineHeight,
} as const;

export { A4_CONTENT_HEIGHT, A4_CONTENT_WIDTH };

export function a4TemplateFamilyClass(family: string): string {
  return `resume-template-${family}`;
}
