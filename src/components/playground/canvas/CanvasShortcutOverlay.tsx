import { X } from "lucide-react";
import { CANVAS_SHORTCUTS } from "../../../lib/canvasStudioTypes";
import { useI18n } from "../../../i18n";
import { getShortcutLabel, getShortcutKeyLabel } from "../../../lib/sectionLabels";

export interface CanvasShortcutOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function CanvasShortcutOverlay({ open, onClose }: CanvasShortcutOverlayProps) {
  const { t } = useI18n();

  if (!open) return null;

  return (
    <div
      className="canvas-shortcut-overlay absolute inset-0 z-40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="canvas-shortcut-title"
      onClick={onClose}
    >
      <div
        className="canvas-shortcut-card w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="canvas-shortcut-header flex items-center justify-between px-4 py-3 border-b">
          <h3 id="canvas-shortcut-title" className="text-xs font-black uppercase tracking-widest">
            {t("canvas.shortcuts.title")}
          </h3>
          <button type="button" className="canvas-shortcut-close" onClick={onClose} aria-label={t("common.close")}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <ul className="canvas-shortcut-list max-h-[min(60vh,420px)] overflow-y-auto scrollbar-thin p-3 space-y-1.5">
          {CANVAS_SHORTCUTS.map((shortcut) => (
            <li key={shortcut.id} className="canvas-shortcut-row flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg">
              <span className="text-[11px] font-medium">{getShortcutLabel(shortcut.id)}</span>
              <span className="flex items-center gap-1 shrink-0">
                {shortcut.keys.map((key, i) => (
                  <kbd key={`${shortcut.id}-${key}-${i}`} className="canvas-shortcut-kbd">
                    {getShortcutKeyLabel(key)}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="canvas-shortcut-footer text-[10px] px-4 py-2 border-t opacity-60">
          {t("canvas.shortcuts.footer")}
        </p>
      </div>
    </div>
  );
}
