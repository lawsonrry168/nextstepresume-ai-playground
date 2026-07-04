import { useCallback, useState } from "react";
import { Bookmark, Check, Trash2, X } from "lucide-react";
import type { TemplateFamily } from "../../lib/resumeTemplateCatalog";
import type { FreeLayoutPosition } from "../../lib/resumeFreeLayout";
import { readFamilyLayoutStorage } from "../../lib/resumeFreeLayout";
import { applyLayoutUndoPositions } from "../../lib/undoRegistry";
import { useI18n } from "../../i18n";

interface LayoutSnapshot {
  id: string;
  name: string;
  family: TemplateFamily;
  positions: Record<string, FreeLayoutPosition>;
  savedAt: number;
}

const STORAGE_KEY = "nsr_layout_snapshots_v1";
const MAX_SNAPSHOTS = 12;

function readSnapshots(): LayoutSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as LayoutSnapshot[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSnapshots(snapshots: LayoutSnapshot[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  } catch {
    // ignore quota errors
  }
}

/**
 * Named layout snapshots — save the current free-layout arrangement under a
 * name (e.g. "投行版" / "初創版") and re-apply it later. Applying goes through
 * the undo bridge, so it lands in the global Ctrl+Z history.
 */
export default function LayoutSnapshotMenu({ templateFamily }: { templateFamily: TemplateFamily }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<LayoutSnapshot[]>(readSnapshots);
  const [draftName, setDraftName] = useState("");

  const familySnapshots = snapshots.filter((snap) => snap.family === templateFamily);

  const saveCurrent = useCallback(() => {
    const positions = readFamilyLayoutStorage()[templateFamily];
    if (!positions || !Object.keys(positions).length) return;
    const name = draftName.trim() || new Date().toLocaleString();
    const snapshot: LayoutSnapshot = {
      id: `snap-${Date.now().toString(36)}`,
      name,
      family: templateFamily,
      positions: JSON.parse(JSON.stringify(positions)) as Record<string, FreeLayoutPosition>,
      savedAt: Date.now(),
    };
    setSnapshots((prev) => {
      const next = [snapshot, ...prev].slice(0, MAX_SNAPSHOTS);
      writeSnapshots(next);
      return next;
    });
    setDraftName("");
  }, [draftName, templateFamily]);

  const applySnapshot = useCallback((snapshot: LayoutSnapshot) => {
    applyLayoutUndoPositions({ family: snapshot.family, positions: snapshot.positions });
  }, []);

  const deleteSnapshot = useCallback((id: string) => {
    setSnapshots((prev) => {
      const next = prev.filter((snap) => snap.id !== id);
      writeSnapshots(next);
      return next;
    });
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
                    onClick={() => deleteSnapshot(snapshot.id)}
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
