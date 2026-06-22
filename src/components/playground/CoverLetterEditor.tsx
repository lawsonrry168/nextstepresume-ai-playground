import { useEffect, useRef, useState } from "react";
import type { CoverLetterResult } from "../../types";
import { useI18n } from "../../i18n";

interface CoverLetterEditorProps {
  value: CoverLetterResult | null;
  onChange: (next: CoverLetterResult) => void;
  readOnly?: boolean;
  /** Debounce persistence callbacks (ms). Default 600. */
  saveDebounceMs?: number;
}

function rebuildFullText(letter: Omit<CoverLetterResult, "fullText">): string {
  return [
    letter.salutation,
    "",
    letter.opening,
    "",
    ...letter.bodyParagraphs.flatMap((p) => [p, ""]),
    letter.closing,
    "",
    letter.signature,
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function CoverLetterEditor({
  value,
  onChange,
  readOnly = false,
  saveDebounceMs = 600,
}: CoverLetterEditorProps) {
  const { t } = useI18n();
  const [local, setLocal] = useState<CoverLetterResult | null>(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<CoverLetterResult | null>(value);

  useEffect(() => {
    setLocal(value);
    latestRef.current = value;
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const schedulePersist = (next: CoverLetterResult) => {
    latestRef.current = next;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (latestRef.current) onChange(latestRef.current);
    }, saveDebounceMs);
  };

  const flushPersist = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (latestRef.current) onChange(latestRef.current);
  };

  if (!local) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
        {t("coverLetterEditor.empty")}
      </div>
    );
  }

  const patch = (partial: Partial<CoverLetterResult>) => {
    const next = { ...local, ...partial };
    next.fullText = rebuildFullText(next);
    setLocal(next);
    schedulePersist(next);
  };

  const fieldClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400";

  return (
    <div className="space-y-3" onBlur={flushPersist}>
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
          {t("coverLetterEditor.salutation")}
        </label>
        <input
          className={fieldClass}
          value={local.salutation}
          readOnly={readOnly}
          onChange={(e) => patch({ salutation: e.target.value })}
        />
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
          {t("coverLetterEditor.opening")}
        </label>
        <textarea
          className={`${fieldClass} min-h-[72px] resize-y`}
          value={local.opening}
          readOnly={readOnly}
          onChange={(e) => patch({ opening: e.target.value })}
        />
      </div>
      {local.bodyParagraphs.map((para, idx) => (
        <div key={idx}>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
            {t("coverLetterEditor.body", { index: idx + 1 })}
          </label>
          <textarea
            className={`${fieldClass} min-h-[88px] resize-y`}
            value={para}
            readOnly={readOnly}
            onChange={(e) => {
              const bodyParagraphs = [...local.bodyParagraphs];
              bodyParagraphs[idx] = e.target.value;
              patch({ bodyParagraphs });
            }}
          />
        </div>
      ))}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
          {t("coverLetterEditor.closing")}
        </label>
        <textarea
          className={`${fieldClass} min-h-[64px] resize-y`}
          value={local.closing}
          readOnly={readOnly}
          onChange={(e) => patch({ closing: e.target.value })}
        />
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
          {t("coverLetterEditor.signature")}
        </label>
        <textarea
          className={`${fieldClass} min-h-[48px] resize-y`}
          value={local.signature}
          readOnly={readOnly}
          onChange={(e) => patch({ signature: e.target.value })}
        />
      </div>
    </div>
  );
}

export function copyCoverLetterToClipboard(letter: CoverLetterResult): Promise<void> {
  return navigator.clipboard.writeText(letter.fullText);
}

export function downloadCoverLetterText(letter: CoverLetterResult, filenameBase: string) {
  const blob = new Blob([letter.fullText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filenameBase}_CoverLetter.txt`;
  link.click();
  URL.revokeObjectURL(url);
}
