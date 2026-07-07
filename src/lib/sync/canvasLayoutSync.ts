import type { CanvasLayoutSyncSnapshot } from "./canvasLayoutSyncLocal";
import { applyCanvasLayoutSyncSnapshot } from "./canvasLayoutSyncLocal";
import { CANVAS_LAYOUT_CLOUD_KEY } from "./canvasLayoutSyncLocal";
import { fetchRemoteCanvasLayout, pushRemoteCanvasLayout } from "./canvasLayoutSyncApi";
import { isCloudSyncActive } from "./cloudSyncCoordinator";

let pushTimer: ReturnType<typeof setTimeout> | null = null;

type CanvasLayoutHydrateHandler = (snapshot: CanvasLayoutSyncSnapshot) => void;
let hydrateHandler: CanvasLayoutHydrateHandler | null = null;

function readLocalIso(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalIso(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function parseIso(value: string | null | undefined): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function shouldApplyRemote(remoteUpdatedAt: string, localKey: string): boolean {
  const remoteMs = parseIso(remoteUpdatedAt);
  const localMs = parseIso(readLocalIso(localKey));
  if (remoteMs === 0) return false;
  if (localMs === 0) return true;
  // Strictly greater: on equal timestamps favour local so concurrent edits are
  // not silently overwritten by a same-second remote snapshot.
  return remoteMs > localMs;
}

function shouldPushLocal(localUpdatedAt: string, remoteUpdatedAt: string | null | undefined): boolean {
  const localMs = parseIso(localUpdatedAt);
  const remoteMs = parseIso(remoteUpdatedAt);
  if (localMs === 0) return true;
  if (remoteMs === 0) return true;
  return localMs > remoteMs;
}

export function registerCanvasLayoutHydrateHandler(handler: CanvasLayoutHydrateHandler | null): () => void {
  hydrateHandler = handler;
  return () => {
    if (hydrateHandler === handler) hydrateHandler = null;
  };
}

export function scheduleCanvasLayoutCloudPush(
  snapshot: CanvasLayoutSyncSnapshot | (() => CanvasLayoutSyncSnapshot),
): void {
  if (!isCloudSyncActive()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    // Build the snapshot at fire-time so debounced localStorage writes have
    // flushed and we push the latest state exactly once per burst.
    const payload = typeof snapshot === "function" ? snapshot() : snapshot;
    void pushRemoteCanvasLayout(payload)
      .then((updatedAt) => {
        if (updatedAt) writeLocalIso(CANVAS_LAYOUT_CLOUD_KEY, updatedAt);
      })
      .catch(() => {
        // Network/server error — keep local state; next reconcile will retry.
      });
  }, 1800);
}

export async function reconcileCanvasLayoutCloud(localSnapshot: CanvasLayoutSyncSnapshot): Promise<void> {
  if (!isCloudSyncActive()) return;

  let remote: CanvasLayoutSyncSnapshot | null;
  try {
    remote = await fetchRemoteCanvasLayout();
  } catch {
    // Fetch failed (network/server error). Abort without pushing so we never
    // overwrite remote state on the basis of a failed read.
    return;
  }

  try {
    if (!remote) {
      const savedAt = await pushRemoteCanvasLayout(localSnapshot);
      if (savedAt) writeLocalIso(CANVAS_LAYOUT_CLOUD_KEY, savedAt);
      return;
    }

    if (shouldApplyRemote(remote.updatedAt, CANVAS_LAYOUT_CLOUD_KEY)) {
      // Persist to localStorage first, then reload hooks so they read fresh data.
      applyCanvasLayoutSyncSnapshot(remote);
      writeLocalIso(CANVAS_LAYOUT_CLOUD_KEY, remote.updatedAt);
      hydrateHandler?.(remote);
      return;
    }

    if (shouldPushLocal(localSnapshot.updatedAt, remote.updatedAt)) {
      const savedAt = await pushRemoteCanvasLayout(localSnapshot);
      if (savedAt) writeLocalIso(CANVAS_LAYOUT_CLOUD_KEY, savedAt);
    }
  } catch {
    // Push failed — keep local state; next reconcile retries.
  }
}

export { buildCanvasLayoutSyncSnapshot } from "./canvasLayoutSyncLocal";
