import {
  LAYOUT_PAGE_GAP,
  LAYOUT_PAGE_HEIGHT,
  LAYOUT_PAGE_MARGIN,
  LAYOUT_PAGE_WIDTH,
  LAYOUT_SPACING,
} from "./geometry";

/** CSS custom properties derived from geometry.ts — single source of truth */
export function getLayoutGeometryCssVars(): Record<string, string> {
  return {
    "--layout-page-width": `${LAYOUT_PAGE_WIDTH}px`,
    "--layout-page-height": `${LAYOUT_PAGE_HEIGHT}px`,
    "--layout-page-margin": `${LAYOUT_PAGE_MARGIN}px`,
    "--layout-page-gap": `${LAYOUT_PAGE_GAP}px`,
    "--layout-content-width": `${LAYOUT_PAGE_WIDTH - LAYOUT_PAGE_MARGIN * 2}px`,
    "--layout-content-height": `${LAYOUT_PAGE_HEIGHT - LAYOUT_PAGE_MARGIN * 2}px`,
    "--a4-margin": `${LAYOUT_PAGE_MARGIN}px`,
    "--a4-pad-top": `${LAYOUT_SPACING.padTop}px`,
    "--a4-pad-bottom": `${LAYOUT_SPACING.padBottom}px`,
    "--a4-pad-x": `${LAYOUT_SPACING.padX}px`,
    "--a4-section-gap": `${LAYOUT_SPACING.sectionGap}px`,
    "--a4-block-gap": `${LAYOUT_SPACING.blockGap}px`,
    "--a4-item-gap": `${LAYOUT_SPACING.itemGap}px`,
    "--a4-header-gap": `${LAYOUT_SPACING.headerGap}px`,
    "--a4-col-gap": `${LAYOUT_SPACING.columnGap}px`,
    "--a4-sidebar-w": `${LAYOUT_SPACING.sidebarWidth}px`,
    "--a4-body": `${LAYOUT_SPACING.bodySize}px`,
    "--a4-line": String(LAYOUT_SPACING.lineHeight),
  };
}

/** Build :root CSS block — keep src/styles/layout-geometry.css in sync (validated by tests). */
export function buildLayoutGeometryCssText(): string {
  const vars = getLayoutGeometryCssVars();
  const lines = Object.entries(vars).map(([key, value]) => `  ${key}: ${value};`);
  return `:root {\n${lines.join("\n")}\n}\n`;
}

const STYLE_ELEMENT_ID = "layout-geometry-vars";

/** Inject geometry CSS vars at runtime (fallback if layout-geometry.css is stale). */
export function injectLayoutGeometryCss(): void {
  if (typeof document === "undefined") return;
  let el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ELEMENT_ID;
    document.head.prepend(el);
  }
  el.textContent = buildLayoutGeometryCssText();
}
