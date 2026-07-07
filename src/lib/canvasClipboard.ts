import {
  duplicateCanvasElement,
  getCanvasElement,
  isCanvasElementId,
  type CanvasElement,
} from "./canvasElements";
import type { FreeLayoutPosition } from "./resumeFreeLayout";

export interface CanvasClipboardItem {
  sourceId: string;
  position: FreeLayoutPosition;
  element?: CanvasElement;
}

export interface CanvasClipboardPayload {
  family: string;
  items: CanvasClipboardItem[];
  copiedAt: number;
}

let clipboard: CanvasClipboardPayload | null = null;

export function getCanvasClipboard(): CanvasClipboardPayload | null {
  return clipboard;
}

export function clearCanvasClipboard(): void {
  clipboard = null;
}

export function copyCanvasSelection(
  family: string,
  ids: string[],
  positions: Record<string, FreeLayoutPosition>,
): boolean {
  const items: CanvasClipboardItem[] = [];
  for (const id of ids) {
    const pos = positions[id];
    if (!pos) continue;
    // Only custom canvas elements can be copied/duplicated. Resume sections
    // (header, experience, …) are singletons backed by resumeData — pasting a
    // "copy" would just move the original, so we skip them here.
    if (!isCanvasElementId(id)) continue;
    const el = getCanvasElement(id);
    if (!el) continue;
    items.push({
      sourceId: id,
      position: JSON.parse(JSON.stringify(pos)) as FreeLayoutPosition,
      element: JSON.parse(JSON.stringify(el)) as CanvasElement,
    });
  }
  if (!items.length) return false;
  clipboard = { family, items, copiedAt: Date.now() };
  return true;
}

export interface PasteCanvasClipboardOptions {
  family: string;
  activePageId: string;
  offset?: { x: number; y: number };
  applyPosition: (id: string, pos: FreeLayoutPosition, options?: { layoutOverride?: boolean }) => void;
}

export function pasteCanvasClipboard(options: PasteCanvasClipboardOptions): string[] {
  if (!clipboard || clipboard.family !== options.family || !clipboard.items.length) return [];
  const offset = options.offset ?? { x: 24, y: 24 };
  const pastedIds: string[] = [];

  for (const item of clipboard.items) {
    if (!item.element) continue;
    const clone = duplicateCanvasElement(item.element);
    if (!clone) continue;
    const pos: FreeLayoutPosition = {
      ...item.position,
      x: item.position.x + offset.x,
      y: item.position.y + offset.y,
      pageId: options.activePageId,
    };
    options.applyPosition(clone.id, pos, { layoutOverride: true });
    pastedIds.push(clone.id);
  }

  return pastedIds;
}

export function duplicateCanvasSelection(
  family: string,
  ids: string[],
  positions: Record<string, FreeLayoutPosition>,
  options: Omit<PasteCanvasClipboardOptions, "offset">,
): string[] {
  if (!copyCanvasSelection(family, ids, positions)) return [];
  return pasteCanvasClipboard(options);
}

export function hasCanvasClipboard(family: string): boolean {
  return Boolean(clipboard && clipboard.family === family && clipboard.items.length > 0);
}
