// @vitest-environment happy-dom
import { describe, expect, it, beforeEach } from "vitest";
import {
  clearCanvasClipboard,
  copyCanvasSelection,
  duplicateCanvasSelection,
  hasCanvasClipboard,
  pasteCanvasClipboard,
} from "../lib/canvasClipboard";
import { addCanvasElement } from "../lib/canvasElements";
import type { FreeLayoutPosition } from "../lib/resumeFreeLayout";

describe("canvasClipboard", () => {
  beforeEach(() => {
    clearCanvasClipboard();
  });

  it("does not copy resume section singletons (only elements are copyable)", () => {
    const positions: Record<string, FreeLayoutPosition> = {
      summary: { x: 40, y: 60, width: 320, height: 120 },
    };
    // Resume sections are singletons backed by resumeData — copy must be a no-op
    // so that paste never silently "moves" the original.
    expect(copyCanvasSelection("modern", ["summary"], positions)).toBe(false);
    expect(hasCanvasClipboard("modern")).toBe(false);
    const applied: Array<[string, FreeLayoutPosition]> = [];
    const pasted = pasteCanvasClipboard({
      family: "modern",
      activePageId: "page-1",
      applyPosition: (id, pos) => {
        applied.push([id, pos]);
      },
    });
    expect(pasted).toEqual([]);
    expect(applied).toHaveLength(0);
  });

  it("duplicates canvas elements with new ids", () => {
    const el = addCanvasElement("text");
    expect(el).toBeTruthy();
    const positions: Record<string, FreeLayoutPosition> = {
      [el!.id]: { x: 10, y: 20, width: 200, height: 80, pageId: "page-1" },
    };
    const pasted = duplicateCanvasSelection("modern", [el!.id], positions, {
      family: "modern",
      activePageId: "page-2",
      applyPosition: (id, pos) => {
        positions[id] = pos;
      },
    });
    expect(pasted).toHaveLength(1);
    expect(pasted[0]).not.toBe(el!.id);
    expect(positions[pasted[0]!]?.pageId).toBe("page-2");
    expect(hasCanvasClipboard("modern")).toBe(true);
  });
});
