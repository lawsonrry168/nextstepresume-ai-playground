import { formatAutoSaveTime, formatCanvasPageLabel } from "./sectionLabels";

/** Studio immersive view modes */
export type StudioViewMode = "single" | "compare" | "canvas";

export interface CanvasViewportState {
  panX: number;
  panY: number;
  /** 0.25 – 2.0 */
  zoom: number;
}

export const CANVAS_VIEWPORT_DEFAULTS: CanvasViewportState = {
  panX: 0,
  panY: 0,
  zoom: 0.72,
};

export const CANVAS_ZOOM_MIN = 0.25;
export const CANVAS_ZOOM_MAX = 2;
export const CANVAS_ZOOM_STEP = 0.05;

/** A4 page dimensions (96 dpi) */
export const CANVAS_PAGE_WIDTH = 794;
export const CANVAS_PAGE_HEIGHT = 1123;
export const CANVAS_PAGE_GAP = 48;
/** Drag within this px of page top/bottom triggers cross-page snap */
export const CANVAS_PAGE_EDGE_SNAP = 56;

export interface CanvasPage {
  id: string;
  label: string;
}

export interface CanvasPagesDocument {
  pages: CanvasPage[];
  activePageId: string;
}

export interface CanvasLayerDocument {
  /** Bottom → top */
  order: string[];
  hidden: Record<string, boolean>;
  locked: Record<string, boolean>;
}

export interface CanvasStudioUiState {
  layerPanelOpen: boolean;
  rightNavOpen: boolean;
  shortcutsDismissed: boolean;
  showGrid: boolean;
  showMargins: boolean;
  /** Grid line intensity 10–100 (maps to opacity multiplier) */
  gridStrength: number;
  /** Draggable right-nav tool section order */
  navSectionOrder: CanvasNavSectionId[];
}

export type CanvasNavSectionId = "view" | "layers" | "align" | "size" | "page" | "layout";

export const CANVAS_NAV_SECTION_DEFAULT_ORDER: CanvasNavSectionId[] = [
  "layout",
  "align",
  "view",
  "layers",
  "size",
  "page",
];

export function normalizeNavSectionOrder(raw: unknown): CanvasNavSectionId[] {
  const defaults = CANVAS_NAV_SECTION_DEFAULT_ORDER;
  if (!Array.isArray(raw)) return [...defaults];
  const known = new Set(defaults);
  const order: CanvasNavSectionId[] = [];
  for (const id of raw) {
    if (typeof id === "string" && known.has(id as CanvasNavSectionId) && !order.includes(id as CanvasNavSectionId)) {
      order.push(id as CanvasNavSectionId);
    }
  }
  for (const id of defaults) {
    if (!order.includes(id)) order.push(id);
  }
  return order;
}

export function reorderNavSection(
  order: CanvasNavSectionId[],
  draggedId: CanvasNavSectionId,
  targetId: CanvasNavSectionId,
  place: "before" | "after",
): CanvasNavSectionId[] {
  if (draggedId === targetId) return order;
  const next = order.filter((id) => id !== draggedId);
  let idx = next.indexOf(targetId);
  if (idx < 0) return order;
  if (place === "after") idx += 1;
  next.splice(idx, 0, draggedId);
  return next;
}

export const CANVAS_GRID_STRENGTH_DEFAULT = 55;
export const CANVAS_GRID_STRENGTH_MIN = 10;
export const CANVAS_GRID_STRENGTH_MAX = 100;

export function clampGridStrength(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : CANVAS_GRID_STRENGTH_DEFAULT;
  return Math.min(CANVAS_GRID_STRENGTH_MAX, Math.max(CANVAS_GRID_STRENGTH_MIN, Math.round(n)));
}

export function gridStrengthToOpacity(strength: number): number {
  return clampGridStrength(strength) / 100;
}

export function formatCanvasAutoSaveTime(savedAt: number | null): string {
  return formatAutoSaveTime(savedAt);
}

export interface CanvasShortcutDef {
  id: string;
  keys: string[];
  labelZh: string;
}

