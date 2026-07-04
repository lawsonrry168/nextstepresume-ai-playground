import { describe, expect, it } from "vitest";
import { applyPageLayoutAction, assignAllSectionsToPage, reflowPageColumnsNatural, resolveLayoutTargetPageId, sortSectionsByPanelOrder, syncSectionHeightsToContentAllPages, syncSectionSizesToContentAllPages } from "../lib/canvasLayoutTools";
import { initialResumeData } from "../data";
import {
  estimateSectionHeightForContent,
  estimateSectionWidthForContent,
  getSectionTextLength,
  buildThemeFitSignature,
} from "../lib/canvasSectionContentSizing";
import { applyMagneticSnap } from "../lib/resumeFreeLayout";
import { CANVAS_PAGE_MARGIN } from "../lib/canvasAlignTools";
import { alignPositionOnPage, nudgePosition, centerOnPage, fillPageWidth, snapPositionToGrid, resizeSection, resetSectionPosition } from "../lib/canvasAlignTools";
import { detectPageSnapEdge, resolveBoundaryPageCross, clampPositionToA4Page, maxSectionHeightOnPage } from "../lib/canvasPageSnap";
import { estimatePdfPageCount } from "../lib/canvasPdfPagination";
import { syncPagesDocumentToPositions } from "../hooks/useCanvasDocument";
import {
  CANVAS_VIEWPORT_DEFAULTS,
  CANVAS_ZOOM_MAX,
  CANVAS_ZOOM_MIN,
  CANVAS_PAGE_HEIGHT,
  CANVAS_PAGE_GAP,
  clampCanvasZoom,
  computeMultiPageDeskHeight,
  clampGridStrength,
  CANVAS_GRID_STRENGTH_DEFAULT,
  gridStrengthToOpacity,
  normalizeNavSectionOrder,
  reorderNavSection,
  createDefaultPagesDocument,
  getPageTopOffset,
  layerZIndex,
  normalizeCanvasViewport,
  normalizeLayerDocument,
  normalizePagesDocument,
  reorderLayerInPanel,
} from "../lib/canvasStudioTypes";

describe("canvasStudioTypes", () => {
  it("clamps zoom within bounds", () => {
    expect(clampCanvasZoom(0.1)).toBe(CANVAS_ZOOM_MIN);
    expect(clampCanvasZoom(3)).toBe(CANVAS_ZOOM_MAX);
    expect(clampCanvasZoom(0.72)).toBe(0.72);
  });

  it("normalizes partial viewport state", () => {
    expect(normalizeCanvasViewport({ zoom: 5 })).toEqual({
      panX: CANVAS_VIEWPORT_DEFAULTS.panX,
      panY: CANVAS_VIEWPORT_DEFAULTS.panY,
      zoom: CANVAS_ZOOM_MAX,
    });
    expect(normalizeCanvasViewport({ panX: 12, panY: -8, zoom: 0.5 })).toEqual({
      panX: 12,
      panY: -8,
      zoom: 0.5,
    });
  });

  it("normalizes pages document with fallback", () => {
    const doc = normalizePagesDocument({ pages: [], activePageId: "x" });
    expect(doc.pages.length).toBe(1);
    expect(doc.activePageId).toBe(doc.pages[0].id);
  });

  it("normalizes layer order with new sections", () => {
    const layers = normalizeLayerDocument({ order: ["header"], hidden: {}, locked: {} }, [
      "header",
      "skills",
    ]);
    expect(layers.order).toEqual(["header", "skills"]);
  });

  it("computes multi-page desk height", () => {
    expect(computeMultiPageDeskHeight(1)).toBe(CANVAS_PAGE_HEIGHT);
    expect(computeMultiPageDeskHeight(2)).toBe(CANVAS_PAGE_HEIGHT * 2 + CANVAS_PAGE_GAP);
  });

  it("computes page top offsets", () => {
    expect(getPageTopOffset(0)).toBe(0);
    expect(getPageTopOffset(1)).toBe(CANVAS_PAGE_HEIGHT + CANVAS_PAGE_GAP);
  });

  it("assigns z-index from layer order", () => {
    expect(layerZIndex("a", ["a", "b", "c"])).toBe(10);
    expect(layerZIndex("c", ["a", "b", "c"])).toBe(12);
  });

  it("creates default pages document", () => {
    const doc = createDefaultPagesDocument();
    expect(doc.pages).toHaveLength(1);
    expect(doc.activePageId).toBe(doc.pages[0].id);
  });

  it("syncs canvas pages to section page ids when imported layout uses new pages", () => {
    const current = {
      pages: [{ id: "page-local", label: "Page 1" }],
      activePageId: "page-local",
    };
    const positions = {
      header: { x: 48, y: 48, width: 698, height: 120, pageId: "export-page-1" },
      experience: { x: 48, y: 48, width: 698, height: 240, pageId: "export-page-2" },
    };
    const synced = syncPagesDocumentToPositions(current, ["header", "experience"], positions);
    expect(synced.pages.map((page) => page.id)).toEqual(["export-page-1", "export-page-2"]);
    expect(synced.activePageId).toBe("export-page-1");
  });

  it("reorders layers in panel drag order", () => {
    const next = reorderLayerInPanel(["a", "b", "c"], "c", "a", "before");
    expect(next.indexOf("c")).toBeGreaterThan(next.indexOf("a"));
  });

  it("clamps grid strength to 10–100", () => {
    expect(clampGridStrength(5)).toBe(10);
    expect(clampGridStrength(150)).toBe(100);
    expect(clampGridStrength(55)).toBe(55);
    expect(clampGridStrength(undefined)).toBe(CANVAS_GRID_STRENGTH_DEFAULT);
    expect(gridStrengthToOpacity(50)).toBe(0.5);
  });

  it("normalizes and reorders nav sections", () => {
    expect(normalizeNavSectionOrder(["layout", "view", "unknown"])).toEqual([
      "layout",
      "view",
      "align",
      "layers",
      "size",
      "page",
    ]);
    const order = normalizeNavSectionOrder(undefined);
    expect(reorderNavSection(order, "page", "view", "before")).toEqual([
      "layout",
      "align",
      "page",
      "view",
      "layers",
      "size",
    ]);
  });
});

