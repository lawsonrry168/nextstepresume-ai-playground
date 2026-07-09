import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, lazy, Suspense, type ReactNode } from "react";
import { motion } from "motion/react";
import { Minimize2, TrendingUp, Check } from "lucide-react";
import { ResumeData, AnalysisResult, TemplateStyle } from "../../types";
import type { PdfExportMode } from "../../lib/resumePdfTypes";
import ResumeTemplateRenderer from "../ResumeTemplateRenderer";
import PreviewUtilityNav from "./PreviewUtilityNav";
const FreeLayoutStudioCanvas = lazy(() => import("./FreeLayoutStudioCanvas"));
const CanvasStudioViewport = lazy(() => import("./CanvasStudioViewport"));
import type { CanvasStudioViewportHandle } from "./CanvasStudioViewport";
const CanvasLayerPanel = lazy(() => import("./canvas/CanvasLayerPanel"));
const CanvasPageStrip = lazy(() => import("./canvas/CanvasPageStrip"));
const CanvasRightNavSections = lazy(() => import("./canvas/CanvasRightNavSections"));
import type { CanvasToolsBarProps } from "./canvas/CanvasToolsBar";
import { useLayoutDocument } from "../../hooks/useLayoutDocument";
import { syncPagesDocumentToPositions } from "../../hooks/useCanvasDocument";
import {
  addCanvasElement,
  getCanvasElements,
  subscribeCanvasElements,
  type CanvasElementKind,
} from "../../lib/canvasElements";
import { useCanvasStudioShortcuts } from "../../hooks/useCanvasStudioShortcuts";
import { getTemplateFamily, isMarginaliaNotebookTemplate } from "../../lib/resumeTemplateCatalog";
import StudioPreviewHeader from "./StudioPreviewHeader";
import { useI18n } from "../../i18n";
import { useSubscription } from "../../context/SubscriptionProvider";
import { ResumeThemeCustomization, ResolvedResumeTheme, resolveResumeTheme } from "../../lib/resumeThemeCustomization";
import { computeMultiPageDeskHeight, type StudioViewMode } from "../../lib/canvasStudioTypes";
import { formatAutoSaveTime, formatCanvasPageLabel } from "../../lib/sectionLabels";
import { clampPositionToA4Page } from "../../lib/canvasPageSnap";
import { alignPositionOnPage, nudgePosition, centerOnPage, fillPageWidth, snapPositionToGrid, resizeSection, resetSectionPosition } from "../../lib/canvasAlignTools";
import {
  applyA4AutoLayoutAllPages,
  applyPageLayoutAction,
  isMultiPageStructuralLayoutAction,
  reflowPageColumnsNatural,
  resolveLayoutTargetPageId,
  sectionsOnPage,
  shouldSkipColumnReflowAfterLayout,
  stackFillModeForLayoutAction,
  syncSectionHeightsToContentAllPages,
  type A4StackFillMode,
  type CanvasPageLayoutAction,
} from "../../lib/canvasLayoutTools";
import { buildContentFitSignature, buildThemeFitSignature, themeContentScale } from "../../lib/canvasSectionContentSizing";
import { EXPORT_SURFACE_HOST_ID, sectionOverflowsPrintPage } from "../../lib/layoutExportSurface";
import { editorPositionsFromDraftThroughPrintPlan, editorPositionsFromPrintPlan } from "../../lib/layoutDocument";
import type { FreeLayoutPresetId, FreeLayoutPosition } from "../../lib/resumeFreeLayout";
import { estimateFreeLayoutCanvasHeight, FREE_LAYOUT_CANVAS } from "../../lib/resumeFreeLayout";
import { LAYOUT_PAGE_HEIGHT, LAYOUT_PAGE_WIDTH } from "../../lib/layoutDocument/geometry";
import { createFamilyDefaultPositions, createFreeLayoutPresetPositions } from "../../lib/layoutPresets";
import { useResponsiveScale } from "../../hooks/useResponsiveScale";
import { exportSectionPageMapFromPositions, setPrintExportSnapshot } from "../../lib/printExportBridge";
import { isTemplateDemoResume } from "../../lib/templates/templateDemoMatch";
import {
  demoLayoutHasPageOverflow,
  demoLayoutPageAssignmentDrift,
} from "../../lib/templates/templateDemoLayout";
import { resolveTemplateDemoEditorPositions } from "../../lib/templates/applyTemplateDemo";
import ExportDock from "./ExportDock";
import CanvasContextMenu, { type CanvasContextMenuState } from "./CanvasContextMenu";
import {
  copyCanvasSelection,
  duplicateCanvasSelection,
  hasCanvasClipboard,
  pasteCanvasClipboard,
} from "../../lib/canvasClipboard";
import { isCanvasElementId, removeCanvasElement } from "../../lib/canvasElements";
import { clampSectionHeight, FREE_LAYOUT_MAX_HEIGHT } from "../../lib/resumeFreeLayout";
import { estimateSectionHeightForContent } from "../../lib/canvasSectionContentSizing";
import { buildCanvasLayoutSyncSnapshot, resetCanvasLayoutCloud, scheduleCanvasLayoutCloudPush } from "../../lib/sync/canvasLayoutSync";
import { useAuth } from "../../context/AuthProvider";
import { useAppConfig } from "../../hooks/useAppConfig";
import { runSmartLayoutPipeline } from "../../lib/canvasSmartLayout";

export interface ResumeLivePreviewPanelProps {
  isPreviewMode: boolean;
  setIsPreviewMode: (value: boolean) => void;
  liveAtsScore: number;
  previewZoom: number;
  setPreviewZoom: (value: number) => void;
  previewAutoFit: boolean;
  setPreviewAutoFit: (value: boolean | ((prev: boolean) => boolean)) => void;
  grayscaleMode: boolean;
  setGrayscaleMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  studioViewMode: StudioViewMode;
  setStudioViewMode: (mode: StudioViewMode) => void;
  activeTemplate: TemplateStyle;
  setActiveTemplate: (style: TemplateStyle) => void;
  history: unknown[];
  future?: unknown[];
  handleUndo: () => void;
  handleRedo?: () => void;
  chatOpen: boolean;
  setChatOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  pdfExporting: boolean;
  exportToPDF: (mode: PdfExportMode) => void;
  exportToJson: () => void;
  exportToDocx: () => void;
  resumeData: ResumeData;
  highlightChanges: boolean;
  setHighlightChanges: (value: boolean | ((prev: boolean) => boolean)) => void;
  analysisResult: AnalysisResult | null;
  detectedKeywords: string[];
  activeKeywordsList: string[];
  matcherHighlightActive: boolean;
  setMatcherHighlightActive: (value: boolean | ((prev: boolean) => boolean)) => void;
  atsScoreExpanded: boolean;
  setAtsScoreExpanded: (value: boolean) => void;
  themeCustomization: ResumeThemeCustomization;
  onThemeCustomizationChange: (patch: Partial<ResumeThemeCustomization>) => void;
  onThemeCustomizationReset: () => void;
  resolvedTheme: ResolvedResumeTheme;
  /** Increment to reload free-layout + canvas pages after template demo is persisted. */
  templateDemoReloadToken?: number;
}

function CanvasLoadingFallback() {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 min-h-0 items-center justify-center text-slate-400 text-sm font-medium">
      {t("common.loading")}
    </div>
  );
}