export const CANVAS_SHORTCUTS: CanvasShortcutDef[] = [
  { id: "help", keys: ["?"], labelZh: "顯示 / 關閉快捷鍵" },
  { id: "pan", keys: ["Space", "拖曳"], labelZh: "平移畫布" },
  { id: "zoom", keys: ["Ctrl", "滾輪"], labelZh: "縮放畫布" },
  { id: "layer-up", keys: ["↑"], labelZh: "選取上一圖層" },
  { id: "layer-down", keys: ["↓"], labelZh: "選取下一圖層" },
  { id: "order-up", keys: ["]"], labelZh: "圖層上移" },
  { id: "order-down", keys: ["["], labelZh: "圖層下移" },
  { id: "front", keys: ["Shift", "]"], labelZh: "移至最前" },
  { id: "back", keys: ["Shift", "["], labelZh: "移至最後" },
  { id: "hide", keys: ["H"], labelZh: "隱藏 / 顯示圖層" },
  { id: "lock", keys: ["Shift", "L"], labelZh: "鎖定 / 解鎖圖層" },
  { id: "layers", keys: ["L"], labelZh: "切換圖層面板" },
  { id: "tools", keys: ["R"], labelZh: "切換右側工具欄" },
  { id: "page-add", keys: ["P"], labelZh: "新增頁面" },
  { id: "page-next", keys: ["Tab"], labelZh: "下一頁" },
  { id: "page-prev", keys: ["Shift", "Tab"], labelZh: "上一頁" },
  { id: "cross-page", keys: ["拖曳", "→", "另一頁"], labelZh: "跨頁移動段落" },
  { id: "page-snap", keys: ["拖至", "頁緣"], labelZh: "分頁線吸附（自動跨頁）" },
  { id: "layer-drag", keys: ["圖層", "握把拖曳"], labelZh: "拖曳排序圖層" },
  { id: "layer-touch", keys: ["長按", "握把"], labelZh: "觸控長按排序圖層" },
  { id: "nav-section-drag", keys: ["握把", "拖曳"], labelZh: "右側工具區塊排序" },
  { id: "fit", keys: ["F"], labelZh: "適合畫面" },
  { id: "reset", keys: ["0"], labelZh: "重設視角" },
  { id: "zoom100", keys: ["1"], labelZh: "100% 縮放" },
  { id: "grid", keys: ["G"], labelZh: "顯示 / 隱藏格線" },
  { id: "grid-strength", keys: ["視圖", "滑桿"], labelZh: "格線深淺（10%–100%）" },
  { id: "margins", keys: ["M"], labelZh: "顯示 / 隱藏安全邊界" },
  { id: "center", keys: ["C"], labelZh: "段落置中於頁面" },
  { id: "fill-width", keys: ["Shift", "W"], labelZh: "段落填滿頁寬（含邊距）" },
  { id: "move-page", keys: ["Shift", "M"], labelZh: "移至目前頁面" },
  { id: "show-all", keys: ["Shift", "H"], labelZh: "顯示所有圖層" },
  { id: "unlock-all", keys: ["Shift", "U"], labelZh: "解鎖所有圖層" },
  { id: "del-page", keys: ["Delete"], labelZh: "刪除目前頁面" },
  { id: "zoom50", keys: ["5"], labelZh: "50% 縮放" },
  { id: "focus-page", keys: ["Home"], labelZh: "聚焦目前頁面" },
  { id: "dup-page", keys: ["Shift", "P"], labelZh: "新增頁面副本" },
  { id: "nudge", keys: ["Alt", "方向鍵"], labelZh: "微調段落位置（1px）" },
  { id: "nudge-grid", keys: ["Alt", "Shift", "方向鍵"], labelZh: "微調段落位置（格線 24px）" },
  { id: "align-h", keys: ["Ctrl", "←", "→"], labelZh: "靠左 / 靠右對齊" },
  { id: "align-v", keys: ["Ctrl", "↑", "↓"], labelZh: "靠上 / 靠下對齊" },
  { id: "snap-grid", keys: ["S"], labelZh: "段落貼齊格線" },
  { id: "resize-w", keys: ["Shift", "←", "→"], labelZh: "減寬 / 加寬（24px）" },
  { id: "resize-h", keys: ["Shift", "↑", "↓"], labelZh: "加高 / 減高（24px）" },
  { id: "layout-stack", keys: ["—"], labelZh: "版型列：單欄 / 雙欄 / 三欄等（目前頁）" },
  { id: "layout-preset", keys: ["—"], labelZh: "版型列：全域預設（所有頁面）" },
  { id: "deselect", keys: ["Esc"], labelZh: "取消選取" },
];

export function clampCanvasZoom(value: number): number {
  return Math.min(CANVAS_ZOOM_MAX, Math.max(CANVAS_ZOOM_MIN, value));
}

