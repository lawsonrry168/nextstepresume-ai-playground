import type { FreeLayoutPosition } from "./resumeFreeLayout";
import type { CanvasLayerDocument, CanvasPagesDocument } from "./canvasStudioTypes";

/**
 * Bridge between layout/canvas hooks and the global undo history.
 * Content edits, layout drags, page changes, and layer ops share Ctrl+Z / Ctrl+Shift+Z.
 */

export interface LayoutPositionsSnapshot {
  family: string;
  positions: Record<string, FreeLayoutPosition>;
}

export interface CanvasDocumentSnapshot {
  family: string;
  pages: CanvasPagesDocument;
  layers: CanvasLayerDocument;
}

export interface CanvasUndoSnapshot {
  family: string;
  positions: Record<string, FreeLayoutPosition>;
  pages?: CanvasPagesDocument;
  layers?: CanvasLayerDocument;
}

interface LayoutUndoBridge {
  family: string;
  applyPositions: (positions: Record<string, FreeLayoutPosition>) => void;
}

interface CanvasUndoBridge {
  family: string;
  applyCanvasDocument: (snapshot: CanvasDocumentSnapshot) => void;
}

let layoutBridge: LayoutUndoBridge | null = null;
let canvasBridge: CanvasUndoBridge | null = null;
let suppressEmitUntil = 0;

const layoutListeners = new Set<(snapshot: LayoutPositionsSnapshot) => void>();
const canvasListeners = new Set<(snapshot: CanvasDocumentSnapshot) => void>();

export function registerLayoutUndoBridge(next: LayoutUndoBridge): () => void {
  layoutBridge = next;
  return () => {
    if (layoutBridge === next) layoutBridge = null;
  };
}

export function registerCanvasUndoBridge(next: CanvasUndoBridge): () => void {
  canvasBridge = next;
  return () => {
    if (canvasBridge === next) canvasBridge = null;
  };
}

export function applyLayoutUndoPositions(snapshot: LayoutPositionsSnapshot): boolean {
  if (!layoutBridge || layoutBridge.family !== snapshot.family) return false;
  suppressEmitUntil = Date.now() + 900;
  layoutBridge.applyPositions(snapshot.positions);
  return true;
}

export function applyCanvasUndoDocument(snapshot: CanvasDocumentSnapshot): boolean {
  if (!canvasBridge || canvasBridge.family !== snapshot.family) return false;
  suppressEmitUntil = Date.now() + 900;
  canvasBridge.applyCanvasDocument(snapshot);
  return true;
}

export function applyCanvasUndoSnapshot(snapshot: CanvasUndoSnapshot): boolean {
  const layoutOk = applyLayoutUndoPositions({
    family: snapshot.family,
    positions: snapshot.positions,
  });

  // A canvas-document portion is only valid when BOTH pages and layers are
  // present (they are always captured together). Ignore a partial snapshot.
  const hasCanvasDoc = Boolean(snapshot.pages && snapshot.layers);
  const canvasOk = hasCanvasDoc
    ? applyCanvasUndoDocument({
        family: snapshot.family,
        pages: snapshot.pages!,
        layers: snapshot.layers!,
      })
    : true;

  // Require every captured portion to apply. Reporting success on a partial
  // restore would push a corrupt entry onto the redo stack.
  return hasCanvasDoc ? layoutOk && canvasOk : layoutOk;
}

export function emitLayoutPositions(snapshot: LayoutPositionsSnapshot): void {
  if (Date.now() < suppressEmitUntil) return;
  for (const listener of layoutListeners) listener(snapshot);
}

export function emitCanvasDocumentChange(snapshot: CanvasDocumentSnapshot): void {
  if (Date.now() < suppressEmitUntil) return;
  for (const listener of canvasListeners) listener(snapshot);
}

export function subscribeLayoutPositions(
  listener: (snapshot: LayoutPositionsSnapshot) => void,
): () => void {
  layoutListeners.add(listener);
  return () => {
    layoutListeners.delete(listener);
  };
}

export function subscribeCanvasDocument(
  listener: (snapshot: CanvasDocumentSnapshot) => void,
): () => void {
  canvasListeners.add(listener);
  return () => {
    canvasListeners.delete(listener);
  };
}
