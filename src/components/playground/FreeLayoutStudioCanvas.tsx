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
  estimateFreeLayoutCanvasHeight,
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
  SECTION_CONTENT_PADDING,
} from "../../lib/canvasSectionContentSizing";
import { getTemplateFamily } from "../../lib/resumeTemplateCatalog";
import { ResolvedResumeTheme, DEFAULT_THEME_CUSTOMIZATION, resolveResumeTheme } from "../../lib/resumeThemeCustomization";
import ResumeThemeRoot from "./ResumeThemeRoot";
import FreeLayoutSectionContent from "./FreeLayoutSectionContent";
import CanvasPageMarginGuides from "./canvas/CanvasPageMarginGuides";
import { useI18n } from "../../i18n";
import { getSectionLabel } from "../../lib/sectionLabels";

export interface FreeLayoutStudioCanvasProps {
  resumeData: ResumeData;
  highlightChanges: boolean;
  analysisResult: AnalysisResult | null;
  previewZoom: number;
  grayscaleMode: boolean;
  sections: FreeLayoutSectionMeta[];
  positions: Record<string, FreeLayoutPosition>;
  onPositionChange: (id: string, pos: FreeLayoutPosition, options?: { skipSnap?: boolean; constrainA4?: boolean; userMoved?: boolean }) => void;
  variant?: "edit" | "preview";
  chromeMode?: "full" | "live";
  templateStyle: TemplateStyle;
  resolvedTheme?: ResolvedResumeTheme;
  containerId?: string;
  outerClassName?: string;
  showGrid?: boolean;
  gridStrength?: number;
  showMargins?: boolean;
  snapEnabled?: boolean;
  /** When false, skip DOM ResizeObserver height auto-fit (Canvas Studio sync handles sizing) */
  autoFitContentHeight?: boolean;
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

function useFitToContainerWidth(enabled: boolean, canvasWidth: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    if (!enabled) {
      setFitScale(1);
      return;
    }

    const node = containerRef.current;
    if (!node) return;

    const update = () => {
      const horizontalPadding = 32;
      const available = node.clientWidth - horizontalPadding;
      if (available <= 0) return;
      setFitScale(Math.min(1, available / canvasWidth));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, canvasWidth]);

