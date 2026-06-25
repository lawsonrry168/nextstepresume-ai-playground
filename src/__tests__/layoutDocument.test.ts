import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initialResumeData } from "../data";
import { buildLayoutDocument, exportPositionsFromDocument, buildLayoutGeometryCssText, editorPositionsFromPrintPlan, editorPositionsFromDraftThroughPrintPlan } from "../lib/layoutDocument";
import {
  LAYOUT_CONTENT_HEIGHT,
  LAYOUT_CONTENT_WIDTH,
  LAYOUT_PAGE_GAP,
  LAYOUT_PAGE_HEIGHT,
  LAYOUT_PAGE_MARGIN,
  LAYOUT_PAGE_WIDTH,
  LAYOUT_SPACING,
} from "../lib/layoutDocument/geometry";
import { createFreeLayoutPresetPositions } from "../lib/layoutPresets";
import { buildFreeLayoutSections } from "../lib/resumeFreeLayout";
import { A4_CONTENT_WIDTH, A4_PAGE_HEIGHT, A4_PAGE_WIDTH } from "../lib/a4Page";
import { CANVAS_PAGE_HEIGHT, CANVAS_PAGE_WIDTH } from "../lib/canvasStudioTypes";
import { CANVAS_PAGE_MARGIN } from "../lib/canvasAlignTools";

describe("layoutDocument kernel", () => {
  const sectionIds = buildFreeLayoutSections(initialResumeData).map((s) => s.id);

  it("geometry is the single source for A4 dimensions", () => {
    expect(LAYOUT_PAGE_WIDTH).toBe(794);
    expect(LAYOUT_PAGE_HEIGHT).toBe(1123);
    expect(LAYOUT_PAGE_MARGIN).toBe(48);
    expect(LAYOUT_CONTENT_WIDTH).toBe(698);
    expect(LAYOUT_CONTENT_HEIGHT).toBe(1027);
    expect(A4_PAGE_WIDTH).toBe(LAYOUT_PAGE_WIDTH);
    expect(A4_PAGE_HEIGHT).toBe(LAYOUT_PAGE_HEIGHT);
    expect(CANVAS_PAGE_WIDTH).toBe(LAYOUT_PAGE_WIDTH);
    expect(CANVAS_PAGE_HEIGHT).toBe(LAYOUT_PAGE_HEIGHT);
    expect(CANVAS_PAGE_MARGIN).toBe(LAYOUT_PAGE_MARGIN);
    expect(A4_CONTENT_WIDTH).toBe(LAYOUT_CONTENT_WIDTH);
  });

  it("spacing tokens align CSS rhythm", () => {
    expect(LAYOUT_SPACING.headerGap).toBe(14);
    expect(LAYOUT_SPACING.sectionGap).toBe(20);
    expect(LAYOUT_PAGE_GAP).toBe(48);
  });

  it("buildLayoutDocument derives print plan from draft positions", () => {
    const draft = createFreeLayoutPresetPositions("modern", sectionIds, initialResumeData);
    const doc = buildLayoutDocument({
      sectionIds,
      draftPositions: draft,
      resumeData: initialResumeData,
      freeLayoutEnabled: true,
    });

    expect(doc.editMode).toBe("free");
    expect(doc.printPlan.positions).toBeDefined();
    expect(Object.keys(doc.printPlan.positions).length).toBeGreaterThan(0);
  });

  it("exportPositionsFromDocument always uses print plan not draft", () => {
    const draft = createFreeLayoutPresetPositions("compact", sectionIds, initialResumeData);
    const doc = buildLayoutDocument({
      sectionIds,
      draftPositions: draft,
      resumeData: initialResumeData,
      freeLayoutEnabled: true,
    });

    const exported = exportPositionsFromDocument(doc);
    expect(exported).toEqual(doc.printPlan.positions);
    expect(exported).not.toBe(doc.draftPositions);

    const firstId = sectionIds[0]!;
    if (draft[firstId] && exported[firstId]) {
      const draftY = draft[firstId]!.y;
      const exportY = exported[firstId]!.y;
      if (draftY !== exportY) {
        expect(exported[firstId]!.y).toBe(exportY);
      }
    }
  });

  it("flow mode still produces print plan when free layout disabled", () => {
    const doc = buildLayoutDocument({
      sectionIds,
      draftPositions: {},
      resumeData: initialResumeData,
      freeLayoutEnabled: false,
    });
    expect(doc.editMode).toBe("flow");
    expect(doc.printPlan.positions).toBeDefined();
  });

  it("editorPositionsFromPrintPlan maps print plan to editor placements", () => {
    const draft = createFreeLayoutPresetPositions("compact", sectionIds, initialResumeData);
    const doc = buildLayoutDocument({
      sectionIds,
      draftPositions: draft,
      resumeData: initialResumeData,
      freeLayoutEnabled: true,
    });
    const editor = editorPositionsFromPrintPlan(sectionIds, doc.printPlan);
    expect(Object.keys(editor).length).toBeGreaterThan(0);
    for (const id of sectionIds) {
      if (doc.printPlan.positions[id]) {
        expect(editor[id]).toBeDefined();
        expect(editor[id]!.y).toBe(doc.printPlan.positions[id]!.y);
      }
    }
  });

  it("editorPositionsFromDraftThroughPrintPlan matches preset pipeline", () => {
    const draft = createFreeLayoutPresetPositions("modern", sectionIds, initialResumeData);
    const viaDraft = editorPositionsFromDraftThroughPrintPlan({
      sectionIds,
      draftPositions: draft,
      resumeData: initialResumeData,
      freeLayoutEnabled: true,
    });
    const doc = buildLayoutDocument({
      sectionIds,
      draftPositions: draft,
      resumeData: initialResumeData,
      freeLayoutEnabled: true,
    });
    const viaDoc = editorPositionsFromPrintPlan(sectionIds, doc.printPlan);
    expect(viaDraft).toEqual(viaDoc);
  });

  it("layout-geometry.css stays in sync with geometry.ts", () => {
    const cssPath = resolve(process.cwd(), "src/styles/layout-geometry.css");
    const onDisk = readFileSync(cssPath, "utf8").trim();
    const generated = buildLayoutGeometryCssText().trim();
    expect(onDisk).toBe(generated);
  });
});
