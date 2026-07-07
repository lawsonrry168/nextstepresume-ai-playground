// @vitest-environment happy-dom
import { describe, expect, it, beforeEach } from "vitest";
import {
  captureCurrentLayoutSnapshot,
  readLayoutSnapshots,
  saveLayoutSnapshot,
  LAYOUT_SNAPSHOTS_STORAGE_KEY,
} from "../lib/layoutSnapshots";
import { __resetCanvasDocumentStoreForTests } from "../lib/canvasDocument/store";

describe("layoutSnapshots", () => {
  beforeEach(() => {
    localStorage.clear();
    __resetCanvasDocumentStoreForTests();
  });

  it("captures and persists full layout snapshots", () => {
    localStorage.setItem(
      "nsr_free_layout_by_family",
      JSON.stringify({
        modern: {
          summary: { x: 12, y: 24, width: 300, height: 100 },
        },
      }),
    );

    const snapshot = captureCurrentLayoutSnapshot("modern", "投行版", ["summary"]);
    expect(snapshot).toBeTruthy();
    expect(snapshot!.name).toBe("投行版");
    expect(snapshot!.positions.summary?.x).toBe(12);
    expect(snapshot!.pages.pages.length).toBeGreaterThan(0);

    saveLayoutSnapshot(snapshot!);
    const stored = readLayoutSnapshots();
    expect(stored).toHaveLength(1);
    expect(localStorage.getItem(LAYOUT_SNAPSHOTS_STORAGE_KEY)).toContain("投行版");
  });
});
