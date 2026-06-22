import React, { useRef, useState } from "react";
import { FileUp, FileText, X, Loader2, Upload } from "lucide-react";
import { ResumeData } from "../types";
import { useI18n } from "../i18n";
import { useSubscription } from "../context/SubscriptionProvider";
import { parseApiJson } from "../lib/apiResponse";
import { isQuotaError } from "../lib/api/quotaError";

type ImportMode = "text" | "pdf";

type MeasuredFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface ResumeImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: (data: ResumeData, source: string) => void;
  measuredFetch: MeasuredFetch;
}

export default function ResumeImportModal({
  open,
  onClose,
  onImported,
  measuredFetch,
}: ResumeImportModalProps) {
  const { t } = useI18n();
  const subscription = useSubscription();
  const [mode, setMode] = useState<ImportMode>("text");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const resetAndClose = () => {
    setText("");
    setError(null);
    setFileName(null);
    setMode("text");
    onClose();
  };

  const handleParseText = async () => {
    if (!text.trim()) {
      setError(t("import.pasteRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await measuredFetch("/api/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const { data: payload } = await parseApiJson<{
        success?: boolean;
        resumeData?: ResumeData;
        error?: string;
        meta?: { source?: string };
      }>(response);

      if (!payload.success || !payload.resumeData) {
        throw new Error(payload.error || t("import.parseFailed"));
      }

      onImported(payload.resumeData, payload.meta?.source || "parser");
      resetAndClose();
    } catch (err: unknown) {
      if (!isQuotaError(err)) {
        setError(err instanceof Error ? err.message : t("import.parseFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleParsePdf = async (file: File) => {
    if (!subscription.canUseFeature("import.pdf")) {
      subscription.openUpgrade("import.pdf");
      return;
    }
    if (!subscription.canConsume("pdfParse", 1)) {
      subscription.openUpgrade("pdfParse");
      return;
    }

    setLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await measuredFetch("/api/resume/parse-pdf", {
        method: "POST",
        body: formData,
      });

      const { data: payload } = await parseApiJson<{
        success?: boolean;
        resumeData?: ResumeData;
        error?: string;
      }>(response);

      if (!payload.success || !payload.resumeData) {
        throw new Error(payload.error || t("import.pdfParseFailed"));
      }

      onImported(payload.resumeData, "pdf");
      resetAndClose();
    } catch (err: unknown) {
      if (!isQuotaError(err)) {
        setError(err instanceof Error ? err.message : t("import.pdfFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleParsePdf(file);
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 no-print">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t("import.title")}</h3>
          </div>
          <button type="button" onClick={resetAndClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border cursor-pointer flex items-center justify-center gap-1 ${
              mode === "text" ? "bg-emerald-600 text-white border-blue-500" : "bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> {t("import.textMode")}
          </button>
          <button
            type="button"
            onClick={() => setMode("pdf")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border cursor-pointer flex items-center justify-center gap-1 ${
              mode === "pdf" ? "bg-emerald-600 text-white border-blue-500" : "bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> {t("import.pdfMode")}
          </button>
        </div>

        <div className="p-4 space-y-3">
          {mode === "text" ? (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t("import.textHint")}
              </p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                placeholder={t("import.textPlaceholder")}
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-y"
              />
            </>
          ) : (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t("import.pdfHint")}
              </p>
              <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onFileChange} />
              <button
                type="button"
                disabled={loading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-blue-200 rounded-xl p-8 text-center hover:bg-emerald-50/50 transition cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">{t("import.selectPdf")}</p>
                {fileName && <p className="text-[10px] text-slate-500 mt-1">{fileName}</p>}
              </button>
            </>
          )}
          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        </div>

        <div className="flex gap-2 p-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={resetAndClose} className="flex-1 py-2 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer">
            {t("common.cancel")}
          </button>
          {mode === "text" && (
            <button
              type="button"
              disabled={loading}
              onClick={handleParseText}
              className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
              {t("import.parseAndImport")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