describe("canvasPageSnap", () => {
  it("detects top and bottom snap edges", () => {
    expect(detectPageSnapEdge(20, 100)).toBe("top");
    expect(detectPageSnapEdge(1100, 100)).toBe("bottom");
    expect(detectPageSnapEdge(200, 100)).toBe(null);
  });

  it("resolves cross-page boundary at bottom edge", () => {
    const result = resolveBoundaryPageCross(1080, 100, 0, ["p1", "p2"]);
    expect(result).toEqual({ pageId: "p2", y: 48 });
  });

  it("resolves cross-page boundary at top edge", () => {
    const result = resolveBoundaryPageCross(20, 100, 1, ["p1", "p2"]);
    expect(result?.pageId).toBe("p1");
  });

  it("clamps section position within A4 page bounds", () => {
    const clamped = clampPositionToA4Page({ x: 700, y: 1000, width: 400, height: 300 });
    expect(clamped.x + clamped.width).toBeLessThanOrEqual(794);
    expect(clamped.y + clamped.height).toBeLessThanOrEqual(1123);
    expect(clamped.x).toBeGreaterThanOrEqual(0);
    expect(clamped.y).toBeGreaterThanOrEqual(0);
  });

  it("computes max section height from y offset on page", () => {
    expect(maxSectionHeightOnPage(48)).toBe(1027);
    expect(maxSectionHeightOnPage(1100)).toBe(72);
  });
});

describe("canvasAlignTools", () => {
  const base = { x: 100, y: 200, width: 300, height: 120 };

  it("aligns section horizontally on page", () => {
    expect(alignPositionOnPage(base, "center", undefined).x).toBe(Math.round((794 - 300) / 2));
    expect(alignPositionOnPage(base, "right", undefined).x).toBe(794 - 300);
    expect(alignPositionOnPage(base, "left", undefined).x).toBe(0);
  });

  it("nudges section within page bounds", () => {
    const moved = nudgePosition(base, 10, -5);
    expect(moved.x).toBe(110);
    expect(moved.y).toBe(195);
  });

  it("centers section on page", () => {
    const centered = centerOnPage(base);
    expect(centered.x).toBe(Math.round((794 - 300) / 2));
    expect(centered.y).toBe(Math.round((1123 - 120) / 2));
  });

  it("fills section to page width with margin", () => {
    const filled = fillPageWidth(base);
    expect(filled.x).toBe(48);
    expect(filled.width).toBe(794 - 96);
  });

  it("snaps section position to grid", () => {
    const snapped = snapPositionToGrid({ x: 101, y: 205, width: 310, height: 125 });
    expect(snapped.x % 24).toBe(0);
    expect(snapped.y % 24).toBe(0);
  });

  it("resizes section by grid step", () => {
    const grown = resizeSection(base, 1, 1);
    expect(grown.width).toBe(base.width + 24);
    expect(grown.height).toBe(base.height + 24);
  });

  it("resets section to default position", () => {
    const defaults = { x: 48, y: 48, width: 698, height: 150 };
    const reset = resetSectionPosition("header", { ...base, height: 200 }, defaults);
    expect(reset.x).toBe(48);
    expect(reset.width).toBe(698);
  });
});

