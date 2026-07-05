import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useDragControls, useMotionValue } from "motion/react";
import { GripVertical } from "lucide-react";
import { ResumeData, AnalysisResult, TemplateStyle } from "../../types";
import {
  FREE_LAYOUT_CANVAS,
  FREE_LAYOUT_MIN_WIDTH,
  FREE_LAYOUT_MIN_HEIGHT,
  FREE_LAYOUT_MAX_HEIGHT,
  SNAP_GRID_SIZE,
  FreeLayoutPosition,
  FreeLayoutSectionMeta,
  applyMagneticSnap,
  clampSectionWidth,
  clampSectionHeight,
  defaultSectionHeight,
  snapToGrid,
} from "../../lib/resumeFreeLayout";
import {
  CANVAS_PAGE_HEIGHT,
  CANVAS_PAGE_WIDTH,
  CanvasPage,
  computeMultiPageDeskHeight,
  getPageTopOffset,
  gridStrengthToOpacity,
  resolvePageDropFromPoint,
} from "../../lib/canvasStudioTypes";
import { detectPageSnapEdge, resolveBoundaryPageCross, clampPositionToA4Page, maxSectionHeightOnPage, type PageSnapEdge } from "../../lib/canvasPageSnap";
import { CANVAS_PAGE_MARGIN } from "../../lib/canvasAlignTools";
import {
  estimateSectionHeightForContent,
  getSectionTextLength,
  measureSectionContentHeight,
  SECTION_CONTENT_PADDING,
} from "../../lib/canvasSectionContentSizing";
import { getTemplateFamily } from "../../lib/resumeTemplateCatalog";
import { ResolvedResumeTheme, DEFAULT_THEME_CUSTOMIZATION, resolveResumeTheme } from "../../lib/resumeThemeCustomization";
import ResumeThemeRoot from "./ResumeThemeRoot";
import ResumeSectionRenderer from "../resume/ResumeSectionRenderer";
import CanvasPageMarginGuides from "./canvas/CanvasPageMarginGuides";
import { useI18n } from "../../i18n";
import { getSectionLabel } from "../../lib/sectionLabels";
import { isCanvasElementId, removeCanvasElement } from "../../lib/canvasElements";
import { Trash2 } from "lucide-react";
import { useResponsiveScale } from "../../hooks/useResponsiveScale";

export interface FreeLayoutStudioCanvasProps {
  resumeData: ResumeData;
  highlightChanges: boolean;
  analysisResult: AnalysisResult | null;
  previewZoom: number;
  grayscaleMode: boolean;
  sections: FreeLayoutSectionMeta[];
  positions: Record<string, FreeLayoutPosition>;
  onPositionChange: (id: string, pos: FreeLayoutPosition, options?: { skipSnap?: boolean; constrainA4?: boolean; userMoved?: boolean }) => void;
  variant?: "edit" | "preview" | "export";
  chromeMode?: "full" | "live";
  templateStyle: TemplateStyle;
  resolvedTheme?: ResolvedResumeTheme;
  containerId?: string;
  outerClassName?: string;
  showGrid?: boolean;
  gridStrength?: number;
  showMargins?: boolean;
  snapEnabled?: boolean;
  autoFitToWidth?: boolean;
  /** When false, skip DOM ResizeObserver height auto-fit (Canvas Studio sync handles sizing) */
  autoFitContentHeight?: boolean;
  /** Sections the user manually resized — skip auto-fit / batch height sync */
  manualSizedSections?: ReadonlySet<string>;
  onSectionManualSize?: (sectionId: string) => void;
  onSectionClearManualSize?: (sectionId: string) => void;
  canvasLayout?: {
    pages: CanvasPage[];
    activePageId: string;
    sectionPageMap: Record<string, string>;
    hiddenSections: Record<string, boolean>;
    lockedSections: Record<string, boolean>;
    selectedSectionId: string | null;
    onSelectSection: (id: string | null) => void;
    getZIndex: (id: string) => number;
  };
}

