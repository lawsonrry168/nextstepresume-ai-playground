import type { FreeLayoutPosition } from "./resumeFreeLayout";

/**
 * Bridge between the free-layout hook (deep in the preview panel) and the
 * global undo history (top-level playground). Lets layout drags, presets,
 * and resets join the same Ctrl+Z / Ctrl+Shift+Z history as content edits.
 */

export interface LayoutPositionsSnapshot {
  family: string;
  positions: Record<string, FreeLayoutPosition>;
}

interface LayoutUndoBridge {
  family: string;
  applyPositions: (positions: Record<string, FreeLayoutPosition>) => void;
}

let bridge: LayoutUndoBridge | null = null;
let suppressEmitUntil = 0;
const listeners = new Set<(snapshot: LayoutPositionsSnapshot) => void>();

export function registerLayoutUndoBridge(next: LayoutUndoBridge): () => void {
  bridge = next;
  return () => {
    if (bridge === next) bridge = null;
  };
}

/** Apply positions from an undo/redo entry; ignored when the family no longer matches. */
export function applyLayoutUndoPositions(snapshot: LayoutPositionsSnapshot): boolean {
  if (!bridge || bridge.family !== snapshot.family) return false;
  suppressEmitUntil = Date.now() + 900;
  bridge.applyPositions(snapshot.positions);
  return true;
}

/** Called by the layout hook when the user changed positions (post-debounce). */
export function emitLayoutPositions(snapshot: LayoutPositionsSnapshot): void {
  if (Date.now() < suppressEmitUntil) return;
  for (const listener of listeners) listener(snapshot);
}

export function subscribeLayoutPositions(
  listener: (snapshot: LayoutPositionsSnapshot) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
