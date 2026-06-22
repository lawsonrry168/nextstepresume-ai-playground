import { useEffect, useState } from "react";
import type { ApplicationPackage } from "../../types";
import { useI18n } from "../../i18n";

export type NotesSavePayload = {
  notes?: string | null;
  followUpDate?: string | null;
  interviewDate?: string | null;
  appliedAt?: string | null;
};

interface ApplicationNotesEditorProps {
  pkg: ApplicationPackage;
  onSave: (data: NotesSavePayload) => void;
}

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30";

/** Local calendar date → ISO (noon local) to avoid UTC day-shift. */
export function localDateInputToIso(dateValue: string): string | null {
  if (!dateValue) return null;
  const [y, m, d] = dateValue.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString();
}

export function isoToLocalDateInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isoToLocalDatetimeInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function localDatetimeInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function ApplicationNotesEditor({ pkg, onSave }: ApplicationNotesEditorProps) {
  const { t } = useI18n();
  const [notes, setNotes] = useState(pkg.notes ?? "");
  const [appliedAt, setAppliedAt] = useState(isoToLocalDateInput(pkg.appliedAt));
  const [interviewDate, setInterviewDate] = useState(isoToLocalDatetimeInput(pkg.interviewDate));
  const [followUpDate, setFollowUpDate] = useState(isoToLocalDateInput(pkg.followUpDate));

  useEffect(() => {
    setNotes(pkg.notes ?? "");
    setAppliedAt(isoToLocalDateInput(pkg.appliedAt));
    setInterviewDate(isoToLocalDatetimeInput(pkg.interviewDate));
    setFollowUpDate(isoToLocalDateInput(pkg.followUpDate));
  }, [pkg.id, pkg.notes, pkg.appliedAt, pkg.interviewDate, pkg.followUpDate]);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("notesEditor.title")}</p>
      <div>
        <label className="text-[10px] font-bold text-slate-500 mb-1 block">{t("notesEditor.notes")}</label>
        <textarea
          className={`${fieldClass} min-h-[72px] resize-y`}
          value={notes}
          placeholder={t("notesEditor.notesPlaceholder")}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => onSave({ notes: notes.trim() || null })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] font-bold text-slate-500 mb-1 block">{t("notesEditor.appliedDate")}</label>
          <input
            type="date"
            className={fieldClass}
            value={appliedAt}
            onChange={(e) => {
              const v = e.target.value;
              setAppliedAt(v);
              onSave({ appliedAt: localDateInputToIso(v) });
            }}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 mb-1 block">{t("notesEditor.interviewDate")}</label>
          <input
            type="datetime-local"
            className={fieldClass}
            value={interviewDate}
            onChange={(e) => {
              const v = e.target.value;
              setInterviewDate(v);
              onSave({ interviewDate: localDatetimeInputToIso(v) });
            }}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 mb-1 block">{t("notesEditor.followUpDate")}</label>
          <input
            type="date"
            className={fieldClass}
            value={followUpDate}
            onChange={(e) => {
              const v = e.target.value;
              setFollowUpDate(v);
              onSave({ followUpDate: localDateInputToIso(v) });
            }}
          />
        </div>
      </div>
    </div>
  );
}
