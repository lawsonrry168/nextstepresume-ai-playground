/**
 * Custom canvas elements — free text boxes, photos (HK CV headshots), dividers.
 * Elements ride the existing free-layout position machinery via ids `el-<kind>-<n>`,
 * so drag/resize/snap/layers/undo all work unchanged. Content lives here.
 */

export type CanvasElementKind = "text" | "photo" | "divider";

export interface CanvasElement {
  id: string;
  kind: CanvasElementKind;
  /** Text content for kind=text */
  text?: string;
  /** Data URL for kind=photo */
  imageDataUrl?: string;
  /** Circle crop for photos (HK headshot style) */
  circle?: boolean;
}

export const CANVAS_ELEMENT_PREFIX = "el-";
const STORAGE_KEY = "nsr_canvas_elements_v1";
const MAX_ELEMENTS = 24;
const MAX_PHOTO_DATAURL_BYTES = 800_000;

export function isCanvasElementId(id: string): boolean {
  return id.startsWith(CANVAS_ELEMENT_PREFIX);
}

export function canvasElementKindFromId(id: string): CanvasElementKind | null {
  if (!isCanvasElementId(id)) return null;
  const kind = id.split("-")[1];
  return kind === "text" || kind === "photo" || kind === "divider" ? kind : null;
}

function readStorage(): CanvasElement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CanvasElement[];
    return Array.isArray(parsed) ? parsed.filter((el) => el && isCanvasElementId(el.id)) : [];
  } catch {
    return [];
  }
}

let elements: CanvasElement[] | null = null;
const listeners = new Set<() => void>();

function ensureLoaded(): CanvasElement[] {
  if (elements === null) elements = readStorage();
  return elements;
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(elements ?? []));
  } catch {
    // storage full (large photos) — keep in-memory state
  }
}

function notify(): void {
  for (const listener of listeners) listener();
}

export function getCanvasElements(): CanvasElement[] {
  return ensureLoaded();
}

export function getCanvasElement(id: string): CanvasElement | undefined {
  return ensureLoaded().find((el) => el.id === id);
}

export function subscribeCanvasElements(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function addCanvasElement(kind: CanvasElementKind): CanvasElement | null {
  const current = ensureLoaded();
  if (current.length >= MAX_ELEMENTS) return null;
  const id = `${CANVAS_ELEMENT_PREFIX}${kind}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const element: CanvasElement = {
    id,
    kind,
    ...(kind === "text" ? { text: "" } : {}),
    ...(kind === "photo" ? { circle: true } : {}),
  };
  elements = [...current, element];
  persist();
  notify();
  return element;
}

export function duplicateCanvasElement(source: CanvasElement): CanvasElement | null {
  const current = ensureLoaded();
  if (current.length >= MAX_ELEMENTS) return null;
  const id = `${CANVAS_ELEMENT_PREFIX}${source.kind}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const element: CanvasElement = {
    ...source,
    id,
    text: source.text,
    imageDataUrl: source.imageDataUrl,
    circle: source.circle,
  };
  elements = [...current, element];
  persist();
  notify();
  return element;
}

export function updateCanvasElement(id: string, patch: Partial<Omit<CanvasElement, "id" | "kind">>): void {
  const current = ensureLoaded();
  if (patch.imageDataUrl && patch.imageDataUrl.length > MAX_PHOTO_DATAURL_BYTES) {
    return;
  }
  elements = current.map((el) => (el.id === id ? { ...el, ...patch } : el));
  persist();
  notify();
}

export function removeCanvasElement(id: string): void {
  elements = ensureLoaded().filter((el) => el.id !== id);
  persist();
  notify();
}

/** Merge snapshot elements into storage (used by layout snapshot restore). */
export function mergeCanvasElementsForSnapshot(relevant: CanvasElement[]): void {
  const ids = new Set(relevant.map((el) => el.id));
  const merged = [...ensureLoaded().filter((el) => !ids.has(el.id)), ...relevant];
  elements = merged;
  persist();
  notify();
}

/** Replace all elements (cloud hydrate) — updates module cache, persists, notifies subscribers. */
export function hydrateCanvasElements(next: CanvasElement[]): void {
  elements = Array.isArray(next) ? next.filter((el) => el && isCanvasElementId(el.id)) : [];
  persist();
  notify();
}

/** Test hook */
export function __resetCanvasElementsForTests(): void {
  elements = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
