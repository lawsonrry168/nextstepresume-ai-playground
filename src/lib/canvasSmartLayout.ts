import type { ResumeData } from "../types";
import type { FreeLayoutPosition } from "./resumeFreeLayout";
import { buildPrintReadyExportLayout, type PrintExportPlan } from "./layoutExportSurface";
import {
  applyA4AutoLayoutAllPages,
  syncSectionHeightsToContentAllPages,
  type CanvasPageLayoutAction,
  type PageLayoutContentContext,
} from "./canvasLayoutTools";
import { sectionOverflowsPrintPage } from "./layoutExportSurface";
import { editorPositionsFromPrintPlan } from "./layoutDocument/buildLayoutDocument";

export type SmartLayoutDensity = "low" | "medium" | "high";

export interface SmartLayoutAnalysis {
  overflowingSections: string[];
  experienceEntryCount: number;
  totalChars: number;
  density: SmartLayoutDensity;
  recommendedAction: Extract<
    CanvasPageLayoutAction,
    "stack" | "stack-compact" | "two-column" | "sidebar"
  >;
  rationaleKey: string;
}

export interface SmartLayoutPipelineInput {
  sectionIds: string[];
  positions: Record<string, FreeLayoutPosition>;
  pageIds: string[];
  getPageId: (id: string) => string;
  resumeData: ResumeData;
  layerOrder?: string[];
  themeFontScale?: number;
  manualSizedSections?: ReadonlySet<string>;
}

export interface SmartLayoutPipelineResult {
  analysis: SmartLayoutAnalysis;
  printPlan: PrintExportPlan;
  editorPositions: Record<string, FreeLayoutPosition>;
  pageIds: string[];
}

function estimateContentDensity(resumeData: ResumeData): SmartLayoutDensity {
  const chars =
    resumeData.summary.length +
    resumeData.experience.reduce((sum, e) => sum + e.bullets.join(" ").length + e.role.length, 0) +
    resumeData.education.length * 80 +
    resumeData.projects.length * 120 +
    resumeData.skills.join(" ").length;
  if (chars < 1200) return "low";
  if (chars < 2800) return "medium";
  return "high";
}

function occupiedPageCount(input: SmartLayoutPipelineInput): number {
  const pages = new Set<string>();
  for (const id of input.sectionIds) {
    const pageId = input.positions[id]?.pageId ?? input.getPageId(id);
    if (pageId) pages.add(pageId);
  }
  return pages.size || input.pageIds.length;
}

export function analyzeSmartLayout(input: SmartLayoutPipelineInput): SmartLayoutAnalysis {
  const overflowingSections = input.sectionIds.filter((id) => {
    const pos = input.positions[id];
    return pos ? sectionOverflowsPrintPage(pos) : false;
  });

  const experienceEntryCount = input.resumeData.experience.length;
  const totalChars = input.resumeData.experience.reduce(
    (sum, item) => sum + item.bullets.join(" ").length + item.role.length + item.company.length,
    input.resumeData.summary.length,
  );
  const density = estimateContentDensity(input.resumeData);
  const multiPage = occupiedPageCount(input) > 1;

  let recommendedAction: SmartLayoutAnalysis["recommendedAction"] = "stack";
  let rationaleKey = "canvas.smartLayout.rationaleStack";

  if (overflowingSections.length > 0 || density === "high") {
    if (experienceEntryCount >= 4 || totalChars > 3200) {
      // Multi-page resumes stay single-column per page — two-column packing
      // across a dense stack creates overlaps when heights don't fit.
      recommendedAction = multiPage ? "stack-compact" : "two-column";
      rationaleKey = multiPage
        ? "canvas.smartLayout.rationaleCompact"
        : "canvas.smartLayout.rationaleTwoColumn";
    } else {
      recommendedAction = "stack-compact";
      rationaleKey = "canvas.smartLayout.rationaleCompact";
    }
  } else if (!multiPage && density === "low" && input.resumeData.skills.length >= 6) {
    // Sidebar is a single-page magazine layout. Never apply it when sections
    // already span multiple pages — it collapses page assignments.
    recommendedAction = "sidebar";
    rationaleKey = "canvas.smartLayout.rationaleSidebar";
  }

  return {
    overflowingSections,
    experienceEntryCount,
    totalChars,
    density,
    recommendedAction,
    rationaleKey,
  };
}

/** Deterministic smart layout — sync sizes, apply structural preset, rebuild print plan with entry split. */
export function runSmartLayoutPipeline(input: SmartLayoutPipelineInput): SmartLayoutPipelineResult {
  const content: PageLayoutContentContext = {
    resumeData: input.resumeData,
    layerOrder: input.layerOrder,
    themeFontScale: input.themeFontScale ?? 1,
  };

  const analysis = analyzeSmartLayout(input);

  // Stamp pageId onto every section before sync/layout so height clamps and
  // column presets cannot drop multi-page assignments.
  let positions: Record<string, FreeLayoutPosition> = {};
  for (const id of input.sectionIds) {
    const pos = input.positions[id];
    if (!pos) continue;
    positions[id] = { ...pos, pageId: pos.pageId ?? input.getPageId(id) };
  }

  const resolvePageId = (id: string) => positions[id]?.pageId ?? input.getPageId(id);

  positions = syncSectionHeightsToContentAllPages(
    input.sectionIds,
    positions,
    input.pageIds,
    resolvePageId,
    content,
  );

  // Only run structural presets on pages that still hold sections.
  const occupiedPageIds = input.pageIds.filter((pageId) =>
    input.sectionIds.some((id) => resolvePageId(id) === pageId),
  );
  const layoutPageIds = occupiedPageIds.length ? occupiedPageIds : input.pageIds.slice(0, 1);

  positions = applyA4AutoLayoutAllPages(
    analysis.recommendedAction,
    input.sectionIds,
    positions,
    layoutPageIds,
    resolvePageId,
    content,
  );

  // Re-stamp page ids after structural layout (defensive against clamp drops).
  for (const id of input.sectionIds) {
    const pos = positions[id];
    if (!pos) continue;
    if (!pos.pageId) positions[id] = { ...pos, pageId: resolvePageId(id) };
  }

  // Entry-split only when content actually overflows A4 (or density is high).
  // Forcing it always causes "one page of text → empty page 2" on short resumes.
  // Multi-page studio layouts already paginate — skip entry-split to avoid
  // collapsing demo-page-* into export-page-* with empty trailing sheets.
  const needsEntrySplit =
    occupiedPageCount({ ...input, positions }) <= 1 &&
    (analysis.overflowingSections.length > 0 || analysis.density === "high");

  const printPlan = buildPrintReadyExportLayout(input.sectionIds, positions, input.resumeData, {
    manualSizedSections: input.manualSizedSections,
    layerOrder: input.layerOrder,
    themeFontScale: input.themeFontScale,
    studioPages: layoutPageIds.map((id) => ({ id })),
    studioSectionPageMap: Object.fromEntries(
      input.sectionIds
        .filter((id) => positions[id])
        .map((id) => [id, positions[id]!.pageId ?? layoutPageIds[0]!]),
    ),
    preservePlacements: true,
    enableEntrySplit: needsEntrySplit,
  });

  const editorPositions = editorPositionsFromPrintPlan(input.sectionIds, printPlan);

  return {
    analysis,
    printPlan,
    editorPositions,
    pageIds: printPlan.pageIds,
  };
}
