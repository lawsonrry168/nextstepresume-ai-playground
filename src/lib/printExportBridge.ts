import type { ResumeData, AnalysisResult, TemplateStyle } from "../types";
import type { FreeLayoutPosition, FreeLayoutSectionMeta } from "./resumeFreeLayout";
import type { ResumeThemeCustomization } from "./resumeThemeCustomization";
import type { CanvasPage } from "./canvasStudioTypes";
import type { SectionContentSlice } from "./layoutEntryPagination";
import { formatCanvasPageLabel } from "./sectionLabels";
import type { PrintLayoutPayload } from "./printExportPayload";
import { buildLayoutDocument } from "./layoutDocument";
import {
  buildTemplateDemoPagesDocument,
  createTemplateDemoLayoutPositions,
  demoLayoutMissingSecondPage,
  demoLayoutPageAssignmentDrift,
} from "./templates/templateDemoLayout";
import { isTemplateDemoResume } from "./templates/templateDemoMatch";

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

/** Print-plan page ids — authoritative for PDF export (not live canvas doc). */
export function exportSectionPageMapFromPositions(
  sections: FreeLayoutSectionMeta[],
  positions: Record<string, FreeLayoutPosition>,
  fallbackPageId?: string,
): Record<string, string> {
  const primary = fallbackPageId ?? Object.values(positions).find((p) => p.pageId)?.pageId ?? "page-1";
  return Object.fromEntries(
    sections
      .filter((s) => positions[s.id])
      .map((s) => [s.id, positions[s.id]!.pageId ?? primary]),
  );
}

function distinctPositionPageCount(positions: Record<string, FreeLayoutPosition>): number {
  return new Set(Object.values(positions).map((pos) => pos.pageId).filter(Boolean)).size;
}

/** Rebuild two-page demo print plan when export snapshot still reflects stale single-page collapse. */
export function healDemoExportLayoutSnapshot(snap: PrintExportSnapshot): {
  exportSurfacePositions: Record<string, FreeLayoutPosition>;
  exportPages: CanvasPage[];
} {
  if (!isTemplateDemoResume(snap.resumeData, snap.activeTemplate)) {
    return { exportSurfacePositions: snap.exportSurfacePositions, exportPages: snap.exportPages };
  }

  const singleExportPage =
    snap.exportPages.length <= 1 || distinctPositionPageCount(snap.exportSurfacePositions) <= 1;
  const sectionIds = snap.sections.map((section) => section.id);
  const needsHeal =
    demoLayoutMissingSecondPage(snap.exportSurfacePositions) ||
    demoLayoutPageAssignmentDrift(
      snap.exportSurfacePositions,
      snap.activeTemplate,
      sectionIds,
      snap.resumeData,
    ) ||
    (singleExportPage && snap.sections.length > 5);

  if (!needsHeal) {
    return { exportSurfacePositions: snap.exportSurfacePositions, exportPages: snap.exportPages };
  }

  const draftPositions = createTemplateDemoLayoutPositions(
    snap.activeTemplate,
    sectionIds,
    snap.resumeData,
  );
  const studioPages = buildTemplateDemoPagesDocument();
  const doc = buildLayoutDocument({
    sectionIds,
    draftPositions,
    resumeData: snap.resumeData,
    freeLayoutEnabled: true,
    studioPages: studioPages.pages,
    studioSectionPageMap: exportSectionPageMapFromPositions(
      snap.sections,
      draftPositions,
      studioPages.pages[0]!.id,
    ),
  });

  return {
    exportSurfacePositions: doc.printPlan.positions,
    exportPages: doc.printPlan.pageIds.map((id, index) => ({
      id,
      label: formatCanvasPageLabel(index + 1),
    })),
  };
}

export function healDemoPrintLayoutPayload(
  resumeData: ResumeData,
  templateStyle: TemplateStyle,
  layout: PrintLayoutPayload,
): PrintLayoutPayload {
  if (!layout.enabled) return layout;
  const healed = healDemoExportLayoutSnapshot({
    resumeData,
    activeTemplate: templateStyle,
    highlightChanges: false,
    analysisResult: null,
    grayscaleMode: layout.grayscaleMode ?? false,
    themeCustomization: layout.themeCustomization ?? {},
    freeLayoutEnabled: true,
    sections: layout.sections,
    exportSurfacePositions: layout.positions,
    exportPages: layout.pages ?? [],
    sectionPageMap: layout.sectionPageMap ?? {},
    layerOrder: layout.layerOrder ?? [],
    hiddenSections: layout.hiddenSections ?? {},
    sectionSlices: layout.sectionSlices,
  });
  return {
    ...layout,
    positions: healed.exportSurfacePositions,
    pages: healed.exportPages,
  };
}

export function normalizePrintLayoutPayload(layout: PrintLayoutPayload): PrintLayoutPayload {
  if (!layout.enabled || !layout.sections.length || !Object.keys(layout.positions).length) {
    return layout;
  }
  const primaryPageId = layout.pages?.[0]?.id;
  const sectionPageMap = exportSectionPageMapFromPositions(
    layout.sections,
    layout.positions,
    primaryPageId,
  );
  const referencedIds: string[] = [];
  const pushId = (pageId: string | undefined) => {
    if (pageId && !referencedIds.includes(pageId)) referencedIds.push(pageId);
  };
  for (const pageId of Object.values(sectionPageMap)) pushId(pageId);
  for (const pos of Object.values(layout.positions)) pushId(pos.pageId);
  for (const page of layout.pages ?? []) pushId(page.id);

  const pageById = new Map((layout.pages ?? []).map((page) => [page.id, page]));
  const pages = referencedIds.map((id, index) => pageById.get(id) ?? { id, label: formatCanvasPageLabel(index + 1) });

  return {
    ...layout,
    sectionPageMap,
    pages: pages.length ? pages : layout.pages,
  };
}

export function buildLayoutPayloadFromSnapshot(
  snap: PrintExportSnapshot,
): import("./printExportPayload").PrintLayoutPayload | undefined {
  if (!snap.sections.length) return undefined;
  if (!snap.exportSurfacePositions || Object.keys(snap.exportSurfacePositions).length === 0) {
    return undefined;
  }
  const healed = healDemoExportLayoutSnapshot(snap);
  const primaryPageId = healed.exportPages[0]?.id;
  const sectionPageMap = exportSectionPageMapFromPositions(
    snap.sections,
    healed.exportSurfacePositions,
    primaryPageId,
  );
  return normalizePrintLayoutPayload({
    enabled: true,
    sections: snap.sections,
    positions: healed.exportSurfacePositions,
    pages: healed.exportPages.length > 0 ? healed.exportPages : undefined,
    sectionPageMap,
    layerOrder: snap.layerOrder,
    hiddenSections: snap.hiddenSections,
    sectionSlices: snap.sectionSlices,
    themeCustomization: snap.themeCustomization,
    grayscaleMode: snap.grayscaleMode,
  });
}
