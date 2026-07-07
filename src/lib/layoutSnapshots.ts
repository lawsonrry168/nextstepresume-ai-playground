import type { CanvasElement } from "./canvasElements";
import { getCanvasElements, mergeCanvasElementsForSnapshot } from "./canvasElements";
import { loadCanvasDocument } from "./canvasDocument/store";
import type { CanvasLayerDocument, CanvasPagesDocument } from "./canvasStudioTypes";
import type { FreeLayoutPosition } from "./resumeFreeLayout";
import { readFamilyLayoutStorage } from "./resumeFreeLayout";
import type { TemplateFamily } from "./resumeTemplateCatalog";
import { applyCanvasUndoSnapshot } from "./undoRegistry";

export const LAYOUT_SNAPSHOTS_STORAGE_KEY = "nsr_layout_snapshots_v2";
export const MAX_LAYOUT_SNAPSHOTS = 12;

/** Full studio snapshot — positions, pages, layers, and custom canvas elements. */
export interface LayoutFullSnapshot {
  id: string;
  name: string;
  family: TemplateFamily;
  positions: Record<string, FreeLayoutPosition>;
  pages: CanvasPagesDocument;
  layers: CanvasLayerDocument;
  canvasElements: CanvasElement[];
  savedAt: number;
}

function readRawSnapshots(): LayoutFullSnapshot[] {
  try {
    const raw = localStorage.getItem(LAYOUT_SNAPSHOTS_STORAGE_KEY);
    if (!raw) return migrateLegacySnapshots();
    const parsed = JSON.parse(raw) as LayoutFullSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Migrate v1 position-only snapshots into v2 (pages/layers left default). */
function migrateLegacySnapshots(): LayoutFullSnapshot[] {
  try {
    const legacyRaw = localStorage.getItem("nsr_layout_snapshots_v1");
    if (!legacyRaw) return [];
    const legacy = JSON.parse(legacyRaw) as Array<{
      id: string;
      name: string;
      family: TemplateFamily;
      positions: Record<string, FreeLayoutPosition>;
      savedAt: number;
    }>;
    if (!Array.isArray(legacy)) return [];
    const migrated = legacy.map((snap) => {
      const doc = loadCanvasDocument(snap.family, Object.keys(snap.positions));
      return {
        ...snap,
        pages: doc.pages,
        layers: doc.layers,
        canvasElements: getCanvasElements().filter((el) => Boolean(snap.positions[el.id])),
      };
    });
    writeSnapshots(migrated);
    return migrated;
  } catch {
    return [];
  }
}

export function readLayoutSnapshots(): LayoutFullSnapshot[] {
  return readRawSnapshots();
}

export function writeSnapshots(snapshots: LayoutFullSnapshot[]): void {
  try {
    localStorage.setItem(LAYOUT_SNAPSHOTS_STORAGE_KEY, JSON.stringify(snapshots.slice(0, MAX_LAYOUT_SNAPSHOTS)));
  } catch {
    // ignore quota errors
  }
}

export function captureCurrentLayoutSnapshot(
  family: TemplateFamily,
  name: string,
  sectionIds: string[],
): LayoutFullSnapshot | null {
  const positions = readFamilyLayoutStorage()[family];
  if (!positions || !Object.keys(positions).length) return null;
  const doc = loadCanvasDocument(family, sectionIds);
  const positionIds = new Set(Object.keys(positions));
  const canvasElements = getCanvasElements()
    .filter((el) => positionIds.has(el.id))
    .map((el) => JSON.parse(JSON.stringify(el)) as CanvasElement);

  return {
    id: `snap-${Date.now().toString(36)}`,
    name: name.trim() || new Date().toLocaleString(),
    family,
    positions: JSON.parse(JSON.stringify(positions)) as Record<string, FreeLayoutPosition>,
    pages: JSON.parse(JSON.stringify(doc.pages)) as CanvasPagesDocument,
    layers: JSON.parse(JSON.stringify(doc.layers)) as CanvasLayerDocument,
    canvasElements,
    savedAt: Date.now(),
  };
}

export function applyLayoutFullSnapshot(snapshot: LayoutFullSnapshot): boolean {
  if (snapshot.canvasElements.length > 0) {
    mergeCanvasElementsForSnapshot(snapshot.canvasElements);
  }
  return applyCanvasUndoSnapshot({
    family: snapshot.family,
    positions: snapshot.positions,
    pages: snapshot.pages,
    layers: snapshot.layers,
  });
}

export function deleteLayoutSnapshot(id: string): LayoutFullSnapshot[] {
  const next = readRawSnapshots().filter((snap) => snap.id !== id);
  writeSnapshots(next);
  return next;
}

export function saveLayoutSnapshot(snapshot: LayoutFullSnapshot): LayoutFullSnapshot[] {
  const next = [snapshot, ...readRawSnapshots().filter((s) => s.id !== snapshot.id)].slice(0, MAX_LAYOUT_SNAPSHOTS);
  writeSnapshots(next);
  return next;
}