export function normalizeCanvasViewport(raw: Partial<CanvasViewportState> | null | undefined): CanvasViewportState {
  return {
    panX: typeof raw?.panX === "number" && Number.isFinite(raw.panX) ? raw.panX : CANVAS_VIEWPORT_DEFAULTS.panX,
    panY: typeof raw?.panY === "number" && Number.isFinite(raw.panY) ? raw.panY : CANVAS_VIEWPORT_DEFAULTS.panY,
    zoom: clampCanvasZoom(
      typeof raw?.zoom === "number" && Number.isFinite(raw.zoom) ? raw.zoom : CANVAS_VIEWPORT_DEFAULTS.zoom,
    ),
  };
}

export function createDefaultCanvasPage(index = 1): CanvasPage {
  return { id: `page-${Date.now().toString(36)}-${index}`, label: formatCanvasPageLabel(index) };
}

export function createDefaultPagesDocument(): CanvasPagesDocument {
  const first = createDefaultCanvasPage(1);
  return { pages: [first], activePageId: first.id };
}

export function normalizePagesDocument(raw: Partial<CanvasPagesDocument> | null | undefined): CanvasPagesDocument {
  const fallback = createDefaultPagesDocument();
  if (!raw?.pages?.length) return fallback;
  const pages = raw.pages.filter((p) => p?.id && p?.label);
  if (!pages.length) return fallback;
  const activePageId = pages.some((p) => p.id === raw.activePageId) ? raw.activePageId! : pages[0].id;
  return { pages, activePageId };
}

export function normalizeLayerDocument(
  raw: Partial<CanvasLayerDocument> | null | undefined,
  sectionIds: string[],
): CanvasLayerDocument {
  const hidden = raw?.hidden ?? {};
  const locked = raw?.locked ?? {};
  const seen = new Set<string>();
  const order: string[] = [];

  for (const id of raw?.order ?? []) {
    if (sectionIds.includes(id) && !seen.has(id)) {
      order.push(id);
      seen.add(id);
    }
  }
  for (const id of sectionIds) {
    if (!seen.has(id)) order.push(id);
  }

  return { order, hidden, locked };
}

export function computeMultiPageDeskHeight(pageCount: number): number {
  if (pageCount <= 0) return CANVAS_PAGE_HEIGHT;
  return pageCount * CANVAS_PAGE_HEIGHT + Math.max(0, pageCount - 1) * CANVAS_PAGE_GAP;
}

export function getPageTopOffset(pageIndex: number): number {
  return pageIndex * (CANVAS_PAGE_HEIGHT + CANVAS_PAGE_GAP);
}

export function layerZIndex(sectionId: string, order: string[]): number {
  const index = order.indexOf(sectionId);
  return index >= 0 ? 10 + index : 10;
}

/** Panel shows top-first (front layers first); reorder by drag-drop in that visual list */
export function reorderLayerInPanel(
  order: string[],
  draggedId: string,
  targetId: string,
  place: "before" | "after",
): string[] {
  if (draggedId === targetId) return order;
  const panel = [...order].reverse();
  const from = panel.indexOf(draggedId);
  const to = panel.indexOf(targetId);
  if (from < 0 || to < 0) return order;

  panel.splice(from, 1);
  let insertAt = place === "before" ? to : to + 1;
  if (from < to) insertAt -= 1;
  panel.splice(insertAt, 0, draggedId);
  return panel.reverse();
}

export function resolvePageDropFromPoint(
  clientX: number,
  clientY: number,
  sectionWidth: number,
  sectionHeight: number,
): { pageId: string; x: number; y: number } | null {
  if (typeof document === "undefined") return null;
  const pageEl = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>("[data-page-id]");
  if (!pageEl?.dataset.pageId) return null;

  const surface =
    pageEl.querySelector<HTMLElement>("[data-page-drop-surface]") ?? pageEl;
  const rect = surface.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const relX = ((clientX - rect.left) / rect.width) * CANVAS_PAGE_WIDTH;
  const relY = ((clientY - rect.top) / rect.height) * CANVAS_PAGE_HEIGHT;
  const x = Math.max(0, Math.min(CANVAS_PAGE_WIDTH - sectionWidth, Math.round(relX - sectionWidth / 2)));
  const y = Math.max(0, Math.min(CANVAS_PAGE_HEIGHT - sectionHeight, Math.round(relY - 24)));

  return { pageId: pageEl.dataset.pageId, x, y };
}
