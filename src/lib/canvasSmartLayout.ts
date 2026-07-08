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

  let recommendedAction: SmartLayoutAnalysis["recommendedAction"] = "stack";
  let rationaleKey = "canvas.smartLayout.rationaleStack";

  if (overflowingSections.length > 0 || density === "high") {
    if (experienceEntryCount >= 4 || totalChars > 3200) {
      recommendedAction = "two-column";
      rationaleKey = "canvas.smartLayout.rationaleTwoColumn";
    } else {
      recommendedAction = "stack-compact";
      rationaleKey = "canvas.smartLayout.rationaleCompact";
    }
  } else if (density === "low" && input.resumeData.skills.length >= 6) {
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

  let positions = syncSectionHeightsToContentAllPages(
    input.sectionIds,
    input.positions,
    input.pageIds,
    input.getPageId,
    content,
  );

  // Only run structural presets on pages that still hold sections.
  const occupiedPageIds = input.pageIds.filter((pageId) =>
    input.sectionIds.some((id) => (positions[id]?.pageId ?? input.getPageId(id)) === pageId),
  );

  positions = applyA4AutoLayoutAllPages(
    analysis.recommendedAction,
    input.sectionIds,
    positions,
    occupiedPageIds.length ? occupiedPageIds : input.pageIds.slice(0, 1),
    (id) => positions[id]?.pageId ?? input.getPageId(id),
    content,
  );

  // Entry-split only when content actually overflows A4 (or density is high).
  // Forcing it always causes "one page of text → empty page 2" on short resumes.
  const needsEntrySplit = analysis.overflowingSections.length > 0 || analysis.density === "high";

  const printPlan = buildPrintReadyExportLayout(input.sectionIds, positions, input.resumeData, {
    manualSizedSections: input.manualSizedSections,
    layerOrder: input.layerOrder,
    themeFontScale: input.themeFontScale,
    studioPages: (occupiedPageIds.length ? occupiedPageIds : input.pageIds.slice(0, 1)).map((id) => ({
      id,
    })),
    studioSectionPageMap: Object.fromEntries(
      input.sectionIds
        .filter((id) => positions[id])
        .map((id) => [id, positions[id]!.pageId ?? input.pageIds[0]!]),
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
