import { useEffect, useMemo } from "react";
import { ResumeData } from "../types";
import { TemplateFamily } from "../lib/resumeTemplateCatalog";
import { ResumeThemeCustomization } from "../lib/resumeThemeCustomization";
import type { FreeLayoutSectionMeta } from "../lib/resumeFreeLayout";
import { useFreeLayout } from "./useFreeLayout";
import { useCanvasDocument } from "./useCanvasDocument";
import { buildLayoutDocument, exportPositionsFromDocument } from "../lib/layoutDocument";
import { exportSectionsFromPrintPlan } from "../lib/layoutEntryPagination";
import { registerCanvasLayoutHydrateHandler } from "../lib/sync/canvasLayoutSync";
import { themeContentScale } from "../lib/canvasSectionContentSizing";
import { formatCanvasPageLabel } from "../lib/sectionLabels";
import type { CanvasPage } from "../lib/canvasStudioTypes";

export type ExportCanvasLayoutContext = {
  pages: CanvasPage[];
  activePageId: string;
  sectionPageMap: Record<string, string>;
  hiddenSections: Record<string, boolean>;
  lockedSections: Record<string, boolean>;
  selectedSectionId: string | null;
  onSelectSection: (id: string | null) => void;
  getZIndex: (id: string) => number;
};

export interface UseLayoutDocumentOptions {
  resumeData: ResumeData;
  templateFamily: TemplateFamily;
  themeCustomization: ResumeThemeCustomization;
  manualSizedSections?: ReadonlySet<string>;
  /** Custom canvas elements (text/photo/divider) joining the layout */
  extraSections?: FreeLayoutSectionMeta[];
}

/**
 * L1 hook — unifies free-layout editor state, canvas pages/layers, and print plan.
 * Export/PDF MUST use `exportSurfacePositions` (print plan), never draft positions.
 */
export function useLayoutDocument({
  resumeData,
  templateFamily,
  themeCustomization,
  manualSizedSections,
  extraSections,
}: UseLayoutDocumentOptions) {
  const freeLayout = useFreeLayout(resumeData, templateFamily, extraSections);
  const canvasDoc = useCanvasDocument({
    templateFamily,
    sections: freeLayout.sections,
    positions: freeLayout.positions,
    updatePosition: freeLayout.updatePosition,
  });

  const sectionIds = useMemo(
    () => freeLayout.sections.map((s) => s.id),
    [freeLayout.sections],
  );

  // Cloud hydrate: after remote canvas layout is written to localStorage,
  // reload positions/pages/layers so the studio reflects the pulled state.
  const reloadFreeLayout = freeLayout.reloadFromStorage;
  const reloadCanvasDoc = canvasDoc.reloadFromStorage;
  useEffect(() => {
    return registerCanvasLayoutHydrateHandler(() => {
      reloadFreeLayout();
      reloadCanvasDoc();
    });
  }, [reloadFreeLayout, reloadCanvasDoc]);

  const layoutDocument = useMemo(
    () =>
      buildLayoutDocument({
        sectionIds,
        draftPositions: freeLayout.positions,
        resumeData,
        freeLayoutEnabled: freeLayout.enabled,
        manualSizedSections,
        layerOrder: canvasDoc.layers.order,
        themeFontScale: themeContentScale(themeCustomization),
        studioPages: canvasDoc.pages,
        studioSectionPageMap: canvasDoc.sectionPageMap,
      }),
    [
      freeLayout.enabled,
      freeLayout.positions,
      sectionIds,
      resumeData,
      manualSizedSections,
      canvasDoc.layers.order,
      canvasDoc.pages,
      canvasDoc.sectionPageMap,
      themeCustomization,
    ],
  );

  const exportPrintPlan = layoutDocument.printPlan;

  const exportSurfacePositions = useMemo(
    () => exportPositionsFromDocument(layoutDocument),
    [layoutDocument],
  );

  const exportSectionIds = useMemo(
    () => exportSectionsFromPrintPlan(sectionIds, exportSurfacePositions, canvasDoc.layers.order),
    [exportSurfacePositions, sectionIds, canvasDoc.layers.order],
  );

  const exportSections = useMemo(
    () => exportSectionIds.map((id) => ({ id })),
    [exportSectionIds],
  );

  const exportSectionSlices = exportPrintPlan.sectionSlices;

  const exportCanvasLayout = useMemo((): ExportCanvasLayoutContext | undefined => {
    const hasFragments = Boolean(exportSectionSlices && Object.keys(exportSectionSlices).length > 0);
    if (exportPrintPlan.pageIds.length <= 1 && !hasFragments) return undefined;
    const primaryPageId = exportPrintPlan.pageIds[0]!;
    return {
      pages: exportPrintPlan.pageIds.map((id, index) => ({
        id,
        label: formatCanvasPageLabel(index + 1),
      })),
      activePageId: primaryPageId,
      sectionPageMap: Object.fromEntries(
        exportSectionIds
          .filter((id) => exportSurfacePositions[id])
          .map((id) => [id, exportSurfacePositions[id]!.pageId ?? primaryPageId]),
      ),
      hiddenSections: canvasDoc.layers.hidden,
      lockedSections: canvasDoc.layers.locked,
      selectedSectionId: null,
      onSelectSection: () => {},
      getZIndex: canvasDoc.getZIndex,
    };
  }, [
    canvasDoc.getZIndex,
    canvasDoc.layers.hidden,
    canvasDoc.layers.locked,
    exportPrintPlan.pageIds,
    exportSectionIds,
    exportSectionSlices,
    exportSurfacePositions,
  ]);

  return {
    freeLayout,
    canvasDoc,
    sectionIds,
    layoutDocument,
    exportPrintPlan,
    exportSurfacePositions,
    exportSections,
    exportSectionSlices,
    exportCanvasLayout,
  };
}
