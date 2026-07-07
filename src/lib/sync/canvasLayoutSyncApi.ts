import { withApiAuthHeaders } from "../apiAuthHeaders";
import type { CanvasLayoutSyncSnapshot } from "./canvasLayoutSyncLocal";

/**
 * Fetch the remote canvas layout.
 * - Returns `null` only when the remote genuinely has no record yet (HTTP 404
 *   or an empty/malformed payload with no `updatedAt`).
 * - Throws on network failures or non-404 server errors so callers can avoid
 *   clobbering remote state by mistaking an error for "no remote".
 */
export async function fetchRemoteCanvasLayout(): Promise<CanvasLayoutSyncSnapshot | null> {
  const response = await fetch("/api/sync/canvas-layout", {
    headers: withApiAuthHeaders(),
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`canvas-layout fetch failed: ${response.status}`);
  }
  const data = (await response.json()) as CanvasLayoutSyncSnapshot;
  if (!data.updatedAt) return null;
  return data;
}

export async function pushRemoteCanvasLayout(snapshot: CanvasLayoutSyncSnapshot): Promise<string | null> {
  const response = await fetch("/api/sync/canvas-layout", {
    method: "PUT",
    headers: withApiAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(snapshot),
  });
  if (!response.ok) {
    throw new Error(`canvas-layout push failed: ${response.status}`);
  }
  const data = (await response.json()) as { updatedAt?: string };
  return data.updatedAt ?? snapshot.updatedAt;
}
