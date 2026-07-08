import { describe, expect, it, beforeEach, vi } from "vitest";
import { NSR_STORAGE_KEYS } from "../lib/storageKeys";
import {
  buildEmptyCanvasLayoutSnapshot,
  clearCanvasLayoutLocalStorage,
} from "../lib/sync/canvasLayoutSyncLocal";
import { getCanvasElements, hydrateCanvasElements, __resetCanvasElementsForTests } from "../lib/canvasElements";

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });
}

describe("canvas layout reset", () => {
  beforeEach(() => {
    installLocalStorageMock();
    __resetCanvasElementsForTests();
    hydrateCanvasElements([]);
  });

  it("buildEmptyCanvasLayoutSnapshot returns empty payload with timestamp", () => {
    const snapshot = buildEmptyCanvasLayoutSnapshot();
    expect(snapshot.layoutPositions).toEqual({});
    expect(snapshot.canvasDocument).toEqual({});
    expect(snapshot.canvasElements).toEqual([]);
    expect(snapshot.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("clearCanvasLayoutLocalStorage removes canvas keys and custom elements", () => {
    localStorage.setItem(NSR_STORAGE_KEYS.freeLayoutByFamily, '{"modern":{}}');
    localStorage.setItem("nsr_canvas_document_v1", '{"modern":{}}');
    localStorage.setItem(NSR_STORAGE_KEYS.canvasPages, "{}");
    localStorage.setItem(NSR_STORAGE_KEYS.canvasViewport, "{}");
    localStorage.setItem("nsr_canvas_elements_v1", '[{"id":"el-text-1","kind":"text"}]');
    hydrateCanvasElements([{ id: "el-text-1", kind: "text", text: "Hi" }]);

    clearCanvasLayoutLocalStorage();

    expect(localStorage.getItem(NSR_STORAGE_KEYS.freeLayoutByFamily)).toBeNull();
    expect(localStorage.getItem("nsr_canvas_document_v1")).toBeNull();
    expect(localStorage.getItem(NSR_STORAGE_KEYS.canvasPages)).toBeNull();
    expect(localStorage.getItem(NSR_STORAGE_KEYS.canvasViewport)).toBeNull();
    expect(getCanvasElements()).toEqual([]);
  });
});
