import type { ResumeData, AnalysisResult, TemplateStyle } from "../types";
import type { FreeLayoutPosition, FreeLayoutSectionMeta } from "./resumeFreeLayout";
import type { ResumeThemeCustomization } from "./resumeThemeCustomization";
import type { CanvasPage } from "./canvasStudioTypes";
import type { SectionContentSlice } from "./layoutEntryPagination";

/** Live export snapshot published by the preview panel for PDF export. */
export interface PrintExportSnapshot {
  resumeData: ResumeData;
  activeTemplate: TemplateStyle;
  highlightChanges: boolean;
  analysisResult: AnalysisResult | null;
  grayscaleMode: boolean;
  themeCustomization: ResumeThemeCustomization;
  freeLayoutEnabled: boolean;
  sections: FreeLayoutSectionMeta[];
  exportSurfacePositions: Record<string, FreeLayoutPosition>;
  exportPages: CanvasPage[];
  sectionPageMap: Record<string, string>;
  layerOrder: string[];
  hiddenSections: Record<string, boolean>;
  sectionSlices?: Record<string, SectionContentSlice>;
}

let snapshot: PrintExportSnapshot | null = null;

export function setPrintExportSnapshot(next: PrintExportSnapshot | null): void {
  snapshot = next;
}

export function getPrintExportSnapshot(): PrintExportSnapshot | null {
  return snapshot;
}

export function buildLayoutPayloadFromSnapshot(
  snap: PrintExportSnapshot,
): import("./printExportPayload").PrintLayoutPayload | undefined {
  if (!snap.freeLayoutEnabled || snap.sections.length === 0) return undefined;
  return {
    enabled: true,
    sections: snap.sections,
    positions: snap.exportSurfacePositions,
    pages: snap.exportPages.length > 0 ? snap.exportPages : undefined,
    sectionPageMap: snap.sectionPageMap,
    layerOrder: snap.layerOrder,
    hiddenSections: snap.hiddenSections,
    sectionSlices: snap.sectionSlices,
    themeCustomization: snap.themeCustomization,
    grayscaleMode: snap.grayscaleMode,
  };
}
