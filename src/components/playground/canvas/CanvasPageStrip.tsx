import { Plus, X } from "lucide-react";
import { CanvasPage } from "../../../lib/canvasStudioTypes";
import { useI18n } from "../../../i18n";
import { formatCanvasPageLabel } from "../../../lib/sectionLabels";

export interface CanvasPageStripProps {
  pages: CanvasPage[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onRemovePage: (pageId: string) => void;
  onRenamePage: (pageId: string, label: string) => void;
}

export default function CanvasPageStrip({
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onRemovePage,
  onRenamePage,
}: CanvasPageStripProps) {
  const { t } = useI18n();

  return (
    <div id="canvas-page-strip" className="canvas-page-strip canvas-page-strip--embedded flex items-center gap-1.5 min-w-max">
      <span className="text-[9px] font-black uppercase tracking-widest opacity-60 shrink-0 mr-1">{t("common.page")}</span>
      {pages.map((page, index) => {
        const isActive = page.id === activePageId;
        return (
          <div
            key={page.id}
            className={`canvas-page-tab group flex items-center gap-1 shrink-0 ${isActive ? "canvas-page-tab--active" : ""}`}
          >
            <button
              type="button"
              className="canvas-page-tab-btn"
              onClick={() => onSelectPage(page.id)}
              title={page.label}
            >
              <span className="canvas-page-tab-thumb" aria-hidden />
              <input
                className="canvas-page-tab-label"
                value={page.label}
                onChange={(e) => onRenamePage(page.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`${t("common.edit")} ${page.label}`}
              />
            </button>
            {pages.length > 1 ? (
              <button
                type="button"
                className="canvas-page-tab-remove opacity-0 group-hover:opacity-100"
                onClick={() => onRemovePage(page.id)}
                title={`${t("common.delete")} ${page.label}`}
                aria-label={`${t("common.delete")} ${page.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            ) : null}
            <span className="sr-only">{formatCanvasPageLabel(index + 1)}</span>
          </div>
        );
      })}
      <button type="button" className="canvas-page-add-btn" onClick={onAddPage} title={t("canvas.tools.addPage")}>
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