describe("canvasLayoutTools", () => {
  const pageId = "p1";
  const getPageId = () => pageId;
  const sectionIds = ["header", "summary", "experience"];
  const positions = {
    header: { x: 10, y: 10, width: 300, height: 120 },
    summary: { x: 20, y: 200, width: 280, height: 100 },
    experience: { x: 30, y: 400, width: 320, height: 200, pageId: "p1" },
  };

  it("stacks sections vertically on page", () => {
    const result = applyPageLayoutAction("stack", sectionIds, positions, pageId, getPageId);
    expect(result.header.x).toBe(48);
    expect(result.summary.y).toBeGreaterThan(result.header.y);
    expect(result.experience.y).toBeGreaterThan(result.summary.y);
  });

  it("stack-compact uses tighter gaps than fill-page stack when resume data is present", async () => {
    const { initialResumeData } = await import("../data");
    // Content set chosen to genuinely fit one A4 page with accurate heights —
    // the compact-vs-natural gap invariant is only physical when slack exists.
    const ids = ["header", "summary", "education", "skills", "languages"];
    const loose = {
      header: { x: 48, y: 48, width: 698, height: 200, pageId },
      summary: { x: 48, y: 300, width: 698, height: 200, pageId },
      education: { x: 48, y: 600, width: 698, height: 120, pageId },
      skills: { x: 48, y: 760, width: 698, height: 120, pageId },
      languages: { x: 48, y: 920, width: 698, height: 80, pageId },
    };
    const content = { resumeData: initialResumeData };
    const stacked = applyPageLayoutAction("stack", ids, loose, pageId, getPageId, undefined, content);
    const compact = applyPageLayoutAction("stack-compact", ids, loose, pageId, getPageId, undefined, content);

    const stackGap = stacked.summary.y - (stacked.header.y + stacked.header.height);
    const compactGap = compact.summary.y - (compact.header.y + compact.header.height);

    expect(compactGap).toBeLessThanOrEqual(12);
    expect(compactGap).toBeLessThan(stackGap);
    expect(compact.languages.y + compact.languages.height).toBeLessThanOrEqual(1123 - 48 + 8);
  });

  it("layouts two columns on page", () => {
    const layerOrder = ["experience", "summary", "header"];
    const result = applyPageLayoutAction("two-column", sectionIds, positions, pageId, getPageId, undefined, {
      layerOrder,
    });
    const xs = new Set([result.header.x, result.summary.x, result.experience.x]);
    expect(xs.size).toBe(2);
    expect(result.header.y).toBeLessThan(result.experience.y);
  });

  it("sorts stack order by layer panel not canvas y", () => {
    const layerOrder = ["projects", "skills", "education", "experience", "summary", "header"];
    const ids = ["header", "summary", "experience", "education", "skills", "projects"];
    const messy = {
      header: { x: 48, y: 900, width: 300, height: 80 },
      summary: { x: 48, y: 100, width: 300, height: 80 },
      experience: { x: 48, y: 500, width: 300, height: 80 },
      education: { x: 48, y: 700, width: 300, height: 80 },
      skills: { x: 48, y: 300, width: 300, height: 80 },
      projects: { x: 48, y: 50, width: 300, height: 80 },
    };
    const result = applyPageLayoutAction("stack", ids, messy, pageId, getPageId, undefined, { layerOrder });
    expect(result.header.y).toBeLessThan(result.summary.y);
    expect(result.summary.y).toBeLessThan(result.experience.y);
    expect(result.experience.y).toBeLessThan(result.education.y);
    expect(result.education.y).toBeLessThan(result.skills.y);
    expect(result.skills.y).toBeLessThan(result.projects.y);
  });

  it("sortSectionsByPanelOrder matches layer panel top-first", () => {
    expect(sortSectionsByPanelOrder(["c", "a", "b"], ["a", "b", "c"])).toEqual(["c", "b", "a"]);
  });

  it("equalizes widths using reference section", () => {
    const result = applyPageLayoutAction("equalize-width", sectionIds, positions, pageId, getPageId, "header");
    expect(result.summary.width).toBe(300);
    expect(result.experience.width).toBe(300);
  });

  it("fits each section width from content when resume data provided", () => {
    const result = applyPageLayoutAction(
      "equalize-width",
      sectionIds,
      positions,
      pageId,
      getPageId,
      undefined,
      { resumeData: initialResumeData },
    );
    for (const id of sectionIds) {
      const expectedW = estimateSectionWidthForContent(
        id,
        initialResumeData,
        698,
        positions[id as keyof typeof positions].x,
      );
      expect(result[id as keyof typeof result].width).toBe(expectedW);
    }
  });

  it("fits heights to content when resume data provided", () => {
    const result = applyPageLayoutAction(
      "equalize-height",
      sectionIds,
      positions,
      pageId,
      getPageId,
      undefined,
      { resumeData: initialResumeData },
    );
    for (const id of sectionIds) {
      const expected = estimateSectionHeightForContent(id, initialResumeData, positions[id as keyof typeof positions].width);
      expect(result[id as keyof typeof result].height).toBe(expected);
    }
  });

  it("mirrors columns horizontally", () => {
    const result = applyPageLayoutAction("mirror-columns", sectionIds, positions, pageId, getPageId);
    expect(result.header.x).toBe(794 - positions.header.x - positions.header.width);
  });

  it("snaps all sections to grid on page", () => {
    const result = applyPageLayoutAction("snap-grid", sectionIds, positions, pageId, getPageId);
    expect(result.header.x % 24).toBe(0);
    expect(result.summary.y % 24).toBe(0);
  });

  it("stacks sections with content-aware heights when resume data provided", () => {
    const result = applyPageLayoutAction(
      "stack",
      sectionIds,
      positions,
      pageId,
      getPageId,
      undefined,
      { resumeData: initialResumeData },
    );
    const stackWidth = result.header.width;
    for (const id of sectionIds) {
      expect(result[id as keyof typeof result].width).toBe(stackWidth);
      expect(result[id as keyof typeof result].height).toBe(
        estimateSectionHeightForContent(id, initialResumeData, stackWidth),
      );
    }
    expect(result.experience.height).toBeGreaterThan(result.header.height);
  });

  it("layouts two columns with content-aware column heights", () => {
    const layerOrder = ["experience", "summary", "header"];
    const result = applyPageLayoutAction(
      "two-column",
      sectionIds,
      positions,
      pageId,
      getPageId,
      undefined,
      { resumeData: initialResumeData, layerOrder },
    );
    const xs = new Set([result.header.x, result.summary.x, result.experience.x]);
    expect(xs.size).toBe(2);
    expect(result.experience.height).toBe(
      estimateSectionHeightForContent("experience", initialResumeData, result.experience.width),
    );
  });

  it("layouts three columns on page", () => {
    const result = applyPageLayoutAction("three-column", sectionIds, positions, pageId, getPageId);
    const xs = new Set([result.header.x, result.summary.x, result.experience.x]);
    expect(xs.size).toBeGreaterThan(1);
  });

  it("distributes sections with equal gaps across A4 printable height", () => {
    const sparse = {
      header: { x: 48, y: 48, width: 300, height: 80 },
      summary: { x: 48, y: 400, width: 300, height: 80 },
      experience: { x: 48, y: 800, width: 300, height: 80 },
    };
    const result = applyPageLayoutAction("distribute", sectionIds, sparse, pageId, getPageId);
    const gap1 = result.summary.y - (result.header.y + result.header.height);
    const gap2 = result.experience.y - (result.summary.y + result.summary.height);
    expect(gap1).toBeGreaterThan(20);
    expect(gap1).toBe(gap2);
    expect(result.header.y).toBe(CANVAS_PAGE_MARGIN);
  });

  it("aligns stack to A4 page bottom", () => {
    const sparse = {
      header: { x: 48, y: 48, width: 300, height: 80 },
      summary: { x: 48, y: 120, width: 300, height: 80 },
      experience: { x: 48, y: 200, width: 300, height: 80 },
    };
    const result = applyPageLayoutAction("align-page-bottom", sectionIds, sparse, pageId, getPageId);
    expect(result.experience.y + result.experience.height).toBe(CANVAS_PAGE_HEIGHT - CANVAS_PAGE_MARGIN);
    expect(result.header.y).toBeGreaterThan(CANVAS_PAGE_MARGIN);
  });

  it("fills page height with content-aware sizing", () => {
    const sparse = {
      header: { x: 48, y: 48, width: 698, height: 80 },
      summary: { x: 48, y: 200, width: 698, height: 80 },
      experience: { x: 48, y: 400, width: 698, height: 80 },
    };
    const result = applyPageLayoutAction(
      "fill-page-height",
      sectionIds,
      sparse,
      pageId,
      getPageId,
      undefined,
      { resumeData: initialResumeData },
    );
    expect(result.experience.y + result.experience.height).toBe(CANVAS_PAGE_HEIGHT - CANVAS_PAGE_MARGIN);
    expect(result.experience.height).toBeGreaterThan(result.header.height);
  });

  it("distributes with content-aware heights when resume data provided", () => {
    const sparse = {
      header: { x: 48, y: 48, width: 698, height: 80 },
      summary: { x: 48, y: 400, width: 698, height: 80 },
      experience: { x: 48, y: 800, width: 698, height: 80 },
    };
    const result = applyPageLayoutAction(
      "distribute",
      sectionIds,
      sparse,
      pageId,
      getPageId,
      undefined,
      { resumeData: initialResumeData },
    );
    expect(result.experience.height).toBeGreaterThan(result.header.height);
    expect(getSectionTextLength("experience", initialResumeData)).toBeGreaterThan(
      getSectionTextLength("header", initialResumeData),
    );
  });

  it("syncSectionHeightsToContentAllPages preserves column widths and x positions", () => {
    const layerOrder = ["experience", "summary", "header"];
    const twoCol = applyPageLayoutAction("two-column", sectionIds, positions, pageId, getPageId, undefined, {
      resumeData: initialResumeData,
      layerOrder,
    });
    const synced = syncSectionHeightsToContentAllPages(
      sectionIds,
      twoCol,
      [pageId],
      getPageId,
      { resumeData: initialResumeData, layerOrder },
    );
    for (const id of sectionIds) {
      expect(synced[id as keyof typeof synced].width).toBe(twoCol[id as keyof typeof twoCol].width);
      expect(synced[id as keyof typeof synced].x).toBe(twoCol[id as keyof typeof twoCol].x);
      expect(synced[id as keyof typeof synced].height).toBe(
        estimateSectionHeightForContent(id, initialResumeData, twoCol[id as keyof typeof twoCol].width),
      );
    }
  });

  it("syncSectionSizesToContentAllPages with resizeWidth false does not expand narrow columns", () => {
    const narrow = {
      header: { x: 48, y: 48, width: 320, height: 120 },
      summary: { x: 48, y: 200, width: 310, height: 100 },
      experience: { x: 400, y: 48, width: 330, height: 200, pageId: "p1" },
    };
    const fullWidth = syncSectionSizesToContentAllPages(
      sectionIds,
      narrow,
      [pageId],
      getPageId,
      { resumeData: initialResumeData },
      { reflow: false, resizeWidth: true },
    );
    const heightOnly = syncSectionSizesToContentAllPages(
      sectionIds,
      narrow,
      [pageId],
      getPageId,
      { resumeData: initialResumeData },
      { reflow: false, resizeWidth: false },
    );
    expect(fullWidth.experience.width).toBeGreaterThan(narrow.experience.width);
    expect(heightOnly.experience.width).toBe(narrow.experience.width);
    expect(heightOnly.summary.width).toBe(narrow.summary.width);
  });

  it("reflowPageColumnsNatural stacks sections without y overlap in each column", () => {
    const layerOrder = ["experience", "summary", "header", "education", "skills", "projects"];
    const ids = ["header", "summary", "experience", "education", "skills", "projects"];
    const twoCol = applyPageLayoutAction("two-column", ids, positions, pageId, getPageId, undefined, {
      resumeData: initialResumeData,
      layerOrder,
    });
    const inflated = {
      ...twoCol,
      header: { ...twoCol.header, height: twoCol.header.height + 120 },
      experience: { ...twoCol.experience, height: twoCol.experience.height + 200 },
    };
    const reflowed = reflowPageColumnsNatural(ids, inflated, pageId, getPageId, {
      resumeData: initialResumeData,
      layerOrder,
    });

    const present = ids.filter((id) => reflowed[id]);
    const columnIds = (anchorX: number) =>
      present.filter((id) => Math.abs((reflowed[id]?.x ?? 0) - anchorX) <= 48);

    const anchors = [...new Set(present.map((id) => reflowed[id]!.x))];
    for (const anchor of anchors) {
      const col = columnIds(anchor).sort(
        (a, b) => (reflowed[a]!.y ?? 0) - (reflowed[b]!.y ?? 0),
      );
      for (let i = 1; i < col.length; i++) {
        const prev = reflowed[col[i - 1]!]!;
        const cur = reflowed[col[i]!]!;
        expect(prev.y + prev.height).toBeLessThanOrEqual(cur.y + 2);
      }
    }
  });
});

