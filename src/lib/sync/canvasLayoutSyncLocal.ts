import type { CanvasElement } from "../canvasElements";
import { getCanvasElements, hydrateCanvasElements } from "../canvasElements";
import type { CanvasDocumentStore } from "../canvasDocument/types";
import type { FreeLayoutPosition } from "../resumeFreeLayout";
import { readFamilyLayoutStorage } from "../resumeFreeLayout";
import type { TemplateFamily } from "../resumeTemplateCatalog";
import { NSR_STORAGE_KEYS } from "../storageKeys";

export interface CanvasLayoutSyncSnapshot {
  layoutPositions: Partial<Record<TemplateFamily, Record<string, FreeLayoutPosition>>>;
  canvasDocument: CanvasDocumentStore;
  canvasElements: CanvasElement[];
  updatedAt: string;
}

const CANVAS_DOCUMENT_KEY = "nsr_canvas_document_v1";
const CANVAS_LAYOUT_CLOUD_KEY = "nsr_canvas_layout_cloud_updated_at";

function readCanvasDocumentStore(): CanvasDocumentStore {
  try {
    const raw = localStorage.getItem(CANVAS_DOCUMENT_KEY);
    return raw ? (JSON.parse(raw) as CanvasDocumentStore) : {};
  } catch {
    return {};
  }
}

function writeCanvasDocumentStore(store: CanvasDocumentStore): void {
  try {
    localStorage.setItem(CANVAS_DOCUMENT_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

function writeCanvasElements(elements: CanvasElement[]): void {
  // Route through the canvasElements module so subscribers (studio, preview) re-render.
  hydrateCanvasElements(elements);
}

function writeLayoutPositions(
  layoutPositions: Partial<Record<TemplateFamily, Record<string, FreeLayoutPosition>>>,
): void {
  try {
    const current = readFamilyLayoutStorage();
    localStorage.setItem(
      NSR_STORAGE_KEYS.freeLayoutByFamily,
      JSON.stringify({ ...current, ...layoutPositions }),
    );
  } catch {
    // ignore quota errors
  }
}

export function buildCanvasLayoutSyncSnapshot(): CanvasLayoutSyncSnapshot {
  return {
    layoutPositions: readFamilyLayoutStorage(),
    canvasDocument: readCanvasDocumentStore(),
    canvasElements: getCanvasElements(),
    updatedAt: new Date().toISOString(),
  };
}

export function applyCanvasLayoutSyncSnapshot(snapshot: CanvasLayoutSyncSnapshot): void {
  if (snapshot.layoutPositions && Object.keys(snapshot.layoutPositions).length > 0) {
    writeLayoutPositions(snapshot.layoutPositions);
  }
  if (snapshot.canvasDocument && Object.keys(snapshot.canvasDocument).length > 0) {
    writeCanvasDocumentStore(snapshot.canvasDocument);
  }
  if (Array.isArray(snapshot.canvasElements)) {
    writeCanvasElements(snapshot.canvasElements);
  }
  try {
    localStorage.setItem(CANVAS_LAYOUT_CLOUD_KEY, snapshot.updatedAt);
  } catch {
    // ignore
  }
}

export { CANVAS_LAYOUT_CLOUD_KEY };
