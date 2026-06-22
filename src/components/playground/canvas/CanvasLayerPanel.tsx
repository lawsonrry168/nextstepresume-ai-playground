import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Eye, EyeOff, Lock, LockOpen, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, GripVertical, PanelLeftClose } from "lucide-react";
import { FreeLayoutSectionMeta } from "../../../lib/resumeFreeLayout";
import { CanvasPage } from "../../../lib/canvasStudioTypes";
import { useI18n } from "../../../i18n";
import { getSectionLabel } from "../../../lib/sectionLabels";

const LONG_PRESS_MS = 450;

export interface CanvasLayerPanelProps {
  layers: FreeLayoutSectionMeta[];
  selectedSectionId: string | null;
  hiddenSections: Record<string, boolean>;
  lockedSections: Record<string, boolean>;
  sectionPageMap: Record<string, string>;
  pages: CanvasPage[];
  onSelect: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down" | "front" | "back") => void;
  onReorderRelative: (draggedId: string, targetId: string, place: "before" | "after") => void;
  onAssignPage: (sectionId: string, pageId: string) => void;
  onCollapse?: () => void;
}

export default function CanvasLayerPanel({
  layers,
  selectedSectionId,
  hiddenSections,
  lockedSections,
  sectionPageMap,
  pages,
  onSelect,
  onToggleHidden,
  onToggleLocked,
  onReorder,
  onReorderRelative,
  onAssignPage,
  onCollapse,
}: CanvasLayerPanelProps) {
  const { t } = useI18n();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPlace, setDropPlace] = useState<"before" | "after">("before");
  const [touchDragId, setTouchDragId] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDragIdRef = useRef<string | null>(null);

  const finishDrag = useCallback(() => {
    setDraggingId(null);
    setDropTargetId(null);
    setTouchDragId(null);
    touchDragIdRef.current = null;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const resolveDropTarget = useCallback((clientY: number) => {
    const rows = document.querySelectorAll<HTMLElement>("[data-layer-row-id]");
    for (const row of rows) {
      const rect = row.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        const id = row.dataset.layerRowId;
        if (!id) continue;
        const place = clientY < rect.top + rect.height / 2 ? "before" : "after";
        setDropTargetId(id);
        setDropPlace(place);
        return;
      }
    }
  }, []);

  const startTouchDrag = useCallback(
    (layerId: string, target: HTMLElement, pointerId: number) => {
      setTouchDragId(layerId);
      touchDragIdRef.current = layerId;
      setDraggingId(layerId);
      target.setPointerCapture(pointerId);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(12);
      }
    },
    [],
  );

  const onGripPointerDown = (layerId: string) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "touch") return;
    e.preventDefault();
    const target = e.currentTarget;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      startTouchDrag(layerId, target, e.pointerId);
    }, LONG_PRESS_MS);
  };

  const onGripPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!touchDragIdRef.current) return;
    e.preventDefault();
    resolveDropTarget(e.clientY);
  };

  const onGripPointerUp = (layerId: string) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (touchDragIdRef.current === layerId && dropTargetId && dropTargetId !== layerId) {
      onReorderRelative(layerId, dropTargetId, dropPlace);
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    finishDrag();
  };

  return (
    <aside
      id="canvas-layer-panel"
      className="canvas-layer-panel shrink-0 w-[220px] flex flex-col border-r overflow-hidden"
    >
      <div className="canvas-layer-panel-header px-3 py-2 border-b flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-widest">{t("canvas.layers.title")}</span>
          <span className="text-[9px] font-mono opacity-60">{layers.length}</span>
        </div>
        {onCollapse ? (
          <button
            type="button"
            className="canvas-studio-panel-collapse-btn"
            onClick={onCollapse}
            title={t("canvas.layers.collapse")}
            aria-label={t("canvas.layers.collapse")}
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>
      <p className="text-[9px] opacity-50 px-3 py-1.5 border-b">{t("canvas.layers.dragHint")}</p>
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {layers.length === 0 ? (
          <p className="text-[10px] opacity-60 px-1 py-2">{t("canvas.layers.empty")}</p>
        ) : (
          layers.map((layer) => {
            const layerLabel = getSectionLabel(layer.id);
            const isSelected = selectedSectionId === layer.id;
            const isHidden = Boolean(hiddenSections[layer.id]);
            const isLocked = Boolean(lockedSections[layer.id]);
            const pageId = sectionPageMap[layer.id];
            const pageIndex = pages.findIndex((p) => p.id === pageId);
            const pageShortLabel = pageIndex >= 0 ? `P${pageIndex + 1}` : "—";
            const isDropBefore = dropTargetId === layer.id && dropPlace === "before";
            const isDropAfter = dropTargetId === layer.id && dropPlace === "after";
            const isDragging = draggingId === layer.id || touchDragId === layer.id;

            return (
              <div key={layer.id} className="relative">
                {isDropBefore ? <div className="canvas-layer-drop-indicator canvas-layer-drop-indicator--before" /> : null}
                <div
                  data-layer-row-id={layer.id}
                  className={`canvas-layer-row rounded-lg border px-2 py-1.5 transition-colors ${
                    isSelected ? "canvas-layer-row--selected" : ""
                  } ${isHidden ? "opacity-50" : ""} ${isDragging ? "canvas-layer-row--dragging" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const place = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
                    setDropTargetId(layer.id);
                    setDropPlace(place);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData("text/plain") || draggingId;
                    if (draggedId && draggedId !== layer.id) {
                      onReorderRelative(draggedId, layer.id, dropPlace);
                    }
                    finishDrag();
                  }}
                  onDragLeave={() => {
                    if (dropTargetId === layer.id) setDropTargetId(null);
                  }}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <button
                      type="button"
                      className={`canvas-layer-drag-handle shrink-0 ${touchDragId === layer.id ? "canvas-layer-drag-handle--active" : ""}`}
                      draggable={!touchDragId}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", layer.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingId(layer.id);
                      }}
                      onDragEnd={finishDrag}
                      onPointerDown={onGripPointerDown(layer.id)}
                      onPointerMove={onGripPointerMove}
                      onPointerUp={onGripPointerUp(layer.id)}
                      onPointerCancel={onGripPointerUp(layer.id)}
                      title={t("canvas.layers.dragHandle")}
                      aria-label={`${t("canvas.layers.dragHandle")} ${layerLabel}`}
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="flex-1 text-left flex items-center gap-1.5 min-w-0"
                      onClick={() => onSelect(layer.id)}
                    >
                      <span className="text-[10px] font-bold truncate flex-1">{layerLabel}</span>
                      <span className="text-[8px] font-mono opacity-50 shrink-0">
                        {pageShortLabel}
                      </span>
                    </button>
                  </div>
                  <div className="flex items-center gap-0.5 mt-1 pl-5">
                    <button
                      type="button"
                      className="canvas-layer-icon-btn"
                      onClick={() => onToggleHidden(layer.id)}
                      title={isHidden ? t("canvas.layers.show") : t("canvas.layers.hide")}
                    >
                      {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      className="canvas-layer-icon-btn"
                      onClick={() => onToggleLocked(layer.id)}
                      title={isLocked ? t("canvas.layers.unlock") : t("canvas.layers.lock")}
                    >
                      {isLocked ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
                    </button>
                    <button type="button" className="canvas-layer-icon-btn" onClick={() => onReorder(layer.id, "up")} title={t("canvas.layers.moveUp")}>
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button type="button" className="canvas-layer-icon-btn" onClick={() => onReorder(layer.id, "down")} title={t("canvas.layers.moveDown")}>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button type="button" className="canvas-layer-icon-btn" onClick={() => onReorder(layer.id, "front")} title={t("canvas.layers.moveFront")}>
                      <ChevronsUp className="w-3 h-3" />
                    </button>
                    <button type="button" className="canvas-layer-icon-btn" onClick={() => onReorder(layer.id, "back")} title={t("canvas.layers.moveBack")}>
                      <ChevronsDown className="w-3 h-3" />
                    </button>
                    {pages.length > 1 ? (
                      <select
                        className="canvas-layer-page-select ml-auto"
                        value={pageId}
                        onChange={(e) => onAssignPage(layer.id, e.target.value)}
                        aria-label={`${layerLabel} ${t("canvas.layers.assignPage")}`}
                      >
                        {pages.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                </div>
                {isDropAfter ? <div className="canvas-layer-drop-indicator canvas-layer-drop-indicator--after" /> : null}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
