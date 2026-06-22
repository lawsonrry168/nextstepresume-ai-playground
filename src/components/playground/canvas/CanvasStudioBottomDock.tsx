import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  Keyboard,
  Layers,
  Maximize2,
  Minus,
  Pin,
  Plus,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { clampCanvasZoom } from "../../../lib/canvasStudioTypes";
import { useI18n } from "../../../i18n";
import { formatCanvasPageLabel } from "../../../lib/sectionLabels";

export interface CanvasStudioBottomDockProps {
  pageStrip: ReactNode;
  activePageLabel?: string;
  autoSaveLabel?: string;
  zoomPercent: number;
  zoomStep: number;
  onZoomBy: (delta: number) => void;
  onZoomChange: (zoom: number) => void;
  onFit: () => void;
  onResetView: () => void;
  layerPanelOpen?: boolean;
  onToggleLayerPanel?: () => void;
  rightNavOpen?: boolean;
  onToggleRightNav?: () => void;
  shortcutsOpen?: boolean;
  onToggleShortcuts?: () => void;
  /** Collapse while panning the canvas */
  isPanning?: boolean;
}

const HOVER_EXPAND_MS = 180;
const LEAVE_COLLAPSE_MS = 700;

export default function CanvasStudioBottomDock({
  pageStrip,
  activePageLabel = formatCanvasPageLabel(1),
  autoSaveLabel,
  zoomPercent,
  zoomStep,
  onZoomBy,
  onZoomChange,
  onFit,
  onResetView,
  layerPanelOpen,
  onToggleLayerPanel,
  rightNavOpen,
  onToggleRightNav,
  shortcutsOpen,
  onToggleShortcuts,
  isPanning = false,
}: CanvasStudioBottomDockProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const collapse = useCallback(() => {
    if (!pinned) setExpanded(false);
  }, [pinned]);

  const expand = useCallback(() => {
    setExpanded(true);
  }, []);

  useEffect(() => {
    if (isPanning) collapse();
  }, [collapse, isPanning]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const onDockEnter = () => {
    clearTimers();
    hoverTimerRef.current = setTimeout(expand, HOVER_EXPAND_MS);
  };

  const onDockLeave = () => {
    clearTimers();
    if (!pinned) {
      leaveTimerRef.current = setTimeout(collapse, LEAVE_COLLAPSE_MS);
    }
  };

  const toggleExpanded = () => {
    clearTimers();
    setExpanded((v) => !v);
  };

  const togglePinned = () => {
    setPinned((v) => {
      const next = !v;
      if (next) setExpanded(true);
      return next;
    });
  };

  const toolButtons = (
    <>
      {onToggleLayerPanel ? (
        <button
          type="button"
          className={`canvas-studio-tool-btn ${layerPanelOpen ? "canvas-studio-tool-btn--active" : ""}`}
          onClick={onToggleLayerPanel}
          title={t("canvas.dock.layerPanel")}
        >
          <Layers className="w-3.5 h-3.5" />
        </button>
      ) : null}
      {onToggleRightNav ? (
        <button
          type="button"
          className={`canvas-studio-tool-btn ${rightNavOpen ? "canvas-studio-tool-btn--active" : ""}`}
          onClick={onToggleRightNav}
          title={t("canvas.dock.toolsPanel")}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      ) : null}
      {onToggleShortcuts ? (
        <button
          type="button"
          className={`canvas-studio-tool-btn ${shortcutsOpen ? "canvas-studio-tool-btn--active" : ""}`}
          onClick={onToggleShortcuts}
          title={t("canvas.dock.shortcutsPanel")}
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>
      ) : null}
      <button type="button" className="canvas-studio-tool-btn" onClick={() => onZoomBy(-zoomStep)} title={t("canvas.dock.zoomOut")} aria-label={t("canvas.dock.zoomOut")}>
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="canvas-studio-zoom-label font-mono text-[11px] font-bold min-w-[2.5rem] text-center">
        {zoomPercent}%
      </span>
      <button type="button" className="canvas-studio-tool-btn" onClick={() => onZoomBy(zoomStep)} title={t("canvas.dock.zoomIn")} aria-label={t("canvas.dock.zoomIn")}>
        <Plus className="w-3.5 h-3.5" />
      </button>
      <button type="button" className="canvas-studio-tool-btn" onClick={onFit} title={t("canvas.dock.fitView")}>
        <Maximize2 className="w-3.5 h-3.5" />
        <span className="text-[10px] font-semibold hidden sm:inline">{t("common.fit")}</span>
      </button>
      <button type="button" className="canvas-studio-tool-btn" onClick={onResetView} title={t("canvas.dock.resetView")}>
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </>
  );

  return (
    <div
      id="canvas-studio-bottom-dock"
      className={`canvas-studio-bottom-dock shrink-0 border-t ${expanded ? "canvas-studio-bottom-dock--expanded" : "canvas-studio-bottom-dock--collapsed"}`}
      onMouseEnter={onDockEnter}
      onMouseLeave={onDockLeave}
    >
      {!expanded ? (
        <div className="canvas-studio-bottom-dock-compact flex items-center gap-2 px-3 py-1.5 min-h-[36px]">
          <button
            type="button"
            className="canvas-studio-dock-toggle-btn"
            onClick={toggleExpanded}
            title={t("canvas.dock.expandHint")}
            aria-expanded={false}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-bold truncate max-w-[8rem] sm:max-w-[12rem]" title={activePageLabel}>
            {activePageLabel}
          </span>
          {autoSaveLabel ? (
            <span className="canvas-studio-dock-save-dot hidden sm:inline" title={autoSaveLabel} aria-label={autoSaveLabel} />
          ) : null}
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-1 shrink-0">{toolButtons}</div>
          <button
            type="button"
            className={`canvas-studio-dock-pin-btn ${pinned ? "canvas-studio-dock-pin-btn--active" : ""}`}
            onClick={togglePinned}
            title={pinned ? t("canvas.dock.unpinExpand") : t("canvas.dock.pinExpand")}
            aria-pressed={pinned}
          >
            <Pin className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="canvas-studio-bottom-dock-expanded flex flex-col gap-1.5 px-2 py-2">
          <div className="flex items-center gap-2 min-h-0">
            <div className="flex-1 min-w-0 overflow-x-auto scrollbar-thin">{pageStrip}</div>
            <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-slate-200/80">
              {toolButtons}
              <button
                type="button"
                className={`canvas-studio-dock-pin-btn ${pinned ? "canvas-studio-dock-pin-btn--active" : ""}`}
                onClick={togglePinned}
                title={pinned ? t("canvas.dock.unpinExpand") : t("canvas.dock.pinExpand")}
                aria-pressed={pinned}
              >
                <Pin className="w-3 h-3" />
              </button>
              <button
                type="button"
                className="canvas-studio-dock-toggle-btn"
                onClick={toggleExpanded}
                title={t("canvas.dock.collapse")}
                aria-expanded
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 px-1">
            {autoSaveLabel ? (
              <p className="canvas-auto-save-status text-[9px] shrink-0 max-w-[40%] truncate" title={autoSaveLabel}>
                {autoSaveLabel}
              </p>
            ) : null}
            <input
              type="range"
              className="canvas-studio-zoom-slider flex-1 min-w-0"
              min={25}
              max={200}
              step={5}
              value={zoomPercent}
              onChange={(e) => onZoomChange(clampCanvasZoom(Number(e.target.value) / 100))}
              aria-label={t("canvas.dock.zoomSlider")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
