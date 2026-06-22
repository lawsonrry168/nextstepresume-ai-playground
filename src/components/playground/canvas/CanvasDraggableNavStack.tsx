import { useCallback, useState, type ReactNode } from "react";
import { ChevronDown, GripVertical } from "lucide-react";
import {
  type CanvasNavSectionId,
  reorderNavSection,
} from "../../../lib/canvasStudioTypes";
import { useI18n } from "../../../i18n";

export interface CanvasNavSectionDef {
  id: CanvasNavSectionId;
  content: ReactNode;
}

export interface CanvasDraggableNavStackProps {
  order: CanvasNavSectionId[];
  sections: Record<CanvasNavSectionId, ReactNode>;
  onReorder: (order: CanvasNavSectionId[]) => void;
}

const DEFAULT_EXPANDED: CanvasNavSectionId[] = ["layout", "align"];

function buildInitialCollapsed(order: CanvasNavSectionId[]): Set<CanvasNavSectionId> {
  const collapsed = new Set(order);
  for (const id of DEFAULT_EXPANDED) {
    collapsed.delete(id);
  }
  return collapsed;
}

export default function CanvasDraggableNavStack({ order, sections, onReorder }: CanvasDraggableNavStackProps) {
  const { t } = useI18n();
  const [draggingId, setDraggingId] = useState<CanvasNavSectionId | null>(null);
  const [dropTargetId, setDropTargetId] = useState<CanvasNavSectionId | null>(null);
  const [dropPlace, setDropPlace] = useState<"before" | "after">("before");
  const [collapsed, setCollapsed] = useState<Set<CanvasNavSectionId>>(() => buildInitialCollapsed(order));

  const finishDrag = useCallback(() => {
    setDraggingId(null);
    setDropTargetId(null);
  }, []);

  const applyDrop = useCallback(
    (draggedId: CanvasNavSectionId, targetId: CanvasNavSectionId, place: "before" | "after") => {
      if (draggedId === targetId) return;
      onReorder(reorderNavSection(order, draggedId, targetId, place));
    },
    [onReorder, order],
  );

  const toggleSection = useCallback((sectionId: CanvasNavSectionId) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  return (
    <div className="canvas-tools-nav">
      {order.map((sectionId) => {
        const content = sections[sectionId];
        if (!content) return null;

        const isDragging = draggingId === sectionId;
        const isCollapsed = collapsed.has(sectionId);
        const isDropBefore = dropTargetId === sectionId && dropPlace === "before";
        const isDropAfter = dropTargetId === sectionId && dropPlace === "after";

        return (
          <div key={sectionId} className="canvas-nav-section-wrap">
            {isDropBefore ? <div className="canvas-nav-drop-indicator canvas-nav-drop-indicator--before" aria-hidden /> : null}
            <section
              data-nav-section-id={sectionId}
              className={`canvas-nav-section ${isDragging ? "canvas-nav-section--dragging" : ""} ${isCollapsed ? "canvas-nav-section--collapsed" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const place = e.clientY < rect.top + rect.height / 2 ? "before" : "after";
                setDropTargetId(sectionId);
                setDropPlace(place);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const dragged = (e.dataTransfer.getData("text/plain") || draggingId) as CanvasNavSectionId;
                if (dragged && dragged !== sectionId) {
                  applyDrop(dragged, sectionId, dropPlace);
                }
                finishDrag();
              }}
              onDragLeave={() => {
                if (dropTargetId === sectionId) setDropTargetId(null);
              }}
            >
              <div className="canvas-nav-section-header">
                <button
                  type="button"
                  className={`canvas-nav-section-drag ${isDragging ? "canvas-nav-section-drag--active" : ""}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", sectionId);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggingId(sectionId);
                  }}
                  onDragEnd={finishDrag}
                  title={t("canvasNav.dragSection")}
                  aria-label={t("canvasNav.dragSectionAria", { section: t(`canvas.navSections.${sectionId}`) })}
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="canvas-nav-section-toggle flex-1 flex items-center gap-1 min-w-0 text-left"
                  onClick={() => toggleSection(sectionId)}
                  aria-expanded={!isCollapsed}
                >
                  <h4 className="canvas-nav-section-title">{t(`canvas.navSections.${sectionId}`)}</h4>
                  <ChevronDown className={`canvas-nav-section-chevron w-3 h-3 shrink-0 ${isCollapsed ? "" : "canvas-nav-section-chevron--open"}`} />
                </button>
              </div>
              {!isCollapsed ? <div className="canvas-nav-section-body">{content}</div> : null}
            </section>
            {isDropAfter ? <div className="canvas-nav-drop-indicator canvas-nav-drop-indicator--after" aria-hidden /> : null}
          </div>
        );
      })}
    </div>
  );
}
