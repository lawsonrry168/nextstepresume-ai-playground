import { describe, expect, it } from "vitest";
import { editorPositionsFromPrintPlan } from "../lib/layoutDocument";
import type { PrintExportPlan } from "../lib/layoutExportSurface";
import {
  exportSectionsFromPrintPlan,
  makeFragmentId,
} from "../lib/layoutEntryPagination";
import type { FreeLayoutPosition } from "../lib/resumeFreeLayout";

const pos = (over: Partial<FreeLayoutPosition>): FreeLayoutPosition => ({
  x: 48,
  y: 48,
  width: 680,
  height: 200,
  ...over,
});

describe("editorPositionsFromPrintPlan (H1)", () => {
  it("collapses an entry-split section back onto its first fragment", () => {
    const plan: PrintExportPlan = {
      pageIds: ["page-1", "export-page-2"],
      positions: {
        header: pos({ y: 48, height: 120, pageId: "page-1" }),
        summary: pos({ y: 200, height: 100, pageId: "page-1" }),
        [makeFragmentId("experience", 0)]: pos({ y: 320, height: 500, pageId: "page-1" }),
        [makeFragmentId("experience", 1)]: pos({ y: 48, height: 300, pageId: "export-page-2" }),
      },
    };

    const editor = editorPositionsFromPrintPlan(["header", "experience", "summary"], plan);

    // Base "experience" adopts the first fragment's placement.
    expect(editor.experience).toBeDefined();
    expect(editor.experience!.pageId).toBe("page-1");
    expect(editor.experience!.y).toBe(320);
    // No fragment ghost keys leak into the editor state.
    expect(editor[makeFragmentId("experience", 0)]).toBeUndefined();
    expect(editor[makeFragmentId("experience", 1)]).toBeUndefined();
    // Untouched sections carry through.
    expect(editor.header).toBeDefined();
    expect(editor.summary).toBeDefined();
  });
});

describe("exportSectionsFromPrintPlan (M3)", () => {
  it("orders sections and fragments by layer order", () => {
    const positions: Record<string, FreeLayoutPosition> = {
      header: pos({ pageId: "page-1" }),
      [makeFragmentId("experience", 1)]: pos({ pageId: "export-page-2" }),
      [makeFragmentId("experience", 0)]: pos({ pageId: "page-1" }),
      summary: pos({ pageId: "page-1" }),
    };
    const layerOrder = ["summary", "experience", "header"];

    const ordered = exportSectionsFromPrintPlan(
      ["header", "experience", "summary"],
      positions,
      layerOrder,
    );

    expect(ordered).toEqual([
      "summary",
      makeFragmentId("experience", 0),
      makeFragmentId("experience", 1),
      "header",
    ]);
  });

  it("falls back to base section order when no layer order is given", () => {
    const positions: Record<string, FreeLayoutPosition> = {
      summary: pos({}),
      header: pos({}),
    };
    const ordered = exportSectionsFromPrintPlan(["header", "summary"], positions);
    expect(ordered).toEqual(["header", "summary"]);
  });
});
