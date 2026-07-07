import { useCallback, useState } from "react";
import { Bookmark, Check, Trash2, X } from "lucide-react";
import type { TemplateFamily } from "../../lib/resumeTemplateCatalog";
import {
  applyLayoutFullSnapshot,
  captureCurrentLayoutSnapshot,
  deleteLayoutSnapshot,
  readLayoutSnapshots,
  saveLayoutSnapshot,
  type LayoutFullSnapshot,
} from "../../lib/layoutSnapshots";
import { useI18n } from "../../i18n";

interface LayoutSnapshotMenuProps {
  templateFamily: TemplateFamily;
  sectionIds: string[];
}

/**
 * Named layout snapshots — save positions, pages, layers, and canvas elements.
 * Applying goes through the undo bridge for global Ctrl+Z history.
 */
export default function LayoutSnapshotMenu({ templateFamily, sectionIds }: LayoutSnapshotMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<LayoutFullSnapshot[]>(readLayoutSnapshots);
  const [draftName, setDraftName] = useState("");

  const familySnapshots = snapshots.filter((snap) => snap.family === templateFamily);

  const saveCurrent = useCallback(() => {
    const snapshot = captureCurrentLayoutSnapshot(templateFamily, draftName, sectionIds);
    if (!snapshot) return;
    setSnapshots(saveLayoutSnapshot(snapshot));
    setDraftName("");
  }, [draftName, sectionIds, templateFamily]);

  const applySnapshot = useCallback((snapshot: LayoutFullSnapshot) => {
    applyLayoutFullSnapshot(snapshot);
  }, []);

  const removeSnapshot = useCallback((id: string) => {
    setSnapshots(deleteLayoutSnapshot(id));
  }, []);

  return (
    <div className="relative" data-canvas-chrome>
      <button
        id="studio-btn-snapshots"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-bold transition-colors ${
          open
            ? "bg-sky-600 text-white border-sky-500"
            : "bg-white/95 text-sky-800 border-sky-200 hover:bg-sky-50"
        }`}
        title={t("canvas.snapshots.title")}
      >
        <Bookmark className="w-3 h-3" />
      </button>
      {open ? (
        <div className="absolute right-0 top-full mt-1 z-[80] w-60 bg-white border border-slate-200 rounded-lg shadow-xl p-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-700">{t("canvas.snapshots.title")}</span>
            <button type="button" className="text-slate-400 hover:text-slate-600" onClick={() => setOpen(false)}>
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[9px] text-slate-400 leading-snug">{t("canvas.snapshots.fullHint")}</p>
          <div className="flex gap-1">
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder={t("canvas.snapshots.namePlaceholder")}
              className="flex-1 min-w-0 text-[10px] px-1.5 py-1 border border-slate-200 rounded focus:outline-none focus:border-sky-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") saveCurrent();
              }}
            />
            <button
              type="button"
              className="text-[10px] font-medium px-2 py-1 rounded bg-sky-600 text-white hover:bg-sky-700 shrink-0"
              onClick={saveCurrent}
              title={t("canvas.snapshots.save")}
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
          {familySnapshots.length === 0 ? (
            <p className="text-[10px] text-slate-400 text-center py-1">{t("canvas.snapshots.empty")}</p>
          ) : (
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {familySnapshots.map((snapshot) => (
                <li key={snapshot.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex-1 min-w-0 text-left text-[10px] px-1.5 py-1 rounded border border-slate-100 hover:border-sky-300 hover:bg-sky-50 truncate"
                    onClick={() => applySnapshot(snapshot)}
                    title={t("canvas.snapshots.apply")}
                  >
                    {snapshot.name}
                  </button>
                  <button
                    type="button"
                    className="text-slate-300 hover:text-red-500 shrink-0"
                    onClick={() => removeSnapshot(snapshot.id)}
                    title={t("canvas.snapshots.delete")}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