  return { containerRef, fitScale };
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
  autoFitContentHeight = true,
  canvasLayout,
}: FreeLayoutStudioCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<HTMLDivElement>(null);
  const isEdit = variant === "edit";
  const isCanvasStudioHost = containerId === "resume-container-box-canvas";
  const effectiveChromeMode = isCanvasStudioHost ? "live" : chromeMode;
  const effectiveAutoFitHeight = isCanvasStudioHost ? true : autoFitContentHeight;
  const isLiveChrome = isEdit && effectiveChromeMode === "live";
  const isNarrowPanel = containerId === "resume-container-box";
  const isMultiPage = Boolean(canvasLayout?.pages.length);
  const family = getTemplateFamily(templateStyle);
  const resolved = resolvedTheme ?? resolveResumeTheme(templateStyle, DEFAULT_THEME_CUSTOMIZATION);
  const tc = resolved.classes;
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
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

  const { containerRef, fitScale } = useFitToContainerWidth(isNarrowPanel, FREE_LAYOUT_CANVAS.width);
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);
  const pageCount = canvasLayout?.pages.length ?? 1;
  const canvasHeight = useMemo(
    () => (isMultiPage ? computeMultiPageDeskHeight(pageCount) : estimateFreeLayoutCanvasHeight(sectionIds, positions, pageCount)),
    [isMultiPage, sectionIds, positions, pageCount],
  );

  const emitPositionChange = (
    sectionId: string,
    pos: FreeLayoutPosition,
    options?: { skipSnap?: boolean; constrainA4?: boolean; userMoved?: boolean },
  ) => {
    const next = isMultiPage ? clampPositionToA4Page(pos) : pos;
    onPositionChange(sectionId, next, isMultiPage ? { ...options, constrainA4: true } : options);
  };

  const resolveSnapDraft = useCallback(
    (sectionId: string, draft: FreeLayoutPosition, pageId?: string): FreeLayoutPosition => {
      if (!snapEnabled) return draft;
      return applyMagneticSnap(sectionId, draft, positionsRef.current, FREE_LAYOUT_CANVAS.width, {
        pageHeight: isMultiPage ? CANVAS_PAGE_HEIGHT : undefined,
        pageId: draft.pageId ?? pageId ?? positionsRef.current[sectionId]?.pageId,
        margin: isMultiPage ? CANVAS_PAGE_MARGIN : 0,
      });
    },
    [isMultiPage, snapEnabled],
  );

  const zoomFactor = previewZoom / 100;
  const effectiveScale = isNarrowPanel ? fitScale * zoomFactor : zoomFactor;
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
          onSelect={() => setSelectedSectionId(section.id)}
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
          maxHeight={pageMaxY !== undefined ? maxSectionHeightOnPage(pos.y) : undefined}
          autoFitContentHeight={effectiveAutoFitHeight}
          resumeData={resumeData}
        >
          <FreeLayoutSectionContent
            sectionId={section.id}
            data={resumeData}
            highlightChanges={highlightChanges}
            analysisResult={analysisResult}
            templateStyle={templateStyle}
            resolvedTheme={resolved}
          />
        </DraggableSection>
      );
    }

    return (
      <div
        key={section.id}
        id={`free-layout-section-${section.id}`}
        className="absolute overflow-hidden"
        style={{
          left: pos.x,
          top: pos.y,
          width: pos.width,
          height: pos.height,
          zIndex,
        }}
      >
        <FreeLayoutSectionContent
          sectionId={section.id}
          data={resumeData}
          highlightChanges={highlightChanges}
          analysisResult={analysisResult}
          templateStyle={templateStyle}
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
      id="resume-printable-sheet"
      exportPage
      className={`relative ${resolved.active ? "" : "bg-white"} ${
        isEdit ? "shadow-2xl rounded-xl border border-slate-200/80 overflow-visible" : "shadow-sm border border-slate-100 rounded-lg overflow-visible"
      } ${tc.sheetFont}`}
      style={{
        width: FREE_LAYOUT_CANVAS.width,
        minHeight: canvasHeight,
      }}
    >
      <div ref={canvasRef} className="relative w-full h-full" onPointerDown={() => setSelectedSectionId(null)}>
        {family === "modern" && resolved.showAccentBar && (isLiveChrome || !isEdit) ? (
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
        className="canvas-multi-page-desk relative"
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
              className={`canvas-page-sheet absolute left-0 ${isActive ? "canvas-page-sheet--active" : ""}`}
              style={{
                top: getPageTopOffset(pageIndex),
                width: FREE_LAYOUT_CANVAS.width,
                height: CANVAS_PAGE_HEIGHT,
              }}
            >
              <div className="canvas-page-sheet-label" data-canvas-chrome>
                {page.label} · A4 {CANVAS_PAGE_WIDTH}×{CANVAS_PAGE_HEIGHT}
              </div>
              <ResumeThemeRoot
                resolved={resolved}
                id={isActive ? "resume-printable-sheet" : `canvas-page-${page.id}`}
                exportPage
                className={`canvas-page-sheet-paper canvas-page-sheet-paper--a4 relative ${
                  resolved.active ? "" : "bg-white"
                } ${isEdit ? "shadow-2xl rounded-xl border border-slate-200/80 overflow-hidden" : "overflow-hidden"} ${tc.sheetFont}`}
                style={{ width: FREE_LAYOUT_CANVAS.width, height: CANVAS_PAGE_HEIGHT }}
              >
                <div
                  ref={pageIndex === 0 ? canvasRef : undefined}
                  data-page-drop-surface
                  className="relative w-full h-full overflow-hidden"
                  onPointerDown={() => setSelectedSectionId(null)}
                >
                  {family === "modern" && resolved.showAccentBar && (isLiveChrome || !isEdit) ? (
                    <div className={`h-2 ${tc.accentBar} rounded-t-lg`} />
                  ) : null}
                  {showMargins ? <CanvasPageMarginGuides /> : null}
                  {pageSnapGuide?.pageId === page.id && pageSnapGuide.edge === "top" ? (
                    <div className="canvas-page-snap-guide canvas-page-snap-guide--top" data-canvas-chrome aria-hidden />
                  ) : null}
                  {pageSnapGuide?.pageId === page.id && pageSnapGuide.edge === "bottom" ? (
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
  onSelect?: () => void;
  onPositionChange: (pos: FreeLayoutPosition, options?: { skipSnap?: boolean; userMoved?: boolean }) => void;
  locked?: boolean;
  zIndex?: number;
  maxY?: number;
  maxHeight?: number;
  autoFitContentHeight?: boolean;
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
}

function useAutoFitSectionContentHeight(
  enabled: boolean,
  sectionId: string,
  resumeData: ResumeData | undefined,
  position: FreeLayoutPosition,
  maxHeight: number | undefined,
  onPositionChange: DraggableSectionProps["onPositionChange"],
) {
  const contentRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(position);
  positionRef.current = position;
  const contentLen = resumeData ? getSectionTextLength(sectionId, resumeData) : 0;

  useEffect(() => {
    if (!enabled || !resumeData) return;
    const node = contentRef.current;
    if (!node) return;

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const current = positionRef.current;
        const scrollH = node.scrollHeight;
        const estimated = estimateSectionHeightForContent(sectionId, resumeData, current.width);
        const domNeed = snapToGrid(
          clampSectionHeight(
            Math.max(estimated, scrollH + SECTION_CONTENT_PADDING),
            maxHeight ?? FREE_LAYOUT_MAX_HEIGHT,
          ),
          SNAP_GRID_SIZE,
        );
        if (Math.abs(domNeed - current.height) >= 8) {
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
  }, [enabled, maxHeight, onPositionChange, resumeData, sectionId, contentLen, position.width]);

  return contentRef;
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
  const useCollapsible = variant === "overlay";

  useEffect(() => {
    if (slidingRef.current !== "width") setDraftWidth(position.width);
    if (slidingRef.current !== "height") setDraftHeight(position.height);
  }, [position.width, position.height]);

  useEffect(() => {
    if (!active) setSlidersOpen(false);
  }, [active]);

  const commitWidth = (value: number) => {
    const width = clampSectionWidth(value, position.x, FREE_LAYOUT_CANVAS.width);
    let height = position.height;
    if (resumeData && sectionId) {
      height = clampHeight(estimateSectionHeightForContent(sectionId, resumeData, width));
    }
    onPositionChange({ ...position, width, height }, { skipSnap: true, userMoved: true });
  };

  const commitHeight = (value: number) => {
    onPositionChange({ ...position, height: clampHeight(value) }, { skipSnap: true, userMoved: true });
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
          <button
            type="button"
            className="text-[9px] font-bold text-emerald-700 hover:text-emerald-900"
            onClick={() => setSlidersOpen(false)}
          >
            {t("canvas.dimensions.collapseSize")}
          </button>
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
          onChange={(e) => setDraftWidth(Number(e.target.value))}
          onPointerUp={() => {
            slidingRef.current = null;
            commitWidth(draftWidth);
          }}
          onPointerCancel={() => {
            slidingRef.current = null;
            commitWidth(draftWidth);
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
            const width = clampSectionWidth(raw, position.x, FREE_LAYOUT_CANVAS.width);
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
          onChange={(e) => setDraftHeight(Number(e.target.value))}
          onPointerUp={() => {
            slidingRef.current = null;
            commitHeight(draftHeight);
          }}
          onPointerCancel={() => {
            slidingRef.current = null;
            commitHeight(draftHeight);
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
  onSelect,
  onPositionChange,
  locked = false,
  zIndex = 10,
  maxY,
  maxHeight,
  autoFitContentHeight = true,
  onDragPointer,
  onDragLocalY,
  onDragComplete,
  pageBoundary,
  onCrossPageDrop,
  snapEnabled = false,
  resolveSnap,
  children,
  resumeData,
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
  const contentRef = useAutoFitSectionContentHeight(
    isLive && Boolean(resumeData) && autoFitContentHeight,
    sectionId,
    resumeData,
    position,
    maxHeight,
    onPositionChange,
  );

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

  return (
    <motion.div
      id={`free-layout-section-${sectionId}`}
      drag={!locked}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      className={`absolute touch-none ${locked ? "canvas-section-locked" : ""}`}
      style={{
        x,
        y,
        width: position.width,
        height: position.height,
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
        onSelect?.();
      }}
    >
      {isLive ? (
        <div
          className={`relative h-full flex flex-col overflow-hidden transition-all ${
            isDragging
              ? "ring-2 ring-emerald-500 shadow-xl"
              : isSelected
                ? "ring-2 ring-emerald-400/80"
                : isHovered
                  ? "ring-1 ring-emerald-200"
                  : ""
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            if (!isDragging) setIsHovered(false);
          }}
        >
          {showChrome ? (
            <div className="absolute top-1 left-1 right-1 z-30 flex flex-col gap-1" data-canvas-chrome>
              <div
                role="button"
                tabIndex={0}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md border shadow-sm select-none touch-none cursor-grab active:cursor-grabbing ${
                  isDragging
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-white/95 text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                }`}
                onPointerDown={startDrag}
              >
                <GripVertical className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-bold truncate">{displayLabel}</span>
                <span className="ml-auto text-[9px] opacity-70">{t("canvas.dimensions.dragHint")}</span>
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
                  variant="overlay"
                  active={isSelected}
                />
              ) : null}
            </div>
          ) : null}
          <div
            ref={contentRef}
            className={`flex-1 min-h-0 overflow-hidden text-left ${compact ? "p-2" : "p-3"}`}
          >
            {children}
          </div>
        </div>
      ) : (
      <div
        className={`relative h-full flex flex-col overflow-hidden transition-all rounded-lg ${
          isDragging
            ? "ring-2 ring-emerald-500 shadow-xl"
            : isSelected
              ? "ring-2 ring-emerald-400/80 border-2 border-dashed border-emerald-400/70"
              : isHovered
                ? "ring-1 ring-emerald-200 border border-dashed border-emerald-200/80"
                : "border border-transparent"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (!isDragging) setIsHovered(false);
        }}
      >
        {showChrome ? (
          <div className="absolute top-1 left-1 right-1 z-30 flex flex-col gap-1" data-canvas-chrome>
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
                variant="overlay"
                active={isSelected}
              />
            ) : null}
          </div>
        ) : null}

        <div className={`text-left flex-1 min-h-0 overflow-hidden ${compact ? "p-2" : "p-3"}`}>
          {children}
        </div>
      </div>
      )}
    </motion.div>
  );
});
