import React, { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { Layers, ChevronsLeft, ChevronsRight, PanelRightClose, Move } from "lucide-react";
import { useCanvasViewport } from "../../hooks/useCanvasViewport";
import { CANVAS_PAGE_HEIGHT, clampCanvasZoom, getPageTopOffset } from "../../lib/canvasStudioTypes";
import { useI18n } from "../../i18n";
import CanvasShortcutOverlay from "./canvas/CanvasShortcutOverlay";
import CanvasStudioBottomDock from "./canvas/CanvasStudioBottomDock";

export interface CanvasStudioViewportHandle {
  fitToScreen: () => void;
  resetView: () => void;
  zoomTo: (zoom: number) => void;
  focusPage: (pageIndex: number) => void;
}

export interface CanvasStudioViewportProps {
  children: React.ReactNode;
  contentWidth: number;
  contentHeight: number;
  className?: string;
  layerPanel?: React.ReactNode;
  layerPanelOpen?: boolean;
  onToggleLayerPanel?: () => void;
  rightNavOpen?: boolean;
  onToggleRightNav?: () => void;
  pageStrip?: React.ReactNode;
  shortcutsOpen?: boolean;
  onToggleShortcuts?: () => void;
  showShortcutsHint?: boolean;
  onDismissShortcutsHint?: () => void;
  rightNav?: React.ReactNode;
  autoSaveLabel?: string;
  activePageLabel?: string;
}

const CanvasStudioViewport = forwardRef<CanvasStudioViewportHandle, CanvasStudioViewportProps>(
  function CanvasStudioViewport(
    {
      children,
      contentWidth,
      contentHeight,
      className = "",
      layerPanel,
      layerPanelOpen = true,
      onToggleLayerPanel,
      rightNavOpen = true,
      onToggleRightNav,
      pageStrip,
      shortcutsOpen = false,
      onToggleShortcuts,
      showShortcutsHint = false,
      onDismissShortcutsHint,
      rightNav,
      autoSaveLabel,
      activePageLabel,
    },
    ref,
  ) {
    const { t } = useI18n();
    const stageRef = useRef<HTMLDivElement>(null);
    const { viewport, setPan, panBy, zoomBy, setZoom, zoomStep, resetView, fitToScreen } = useCanvasViewport();
    const [isPanning, setIsPanning] = useState(false);
    const [spaceHeld, setSpaceHeld] = useState(false);
    const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

    const cursorClass = isPanning || spaceHeld ? "canvas-studio-viewport--panning" : "";

    const handleFit = useCallback(() => {
      if (stageRef.current) {
        fitToScreen(stageRef.current, contentWidth, contentHeight);
      }
    }, [contentHeight, contentWidth, fitToScreen]);

    const handleZoomTo = useCallback(
      (zoom: number) => {
        const stage = stageRef.current;
        if (!stage) {
          setZoom(clampCanvasZoom(zoom));
          return;
        }
        setZoom(clampCanvasZoom(zoom), {
          x: stage.clientWidth / 2,
          y: stage.clientHeight / 2,
        });
      },
      [setZoom],
    );

    const handleFocusPage = useCallback(
      (pageIndex: number) => {
        const stage = stageRef.current;
        if (!stage) return;
        const top = getPageTopOffset(pageIndex);
        const zoom = viewport.zoom;
        const panX = (stage.clientWidth - contentWidth * zoom) / 2;
        const panY = (stage.clientHeight - CANVAS_PAGE_HEIGHT * zoom) / 2 - top * zoom;
        setPan(panX, panY);
      },
      [contentWidth, setPan, viewport.zoom],
    );

    useImperativeHandle(
      ref,
      () => ({
        fitToScreen: handleFit,
        resetView,
        zoomTo: handleZoomTo,
        focusPage: handleFocusPage,
      }),
      [handleFit, handleFocusPage, handleZoomTo, resetView],
    );

    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.code === "Space" && !e.repeat) {
          const tag = (e.target as HTMLElement | null)?.tagName;
          if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
          e.preventDefault();
          setSpaceHeld(true);
        }
      };
      const onKeyUp = (e: KeyboardEvent) => {
        if (e.code === "Space") setSpaceHeld(false);
      };
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
      };
    }, []);

    useEffect(() => {
      const stage = stageRef.current;
      if (!stage) return;

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const rect = stage.getBoundingClientRect();
        const anchor = { x: e.clientX - rect.left, y: e.clientY - rect.top };

        if (e.ctrlKey || e.metaKey) {
          const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
          zoomBy(delta, anchor);
        } else {
          panBy(-e.deltaX, -e.deltaY);
        }
      };

      stage.addEventListener("wheel", onWheel, { passive: false });
      return () => stage.removeEventListener("wheel", onWheel);
    }, [panBy, zoomBy, zoomStep]);

    const startPan = useCallback(
      (clientX: number, clientY: number) => {
        setIsPanning(true);
        panStartRef.current = { x: clientX, y: clientY, panX: viewport.panX, panY: viewport.panY };
      },
      [viewport.panX, viewport.panY],
    );

    const movePan = useCallback(
      (clientX: number, clientY: number) => {
        const start = panStartRef.current;
        if (!start) return;
        setPan(start.panX + (clientX - start.x), start.panY + (clientY - start.y));
      },
      [setPan],
    );

    const endPan = useCallback(() => {
      setIsPanning(false);
      panStartRef.current = null;
    }, []);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      const isMiddle = e.button === 1;
      const isSpaceLeft = spaceHeld && e.button === 0;
      if (!isMiddle && !isSpaceLeft) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      startPan(e.clientX, e.clientY);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!panStartRef.current) return;
      movePan(e.clientX, e.clientY);
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!panStartRef.current) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      endPan();
    };

    const zoomPercent = Math.round(viewport.zoom * 100);

    return (
      <div
        id="canvas-studio-viewport"
        className={`canvas-studio-viewport flex-1 min-h-0 flex overflow-hidden ${cursorClass} ${className}`}
      >
        {layerPanelOpen && layerPanel ? (
          layerPanel
        ) : onToggleLayerPanel ? (
          <button
            type="button"
            className="canvas-studio-panel-rail canvas-studio-panel-rail--left"
            onClick={onToggleLayerPanel}
            title={t("nav.expandPanel")}
            aria-label={t("nav.expandPanel")}
          >
            <ChevronsRight className="w-4 h-4 shrink-0" />
            <span className="canvas-studio-panel-rail-label">{t("canvas.layers.title")}</span>
          </button>
        ) : null}

        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <div className="relative flex-1 min-h-0 flex flex-col">
            <div
              ref={stageRef}
              className="canvas-studio-stage relative flex-1 min-h-0 overflow-visible"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={endPan}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div
                className="canvas-studio-transform absolute left-0 top-0 will-change-transform"
                style={{
                  transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
                  transformOrigin: "0 0",
                }}
              >
                <div
                  className="canvas-studio-desk relative"
                  style={{ width: contentWidth, minHeight: contentHeight }}
                >
                  {children}
                </div>
              </div>

              {showShortcutsHint ? (
                <div className="canvas-studio-hint pointer-events-auto absolute top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium">
                    <Move className="w-3 h-3 opacity-70" />
                    {t("canvas.viewport.panHint")} · {t("canvas.viewport.zoomHint")} · {t("canvas.dimensions.studioHint")}
                    {onDismissShortcutsHint ? (
                      <button type="button" className="ml-1 underline opacity-70 hover:opacity-100" onClick={onDismissShortcutsHint}>
                        {t("common.close")}
                      </button>
                    ) : null}
                  </span>
                </div>
              ) : null}

              <CanvasShortcutOverlay open={shortcutsOpen} onClose={() => onToggleShortcuts?.()} />
            </div>
          </div>

          {pageStrip || autoSaveLabel ? (
            <CanvasStudioBottomDock
              pageStrip={pageStrip}
              activePageLabel={activePageLabel}
              autoSaveLabel={autoSaveLabel}
              zoomPercent={zoomPercent}
              zoomStep={zoomStep}
              onZoomBy={zoomBy}
              onZoomChange={setZoom}
              onFit={handleFit}
              onResetView={resetView}
              layerPanelOpen={layerPanelOpen}
              onToggleLayerPanel={onToggleLayerPanel}
              rightNavOpen={rightNavOpen}
              onToggleRightNav={onToggleRightNav}
              shortcutsOpen={shortcutsOpen}
              onToggleShortcuts={onToggleShortcuts}
              isPanning={isPanning}
            />
          ) : null}
        </div>

        {rightNav && rightNavOpen ? (
          <aside id="canvas-studio-right-nav" className="canvas-studio-right-nav shrink-0 flex flex-col min-h-0 border-l">
            <div className="canvas-studio-panel-header shrink-0 flex items-center justify-between gap-2 px-2 py-1.5 border-b">
              <span className="text-[10px] font-black uppercase tracking-widest truncate">{t("common.tools")}</span>
              {onToggleRightNav ? (
                <button
                  type="button"
                  className="canvas-studio-panel-collapse-btn"
                  onClick={onToggleRightNav}
                  title={t("nav.collapsePanel")}
                  aria-label={t("nav.collapsePanel")}
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
            <div className="canvas-studio-right-nav-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin">
              {rightNav}
            </div>
          </aside>
        ) : rightNav && onToggleRightNav ? (
          <button
            type="button"
            className="canvas-studio-panel-rail canvas-studio-panel-rail--right"
            onClick={onToggleRightNav}
            title={t("nav.expandPanel")}
            aria-label={t("nav.expandPanel")}
          >
            <ChevronsLeft className="w-4 h-4 shrink-0" />
            <span className="canvas-studio-panel-rail-label">{t("common.tools")}</span>
          </button>
        ) : null}
      </div>
    );
  },
);

export default CanvasStudioViewport;