describe("buildThemeFitSignature", () => {
  it("changes when template or theme font size changes", () => {
    const base = { enabled: true, baseFontSize: 14, bodyFont: null, headingFont: null, lineHeight: null, sectionSpacing: null };
    const a = buildThemeFitSignature("modern-01", "modern", base);
    const b = buildThemeFitSignature("classic-01", "classic", base);
    const c = buildThemeFitSignature("modern-01", "modern", { ...base, baseFontSize: 18 });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("resolveLayoutTargetPageId", () => {
  const sectionIds = ["header", "summary", "experience"];
  const positions = {
    header: { x: 48, y: 48, width: 300, height: 120, pageId: "page-b" },
    summary: { x: 48, y: 200, width: 300, height: 120, pageId: "page-b" },
    experience: { x: 48, y: 360, width: 300, height: 200, pageId: "page-b" },
  };
  const pages = [{ id: "page-a" }, { id: "page-b" }];
  const getPageId = (id: string) => positions[id as keyof typeof positions]?.pageId ?? "page-a";

  it("keeps active page when it already has sections", () => {
    const onActive = {
      ...positions,
      header: { ...positions.header, pageId: "page-a" },
    };
    expect(
      resolveLayoutTargetPageId(sectionIds, onActive, pages, "page-a", (id) => onActive[id as keyof typeof onActive]?.pageId ?? "page-a"),
    ).toBe("page-a");
  });

  it("falls back to the page with the most sections", () => {
    expect(resolveLayoutTargetPageId(sectionIds, positions, pages, "page-a", getPageId)).toBe("page-b");
  });
});

describe("assignAllSectionsToPage", () => {
  it("patches only sections that need a new pageId", () => {
    const positions = {
      header: { x: 48, y: 48, width: 300, height: 120, pageId: "page-a" },
      summary: { x: 48, y: 200, width: 300, height: 120, pageId: "page-b" },
    };
    const patches = assignAllSectionsToPage(["header", "summary"], positions, "page-a");
    expect(patches.header).toBeUndefined();
    expect(patches.summary?.pageId).toBe("page-a");
  });
});

describe("magneticSnap", () => {
  it("preserves pageId and snaps to margin on canvas", () => {
    const positions = {
      header: { x: 50, y: 50, width: 300, height: 120, pageId: "p1" },
      summary: { x: 52, y: 200, width: 280, height: 100, pageId: "p1" },
      experience: { x: 48, y: 180, width: 320, height: 200, pageId: "p2" },
    };
    const snapped = applyMagneticSnap("header", { ...positions.header, x: 51, y: 51 }, positions, 794, {
      pageHeight: 1123,
      pageId: "p1",
      margin: CANVAS_PAGE_MARGIN,
    });
    expect(snapped.pageId).toBe("p1");
    expect(snapped.x).toBe(CANVAS_PAGE_MARGIN);
    expect(snapped.y).toBe(CANVAS_PAGE_MARGIN);
  });

  it("ignores sections on other pages when snapping", () => {
    const positions = {
      a: { x: 100, y: 100, width: 200, height: 100, pageId: "p1" },
      b: { x: 102, y: 102, width: 200, height: 100, pageId: "p2" },
    };
    const snapped = applyMagneticSnap("a", { ...positions.a, x: 101, y: 101 }, positions, 794, {
      pageId: "p1",
      margin: CANVAS_PAGE_MARGIN,
    });
    expect(snapped.x).not.toBe(102);
  });
});

describe("canvasPdfPagination", () => {
  it("estimates pdf page count", () => {
    expect(estimatePdfPageCount(1123, 2)).toBe(1);
    expect(estimatePdfPageCount(2500, 2)).toBe(2);
    expect(estimatePdfPageCount(2246, 2)).toBe(1);
    expect(estimatePdfPageCount(2247, 2)).toBe(2);
  });
});