function ResponsivePreviewFrame({
  containerId,
  containerClassName,
  autoFit,
  zoomPercent,
  fitPadding = 32,
  contentWidth = LAYOUT_PAGE_WIDTH,
  contentHeight = LAYOUT_PAGE_HEIGHT,
  children,
}: {
  containerId?: string;
  containerClassName: string;
  autoFit: boolean;
  zoomPercent: number;
  fitPadding?: number;
  contentWidth?: number;
  contentHeight?: number;
  children: ReactNode;
}) {
  const { containerRef, fitScale } = useResponsiveScale({
    enabled: autoFit,
    contentWidth,
    padding: fitPadding,
  });
  const effectiveScale = autoFit ? fitScale : zoomPercent / 100;
  const scaledHeight = Math.max(1, contentHeight * effectiveScale);

  return (
    <div ref={containerRef} className={containerClassName} id={containerId}>
      <div className="preview-resume-stage" style={{ minHeight: scaledHeight }}>
        <div className="shrink-0" style={{ width: contentWidth, height: scaledHeight }}>
          <div
            className="shrink-0"
            style={{
              width: contentWidth,
              transform: `scale(${effectiveScale})`,
              transformOrigin: "top center",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResumeLivePreviewPanel({
  isPreviewMode,
  setIsPreviewMode,
  liveAtsScore,
  previewZoom,
  setPreviewZoom,
  previewAutoFit,
  setPreviewAutoFit,
  grayscaleMode,
  setGrayscaleMode,
  studioViewMode,
  setStudioViewMode,
  activeTemplate,
  setActiveTemplate,
  history,
  future,
  handleUndo,
  handleRedo,
  chatOpen,
  setChatOpen,
  pdfExporting,
  exportToPDF,
  exportToJson,
  exportToDocx,
  resumeData,
  highlightChanges,
  setHighlightChanges,
  analysisResult,
  detectedKeywords,
  activeKeywordsList,
  matcherHighlightActive,
  setMatcherHighlightActive,
  atsScoreExpanded,
  setAtsScoreExpanded,
  themeCustomization,
  onThemeCustomizationChange,
  onThemeCustomizationReset,
  resolvedTheme,
  templateDemoReloadToken = 0,
}: ResumeLivePreviewPanelProps) {
  const { t } = useI18n();
  const { canUseFeature, openUpgrade } = useSubscription();
  const { sync } = useAppConfig();
  const { session } = useAuth();
  const templateFamily = getTemplateFamily(activeTemplate);
  const isMarginalia = isMarginaliaNotebookTemplate(activeTemplate);
  const shouldAutoFitPreview = previewAutoFit || !isPreviewMode;
  const resumeSheetClass = `preview-resume-sheet preview-resume-sheet--a4 w-[${LAYOUT_PAGE_WIDTH}px] max-w-[${LAYOUT_PAGE_WIDTH}px] mx-auto rounded-xl overflow-hidden transition-all duration-300${
    isMarginalia ? " preview-resume-sheet--marginalia" : " transform-gpu"
  }`;

  const [manualSizedSections, setManualSizedSections] = useState<Set<string>>(() => new Set());

  const canvasElements = useSyncExternalStore(subscribeCanvasElements, getCanvasElements, getCanvasElements);
  const extraSections = useMemo(() => canvasElements.map((el) => ({ id: el.id })), [canvasElements]);

  const {
    freeLayout,
    canvasDoc,
    sectionIds: freeLayoutSectionIds,
    exportPrintPlan,
    exportSurfacePositions,
    exportSections,
    exportSectionSlices,
    exportCanvasLayout,
    reloadLayoutFromStorage,
  } = useLayoutDocument({
    resumeData,
    templateFamily,
    activeTemplate,
    themeCustomization,
    manualSizedSections,
    extraSections,
  });

  const templateDemoReloadRef = useRef(templateDemoReloadToken);
  useEffect(() => {
    if (templateDemoReloadToken <= 0 || templateDemoReloadRef.current === templateDemoReloadToken) {
      return;
    }
    templateDemoReloadRef.current = templateDemoReloadToken;
    reloadLayoutFromStorage();
  }, [templateDemoReloadToken, reloadLayoutFromStorage]);

  const handleAddElement = useCallback(
    (kind: CanvasElementKind) => {
      const element = addCanvasElement(kind);
      if (!element) return;
      const defaults =
        kind === "photo"
          ? { width: 160, height: 160 }
          : kind === "divider"
            ? { width: 320, height: 24 }
            : { width: 280, height: 120 };
      freeLayout.updatePosition(
        element.id,
        { x: 72, y: 72, ...defaults, pageId: canvasDoc.activePageId },
        { skipSnap: true, constrainA4: true },
      );
      canvasDoc.setSelectedSectionId(element.id);
    },
    [canvasDoc, freeLayout],
  );

  const handleAutoTidy = useCallback(() => {
    // Map the print plan back to base-section editor positions so entry-split
    // fragment IDs (e.g. `experience#frag-1`) never leak into the editor state.
    const editorPositions = editorPositionsFromPrintPlan(freeLayoutSectionIds, exportPrintPlan);
    freeLayout.applyPositionsBatch(editorPositions, { constrainA4: true });
  }, [exportPrintPlan, freeLayoutSectionIds, freeLayout]);

  const [smartLayoutFeedback, setSmartLayoutFeedback] = useState<string | null>(null);
  const [resetCloudLayoutBusy, setResetCloudLayoutBusy] = useState(false);

  const canvasViewportRef = useRef<CanvasStudioViewportHandle>(null);

  const handleSmartLayout = useCallback(() => {
    const result = runSmartLayoutPipeline({
      sectionIds: freeLayoutSectionIds,
      positions: freeLayout.positions,
      pageIds: canvasDoc.pages.map((page) => page.id),
      getPageId: canvasDoc.getSectionPageId,
      resumeData,
      layerOrder: canvasDoc.layers.order,
      themeFontScale: themeContentScale(themeCustomization),
      manualSizedSections,
    });
    // Applying the batch triggers syncPagesDocumentToPositions, which creates any
    // referenced page with its exact id — avoiding the addPage()/export-page-* race.
    freeLayout.applyPositionsBatch(result.editorPositions, { constrainA4: true });
    setSmartLayoutFeedback(t(result.analysis.rationaleKey));
    window.setTimeout(() => setSmartLayoutFeedback(null), 5000);
    // Fit the full multi-page desk — don't focusPage after, or the camera
    // jumps to a single page and looks "stuck" in a corner.
    requestAnimationFrame(() => canvasViewportRef.current?.fitToScreen());
    window.setTimeout(() => canvasViewportRef.current?.fitToScreen(), 120);
  }, [
    canvasDoc,
    freeLayout,
    freeLayoutSectionIds,
    manualSizedSections,
    resumeData,
    t,
    themeCustomization,
  ]);
  const handleResetCloudLayout = useCallback(async () => {
    const confirmKey =
      sync.enabled && session
        ? "canvas.layout.resetCloudLayoutConfirmCloud"
        : "canvas.layout.resetCloudLayoutConfirmLocal";
    if (!window.confirm(t(confirmKey))) return;

    setResetCloudLayoutBusy(true);
    try {
      const result = await resetCanvasLayoutCloud();
      if (!result.ok) {
        setSmartLayoutFeedback(t("canvas.layout.resetCloudLayoutFailed"));
        window.setTimeout(() => setSmartLayoutFeedback(null), 5000);
        return;
      }
      setManualSizedSections(new Set());
      canvasDoc.setSelectedSectionId(null);
      requestAnimationFrame(() => canvasViewportRef.current?.resetView());
      setSmartLayoutFeedback(
        t(result.cloudSynced ? "canvas.layout.resetCloudLayoutDoneCloud" : "canvas.layout.resetCloudLayoutDoneLocal"),
      );
      window.setTimeout(() => setSmartLayoutFeedback(null), 5000);
    } finally {
      setResetCloudLayoutBusy(false);
    }
  }, [canvasDoc, session, sync.enabled, t]);
  const canvasSelectionRef = useRef<{ primary: string | null; multi: ReadonlySet<string> }>({
    primary: null,
    multi: new Set(),
  });
  const [contextMenu, setContextMenu] = useState<CanvasContextMenuState | null>(null);

  const getActiveSelectionIds = useCallback((): string[] => {
    const { primary, multi } = canvasSelectionRef.current;
    if (multi.size > 0) return [...multi];
    if (primary) return [primary];
    return [];
  }, []);

  const handleCanvasSelectionChange = useCallback(
    (primary: string | null, multi: ReadonlySet<string>) => {
      canvasSelectionRef.current = { primary, multi };
      if (!primary || !canvasViewportRef.current) return;
      const pageId =
        freeLayout.positions[primary]?.pageId ?? canvasDoc.getSectionPageId(primary);
      if (pageId && pageId !== canvasDoc.activePageId) {
        canvasDoc.setActivePageId(pageId);
      }
      const pageIndex = Math.max(
        0,
        canvasDoc.pages.findIndex((page) => page.id === pageId),
      );
      requestAnimationFrame(() => canvasViewportRef.current?.focusPage(pageIndex));
    },
    [canvasDoc, freeLayout.positions],
  );

  const handleCanvasCopy = useCallback(() => {
    const ids = getActiveSelectionIds();
    if (!ids.length) return;
    copyCanvasSelection(templateFamily, ids, freeLayout.positions);
  }, [freeLayout.positions, getActiveSelectionIds, templateFamily]);

  const handleCanvasPaste = useCallback(() => {
    const pasted = pasteCanvasClipboard({
      family: templateFamily,
      activePageId: canvasDoc.activePageId,
      applyPosition: (id, pos, options) => {
        freeLayout.updatePosition(id, pos, { skipSnap: true, constrainA4: true, layoutOverride: options?.layoutOverride });
      },
    });
    if (pasted[0]) canvasDoc.setSelectedSectionId(pasted[0]);
  }, [canvasDoc, freeLayout, templateFamily]);

  const handleCanvasDuplicate = useCallback(() => {
    const ids = getActiveSelectionIds();
    if (!ids.length) return;
    const pasted = duplicateCanvasSelection(templateFamily, ids, freeLayout.positions, {
      family: templateFamily,
      activePageId: canvasDoc.activePageId,
      applyPosition: (id, pos, options) => {
        freeLayout.updatePosition(id, pos, { skipSnap: true, constrainA4: true, layoutOverride: options?.layoutOverride });
      },
    });
    if (pasted[0]) canvasDoc.setSelectedSectionId(pasted[0]);
  }, [canvasDoc, freeLayout, getActiveSelectionIds, templateFamily]);

  const handleContextMenuSection = useCallback((sectionId: string, clientX: number, clientY: number) => {
    canvasDoc.setSelectedSectionId(sectionId);
    setContextMenu({ sectionId, x: clientX, y: clientY });
  }, [canvasDoc]);

  const handleDeleteCanvasElement = useCallback((sectionId: string) => {
    removeCanvasElement(sectionId);
    canvasDoc.setSelectedSectionId(null);
  }, [canvasDoc]);

  const handleFitSectionContent = useCallback((sectionId: string) => {
    const pos = freeLayout.positions[sectionId];
    if (!pos) return;
    const height = clampSectionHeight(
      estimateSectionHeightForContent(sectionId, resumeData, pos.width),
      FREE_LAYOUT_MAX_HEIGHT,
    );
    freeLayout.updatePosition(sectionId, { ...pos, height }, { skipSnap: true, constrainA4: true });
  }, [freeLayout, resumeData]);

  const showPrintPreview = isPreviewMode && studioViewMode === "print";
  const showFreeLayoutCanvas = freeLayout.enabled && (!isPreviewMode || studioViewMode === "single");
  const showCanvasViewport = isPreviewMode && studioViewMode === "canvas";
  const showFreeLayoutEditor = showFreeLayoutCanvas || showCanvasViewport;
  const freeLayoutVariant = "edit" as const;

  const previewPagesDoc = useMemo(
    () =>
      syncPagesDocumentToPositions(
        { pages: canvasDoc.pages, activePageId: canvasDoc.activePageId },
        freeLayoutSectionIds,
        freeLayout.positions,
      ),
    [canvasDoc.activePageId, canvasDoc.pages, freeLayoutSectionIds, freeLayout.positions],
  );

  const workspaceCanvasLayout = useMemo(() => {
    const pagesFromPlan =
      exportPrintPlan.pageIds.length > 1
        ? exportPrintPlan.pageIds.map((id, index) => {
            const fromDoc = previewPagesDoc.pages.find((page) => page.id === id);
            return fromDoc ?? { id, label: formatCanvasPageLabel(index + 1) };
          })
        : previewPagesDoc.pages.length > 1
          ? previewPagesDoc.pages
          : null;
    if (!pagesFromPlan || pagesFromPlan.length <= 1) return undefined;

    const sectionPageMap = exportSectionPageMapFromPositions(
      exportSections.length ? exportSections : freeLayout.sections,
      exportSurfacePositions,
      pagesFromPlan[0]!.id,
    );


    return {
      pages: pagesFromPlan,
      activePageId: pagesFromPlan[0]!.id,
      sectionPageMap,
      hiddenSections: canvasDoc.layers.hidden,
      lockedSections: canvasDoc.layers.locked,
      selectedSectionId: null as string | null,
      onSelectSection: () => {},
      getZIndex: canvasDoc.getZIndex,
    };
  }, [
    canvasDoc.getZIndex,
    canvasDoc.layers.hidden,
    canvasDoc.layers.locked,
    canvasDoc.sectionPageMap,
    exportPrintPlan.pageIds,
    exportSections,
    exportSurfacePositions,
    freeLayout.positions,
    freeLayout.sections,
    previewPagesDoc.pages,
  ]);

  const sidebarPreviewLayout = exportCanvasLayout ?? workspaceCanvasLayout;
  const isDemoMultiPageExport =
    Boolean(activeTemplate) &&
    isTemplateDemoResume(resumeData, activeTemplate) &&
    exportPrintPlan.pageIds.length > 1;
  const sidebarUsesPrintPlan =
    isDemoMultiPageExport ||
    (Boolean(sidebarPreviewLayout) && exportPrintPlan.pageIds.length > 1);
  const sidebarPreviewSections = sidebarUsesPrintPlan ? exportSections : freeLayout.sections;
  const sidebarPreviewPositions = sidebarUsesPrintPlan
    ? exportSurfacePositions
    : freeLayout.positions;
  const isActiveTemplateDemo = isTemplateDemoResume(resumeData, activeTemplate);
  /** Demo uses pre-paginated A4 positions — DOM auto-fit breaks two-page layout. */
  const demoLocksLayoutHeights = isActiveTemplateDemo;

  useEffect(() => {
    if (!isTemplateDemoResume(resumeData, activeTemplate)) return;
    if (!freeLayout.enabled) {
      freeLayout.setEnabled(true);
    }
  }, [activeTemplate, freeLayout.enabled, freeLayout.setEnabled, resumeData]);

  useEffect(() => {
    if (!isTemplateDemoResume(resumeData, activeTemplate)) return;
    if (!freeLayout.enabled) return;
    if (
      !demoLayoutPageAssignmentDrift(
        freeLayout.positions,
        activeTemplate,
        freeLayoutSectionIds,
        resumeData,
      ) &&
      !demoLayoutHasPageOverflow(freeLayout.positions)
    ) {
      return;
    }
    const expected = resolveTemplateDemoEditorPositions(
      activeTemplate,
      freeLayoutSectionIds,
      resumeData,
    );
    freeLayout.applyPositionsBatch(expected, { constrainA4: true });
  }, [
    activeTemplate,
    freeLayout.applyPositionsBatch,
    freeLayout.enabled,
    freeLayoutSectionIds,
    resumeData,
    templateDemoReloadToken,
  ]);

  useEffect(() => {
  }, [
    canvasDoc.pages.length,
    exportPrintPlan.pageIds,
    freeLayout.enabled,
    previewPagesDoc.pages.length,
    showFreeLayoutCanvas,
    isDemoMultiPageExport,
    sidebarPreviewLayout,
    sidebarUsesPrintPlan,
  ]);

  const canvasContentHeight = useMemo(() => {
    if (showCanvasViewport) {
      return computeMultiPageDeskHeight(canvasDoc.pages.length);
    }
    if (showFreeLayoutCanvas && previewPagesDoc.pages.length > 1) {
      return computeMultiPageDeskHeight(previewPagesDoc.pages.length);
    }
    if (showFreeLayoutCanvas && exportPrintPlan.pageIds.length > 1) {
      return computeMultiPageDeskHeight(exportPrintPlan.pageIds.length);
    }
    return estimateFreeLayoutCanvasHeight(freeLayoutSectionIds, freeLayout.positions);
  }, [
    showCanvasViewport,
    showFreeLayoutCanvas,
    canvasDoc.pages.length,
    previewPagesDoc.pages.length,
    freeLayoutSectionIds,
    freeLayout.positions,
  ]);

  const canvasClampDoneRef = useRef(false);

  useEffect(() => {
    const exportPages = exportPrintPlan.pageIds.map((id, index) => ({
      id,
      label: formatCanvasPageLabel(index + 1),
    }));
    const exportSectionPageMap = exportSectionPageMapFromPositions(
      exportSections,
      exportSurfacePositions,
      exportPrintPlan.pageIds[0],
    );
    setPrintExportSnapshot({
      resumeData,
      activeTemplate,
      highlightChanges,
      analysisResult,
      grayscaleMode,
      themeCustomization,
      freeLayoutEnabled: freeLayout.enabled,
      sections: exportSections,
      exportSurfacePositions,
      exportPages,
      sectionPageMap: exportSectionPageMap,
      layerOrder: canvasDoc.layers.order,
      hiddenSections: canvasDoc.layers.hidden,
      sectionSlices: exportSectionSlices,
    });
    return () => setPrintExportSnapshot(null);
  }, [
    activeTemplate,
    analysisResult,
    canvasDoc.layers.hidden,
    canvasDoc.layers.order,
    exportPrintPlan.pageIds,
    exportSections,
    exportSurfacePositions,
    canvasDoc.sectionPageMap,
    freeLayout.enabled,
    freeLayout.sections,
    grayscaleMode,
    highlightChanges,
    resumeData,
    themeCustomization,
  ]);

  useEffect(() => {
    if (!showCanvasViewport) {
      canvasClampDoneRef.current = false;
      return;
    }
    if (canvasClampDoneRef.current) return;
    canvasClampDoneRef.current = true;
    for (const id of freeLayoutSectionIds) {
      const pos = freeLayout.positions[id];
      if (!pos) continue;
      const clamped = clampPositionToA4Page(pos);
      if (
        pos.x !== clamped.x ||
        pos.y !== clamped.y ||
        pos.width !== clamped.width ||
        pos.height !== clamped.height
      ) {
        freeLayout.updatePosition(id, clamped, { skipSnap: true, constrainA4: true });
      }
    }
  }, [showCanvasViewport, freeLayoutSectionIds, freeLayout.positions, freeLayout.updatePosition]);

  const activePageIndex = useMemo(
    () => Math.max(0, canvasDoc.pages.findIndex((p) => p.id === canvasDoc.activePageId)),
    [canvasDoc.pages, canvasDoc.activePageId],
  );

  // Entering canvas / page-count change: fit the full desk into view (centered).
  useEffect(() => {
    if (!showCanvasViewport) return;
    let cancelled = false;
    const run = () => {
      if (!cancelled) canvasViewportRef.current?.fitToScreen();
    };
    const frame = requestAnimationFrame(run);
    // Stage often measures 0×0 on the first frame — retry once layout settles.
    const retry = window.setTimeout(run, 80);
    const retry2 = window.setTimeout(run, 240);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(retry);
      window.clearTimeout(retry2);
    };
  }, [showCanvasViewport, canvasDoc.pages.length, canvasContentHeight]);

  // Page-strip / keyboard page changes: track the active page without fighting fit.
  const prevActivePageRef = useRef(canvasDoc.activePageId);
  useEffect(() => {
    if (!showCanvasViewport) return;
    if (prevActivePageRef.current === canvasDoc.activePageId) return;
    prevActivePageRef.current = canvasDoc.activePageId;
    const frame = requestAnimationFrame(() => {
      canvasViewportRef.current?.focusPage(activePageIndex);
    });
    return () => cancelAnimationFrame(frame);
  }, [showCanvasViewport, activePageIndex, canvasDoc.activePageId]);

  const layoutTargetPageId = useMemo(
    () =>
      resolveLayoutTargetPageId(
        freeLayoutSectionIds,
        freeLayout.positions,
        canvasDoc.pages,
        canvasDoc.activePageId,
        canvasDoc.getSectionPageId,
      ),
    [
      canvasDoc.activePageId,
      canvasDoc.getSectionPageId,
      canvasDoc.pages,
      freeLayoutSectionIds,
      freeLayout.positions,
    ],
  );

  const sectionCountOnPage = useMemo(
    () =>
      sectionsOnPage(
        freeLayoutSectionIds,
        freeLayout.positions,
        layoutTargetPageId,
        canvasDoc.getSectionPageId,
      ).length,
    [canvasDoc.getSectionPageId, freeLayoutSectionIds, freeLayout.positions, layoutTargetPageId],
  );

  const contentFitSignature = useMemo(
    () => buildContentFitSignature(freeLayoutSectionIds, resumeData),
    [freeLayoutSectionIds, resumeData],
  );
  const themeFitSignature = useMemo(
    () => buildThemeFitSignature(activeTemplate, templateFamily, themeCustomization),
    [activeTemplate, templateFamily, themeCustomization],
  );
  const contentFitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const columnReflowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContentFitSigRef = useRef<string | null>(null);
  const lastThemeFitSigRef = useRef<string | null>(null);
  const layoutManualOverrideRef = useRef(false);
  const lastLayoutActionRef = useRef<CanvasPageLayoutAction>("stack");
  const [layoutStackFillMode, setLayoutStackFillMode] = useState<A4StackFillMode>("fill-page-exact");
  const lastLayerOrderSigRef = useRef("");
  const layoutPositionsRef = useRef(freeLayout.positions);
  layoutPositionsRef.current = freeLayout.positions;
  const manualSizedSectionsRef = useRef(manualSizedSections);
  manualSizedSectionsRef.current = manualSizedSections;

  const markSectionManualSized = useCallback((sectionId: string) => {
    setManualSizedSections((prev) => {
      if (prev.has(sectionId)) return prev;
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });
  }, []);

  const clearSectionManualSized = useCallback((sectionId: string) => {
    setManualSizedSections((prev) => {
      if (!prev.has(sectionId)) return prev;
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
  }, []);

  const clearAllManualSized = useCallback(() => {
    setManualSizedSections(new Set());
  }, []);

  const preserveManualSizedDimensions = useCallback(
    (
      before: Record<string, FreeLayoutPosition>,
      proposed: Record<string, FreeLayoutPosition>,
    ): Record<string, FreeLayoutPosition> => {
      const next = { ...proposed };
      for (const id of manualSizedSectionsRef.current) {
        const keep = before[id];
        const patch = next[id];
        if (!keep || !patch) continue;
        next[id] = { ...patch, width: keep.width, height: keep.height };
      }
      return next;
    },
    [],
  );

  const layoutContent = useMemo(
    () => ({
      resumeData,
      layerOrder: canvasDoc.layers.order,
      themeFontScale: themeContentScale(themeCustomization),
      stackFillMode: layoutStackFillMode,
    }),
    [resumeData, canvasDoc.layers.order, themeCustomization, layoutStackFillMode],
  );

  const markLayoutManualOverride = useCallback(() => {
    layoutManualOverrideRef.current = true;
    lastContentFitSigRef.current = contentFitSignature;
  }, [contentFitSignature]);

  const runColumnReflow = useCallback(() => {
    if (!showFreeLayoutEditor) return;
    // Demo layouts are already A4-paginated; column reflow shifts y (e.g. 408→571)
    // and desyncs Canvas draft from the print/PDF plan.
    if (isActiveTemplateDemo) return;
    const targetPageId = resolveLayoutTargetPageId(
      freeLayoutSectionIds,
      layoutPositionsRef.current,
      canvasDoc.pages,
      canvasDoc.activePageId,
      canvasDoc.getSectionPageId,
    );
    const current = layoutPositionsRef.current;
    const next = reflowPageColumnsNatural(
      freeLayoutSectionIds,
      current,
      targetPageId,
      canvasDoc.getSectionPageId,
      layoutContent,
    );
    const changed = freeLayoutSectionIds.some((id) => {
      const before = current[id];
      const after = next[id];
      if (!before || !after) return false;
      return before.y !== after.y || before.x !== after.x;
    });
    if (changed) {
      // No A4 clamp here: clamping pulls overflowing sections back up into
      // the ones above (overlap). The draft sheet extends instead; export
      // pagination and auto-tidy handle the page split.
      freeLayout.applyPositionsBatch(next);
    }
  }, [
    canvasDoc.activePageId,
    canvasDoc.getSectionPageId,
    canvasDoc.pages,
    freeLayout.applyPositionsBatch,
    freeLayoutSectionIds,
    isActiveTemplateDemo,
    layoutContent,
    showFreeLayoutEditor,
  ]);

  const scheduleColumnReflow = useCallback(
    (delayMs = 100) => {
      if (!showFreeLayoutEditor) return;
      if (columnReflowTimerRef.current) clearTimeout(columnReflowTimerRef.current);
      columnReflowTimerRef.current = setTimeout(() => {
        columnReflowTimerRef.current = null;
        runColumnReflow();
      }, delayMs);
    },
    [runColumnReflow, showFreeLayoutEditor],
  );

  const handleFreeLayoutPositionChange = useCallback(
    (
      id: string,
      pos: FreeLayoutPosition,
      options?: {
        skipSnap?: boolean;
        constrainA4?: boolean;
        userMoved?: boolean;
        layoutOverride?: boolean;
      },
    ) => {
      const prev = layoutPositionsRef.current[id];
      if (options?.userMoved || options?.layoutOverride) {
        markLayoutManualOverride();
      }
      if (options?.userMoved) {
        markSectionManualSized(id);
      }
      const { userMoved: _userMoved, layoutOverride: _layoutOverride, ...rest } = options ?? {};
      freeLayout.updatePosition(
        id,
        pos,
        showCanvasViewport ? { ...rest, constrainA4: true } : rest,
      );
      if (showFreeLayoutEditor && prev) {
        const sizeChanged = pos.height !== prev.height || pos.width !== prev.width;
        if (sizeChanged && !options?.userMoved) {
          scheduleColumnReflow(120);
        }
        if (options?.userMoved && pos.height !== prev.height) {
          scheduleColumnReflow(220);
        }
      }
    },
    [
      freeLayout.updatePosition,
      markLayoutManualOverride,
      markSectionManualSized,
      scheduleColumnReflow,
      showCanvasViewport,
      showFreeLayoutEditor,
    ],
  );

  const applyPageLayout = useCallback(
    (action: CanvasPageLayoutAction) => {
      lastLayoutActionRef.current = action;
      const fillMode = stackFillModeForLayoutAction(action);
      if (fillMode) setLayoutStackFillMode(fillMode);
      markLayoutManualOverride();
      clearAllManualSized();

      const targetPageId = resolveLayoutTargetPageId(
        freeLayoutSectionIds,
        freeLayout.positions,
        canvasDoc.pages,
        canvasDoc.activePageId,
        canvasDoc.getSectionPageId,
      );
      if (targetPageId !== canvasDoc.activePageId) {
        canvasDoc.setActivePageId(targetPageId);
      }

      const workingPositions = freeLayout.positions;
      // Never collapse multi-page layouts into the active page — reflow each
      // occupied page (structural) or only the target page (align/snap tools).
      const occupiedPageIds = canvasDoc.pages
        .map((page) => page.id)
        .filter((pageId) =>
          sectionsOnPage(
            freeLayoutSectionIds,
            workingPositions,
            pageId,
            canvasDoc.getSectionPageId,
            layoutContent.layerOrder,
          ).length > 0,
        );
      const layoutPageIds =
        isMultiPageStructuralLayoutAction(action) && occupiedPageIds.length > 1
          ? occupiedPageIds
          : [targetPageId];
      const patches =
        layoutPageIds.length > 1
          ? applyA4AutoLayoutAllPages(
              action,
              freeLayoutSectionIds,
              workingPositions,
              layoutPageIds,
              canvasDoc.getSectionPageId,
              layoutContent,
              canvasDoc.selectedSectionId ?? undefined,
            )
          : applyPageLayoutAction(
              action,
              freeLayoutSectionIds,
              workingPositions,
              targetPageId,
              canvasDoc.getSectionPageId,
              canvasDoc.selectedSectionId ?? undefined,
              layoutContent,
            );
      if (Object.keys(patches).length > 0) {
        freeLayout.applyPositionsBatch(patches, { constrainA4: true });
      }
      if (!shouldSkipColumnReflowAfterLayout(action)) {
        window.setTimeout(() => runColumnReflow(), 80);
        window.setTimeout(() => runColumnReflow(), 480);
      }
    },
    [
      canvasDoc.activePageId,
      canvasDoc.getSectionPageId,
      canvasDoc.pages,
      canvasDoc.selectedSectionId,
      canvasDoc.setActivePageId,
      freeLayout.applyPositionsBatch,
      freeLayoutSectionIds,
      freeLayout.positions,
      layoutContent,
      markLayoutManualOverride,
      runColumnReflow,
      clearAllManualSized,
    ],
  );

  const applyDraftThroughPrintPlan = useCallback(
    (draftPositions: Record<string, FreeLayoutPosition>) => {
      const patches = editorPositionsFromDraftThroughPrintPlan({
        sectionIds: freeLayoutSectionIds,
        draftPositions,
        resumeData,
        freeLayoutEnabled: true,
        layerOrder: canvasDoc.layers.order,
        themeFontScale: themeContentScale(themeCustomization),
        studioPages: canvasDoc.pages,
        studioSectionPageMap: canvasDoc.sectionPageMap,
        clampPosition: clampPositionToA4Page,
      });
      freeLayout.applyPositionsBatch(patches, { constrainA4: true });
    },
    [
      canvasDoc.layers.order,
      canvasDoc.pages,
      canvasDoc.sectionPageMap,
      freeLayout.applyPositionsBatch,
      freeLayoutSectionIds,
      resumeData,
      themeCustomization,
    ],
  );

  const handleResetLayout = useCallback(() => {
    layoutManualOverrideRef.current = false;
    clearAllManualSized();
    const draft = createFamilyDefaultPositions(templateFamily, freeLayoutSectionIds, resumeData);
    applyDraftThroughPrintPlan(draft);
  }, [
    applyDraftThroughPrintPlan,
    clearAllManualSized,
    freeLayoutSectionIds,
    resumeData,
    templateFamily,
  ]);

  const applyLayoutPreset = useCallback(
    (presetId: FreeLayoutPresetId) => {
      markLayoutManualOverride();
      clearAllManualSized();
      applyDraftThroughPrintPlan(
        createFreeLayoutPresetPositions(presetId, freeLayoutSectionIds, resumeData),
      );
      window.setTimeout(() => runColumnReflow(), 120);
    },
    [
      applyDraftThroughPrintPlan,
      clearAllManualSized,
      freeLayoutSectionIds,
      markLayoutManualOverride,
      runColumnReflow,
      resumeData,
    ],
  );

  const alignSelectedSection = useMemo(
    () => (horizontal?: "left" | "center" | "right", vertical?: "top" | "middle" | "bottom") => {
      const id = canvasDoc.selectedSectionId;
      if (!id) return;
      const pos = freeLayout.positions[id];
      if (!pos) return;
      handleFreeLayoutPositionChange(id, alignPositionOnPage(pos, horizontal, vertical), {
        skipSnap: true,
        constrainA4: true,
        layoutOverride: true,
      });
    },
    [canvasDoc.selectedSectionId, freeLayout.positions, handleFreeLayoutPositionChange],
  );

  const nudgeSelectedSection = useMemo(
    () => (dx: number, dy: number) => {
      const id = canvasDoc.selectedSectionId;
      if (!id) return;
      const pos = freeLayout.positions[id];
      if (!pos) return;
      handleFreeLayoutPositionChange(id, nudgePosition(pos, dx, dy), {
        skipSnap: true,
        constrainA4: true,
        layoutOverride: true,
      });
    },
    [canvasDoc.selectedSectionId, freeLayout.positions, handleFreeLayoutPositionChange],
  );

  const transformSelectedSection = useMemo(
    () => (transform: (pos: NonNullable<(typeof freeLayout.positions)[string]>) => NonNullable<(typeof freeLayout.positions)[string]>) => {
      const id = canvasDoc.selectedSectionId;
      if (!id) return;
      const pos = freeLayout.positions[id];
      if (!pos) return;
      handleFreeLayoutPositionChange(id, transform(pos), { skipSnap: true, constrainA4: true, userMoved: true });
    },
    [canvasDoc.selectedSectionId, freeLayout.positions, handleFreeLayoutPositionChange],
  );

  const moveSelectedToActivePage = useMemo(
    () => () => {
      const id = canvasDoc.selectedSectionId;
      if (!id) return;
      canvasDoc.assignSectionToPage(id, canvasDoc.activePageId);
    },
    [canvasDoc],
  );

  const familyDefaultPositions = useMemo(
    () => createFamilyDefaultPositions(templateFamily, freeLayoutSectionIds, resumeData),
    [templateFamily, freeLayoutSectionIds, resumeData],
  );

  const resetSelectedSection = useMemo(
    () => () => {
      const id = canvasDoc.selectedSectionId;
      if (!id) return;
      const pos = freeLayout.positions[id];
      const defaults = familyDefaultPositions[id];
      if (!pos || !defaults) return;
      clearSectionManualSized(id);
      handleFreeLayoutPositionChange(id, resetSectionPosition(id, pos, defaults), {
        skipSnap: true,
        constrainA4: true,
        layoutOverride: true,
      });
    },
    [
      canvasDoc.selectedSectionId,
      clearSectionManualSized,
      familyDefaultPositions,
      freeLayout.positions,
      handleFreeLayoutPositionChange,
    ],
  );

  const shortcutActions = useMemo(
    () => ({
      onToggleShortcuts: () => canvasDoc.setShortcutsOpen((open) => !open),
      onSelectLayerUp: () => canvasDoc.selectAdjacentLayer("up"),
      onSelectLayerDown: () => canvasDoc.selectAdjacentLayer("down"),
      onLayerOrderUp: () => {
        if (canvasDoc.selectedSectionId) canvasDoc.reorderLayer(canvasDoc.selectedSectionId, "up");
      },
      onLayerOrderDown: () => {
        if (canvasDoc.selectedSectionId) canvasDoc.reorderLayer(canvasDoc.selectedSectionId, "down");
      },
      onLayerToFront: () => {
        if (canvasDoc.selectedSectionId) canvasDoc.reorderLayer(canvasDoc.selectedSectionId, "front");
      },
      onLayerToBack: () => {
        if (canvasDoc.selectedSectionId) canvasDoc.reorderLayer(canvasDoc.selectedSectionId, "back");
      },
      onToggleHide: () => {
        if (canvasDoc.selectedSectionId) canvasDoc.toggleHidden(canvasDoc.selectedSectionId);
      },
      onToggleLock: () => {
        if (canvasDoc.selectedSectionId) canvasDoc.toggleLocked(canvasDoc.selectedSectionId);
      },
      onToggleLayerPanel: () => canvasDoc.toggleLayerPanel(),
      onToggleRightNav: () => canvasDoc.toggleRightNav(),
      onAddPage: () => canvasDoc.addPage(),
      onNextPage: () => {
        const nextIdx = (activePageIndex + 1) % canvasDoc.pages.length;
        canvasDoc.goToNextPage();
        requestAnimationFrame(() => canvasViewportRef.current?.focusPage(nextIdx));
      },
      onPrevPage: () => {
        const prevIdx = (activePageIndex - 1 + canvasDoc.pages.length) % canvasDoc.pages.length;
        canvasDoc.goToPrevPage();
        requestAnimationFrame(() => canvasViewportRef.current?.focusPage(prevIdx));
      },
      onFit: () => canvasViewportRef.current?.fitToScreen(),
      onResetView: () => canvasViewportRef.current?.resetView(),
      onDeselect: () => canvasDoc.setSelectedSectionId(null),
      onToggleGrid: () => canvasDoc.toggleShowGrid(),
      onToggleMargins: () => canvasDoc.toggleShowMargins(),
      onZoom100: () => canvasViewportRef.current?.zoomTo(1),
      onZoom50: () => canvasViewportRef.current?.zoomTo(0.5),
      onFocusPage: () => canvasViewportRef.current?.focusPage(activePageIndex),
      onDuplicatePage: () => canvasDoc.duplicateActivePage(),
      onRemovePage: () => canvasDoc.removeActivePage(),
      onShowAllLayers: () => canvasDoc.showAllLayers(),
      onUnlockAllLayers: () => canvasDoc.unlockAllLayers(),
      onCenter: () => transformSelectedSection(centerOnPage),
      onFillWidth: () => transformSelectedSection(fillPageWidth),
      onMoveToActivePage: moveSelectedToActivePage,
      onResetLayout: handleResetLayout,
      onNudge: nudgeSelectedSection,
      onAlignLeft: () => alignSelectedSection("left", undefined),
      onAlignRight: () => alignSelectedSection("right", undefined),
      onAlignTop: () => alignSelectedSection(undefined, "top"),
      onAlignBottom: () => alignSelectedSection(undefined, "bottom"),
      onSnapToGrid: () => transformSelectedSection(snapPositionToGrid),
      onGrowWidth: () => transformSelectedSection((pos) => resizeSection(pos, 1, 0)),
      onShrinkWidth: () => transformSelectedSection((pos) => resizeSection(pos, -1, 0)),
      onGrowHeight: () => transformSelectedSection((pos) => resizeSection(pos, 0, 1)),
      onShrinkHeight: () => transformSelectedSection((pos) => resizeSection(pos, 0, -1)),
      onResetSection: resetSelectedSection,
      onCopy: handleCanvasCopy,
      onPaste: handleCanvasPaste,
      onDuplicate: handleCanvasDuplicate,
    }),
    [activePageIndex, alignSelectedSection, canvasDoc, handleCanvasCopy, handleCanvasDuplicate, handleCanvasPaste, handleResetLayout, moveSelectedToActivePage, nudgeSelectedSection, resetSelectedSection, transformSelectedSection],
  );

  useCanvasStudioShortcuts(showCanvasViewport, shortcutActions);

  const canvasToolsBarProps = useMemo<CanvasToolsBarProps>(
    () => ({
      hasSelection: Boolean(canvasDoc.selectedSectionId),
      isHidden: Boolean(canvasDoc.selectedSectionId && canvasDoc.layers.hidden[canvasDoc.selectedSectionId]),
      isLocked: Boolean(canvasDoc.selectedSectionId && canvasDoc.layers.locked[canvasDoc.selectedSectionId]),
      showGrid: canvasDoc.showGrid,
      gridStrength: canvasDoc.gridStrength,
      onGridStrengthChange: canvasDoc.setGridStrength,
      showMargins: canvasDoc.showMargins,
      snapEnabled: freeLayout.snapEnabled,
      livePreview: freeLayout.livePreview,
      pageCount: canvasDoc.pages.length,
      onToggleGrid: () => canvasDoc.toggleShowGrid(),
      onToggleMargins: () => canvasDoc.toggleShowMargins(),
      onToggleSnap: () => freeLayout.setSnapEnabled((v) => !v),
      onToggleLivePreview: () => freeLayout.setLivePreview((v) => !v),
      onToggleHide: () => {
        if (canvasDoc.selectedSectionId) canvasDoc.toggleHidden(canvasDoc.selectedSectionId);
      },
      onToggleLock: () => {
        if (canvasDoc.selectedSectionId) canvasDoc.toggleLocked(canvasDoc.selectedSectionId);
      },
      onLayerUp: () => {
        if (canvasDoc.selectedSectionId) canvasDoc.reorderLayer(canvasDoc.selectedSectionId, "up");
      },
      onLayerDown: () => {
        if (canvasDoc.selectedSectionId) canvasDoc.reorderLayer(canvasDoc.selectedSectionId, "down");
      },
      onLayerFront: () => {
        if (canvasDoc.selectedSectionId) canvasDoc.reorderLayer(canvasDoc.selectedSectionId, "front");
      },
      onLayerBack: () => {
        if (canvasDoc.selectedSectionId) canvasDoc.reorderLayer(canvasDoc.selectedSectionId, "back");
      },
      onAlign: alignSelectedSection,
      onCenter: () => transformSelectedSection(centerOnPage),
      onFillWidth: () => transformSelectedSection(fillPageWidth),
      onMoveToActivePage: moveSelectedToActivePage,
      onSnapToGrid: () => transformSelectedSection(snapPositionToGrid),
      onGrowWidth: () => transformSelectedSection((pos) => resizeSection(pos, 1, 0)),
      onShrinkWidth: () => transformSelectedSection((pos) => resizeSection(pos, -1, 0)),
      onGrowHeight: () => transformSelectedSection((pos) => resizeSection(pos, 0, 1)),
      onShrinkHeight: () => transformSelectedSection((pos) => resizeSection(pos, 0, -1)),
      onResetSection: resetSelectedSection,
      onShowAllLayers: () => canvasDoc.showAllLayers(),
      onUnlockAllLayers: () => canvasDoc.unlockAllLayers(),
      onResetLayout: handleResetLayout,
      onAddPage: () => canvasDoc.addPage(),
      onDuplicatePage: () => canvasDoc.duplicateActivePage(),
      onRemovePage: () => canvasDoc.removeActivePage(),
      onFocusPage: () => canvasViewportRef.current?.focusPage(activePageIndex),
      onFit: () => canvasViewportRef.current?.fitToScreen(),
      onZoom100: () => canvasViewportRef.current?.zoomTo(1),
      onZoom50: () => canvasViewportRef.current?.zoomTo(0.5),
      onAddElement: handleAddElement,
      onAutoTidy: handleAutoTidy,
      onSmartLayout: handleSmartLayout,
    }),
    [
      activePageIndex,
      alignSelectedSection,
      canvasDoc,
      handleAddElement,
      handleAutoTidy,
      handleSmartLayout,
      freeLayout.livePreview,
      handleResetLayout,
      freeLayout.setLivePreview,
      freeLayout.setSnapEnabled,
      freeLayout.snapEnabled,
      moveSelectedToActivePage,
      resetSelectedSection,
      transformSelectedSection,
    ],
  );

  const canvasLayoutPanelProps = useMemo(
    () => ({
      sectionCountOnPage,
      hasSelection: Boolean(canvasDoc.selectedSectionId),
      onApplyPreset: applyLayoutPreset,
      onApplyPageLayout: applyPageLayout,
      activeTemplate,
      onSelectTemplate: setActiveTemplate,
      onResetCloudLayout: handleResetCloudLayout,
      resetCloudLayoutBusy,
    }),
    [
      activeTemplate,
      applyLayoutPreset,
      applyPageLayout,
      canvasDoc.selectedSectionId,
      handleResetCloudLayout,
      resetCloudLayoutBusy,
      sectionCountOnPage,
      setActiveTemplate,
    ],
  );

  const canvasAutoSaveLabel = useMemo(
    () => smartLayoutFeedback ?? formatAutoSaveTime(freeLayout.lastSavedAt),
    [freeLayout.lastSavedAt, smartLayoutFeedback],
  );

  const canvasActivePageLabel = useMemo(() => {
    const page = canvasDoc.pages.find((p) => p.id === canvasDoc.activePageId);
    return page?.label ?? formatCanvasPageLabel(1);
  }, [canvasDoc.activePageId, canvasDoc.pages]);

  const canvasStudioLayout = useMemo(
    () =>
      canvasDoc
        ? {
            pages: canvasDoc.pages,
            activePageId: canvasDoc.activePageId,
            sectionPageMap: canvasDoc.sectionPageMap,
            hiddenSections: canvasDoc.layers.hidden,
            lockedSections: canvasDoc.layers.locked,
            selectedSectionId: canvasDoc.selectedSectionId,
            onSelectSection: canvasDoc.setSelectedSectionId,
            getZIndex: canvasDoc.getZIndex,
            onSelectionChange: handleCanvasSelectionChange,
            onSectionContextMenu: handleContextMenuSection,
          }
        : undefined,
    [
      canvasDoc.activePageId,
      canvasDoc.getZIndex,
      canvasDoc.layers.hidden,
      canvasDoc.layers.locked,
      canvasDoc.pages,
      canvasDoc.sectionPageMap,
      canvasDoc.selectedSectionId,
      canvasDoc.setSelectedSectionId,
      handleCanvasSelectionChange,
      handleContextMenuSection,
    ],
  );

  useEffect(() => {
    if (freeLayout.enabled) {
      void import("./FreeLayoutStudioCanvas");
    }
  }, [freeLayout.enabled]);

  useEffect(() => {
    if (!showCanvasViewport && !freeLayout.enabled) return;
    scheduleCanvasLayoutCloudPush(buildCanvasLayoutSyncSnapshot);
  }, [
    canvasDoc.layers.hidden,
    canvasDoc.layers.locked,
    canvasDoc.layers.order,
    canvasDoc.pages,
    canvasDoc.sectionPageMap,
    freeLayout.enabled,
    freeLayout.lastSavedAt,
    freeLayout.positions,
    showCanvasViewport,
  ]);

  useEffect(() => {
    if (isPreviewMode && studioViewMode === "canvas" && !freeLayout.enabled) {
      freeLayout.setEnabled(true);
    }
  }, [freeLayout.enabled, freeLayout.setEnabled, isPreviewMode, studioViewMode]);

  useEffect(() => {
    if (!showCanvasViewport) return;
    const targetPageId = resolveLayoutTargetPageId(
      freeLayoutSectionIds,
      freeLayout.positions,
      canvasDoc.pages,
      canvasDoc.activePageId,
      canvasDoc.getSectionPageId,
    );
    if (
      targetPageId !== canvasDoc.activePageId &&
      sectionsOnPage(
        freeLayoutSectionIds,
        freeLayout.positions,
        canvasDoc.activePageId,
        canvasDoc.getSectionPageId,
      ).length === 0
    ) {
      canvasDoc.setActivePageId(targetPageId);
    }
  }, [
    showCanvasViewport,
    canvasDoc.activePageId,
    canvasDoc.getSectionPageId,
    canvasDoc.pages,
    canvasDoc.setActivePageId,
    freeLayout.positions,
    freeLayoutSectionIds,
  ]);

  useEffect(() => {
    if (isPreviewMode && freeLayout.enabled && studioViewMode === "compare") {
      if (canUseFeature("layout.canvasStudio")) {
        setStudioViewMode("canvas");
      } else {
        setStudioViewMode("single");
      }
    }
  }, [canUseFeature, freeLayout.enabled, isPreviewMode, setStudioViewMode, studioViewMode]);

  const openCanvasStudio = useCallback(() => {
    if (!canUseFeature("layout.canvasStudio")) {
      openUpgrade("layout.canvasStudio");
      return;
    }
    freeLayout.setEnabled(true);
    setStudioViewMode("canvas");
    setIsPreviewMode(true);
  }, [canUseFeature, freeLayout.setEnabled, openUpgrade, setIsPreviewMode, setStudioViewMode]);

  useEffect(() => {
    if (!showFreeLayoutEditor) {
      lastContentFitSigRef.current = null;
      lastThemeFitSigRef.current = null;
      if (!showCanvasViewport) {
        layoutManualOverrideRef.current = false;
      }
      return;
    }
    if (contentFitTimerRef.current) clearTimeout(contentFitTimerRef.current);
    contentFitTimerRef.current = setTimeout(() => {
      const themeChanged =
        lastThemeFitSigRef.current !== null && lastThemeFitSigRef.current !== themeFitSignature;
      lastThemeFitSigRef.current = themeFitSignature;

      const pageIds = canvasDoc.pages.map((p) => p.id);
      const currentPositions = layoutPositionsRef.current;

      if (showCanvasViewport) {
        const isFirstFit = lastContentFitSigRef.current === null;
        if (isFirstFit && !layoutManualOverrideRef.current) {
          if (isTemplateDemoResume(resumeData, activeTemplate)) {
            const canonical = resolveTemplateDemoEditorPositions(
              activeTemplate,
              freeLayoutSectionIds,
              resumeData,
            );
            freeLayout.applyPositionsBatch(canonical, { constrainA4: true });
            // Do NOT scheduleColumnReflow — it mutates demo y and breaks PDF WYSIWYG.
          } else {
            const synced = syncSectionHeightsToContentAllPages(
              freeLayoutSectionIds,
              currentPositions,
              pageIds,
              canvasDoc.getSectionPageId,
              layoutContent,
            );
            const next = preserveManualSizedDimensions(currentPositions, synced);
            const changed = freeLayoutSectionIds.some((id) => {
              const before = currentPositions[id];
              const after = next[id];
              if (!before || !after) return false;
              return before.height !== after.height;
            });
            if (changed) {
              freeLayout.applyPositionsBatch(next, { constrainA4: true });
            }
            scheduleColumnReflow(80);
          }
        }
        lastContentFitSigRef.current = contentFitSignature;
        return;
      }

      if (layoutManualOverrideRef.current && !themeChanged) {
        lastContentFitSigRef.current = contentFitSignature;
        return;
      }

      if (!showCanvasViewport && (previewPagesDoc.pages.length > 1 || canvasDoc.pages.length > 1)) {
        lastContentFitSigRef.current = contentFitSignature;
        return;
      }

      const synced = syncSectionHeightsToContentAllPages(
        freeLayoutSectionIds,
        currentPositions,
        pageIds,
        canvasDoc.getSectionPageId,
        layoutContent,
      );
      const next = preserveManualSizedDimensions(currentPositions, synced);
      const changed = freeLayoutSectionIds.some((id) => {
        const before = currentPositions[id];
        const after = next[id];
        if (!before || !after) return false;
        return before.height !== after.height;
      });
      if (changed) {
        freeLayout.applyPositionsBatch(next);
      }
      scheduleColumnReflow(100);
      lastContentFitSigRef.current = contentFitSignature;
    }, 360);
    return () => {
      if (contentFitTimerRef.current) clearTimeout(contentFitTimerRef.current);
    };
  }, [
    showFreeLayoutEditor,
    showCanvasViewport,
    contentFitSignature,
    themeFitSignature,
    canvasDoc.getSectionPageId,
    canvasDoc.pages,
    freeLayout.applyPositionsBatch,
    freeLayoutSectionIds,
    layoutContent,
    preserveManualSizedDimensions,
    previewPagesDoc.pages.length,
    scheduleColumnReflow,
  ]);

  const workspaceReflowDoneRef = useRef(false);
  useEffect(() => {
    if (!showFreeLayoutCanvas || showCanvasViewport) {
      workspaceReflowDoneRef.current = false;
      return;
    }
    if (workspaceReflowDoneRef.current) return;
    workspaceReflowDoneRef.current = true;

    if (isActiveTemplateDemo) {
      const canonical = resolveTemplateDemoEditorPositions(
        activeTemplate,
        freeLayoutSectionIds,
        resumeData,
      );
      freeLayout.applyPositionsBatch(canonical, { constrainA4: true });
      return;
    }

    // Multi-page demo layouts assign each page local Y from the top — reflowing
    // on a single sheet stacks page-2 sections onto page-1 coordinates.
    if (previewPagesDoc.pages.length > 1 || canvasDoc.pages.length > 1) return;

    const pageIds = canvasDoc.pages.map((p) => p.id);
    const currentPositions = layoutPositionsRef.current;
    const synced = syncSectionHeightsToContentAllPages(
      freeLayoutSectionIds,
      currentPositions,
      pageIds,
      canvasDoc.getSectionPageId,
      layoutContent,
    );
    const next = preserveManualSizedDimensions(currentPositions, synced);
    const heightChanged = freeLayoutSectionIds.some((id) => {
      const before = currentPositions[id];
      const after = next[id];
      if (!before || !after) return false;
      return before.height !== after.height;
    });
    if (heightChanged) {
      freeLayout.applyPositionsBatch(next);
    }

    scheduleColumnReflow(120);
    scheduleColumnReflow(480);
  }, [
    activeTemplate,
    canvasDoc.getSectionPageId,
    canvasDoc.pages,
    freeLayout.applyPositionsBatch,
    freeLayoutSectionIds,
    isActiveTemplateDemo,
    layoutContent,
    preserveManualSizedDimensions,
    resumeData,
    scheduleColumnReflow,
    showCanvasViewport,
    showFreeLayoutCanvas,
    previewPagesDoc.pages.length,
  ]);

  useEffect(() => {
    if (!showCanvasViewport) {
      lastLayerOrderSigRef.current = "";
      return;
    }
    const sig = canvasDoc.layers.order.join("|");
    if (!lastLayerOrderSigRef.current) {
      lastLayerOrderSigRef.current = sig;
      return;
    }
    if (lastLayerOrderSigRef.current === sig) return;
    lastLayerOrderSigRef.current = sig;

    if (layoutManualOverrideRef.current) return;

    const patches = applyPageLayoutAction(
      lastLayoutActionRef.current,
      freeLayoutSectionIds,
      layoutPositionsRef.current,
      canvasDoc.activePageId,
      canvasDoc.getSectionPageId,
      canvasDoc.selectedSectionId ?? undefined,
      layoutContent,
    );
    if (Object.keys(patches).length > 0) {
      freeLayout.applyPositionsBatch(patches, { constrainA4: true });
    }
    window.setTimeout(() => runColumnReflow(), 120);
  }, [
    showCanvasViewport,
    canvasDoc.activePageId,
    canvasDoc.getSectionPageId,
    canvasDoc.layers.order,
    canvasDoc.selectedSectionId,
    freeLayout.applyPositionsBatch,
    freeLayoutSectionIds,
    layoutContent,
    runColumnReflow,
  ]);

  const contextMenuActions = useMemo(() => {
    const sectionId = contextMenu?.sectionId;
    if (!sectionId) return {};
    return {
      onCopy: handleCanvasCopy,
      onPaste: handleCanvasPaste,
      onDuplicate: handleCanvasDuplicate,
      onDelete: () => handleDeleteCanvasElement(sectionId),
      onToggleLock: () => canvasDoc.toggleLocked(sectionId),
      onToggleHide: () => canvasDoc.toggleHidden(sectionId),
      onBringFront: () => canvasDoc.reorderLayer(sectionId, "front"),
      onSendBack: () => canvasDoc.reorderLayer(sectionId, "back"),
      onFitContent: () => handleFitSectionContent(sectionId),
      onMoveToActivePage: moveSelectedToActivePage,
      canPaste: hasCanvasClipboard(templateFamily),
      isCanvasElement: isCanvasElementId(sectionId),
      isLocked: Boolean(canvasDoc.layers.locked[sectionId]),
      isHidden: Boolean(canvasDoc.layers.hidden[sectionId]),
    };
  }, [
    canvasDoc,
    contextMenu?.sectionId,
    handleCanvasCopy,
    handleCanvasDuplicate,
    handleCanvasPaste,
    handleDeleteCanvasElement,
    handleFitSectionContent,
    moveSelectedToActivePage,
    templateFamily,
  ]);

  return (
    <div
      className={`${
        isPreviewMode
          ? "w-full flex-1 min-h-0 flex flex-col"
          : "w-full h-full flex flex-col min-h-0 min-w-0"
      } relative`}
      id="preview-col"
    >
      
      {isPreviewMode ? (
        /* Fullscreen Comparison & Style Studio Layout */
        <div className="flex flex-col flex-1 min-h-0" id="immersive-preview-studio">
          
          <StudioPreviewHeader
            liveAtsScore={liveAtsScore}
            onExit={() => setIsPreviewMode(false)}
            studioViewMode={studioViewMode}
            setStudioViewMode={setStudioViewMode}
            activeTemplate={activeTemplate}
            setActiveTemplate={setActiveTemplate}
            freeLayoutEnabled={freeLayout.enabled}
            setFreeLayoutEnabled={freeLayout.setEnabled}
            freeLayoutLivePreview={freeLayout.livePreview}
            setFreeLayoutLivePreview={freeLayout.setLivePreview}
            freeLayoutSnapEnabled={freeLayout.snapEnabled}
            setFreeLayoutSnapEnabled={freeLayout.setSnapEnabled}
            onResetLayout={handleResetLayout}
            onApplyLayoutPreset={applyLayoutPreset}
            freeLayoutLastSavedAt={freeLayout.lastSavedAt}
            grayscaleMode={grayscaleMode}
            setGrayscaleMode={setGrayscaleMode}
            highlightChanges={highlightChanges}
            setHighlightChanges={setHighlightChanges}
            previewZoom={previewZoom}
            setPreviewZoom={setPreviewZoom}
            previewAutoFit={previewAutoFit}
            setPreviewAutoFit={setPreviewAutoFit}
            history={history}
            future={future}
            handleUndo={handleUndo}
            handleRedo={handleRedo}
            chatOpen={chatOpen}
            setChatOpen={setChatOpen}
            exportToJson={exportToJson}
            exportToDocx={exportToDocx}
            exportToPDF={exportToPDF}
            pdfExporting={pdfExporting}
            themeCustomization={themeCustomization}
            onThemeCustomizationChange={onThemeCustomizationChange}
            onThemeCustomizationReset={onThemeCustomizationReset}
            freeLayoutSectionIds={freeLayoutSectionIds}
          />
    
          {/* Immersive Workspace Container */}
          {studioViewMode === "compare" ? (
            <div
              className="flex-1 min-h-0 overflow-auto preview-canvas preview-comparison-tray border border-t-0 rounded-b-2xl p-3"
              id="resume-container-box-comparison"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full min-w-0 max-w-full">
                {(
                  [
                    {
                      id: "modern",
                      style: "modern-01" as TemplateStyle,
                      label: t("resumeLivePreview.families.modern"),
                      dot: "bg-emerald-500",
                      btn: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-600 hover:text-white",
                    },
                    {
                      id: "classic",
                      style: "classic-01" as TemplateStyle,
                      label: t("resumeLivePreview.families.classic"),
                      dot: "bg-emerald-500",
                      btn: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-600 hover:text-white",
                    },
                    {
                      id: "minimalist",
                      style: "minimalist-01" as TemplateStyle,
                      label: t("resumeLivePreview.families.minimalist"),
                      dot: "bg-slate-800",
                      btn: "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-800 hover:text-white",
                    },
                  ] as const
                ).map((col) => (
                  <div key={col.id} className={`min-w-0 flex flex-col gap-2 ${grayscaleMode ? "grayscale" : ""}`}>
                    <div className="flex items-center justify-between gap-2 preview-comparison-chip border px-2 py-1.5 rounded-lg shadow-sm min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${col.dot}`} />
                        <span className="text-[9px] font-black uppercase font-mono truncate">{col.label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTemplate(col.style);
                          setStudioViewMode("single");
                        }}
                        className={`shrink-0 text-[8px] font-bold uppercase px-2 py-0.5 rounded border transition-all cursor-pointer ${col.btn}`}
                      >
                        {t("resumeLivePreview.apply")}
                      </button>
                    </div>
                    <ResponsivePreviewFrame
                      containerClassName="min-w-0 overflow-hidden rounded-lg border preview-comparison-slot p-2 shadow-sm"
                      autoFit={shouldAutoFitPreview}
                      zoomPercent={previewZoom}
                      fitPadding={8}
                    >
                      <div className="min-w-0">
                        <ResumeTemplateRenderer
                          data={resumeData}
                          style={col.style}
                          layout="embedded"
                          highlightChanges={highlightChanges}
                          tailoredSummary={analysisResult?.tailoredSummary}
                          tailoredBullets={analysisResult?.tailoredBulletPoints}
                          matchedKeywords={detectedKeywords}
                          missingKeywords={activeKeywordsList.filter((word) => !detectedKeywords.includes(word))}
                          highlightMatcherActive={matcherHighlightActive}
                          resolvedTheme={resolveResumeTheme(col.style, themeCustomization)}
                        />
                      </div>
                    </ResponsivePreviewFrame>
                  </div>
                ))}
              </div>
            </div>
          ) : showPrintPreview ? (
            <div
              id="studio-print-preview"
              className="flex-1 min-h-0 overflow-auto preview-canvas bg-slate-100/80 p-4 md:p-6"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">
                {t("studio.printPreviewHint")}
              </p>
              <Suspense fallback={<CanvasLoadingFallback />}>
                <FreeLayoutStudioCanvas
                  variant="export"
                  resumeData={resumeData}
                  highlightChanges={false}
                  analysisResult={analysisResult}
                  previewZoom={100}
                  grayscaleMode={grayscaleMode}
                  sections={exportSections}
                  positions={exportSurfacePositions}
                  exportSections={exportSections}
                  sectionSlices={exportSectionSlices}
                  onPositionChange={() => {}}
                  chromeMode="full"
                  autoFitContentHeight={false}
                  manualSizedSections={manualSizedSections}
                  templateStyle={activeTemplate}
                  resolvedTheme={resolvedTheme}
                  containerId="studio-print-preview-inner"
                  outerClassName="mx-auto"
                  showGrid={false}
                  showMargins={false}
                  snapEnabled={false}
                  canvasLayout={exportCanvasLayout}
                />
              </Suspense>
            </div>
          ) : showCanvasViewport ? (
            <Suspense fallback={<CanvasLoadingFallback />}>
            <CanvasStudioViewport
              ref={canvasViewportRef}
              contentWidth={FREE_LAYOUT_CANVAS.width}
              contentHeight={canvasContentHeight}
              className="flex-1 min-h-0 rounded-none border-0 shadow-none"
              rightNav={
                <CanvasRightNavSections
                  order={canvasDoc.navSectionOrder}
                  onReorder={canvasDoc.setNavSectionOrder}
                  toolsBarProps={canvasToolsBarProps}
                  layoutPanelProps={canvasLayoutPanelProps}
                />
              }
              layerPanelOpen={canvasDoc.layerPanelOpen}
              onToggleLayerPanel={canvasDoc.toggleLayerPanel}
              rightNavOpen={canvasDoc.rightNavOpen}
              onToggleRightNav={canvasDoc.toggleRightNav}
              shortcutsOpen={canvasDoc.shortcutsOpen}
              onToggleShortcuts={() => canvasDoc.setShortcutsOpen((open) => !open)}
              showShortcutsHint={!canvasDoc.shortcutsDismissed}
              onDismissShortcutsHint={canvasDoc.dismissShortcutsHint}
              autoSaveLabel={canvasAutoSaveLabel}
              activePageLabel={canvasActivePageLabel}
              layerPanel={
                <CanvasLayerPanel
                  layers={canvasDoc.layersForPanel}
                  selectedSectionId={canvasDoc.selectedSectionId}
                  hiddenSections={canvasDoc.layers.hidden}
                  lockedSections={canvasDoc.layers.locked}
                  sectionPageMap={canvasDoc.sectionPageMap}
                  pages={canvasDoc.pages}
                  onSelect={canvasDoc.setSelectedSectionId}
                  onToggleHidden={canvasDoc.toggleHidden}
                  onToggleLocked={canvasDoc.toggleLocked}
                  onReorder={canvasDoc.reorderLayer}
                  onReorderRelative={canvasDoc.reorderLayerRelative}
                  onAssignPage={canvasDoc.assignSectionToPage}
                  onCollapse={canvasDoc.toggleLayerPanel}
                />
              }
              pageStrip={
                <CanvasPageStrip
                  pages={canvasDoc.pages}
                  activePageId={canvasDoc.activePageId}
                  onSelectPage={canvasDoc.setActivePageId}
                  onAddPage={canvasDoc.addPage}
                  onRemovePage={canvasDoc.removePage}
                  onRenamePage={canvasDoc.renamePage}
                />
              }
            >
              <FreeLayoutStudioCanvas
                resumeData={resumeData}
                highlightChanges={highlightChanges}
                analysisResult={analysisResult}
                previewZoom={100}
                grayscaleMode={grayscaleMode}
                sections={freeLayout.sections}
                positions={freeLayout.positions}
                onPositionChange={handleFreeLayoutPositionChange}
                variant={freeLayoutVariant}
                chromeMode={freeLayout.livePreview ? "live" : "full"}
                autoFitContentHeight={!demoLocksLayoutHeights}
                manualSizedSections={manualSizedSections}
                onSectionManualSize={markSectionManualSized}
                onSectionClearManualSize={clearSectionManualSized}
                templateStyle={activeTemplate}
                resolvedTheme={resolvedTheme}
                containerId="resume-container-box-canvas"
                outerClassName="canvas-studio-node-host flex-none overflow-visible border-0 shadow-none bg-transparent p-0"
                autoFitToWidth={false}
                showGrid={canvasDoc.showGrid}
                gridStrength={canvasDoc.gridStrength}
                showMargins={canvasDoc.showMargins}
                snapEnabled={freeLayout.snapEnabled}
                canvasLayout={canvasStudioLayout}
              />
            </CanvasStudioViewport>
            </Suspense>
          ) : showFreeLayoutCanvas ? (
            <Suspense fallback={<CanvasLoadingFallback />}>
            <FreeLayoutStudioCanvas
              resumeData={resumeData}
              highlightChanges={highlightChanges}
              analysisResult={analysisResult}
              previewZoom={previewZoom}
              grayscaleMode={grayscaleMode}
              sections={sidebarPreviewSections}
              positions={sidebarPreviewPositions}
              onPositionChange={handleFreeLayoutPositionChange}
              variant={freeLayoutVariant}
              chromeMode={freeLayout.livePreview ? "live" : "full"}
              autoFitContentHeight={!demoLocksLayoutHeights}
              manualSizedSections={manualSizedSections}
              onSectionManualSize={markSectionManualSized}
              onSectionClearManualSize={clearSectionManualSized}
              templateStyle={activeTemplate}
              resolvedTheme={resolvedTheme}
              autoFitToWidth={shouldAutoFitPreview}
              canvasLayout={sidebarPreviewLayout}
            />
            </Suspense>
          ) : (
            <ResponsivePreviewFrame
              containerId="resume-container-box-workspace"
              containerClassName={`flex-1 min-h-0 preview-canvas border border-t-0 rounded-b-2xl p-4 md:p-6 overflow-auto scrollbar-thin shadow-inner ${grayscaleMode ? "grayscale" : ""}`}
              autoFit={shouldAutoFitPreview}
              zoomPercent={previewZoom}
              fitPadding={32}
            >
              <div className={resumeSheetClass}>
                <ResumeTemplateRenderer
                  data={resumeData}
                  style={activeTemplate}
                  highlightChanges={highlightChanges}
                  tailoredSummary={analysisResult?.tailoredSummary}
                  tailoredBullets={analysisResult?.tailoredBulletPoints}
                  matchedKeywords={detectedKeywords}
                  missingKeywords={activeKeywordsList.filter(word => !detectedKeywords.includes(word))}
                  highlightMatcherActive={matcherHighlightActive}
                  resolvedTheme={resolvedTheme}
                />
              </div>
            </ResponsivePreviewFrame>
          )}
        </div>
      ) : (
        <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden rounded-2xl preview-panel-frame">
          <div
            className={`relative flex-1 min-w-0 min-h-0 ${
              showFreeLayoutCanvas ? "overflow-auto scrollbar-thin" : "overflow-hidden"
            }`}
          >
            {showFreeLayoutCanvas ? (
              <Suspense fallback={<CanvasLoadingFallback />}>
              <FreeLayoutStudioCanvas
                resumeData={resumeData}
                highlightChanges={highlightChanges}
                analysisResult={analysisResult}
                previewZoom={previewZoom}
                grayscaleMode={grayscaleMode}
                sections={sidebarPreviewSections}
                positions={sidebarPreviewPositions}
                onPositionChange={handleFreeLayoutPositionChange}
                variant={freeLayoutVariant}
                chromeMode={freeLayout.livePreview ? "live" : "full"}
                autoFitContentHeight={!demoLocksLayoutHeights}
                manualSizedSections={manualSizedSections}
                onSectionManualSize={markSectionManualSized}
                onSectionClearManualSize={clearSectionManualSized}
                templateStyle={activeTemplate}
                containerId="resume-container-box"
                resolvedTheme={resolvedTheme}
                autoFitToWidth
                canvasLayout={sidebarPreviewLayout}
              />
              </Suspense>
            ) : (
              <ResponsivePreviewFrame
                containerId="resume-container-box"
                containerClassName="preview-canvas flex-1 min-h-[380px] overflow-y-auto scrollbar-thin p-3 md:p-5"
                autoFit
                zoomPercent={previewZoom}
                fitPadding={24}
              >
                <div className={resumeSheetClass}>
                    <ResumeTemplateRenderer
                      data={resumeData}
                      style={activeTemplate}
                      highlightChanges={highlightChanges}
                      tailoredSummary={analysisResult?.tailoredSummary}
                      tailoredBullets={analysisResult?.tailoredBulletPoints}
                      matchedKeywords={detectedKeywords}
                      missingKeywords={activeKeywordsList.filter((word) => !detectedKeywords.includes(word))}
                      highlightMatcherActive={matcherHighlightActive}
                      resolvedTheme={resolvedTheme}
                    />
                  </div>
              </ResponsivePreviewFrame>
            )}
          </div>

          <PreviewUtilityNav
            liveAtsScore={liveAtsScore}
            activeTemplate={activeTemplate}
            setActiveTemplate={setActiveTemplate}
            freeLayoutEnabled={freeLayout.enabled}
            onFreeLayoutChange={(enabled) => freeLayout.setEnabled(enabled)}
            freeLayoutLivePreview={freeLayout.livePreview}
            onFreeLayoutLivePreviewChange={freeLayout.setLivePreview}
            freeLayoutLastSavedAt={freeLayout.lastSavedAt}
            matcherHighlightActive={matcherHighlightActive}
            onMatcherHighlightToggle={() => setMatcherHighlightActive(!matcherHighlightActive)}
            onOpenStudio={openCanvasStudio}
            historyLength={history.length}
            onUndo={handleUndo}
            chatOpen={chatOpen}
            onChatToggle={() => setChatOpen(!chatOpen)}
            exportToJson={exportToJson}
            exportToDocx={exportToDocx}
            exportToPDF={exportToPDF}
            pdfExporting={pdfExporting}
            themeCustomization={themeCustomization}
            onThemeCustomizationChange={onThemeCustomizationChange}
            onThemeCustomizationReset={onThemeCustomizationReset}
          />
          <ExportDock
            pdfExporting={pdfExporting}
            exportToPDF={exportToPDF}
            exportToDocx={exportToDocx}
            exportToJson={exportToJson}
          />
          <CanvasContextMenu
            menu={contextMenu}
            actions={contextMenuActions}
            onClose={() => setContextMenu(null)}
          />
        </div>
      )}
    
      {/* Studio 模式才顯示浮動 ATS（Canvas 全畫面時隱藏） */}
      {isPreviewMode && studioViewMode !== "canvas" ? (
      <div className="absolute bottom-6 right-6 z-30 no-print font-sans flex flex-col items-end gap-3" id="floating-ats-compliance-widget">
        {atsScoreExpanded ? (
          <motion.div
            layoutId="ats-widget"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-5 w-80 text-left space-y-4 max-h-[480px] overflow-y-auto"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">{t("resumeLivePreview.liveAtsTitle")}</h4>
                  <p className="text-[9px] text-slate-400 font-medium">{t("resumeLivePreview.liveAtsHint")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAtsScoreExpanded(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                id="ats-widget-btn-close"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
    
            {/* Dynamic Radial Gauge Section */}
            <div className="flex items-center gap-4 bg-slate-50/80 border border-slate-100 p-3.5 rounded-xl">
              <div className="relative flex items-center justify-center w-20 h-20 shrink-0 select-none">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="stroke-slate-200 fill-none"
                    strokeWidth="5"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className={`fill-none transition-all duration-500 ease-out ${
                      liveAtsScore >= 75 
                        ? "stroke-emerald-500" 
                        : liveAtsScore >= 45
                        ? "stroke-amber-500"
                        : "stroke-rose-500"
                    }`}
                    strokeWidth="5"
                    strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={2 * Math.PI * 32 - (liveAtsScore / 100) * (2 * Math.PI * 32)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-base font-black text-slate-800 tracking-tight leading-none font-mono">
                    {liveAtsScore}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">%</span>
                </div>
              </div>
    
              <div className="space-y-1">
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  liveAtsScore >= 75 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : liveAtsScore >= 45
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  {liveAtsScore >= 75 ? t("resumeLivePreview.excellentMatch") : liveAtsScore >= 45 ? t("resumeLivePreview.goodFoundation") : t("resumeLivePreview.needsRevision")}
                </span>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  {liveAtsScore >= 75 
                    ? t("resumeLivePreview.excellentHint") 
                    : liveAtsScore >= 45
                    ? t("resumeLivePreview.goodHint")
                    : t("resumeLivePreview.lowHint")}
                </p>
              </div>
            </div>
    
            {/* Keywords Alignment Section Area */}
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black font-mono uppercase tracking-widest text-slate-400">{t("resumeLivePreview.keywordChecklist")}</span>
                <span className="text-[9px] font-bold text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded-md">
                  {t("resumeLivePreview.foundCount", { found: detectedKeywords.length, total: activeKeywordsList.length })}
                </span>
              </div>
    
              <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1" id="ats-keywords-list">
                {/* Found tags first */}
                {detectedKeywords.map((word) => (
                  <div key={word} className="flex items-center justify-between text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg px-2.5 py-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>{word}</span>
                    </div>
                    <span className="text-[8px] font-mono font-black uppercase text-emerald-600">{t("resumeLivePreview.matched")}</span>
                  </div>
                ))}
    
                {/* Missing tags second */}
                {activeKeywordsList.filter(w => !detectedKeywords.includes(w)).map((word) => (
                  <div key={word} className="flex items-center justify-between text-[10px] bg-rose-50/60 border border-rose-100/60 text-slate-600 rounded-lg px-2.5 py-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></div>
                      <span>{word}</span>
                    </div>
                    <span className="text-[8px] font-mono font-bold uppercase text-amber-600 bg-amber-50 px-1 border border-amber-100 rounded">{t("resumeLivePreview.missing")}</span>
                  </div>
                ))}
              </div>
    
              <div className="text-[9px] text-slate-400 font-medium pt-1 border-t border-slate-100">
                {t("resumeLivePreview.tip")} <strong>{t("resumeLivePreview.tipLabel")}</strong> {t("resumeLivePreview.tipBody")}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            layoutId="ats-widget"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAtsScoreExpanded(true)}
            className="bg-white border-2 border-emerald-600 hover:border-emerald-700 shadow-xl rounded-full p-2.5 flex items-center justify-center cursor-pointer relative animate-bounce-slow"
            title={t("resumeLivePreview.expandAts")}
          >
            <div className="relative flex items-center justify-center w-12 h-12">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  className="stroke-slate-100 fill-none"
                  strokeWidth="3.5"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  className={`fill-none transition-all duration-500 ease-out ${
                    liveAtsScore >= 75 
                      ? "stroke-emerald-500" 
                      : liveAtsScore >= 45
                      ? "stroke-amber-500"
                      : "stroke-rose-500"
                  }`}
                  strokeWidth="3.5"
                  strokeDasharray={2 * Math.PI * 20}
                  strokeDashoffset={2 * Math.PI * 20 - (liveAtsScore / 100) * (2 * Math.PI * 20)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-black text-slate-800 leading-none font-mono">{liveAtsScore}</span>
                <span className="text-[8px] font-bold text-emerald-600 uppercase mt-0.5 font-sans leading-none">ATS</span>
              </div>
            </div>
          </motion.button>
        )}
      </div>
      ) : null}

      {freeLayout.enabled ? (
        <div id={EXPORT_SURFACE_HOST_ID} className="resume-export-surface-host" aria-hidden="true">
          <Suspense fallback={null}>
            <FreeLayoutStudioCanvas
              variant="export"
              resumeData={resumeData}
              highlightChanges={highlightChanges}
              analysisResult={analysisResult}
              previewZoom={100}
              grayscaleMode={grayscaleMode}
              sections={exportSections}
              positions={exportSurfacePositions}
              exportSections={exportSections}
              sectionSlices={exportSectionSlices}
              onPositionChange={() => {}}
              chromeMode="full"
              autoFitContentHeight={false}
              manualSizedSections={manualSizedSections}
              templateStyle={activeTemplate}
              resolvedTheme={resolvedTheme}
              containerId="resume-export-surface-inner"
              outerClassName="resume-export-surface-inner"
              showGrid={false}
              showMargins={false}
              snapEnabled={false}
              canvasLayout={exportCanvasLayout}
            />
          </Suspense>
        </div>
      ) : null}

    </div>
  );
}