export default function FreeLayoutStudioCanvas({
  resumeData,
  highlightChanges,
  analysisResult,
  previewZoom,
  grayscaleMode,
  sections,
  positions,
  onPositionChange,
  variant = "edit",
  chromeMode = "full",
  templateStyle,
  resolvedTheme,
  containerId = "resume-container-box-workspace",
  outerClassName,
  showGrid = true,
  gridStrength = 55,
  showMargins = false,
  snapEnabled = true,
  autoFitToWidth = true,
  autoFitContentHeight = true,
  manualSizedSections,
  onSectionManualSize,
  onSectionClearManualSize,
  canvasLayout,
}: FreeLayoutStudioCanvasProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<HTMLDivElement>(null);
  const isEdit = variant === "edit";
  const isExport = variant === "export";
  const isPrintSurface = variant === "preview" || isExport;
  const isCanvasStudioHost = containerId === "resume-container-box-canvas";
  const effectiveChromeMode = chromeMode;
  const effectiveAutoFitHeight = autoFitContentHeight;
  const isLiveChrome = isEdit && effectiveChromeMode === "live";
  const isNarrowPanel = containerId === "resume-container-box";
  const isMultiPage = Boolean(canvasLayout?.pages.length);
  const shouldAutoFitToWidth = autoFitToWidth && !isExport && !isCanvasStudioHost;
  const family = getTemplateFamily(templateStyle);
  const resolved = resolvedTheme ?? resolveResumeTheme(templateStyle, DEFAULT_THEME_CUSTOMIZATION);
  const tc = resolved.classes;
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const [multiSelectedIds, setMultiSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [pageSnapGuide, setPageSnapGuide] = useState<{ pageId: string; edge: PageSnapEdge } | null>(null);
  const dropTargetPageRef = useRef<string | null>(null);
  const pageSnapGuideRef = useRef<{ pageId: string; edge: PageSnapEdge } | null>(null);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const dragPointerRafRef = useRef<number | null>(null);
  const pendingDragPointerRef = useRef<{ x: number; y: number } | null>(null);
  const pageIds = useMemo(() => canvasLayout?.pages.map((p) => p.id) ?? [], [canvasLayout?.pages]);
  const selectedSectionId = canvasLayout?.selectedSectionId ?? internalSelectedId;
  const setSelectedSectionId = canvasLayout?.onSelectSection ?? setInternalSelectedId;

  const handleSelectSection = useCallback(
    (sectionId: string, additive?: boolean) => {
      if (additive) {
        setMultiSelectedIds((prev) => {
          const next = new Set(prev);
          if (selectedSectionId && !next.has(selectedSectionId)) next.add(selectedSectionId);
          if (next.has(sectionId)) {
            next.delete(sectionId);
          } else {
            next.add(sectionId);
          }
          return next;
        });
      } else {
        setMultiSelectedIds(new Set());
      }
      setSelectedSectionId(sectionId);
    },
    [selectedSectionId, setSelectedSectionId],
  );

  const clearAllSelection = useCallback(() => {
    setSelectedSectionId(null);
    setMultiSelectedIds(new Set());
  }, [setSelectedSectionId]);

  const editSheetExtent = useMemo(() => {
    if (!isEdit || isExport) return CANVAS_PAGE_HEIGHT;
    let maxBottom = CANVAS_PAGE_HEIGHT;
    for (const section of sections) {
      if (canvasLayout?.hiddenSections[section.id]) continue;
      const pos = positions[section.id];
      if (!pos) continue;
      maxBottom = Math.max(maxBottom, pos.y + pos.height + CANVAS_PAGE_MARGIN);
    }
    return snapToGrid(maxBottom, SNAP_GRID_SIZE);
  }, [isEdit, isExport, sections, positions, canvasLayout?.hiddenSections]);

  const { containerRef, fitScale } = useResponsiveScale({
    enabled: shouldAutoFitToWidth,
    contentWidth: FREE_LAYOUT_CANVAS.width,
    padding: isNarrowPanel ? 24 : 40,
  });
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);
  const pageCount = canvasLayout?.pages.length ?? 1;
  const isSingleA4Page = !isMultiPage;
  const singleSheetHeight = isEdit && !isExport ? editSheetExtent : CANVAS_PAGE_HEIGHT;
  const canvasHeight = useMemo(
    () => (isMultiPage ? computeMultiPageDeskHeight(pageCount) : singleSheetHeight),
    [isMultiPage, pageCount, singleSheetHeight],
  );

  const emitPositionChange = useCallback(
    (sectionId: string, pos: FreeLayoutPosition, options?: { skipSnap?: boolean; constrainA4?: boolean; userMoved?: boolean }) => {
      const next = isMultiPage || isSingleA4Page ? clampPositionToA4Page(pos) : pos;
      onPositionChange(sectionId, next, isMultiPage || isSingleA4Page ? { ...options, constrainA4: true } : options);
    },
    [isMultiPage, isSingleA4Page, onPositionChange],
  );

  const resolveSnapDraft = useCallback(
    (sectionId: string, draft: FreeLayoutPosition, pageId?: string): FreeLayoutPosition => {
      if (!snapEnabled) return draft;
      return applyMagneticSnap(sectionId, draft, positionsRef.current, FREE_LAYOUT_CANVAS.width, {
        pageHeight: isMultiPage || isSingleA4Page ? CANVAS_PAGE_HEIGHT : undefined,
        pageId: draft.pageId ?? pageId ?? positionsRef.current[sectionId]?.pageId,
        margin: isMultiPage ? CANVAS_PAGE_MARGIN : 0,
      });
    },
    [isMultiPage, isSingleA4Page, snapEnabled],
  );

  /** Group ops across the multi-selection — align edges or distribute spacing. */
  const applyGroupOperation = useCallback(
    (op: "align-left" | "align-top" | "align-right" | "distribute-v" | "distribute-h") => {
      const ids = [...multiSelectedIds].filter((id) => positionsRef.current[id]);
      if (ids.length < 2) return;
      const boxes = ids.map((id) => ({ id, pos: positionsRef.current[id]! }));
      const updates: Array<[string, FreeLayoutPosition]> = [];

      if (op === "align-left") {
        const minX = Math.min(...boxes.map((b) => b.pos.x));
        for (const b of boxes) updates.push([b.id, { ...b.pos, x: minX }]);
      } else if (op === "align-top") {
        const minY = Math.min(...boxes.map((b) => b.pos.y));
        for (const b of boxes) updates.push([b.id, { ...b.pos, y: minY }]);
      } else if (op === "align-right") {
        const maxRight = Math.max(...boxes.map((b) => b.pos.x + b.pos.width));
        for (const b of boxes) updates.push([b.id, { ...b.pos, x: maxRight - b.pos.width }]);
      } else if (op === "distribute-v") {
        const sorted = [...boxes].sort((a, b) => a.pos.y - b.pos.y);
        const first = sorted[0]!.pos;
        const last = sorted[sorted.length - 1]!.pos;
        const span = last.y + last.height - first.y;
        const totalH = sorted.reduce((sum, b) => sum + b.pos.height, 0);
        const gap = Math.max(0, (span - totalH) / (sorted.length - 1));
        let cursor = first.y;
        for (const b of sorted) {
          updates.push([b.id, { ...b.pos, y: Math.round(cursor) }]);
          cursor += b.pos.height + gap;
        }
      } else {
        const sorted = [...boxes].sort((a, b) => a.pos.x - b.pos.x);
        const first = sorted[0]!.pos;
        const last = sorted[sorted.length - 1]!.pos;
        const span = last.x + last.width - first.x;
        const totalW = sorted.reduce((sum, b) => sum + b.pos.width, 0);
        const gap = Math.max(0, (span - totalW) / (sorted.length - 1));
        let cursor = first.x;
        for (const b of sorted) {
          updates.push([b.id, { ...b.pos, x: Math.round(cursor) }]);
          cursor += b.pos.width + gap;
        }
      }

      for (const [id, pos] of updates) {
        emitPositionChange(id, pos, { skipSnap: true, userMoved: true });
      }
    },
    [emitPositionChange, multiSelectedIds],
  );

  const zoomFactor = previewZoom / 100;
  const effectiveScale = (shouldAutoFitToWidth ? fitScale : 1) * zoomFactor;
  const scaledHeight = canvasHeight * effectiveScale;

  const defaultOuter = isNarrowPanel
    ? "preview-canvas rounded-b-2xl p-3 md:p-4 flex-1 min-h-0 overflow-x-hidden overflow-y-auto shadow-md"
    : "preview-canvas border border-t-0 rounded-b-2xl p-4 md:p-8 flex-1 overflow-auto shadow-inner min-h-[750px] flex justify-center items-start";

  const renderSection = (section: FreeLayoutSectionMeta, pageMaxY?: number, pageId?: string, pageIndex = 0) => {
    if (canvasLayout?.hiddenSections[section.id]) return null;

    const pos = positions[section.id] ?? {
      x: 48,
      y: 48,
      width: 360,
      height: defaultSectionHeight(section.id),
    };
    const locked = Boolean(canvasLayout?.lockedSections[section.id]);
    const zIndex = canvasLayout?.getZIndex(section.id) ?? 10;

    if (isEdit) {
      return (
        <DraggableSection
          key={section.id}
          sectionId={section.id}
          position={pos}
          compact={isNarrowPanel}
          chromeMode={effectiveChromeMode}
          isSelected={selectedSectionId === section.id}
          multiSelected={multiSelectedIds.has(section.id)}
          onSelect={(additive) => handleSelectSection(section.id, additive)}
          onPositionChange={(next, options) => emitPositionChange(section.id, next, options)}
          onDragPointer={isMultiPage ? handleSectionDragPointer : undefined}
          onDragLocalY={
            isMultiPage && pageId
              ? (localY) => syncPageSnapGuide(pageId, localY, pos.height)
              : undefined
          }
          onDragComplete={finishSectionDrag}
          pageBoundary={
            isMultiPage && pageIds.length > 1
              ? {
                  pageIndex,
                  pageIds,
                  onBoundaryCross: (targetPageId, x, y) => {
                    emitPositionChange(section.id, { ...pos, pageId: targetPageId, x, y }, { userMoved: true });
                  },
                }
              : undefined
          }
          onCrossPageDrop={
            isMultiPage
              ? (clientX, clientY) => {
                  const resolved = resolvePageDropFromPoint(clientX, clientY, pos.width, pos.height);
                  if (!resolved) return false;
                  const currentPageId = canvasLayout?.sectionPageMap[section.id] ?? canvasLayout?.activePageId;
                  if (resolved.pageId === currentPageId) return false;
                  emitPositionChange(section.id, { ...pos, x: resolved.x, y: resolved.y, pageId: resolved.pageId }, { userMoved: true });
                  return true;
                }
              : undefined
          }
          locked={locked}
          zIndex={zIndex}
          snapEnabled={snapEnabled}
          resolveSnap={(draft) => resolveSnapDraft(section.id, draft, pageId)}
          maxY={pageMaxY}
          maxHeight={
            pageMaxY !== undefined
              ? Math.min(FREE_LAYOUT_MAX_HEIGHT, maxSectionHeightOnPage(pos.y))
              : FREE_LAYOUT_MAX_HEIGHT
          }
          pageHeight={pageMaxY ?? CANVAS_PAGE_HEIGHT}
          autoFitContentHeight={effectiveAutoFitHeight}
          manualSizeLocked={manualSizedSections?.has(section.id) ?? false}
          onManualSize={() => onSectionManualSize?.(section.id)}
          onClearManualSize={() => onSectionClearManualSize?.(section.id)}
          resumeData={resumeData}
        >
          <ResumeSectionRenderer
            sectionId={section.id}
            data={resumeData}
            highlightChanges={highlightChanges}
            analysisResult={analysisResult}
            templateStyle={templateStyle}
            resolvedTheme={resolved}
            mode="block"
          />
        </DraggableSection>
      );
    }

    return (
      <div
        key={section.id}
        id={`free-layout-section-${section.id}`}
        className={`absolute ${isExport ? "overflow-visible" : "overflow-hidden"}`}
        style={{
          left: pos.x,
          top: pos.y,
          width: pos.width,
          ...(isExport
            ? { minHeight: pos.height, height: "auto" }
            : { height: pos.height }),
          zIndex,
        }}
      >
        <ResumeSectionRenderer
          sectionId={section.id}
          data={resumeData}
          highlightChanges={highlightChanges}
          analysisResult={analysisResult}
          templateStyle={templateStyle}
          resolvedTheme={resolved}
          mode="block"
        />
      </div>
    );
  };

  const renderGrid = (subtle = false) => (
    <div
      data-canvas-chrome
      className={`canvas-page-grid${subtle ? " canvas-page-grid--live" : ""}`}
      style={{
        ["--canvas-grid-strength" as string]: gridStrengthToOpacity(gridStrength),
        backgroundSize: `${SNAP_GRID_SIZE}px ${SNAP_GRID_SIZE}px, ${SNAP_GRID_SIZE}px ${SNAP_GRID_SIZE}px, ${SNAP_GRID_SIZE * 4}px ${SNAP_GRID_SIZE * 4}px, ${SNAP_GRID_SIZE * 4}px ${SNAP_GRID_SIZE * 4}px`,
      }}
      aria-hidden
    />
  );

  const updateDropTargetPage = useCallback((pageId: string | null) => {
    if (dropTargetPageRef.current === pageId) return;
    const root = deskRef.current ?? canvasRef.current;
    const prevId = dropTargetPageRef.current;
    if (prevId) {
      root?.querySelector<HTMLElement>(`[data-page-id="${prevId}"]`)?.classList.remove("canvas-page-sheet--drop-target");
    }
    dropTargetPageRef.current = pageId;
    if (pageId) {
      root?.querySelector<HTMLElement>(`[data-page-id="${pageId}"]`)?.classList.add("canvas-page-sheet--drop-target");
    }
  }, []);

  const syncPageSnapGuide = useCallback((pageId: string, localY: number, height: number) => {
    const edge = detectPageSnapEdge(localY, height);
    const prev = pageSnapGuideRef.current;
    if (!edge) {
      if (prev !== null) {
        pageSnapGuideRef.current = null;
        setPageSnapGuide(null);
      }
      return;
    }
    if (prev?.pageId === pageId && prev.edge === edge) return;
    const next = { pageId, edge };
    pageSnapGuideRef.current = next;
    setPageSnapGuide(next);
  }, []);

  const handleSectionDragPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!isMultiPage) return;
      pendingDragPointerRef.current = { x: clientX, y: clientY };
      if (dragPointerRafRef.current !== null) return;
      dragPointerRafRef.current = requestAnimationFrame(() => {
        dragPointerRafRef.current = null;
        const point = pendingDragPointerRef.current;
        if (!point) return;
        const pageEl = document.elementFromPoint(point.x, point.y)?.closest<HTMLElement>("[data-page-id]");
        updateDropTargetPage(pageEl?.dataset.pageId ?? null);
      });
    },
    [isMultiPage, updateDropTargetPage],
  );

  const finishSectionDrag = useCallback(() => {
    pendingDragPointerRef.current = null;
    if (dragPointerRafRef.current !== null) {
      cancelAnimationFrame(dragPointerRafRef.current);
      dragPointerRafRef.current = null;
    }
    updateDropTargetPage(null);
    pageSnapGuideRef.current = null;
    setPageSnapGuide(null);
  }, [updateDropTargetPage]);

  useEffect(
    () => () => {
      if (dragPointerRafRef.current !== null) cancelAnimationFrame(dragPointerRafRef.current);
    },
    [],
  );

  const renderPageSections = (pageId: string, pageIndex: number) => {
    const pageSections = sections.filter((s) => (canvasLayout?.sectionPageMap[s.id] ?? pageId) === pageId);
    const pageMaxY = isMultiPage ? CANVAS_PAGE_HEIGHT : undefined;
    return pageSections.map((section) => renderSection(section, pageMaxY, pageId, pageIndex));
  };

  const renderSingleSheet = () => (
    <ResumeThemeRoot
      resolved={resolved}
      id={isExport ? "resume-export-surface" : "resume-printable-sheet"}
      exportPage
      exportStatic={isExport}
      a4Surface
      className={`relative ${resolved.active ? "" : "bg-white"} ${
        isEdit
          ? "shadow-2xl rounded-xl border border-slate-200/80 overflow-visible"
          : isExport
            ? "overflow-hidden shadow-none border-0 rounded-none"
            : "shadow-sm border border-slate-100 rounded-lg overflow-hidden"
      } ${tc.sheetFont}`}
      style={{
        width: FREE_LAYOUT_CANVAS.width,
        minHeight: CANVAS_PAGE_HEIGHT,
        height: singleSheetHeight,
      }}
    >
      <div
        ref={isExport ? undefined : canvasRef}
        className={`relative w-full ${isEdit && !isExport ? "min-h-full overflow-visible" : isExport ? "h-full overflow-visible" : "h-full overflow-hidden"}`}
        onPointerDown={isEdit ? clearAllSelection : undefined}
      >
        {isEdit && !isExport && editSheetExtent > CANVAS_PAGE_HEIGHT ? (
          <div
            className="canvas-page-break-guide pointer-events-none absolute left-0 right-0 z-[5] border-b-2 border-dashed border-red-400/50"
            style={{ top: CANVAS_PAGE_HEIGHT }}
            aria-hidden
          />
        ) : null}
        {family === "modern" && resolved.showAccentBar && (isLiveChrome || isPrintSurface) ? (
          <div className={`h-2 ${tc.accentBar} rounded-t-lg`} />
        ) : null}
        {isEdit && showGrid ? renderGrid(isLiveChrome) : null}
        {sections.map((section) => renderSection(section))}
      </div>
    </ResumeThemeRoot>
  );

  const renderMultiPageDesk = () => {
    const deskHeight = computeMultiPageDeskHeight(canvasLayout!.pages.length);
    return (
      <div
        ref={deskRef}
        className="canvas-multi-page-desk relative overflow-visible"
        style={{ width: FREE_LAYOUT_CANVAS.width, height: deskHeight }}
      >
        {isEdit && showGrid ? (
          <div
            data-canvas-chrome
            className={`canvas-page-grid absolute inset-0 pointer-events-none${isLiveChrome ? " canvas-page-grid--live" : ""}`}
            style={{
              ["--canvas-grid-strength" as string]: gridStrengthToOpacity(gridStrength),
              backgroundSize: `${SNAP_GRID_SIZE}px ${SNAP_GRID_SIZE}px, ${SNAP_GRID_SIZE}px ${SNAP_GRID_SIZE}px, ${SNAP_GRID_SIZE * 4}px ${SNAP_GRID_SIZE * 4}px, ${SNAP_GRID_SIZE * 4}px ${SNAP_GRID_SIZE * 4}px`,
            }}
            aria-hidden
          />
        ) : null}
        {canvasLayout!.pages.map((page, pageIndex) => {
          const isActive = page.id === canvasLayout!.activePageId;
          return (
            <div
              key={page.id}
              data-page-id={page.id}
              className={`canvas-page-sheet absolute left-0${!isExport && isActive ? " canvas-page-sheet--active" : ""}${isEdit ? " canvas-page-sheet--editing" : ""}`}
              style={{
                top: getPageTopOffset(pageIndex),
                width: FREE_LAYOUT_CANVAS.width,
                height: CANVAS_PAGE_HEIGHT,
              }}
            >
              {!isExport ? (
                <div className="canvas-page-sheet-label" data-canvas-chrome>
                  {page.label} · A4 {CANVAS_PAGE_WIDTH}×{CANVAS_PAGE_HEIGHT}
                </div>
              ) : null}
              <ResumeThemeRoot
                resolved={resolved}
                id={
                  isExport
                    ? pageIndex === 0
                      ? "resume-export-surface"
                      : `resume-export-page-${page.id}`
                    : isActive
                      ? "resume-printable-sheet"
                      : `canvas-page-${page.id}`
                }
                exportPage
                exportStatic={isExport}
                className={`canvas-page-sheet-paper canvas-page-sheet-paper--a4 relative ${
                  resolved.active ? "" : "bg-white"
                } ${
                  isEdit
                    ? "shadow-2xl rounded-xl border border-slate-200/80 canvas-page-sheet-paper--editing"
                    : "overflow-hidden"
                } ${tc.sheetFont}`}
                style={{ width: FREE_LAYOUT_CANVAS.width, height: CANVAS_PAGE_HEIGHT }}
              >
                <div
                  ref={pageIndex === 0 && !isExport ? canvasRef : undefined}
                  data-page-drop-surface={isEdit ? "" : undefined}
                  className={`relative w-full h-full ${isEdit || isExport ? "overflow-visible" : "overflow-hidden"}`}
                  onPointerDown={isEdit ? clearAllSelection : undefined}
                >
                  {family === "modern" && resolved.showAccentBar && (isLiveChrome || isPrintSurface) ? (
                    <div className={`h-2 ${tc.accentBar} rounded-t-lg`} />
                  ) : null}
                  {isEdit && showMargins ? <CanvasPageMarginGuides /> : null}
                  {!isExport && pageSnapGuide?.pageId === page.id && pageSnapGuide.edge === "top" ? (
                    <div className="canvas-page-snap-guide canvas-page-snap-guide--top" data-canvas-chrome aria-hidden />
                  ) : null}
                  {!isExport && pageSnapGuide?.pageId === page.id && pageSnapGuide.edge === "bottom" ? (
                    <div className="canvas-page-snap-guide canvas-page-snap-guide--bottom" data-canvas-chrome aria-hidden />
                  ) : null}
                  {renderPageSections(page.id, pageIndex)}
                </div>
              </ResumeThemeRoot>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`${outerClassName ?? defaultOuter} ${grayscaleMode ? "grayscale" : ""}`}
      id={containerId}
    >
      {isEdit && multiSelectedIds.size >= 2 ? (
        <div className="sticky top-2 z-[70] flex justify-center pointer-events-none" data-canvas-chrome>
          <div
            className="pointer-events-auto flex items-center gap-1 bg-white/95 border border-sky-200 rounded-lg shadow-md px-2 py-1"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] font-bold text-sky-800 pr-1 border-r border-sky-100">
              {t("canvas.multi.count", { count: multiSelectedIds.size })}
            </span>
            {(
              [
                ["align-left", t("canvas.multi.alignLeft")],
                ["align-top", t("canvas.multi.alignTop")],
                ["align-right", t("canvas.multi.alignRight")],
                ["distribute-v", t("canvas.multi.distributeV")],
                ["distribute-h", t("canvas.multi.distributeH")],
              ] as const
            ).map(([op, label]) => (
              <button
                key={op}
                type="button"
                className="text-[10px] font-medium text-sky-700 hover:bg-sky-50 border border-transparent hover:border-sky-200 rounded px-1.5 py-0.5"
                onClick={() => applyGroupOperation(op)}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
              title={t("canvas.multi.clear")}
              onClick={clearAllSelection}
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}
      <div
        className={isNarrowPanel ? "w-full flex justify-center" : "shrink-0 flex justify-center"}
        style={{ minHeight: scaledHeight }}
      >
        <div
          style={{
            transform: `scale(${effectiveScale})`,
            transformOrigin: "top center",
            width: FREE_LAYOUT_CANVAS.width,
          }}
          className="shrink-0"
        >
          {isMultiPage ? renderMultiPageDesk() : renderSingleSheet()}
        </div>
      </div>
    </div>
  );
}

interface DraggableSectionProps {
  sectionId: string;
  position: FreeLayoutPosition;
  compact?: boolean;
  chromeMode?: "full" | "live";
  isSelected?: boolean;
  multiSelected?: boolean;
  onSelect?: (additive?: boolean) => void;
  onPositionChange: (pos: FreeLayoutPosition, options?: { skipSnap?: boolean; userMoved?: boolean }) => void;
  locked?: boolean;
  zIndex?: number;
  maxY?: number;
  maxHeight?: number;
  autoFitContentHeight?: boolean;
  manualSizeLocked?: boolean;
  onManualSize?: () => void;
  onClearManualSize?: () => void;
  onDragPointer?: (clientX: number, clientY: number) => void;
  onDragLocalY?: (localY: number) => void;
  onDragComplete?: () => void;
  pageBoundary?: {
    pageIndex: number;
    pageIds: string[];
    onBoundaryCross: (targetPageId: string, x: number, y: number) => void;
  };
  onCrossPageDrop?: (clientX: number, clientY: number) => boolean;
  snapEnabled?: boolean;
  resolveSnap?: (draft: FreeLayoutPosition) => FreeLayoutPosition;
  children: React.ReactNode;
  resumeData?: ResumeData;
  pageHeight?: number;
}

const CHROME_ESTIMATE_COLLAPSED = 40;
const CHROME_ESTIMATE_EXPANDED = 136;

function resolveChromeAbove(position: FreeLayoutPosition, pageHeight: number, isSelected: boolean): boolean {
  const chromeH = isSelected ? CHROME_ESTIMATE_EXPANDED : CHROME_ESTIMATE_COLLAPSED;
  const spaceAbove = position.y;
  const spaceBelow = pageHeight - position.y - position.height;
  if (spaceAbove < chromeH && spaceBelow >= chromeH) return false;
  if (spaceBelow < chromeH && spaceAbove >= chromeH) return true;
  return spaceAbove >= chromeH || spaceAbove >= spaceBelow;
}

/** Content-driven sizing: auto-expand when unlocked; detect clip when manually fixed */
function useSectionContentSizing(
  autoFitEnabled: boolean,
  sectionId: string,
  resumeData: ResumeData | undefined,
  position: FreeLayoutPosition,
  maxHeight: number | undefined,
  onPositionChange: DraggableSectionProps["onPositionChange"],
  manualSizeLocked: boolean,
) {
  const contentRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(position);
  positionRef.current = position;
  const [contentOverflows, setContentOverflows] = useState(false);
  const contentLen = resumeData ? getSectionTextLength(sectionId, resumeData) : 0;
  const expansionMode = autoFitEnabled && !manualSizeLocked;

  useEffect(() => {
    if (!resumeData) return;
    const node = contentRef.current;
    if (!node) return;

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const current = positionRef.current;
        const naturalH = measureSectionContentHeight(node, current.width);
        const estimated = estimateSectionHeightForContent(sectionId, resumeData, current.width);
        const contentNeed = Math.max(estimated, naturalH + SECTION_CONTENT_PADDING);

        if (manualSizeLocked) {
          setContentOverflows(contentNeed > current.height + 4);
          return;
        }
        setContentOverflows(false);
        if (!autoFitEnabled) return;

        const domNeed = snapToGrid(
          clampSectionHeight(contentNeed, maxHeight ?? FREE_LAYOUT_MAX_HEIGHT),
          SNAP_GRID_SIZE,
        );
        if (Math.abs(domNeed - current.height) >= 4) {
          onPositionChange({ ...current, height: domNeed }, { skipSnap: true });
        }
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [
    autoFitEnabled,
    manualSizeLocked,
    maxHeight,
    onPositionChange,
    resumeData,
    sectionId,
    contentLen,
    position.width,
  ]);

  return { contentRef, expansionMode, contentOverflows };
}

const DimensionControls: React.FC<{
  sectionLabel: string;
  sectionId?: string;
  resumeData?: ResumeData;
  position: FreeLayoutPosition;
  maxWidth: number;
  maxHeight?: number;
  compact?: boolean;
  onPositionChange: DraggableSectionProps["onPositionChange"];
  onManualResize?: () => void;
  onFitContent?: () => void;
  variant?: "panel" | "overlay";
  active?: boolean;
}> = ({
  sectionLabel,
  sectionId,
  resumeData,
  position,
  maxWidth,
  maxHeight,
  compact,
  onPositionChange,
  onManualResize,
  onFitContent,
  variant = "panel",
  active = true,
}) => {
  const { t } = useI18n();
  const heightMax = maxHeight ?? FREE_LAYOUT_MAX_HEIGHT;
  const clampHeight = (value: number) =>
    clampSectionHeight(Math.min(value, heightMax));
  const [draftWidth, setDraftWidth] = useState(position.width);
  const [draftHeight, setDraftHeight] = useState(position.height);
  const [slidersOpen, setSlidersOpen] = useState(false);
  const slidingRef = useRef<"width" | "height" | null>(null);
  const positionRef = useRef(position);
  positionRef.current = position;
  const useCollapsible = variant === "overlay";

  useEffect(() => {
    if (slidingRef.current !== "width") setDraftWidth(position.width);
    if (slidingRef.current !== "height") setDraftHeight(position.height);
  }, [position.width, position.height]);

  useEffect(() => {
    if (!active) setSlidersOpen(false);
  }, [active]);

  const commitWidth = (value: number) => {
    const current = positionRef.current;
    let width = clampSectionWidth(value, current.x, FREE_LAYOUT_CANVAS.width);
    let x = current.x;
    if (x + width > CANVAS_PAGE_WIDTH) {
      x = Math.max(0, CANVAS_PAGE_WIDTH - width);
    }
    onManualResize?.();
    onPositionChange({ ...current, x, width }, { skipSnap: true, userMoved: true });
  };

  const commitHeight = (value: number) => {
    const current = positionRef.current;
    onManualResize?.();
    onPositionChange({ ...current, height: clampHeight(value) }, { skipSnap: true, userMoved: true });
  };

  const queueWidthCommit = (value: number) => {
    setDraftWidth(value);
    commitWidth(value);
  };

  const queueHeightCommit = (value: number) => {
    setDraftHeight(value);
    commitHeight(value);
  };

  const wrapClass =
    variant === "overlay"
      ? "flex flex-col gap-1 bg-white/95 backdrop-blur-sm border border-emerald-200 rounded-lg shadow-lg p-2"
      : `flex flex-col gap-1.5 bg-emerald-50/80 border-b border-emerald-100 shrink-0 ${compact ? "px-2 py-1.5" : "px-3 py-2"}`;

  if (useCollapsible && !slidersOpen) {
    return (
      <div className={wrapClass} data-canvas-chrome onPointerDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="flex items-center justify-between gap-2 w-full text-left rounded-md px-2 py-1 hover:bg-emerald-50 transition-colors"
          onClick={() => setSlidersOpen(true)}
          title={t("canvas.dimensions.adjustSize")}
        >
          <span className="text-[10px] font-mono font-bold text-slate-600 tabular-nums">
            {t("canvas.dimensions.sizeSummary", { width: Math.round(draftWidth), height: Math.round(draftHeight) })}
          </span>
          <span className="text-[9px] font-bold text-emerald-700 shrink-0">{t("canvas.dimensions.adjustSize")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={wrapClass} data-canvas-chrome onPointerDown={(e) => e.stopPropagation()}>
      {useCollapsible ? (
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-[9px] font-mono font-bold text-slate-500 tabular-nums">
            {t("canvas.dimensions.sizeSummary", { width: Math.round(draftWidth), height: Math.round(draftHeight) })}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {onFitContent ? (
              <button
                type="button"
                className="text-[9px] font-bold text-violet-700 hover:text-violet-900"
                onClick={onFitContent}
                title={t("canvas.dimensions.fitContent")}
              >
                {t("canvas.dimensions.fitContent")}
              </button>
            ) : null}
            <button
              type="button"
              className="text-[9px] font-bold text-emerald-700 hover:text-emerald-900"
              onClick={() => setSlidersOpen(false)}
            >
              {t("canvas.dimensions.collapseSize")}
            </button>
          </div>
        </div>
      ) : null}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-emerald-600 shrink-0 w-3">{t("canvas.dimensions.width")}</span>
        <input
          type="range"
          min={FREE_LAYOUT_MIN_WIDTH}
          max={maxWidth}
          value={draftWidth}
          onPointerDown={() => {
            slidingRef.current = "width";
          }}
          onChange={(e) => queueWidthCommit(Number(e.target.value))}
          onPointerUp={(e) => {
            slidingRef.current = null;
            commitWidth(Number((e.target as HTMLInputElement).value));
          }}
          onPointerCancel={(e) => {
            slidingRef.current = null;
            commitWidth(Number((e.target as HTMLInputElement).value));
          }}
          onBlur={(e) => {
            if (slidingRef.current === "width") {
              slidingRef.current = null;
              commitWidth(Number((e.target as HTMLInputElement).value));
            }
          }}
          className="flex-1 h-2 accent-emerald-600 cursor-pointer min-w-0"
          aria-label={t("canvas.dimensions.widthAria", { label: sectionLabel })}
        />
        <input
          type="number"
          min={FREE_LAYOUT_MIN_WIDTH}
          max={maxWidth}
          value={draftWidth}
          onChange={(e) => {
            const raw = Number(e.target.value);
            if (Number.isNaN(raw)) return;
            const width = clampSectionWidth(raw, positionRef.current.x, FREE_LAYOUT_CANVAS.width);
            setDraftWidth(width);
            commitWidth(width);
          }}
          className="w-11 text-[10px] font-mono text-emerald-700 border border-emerald-200 rounded px-1 py-0.5 text-right tabular-nums shrink-0 bg-white"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-emerald-600 shrink-0 w-3">{t("canvas.dimensions.height")}</span>
        <input
          type="range"
          min={FREE_LAYOUT_MIN_HEIGHT}
          max={heightMax}
          value={draftHeight}
          onPointerDown={() => {
            slidingRef.current = "height";
          }}
          onChange={(e) => queueHeightCommit(Number(e.target.value))}
          onPointerUp={(e) => {
            slidingRef.current = null;
            commitHeight(Number((e.target as HTMLInputElement).value));
          }}
          onPointerCancel={(e) => {
            slidingRef.current = null;
            commitHeight(Number((e.target as HTMLInputElement).value));
          }}
          onBlur={(e) => {
            if (slidingRef.current === "height") {
              slidingRef.current = null;
              commitHeight(Number((e.target as HTMLInputElement).value));
            }
          }}
          className="flex-1 h-2 accent-violet-600 cursor-pointer min-w-0"
          aria-label={t("canvas.dimensions.heightAria", { label: sectionLabel })}
        />
        <input
          type="number"
          min={FREE_LAYOUT_MIN_HEIGHT}
          max={heightMax}
          value={draftHeight}
          onChange={(e) => {
            const raw = Number(e.target.value);
            if (Number.isNaN(raw)) return;
            const height = clampHeight(raw);
            setDraftHeight(height);
            commitHeight(height);
          }}
          className="w-11 text-[10px] font-mono text-violet-700 border border-violet-200 rounded px-1 py-0.5 text-right tabular-nums shrink-0 bg-white"
        />
      </div>
    </div>
  );
};

const DraggableSection = memo(function DraggableSection({
  sectionId,
  position,
  compact = false,
  chromeMode = "full",
  isSelected = false,
  multiSelected = false,
  onSelect,
  onPositionChange,
  locked = false,
  zIndex = 10,
  maxY,
  maxHeight,
  autoFitContentHeight = true,
  manualSizeLocked = false,
  onManualSize,
  onClearManualSize,
  onDragPointer,
  onDragLocalY,
  onDragComplete,
  pageBoundary,
  onCrossPageDrop,
  snapEnabled = false,
  resolveSnap,
  children,
  resumeData,
  pageHeight = CANVAS_PAGE_HEIGHT,
}: DraggableSectionProps) {
  const { t } = useI18n();
  const displayLabel = getSectionLabel(sectionId);
  const dragControls = useDragControls();
  const x = useMotionValue(position.x);
  const y = useMotionValue(position.y);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  const [isHovered, setIsHovered] = useState(false);
  const isLive = chromeMode === "live";
  const showChrome = isLive ? isHovered || isSelected || isDragging : isHovered || isSelected || isDragging;

  const maxWidth = FREE_LAYOUT_CANVAS.width - position.x - 8;
  const sizingEnabled = Boolean(resumeData) && autoFitContentHeight;
  const { contentRef, expansionMode, contentOverflows } = useSectionContentSizing(
    sizingEnabled,
    sectionId,
    resumeData,
    position,
    maxHeight,
    onPositionChange,
    manualSizeLocked,
  );

  const contentPadClass = compact ? "p-2" : "p-3";
  const contentOverflowClass = expansionMode ? "overflow-visible" : "min-h-0 overflow-hidden";
  const shellRingClass = isDragging
    ? "ring-2 ring-emerald-500 shadow-xl"
    : isSelected
      ? isLive
        ? "ring-2 ring-emerald-400/80"
        : "ring-2 ring-emerald-400/80 border-2 border-dashed border-emerald-400/70"
      : multiSelected
        ? "ring-2 ring-sky-400/80 border-2 border-dashed border-sky-300/70"
      : isHovered
        ? isLive
          ? "ring-1 ring-emerald-200"
          : "ring-1 ring-emerald-200 border border-dashed border-emerald-200/80"
        : isLive
          ? ""
          : "border border-transparent";

  const handleManualResize = useCallback(() => {
    onManualSize?.();
  }, [onManualSize]);

  const handleFitContent = useCallback(() => {
    if (!resumeData) return;
    onClearManualSize?.();
    const current = position;
    const height = clampSectionHeight(
      estimateSectionHeightForContent(sectionId, resumeData, current.width),
      maxHeight ?? FREE_LAYOUT_MAX_HEIGHT,
    );
    onPositionChange({ ...current, height }, { skipSnap: true });
  }, [maxHeight, onClearManualSize, onPositionChange, position, resumeData, sectionId]);

  useEffect(() => {
    if (isDraggingRef.current) return;
    x.set(position.x);
    y.set(position.y);
  }, [position.x, position.y, x, y]);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (locked) return;
    event.preventDefault();
    event.stopPropagation();
    dragControls.start(event);
  };

  /** Float chrome outside the content box; flip based on available page space */
  const chromeAbove = resolveChromeAbove(position, pageHeight, isSelected);
  const chromePlacementClass = chromeAbove
    ? "absolute left-0 right-0 bottom-full mb-1"
    : "absolute left-0 right-0 top-full mt-1";

  return (
    <motion.div
      id={`free-layout-section-${sectionId}`}
      drag={!locked}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      className={`absolute overflow-visible ${locked ? "canvas-section-locked" : ""}`}
      style={{
        x,
        y,
        width: position.width,
        height: expansionMode ? "auto" : position.height,
        minHeight: expansionMode ? Math.max(position.height, FREE_LAYOUT_MIN_HEIGHT) : position.height,
        left: 0,
        top: 0,
        zIndex: isDragging || isHovered || isSelected ? zIndex + 50 : zIndex,
      }}
      onDrag={(_, info) => {
        onDragPointer?.(info.point.x, info.point.y);
        onDragLocalY?.(y.get());
      }}
      onDragStart={() => {
        if (locked) return;
        isDraggingRef.current = true;
        setIsDragging(true);
      }}
      onDragEnd={(event) => {
        if (locked) return;
        const pointer = event as PointerEvent;
        if (onCrossPageDrop?.(pointer.clientX, pointer.clientY)) {
          isDraggingRef.current = false;
          setIsDragging(false);
          onDragComplete?.();
          return;
        }
        const nextX = Math.max(0, Math.round(x.get()));
        let nextY = Math.max(0, Math.round(y.get()));

        if (pageBoundary) {
          const boundary = resolveBoundaryPageCross(
            nextY,
            position.height,
            pageBoundary.pageIndex,
            pageBoundary.pageIds,
          );
          if (boundary) {
            pageBoundary.onBoundaryCross(boundary.pageId, nextX, boundary.y);
            isDraggingRef.current = false;
            setIsDragging(false);
            onDragComplete?.();
            return;
          }
        }

        if (typeof maxY === "number") {
          nextY = Math.min(nextY, Math.max(0, maxY - position.height));
        }
        const draft = { ...position, x: nextX, y: nextY };
        const snapped = snapEnabled && resolveSnap ? resolveSnap(draft) : draft;
        isDraggingRef.current = false;
        setIsDragging(false);
        onDragComplete?.();
        onPositionChange({
          ...position,
          x: snapped.x,
          y: snapped.y,
        }, { userMoved: true });
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect?.(e.shiftKey);
      }}
    >
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (!isDragging) setIsHovered(false);
        }}
      >
        {showChrome ? (
          <div
            className={`${chromePlacementClass} z-50 flex flex-col gap-1 pointer-events-auto`}
            data-canvas-chrome
          >
            <div
              role="button"
              tabIndex={0}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border shadow-sm select-none touch-none cursor-grab active:cursor-grabbing ${
                isDragging
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : "bg-white/95 text-emerald-800 border-emerald-200 hover:bg-emerald-50"
              }`}
              onPointerDown={startDrag}
              aria-label={t("canvas.dimensions.dragAria", { label: displayLabel })}
              title={t("canvas.dimensions.dragTitle")}
            >
              <GripVertical className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] font-bold truncate">{displayLabel}</span>
              <span className="ml-auto text-[9px] opacity-70">{t("canvas.dimensions.dragHint")}</span>
              {isCanvasElementId(sectionId) ? (
                <button
                  type="button"
                  className="shrink-0 p-0.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  title={t("canvas.elements.remove")}
                  aria-label={t("canvas.elements.remove")}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCanvasElement(sectionId);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
            {isSelected ? (
              <DimensionControls
                sectionLabel={displayLabel}
                sectionId={sectionId}
                resumeData={resumeData}
                position={position}
                maxWidth={maxWidth}
                maxHeight={maxHeight}
                compact={compact}
                onPositionChange={onPositionChange}
                onManualResize={handleManualResize}
                onFitContent={resumeData ? handleFitContent : undefined}
                variant="overlay"
                active={isSelected}
              />
            ) : null}
          </div>
        ) : null}
        <div
          className={`relative flex flex-col transition-all ${isLive ? "" : "rounded-lg"} ${expansionMode ? "" : "h-full overflow-hidden"} ${shellRingClass}`}
        >
          {contentOverflows ? (
            <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none flex items-end justify-center pb-0.5">
              <button
                type="button"
                data-canvas-chrome
                className="pointer-events-auto text-[8px] font-bold text-red-800 bg-red-100/95 border border-red-300 rounded px-1.5 py-0.5 shadow-sm hover:bg-red-200 cursor-pointer"
                title={`${t("canvas.dimensions.contentClipped")} — ${t("canvas.dimensions.fitContent")}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFitContent();
                }}
              >
                {t("canvas.dimensions.contentClipped")} ↧
              </button>
            </div>
          ) : null}
          <div ref={contentRef} className={`flex-1 text-left ${contentOverflowClass} ${contentPadClass}`}>
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
