import { useState } from "react";
import { Sparkles, RefreshCw, Check, Maximize2, Info, ChevronDown } from "lucide-react";
import { TailorIntensity } from "../../types";
import { useI18n } from "../../i18n";

interface WorkspaceAnalyzePanelProps {
  saveStatus: "saved" | "saving" | "idle" | "error";
  lastSavedTime: string;
  liveAtsScore: number;
  detectedKeywords: string[];
  activeKeywordsList: string[];
  loading: boolean;
  aiAvailable: boolean;
  tailorIntensity: TailorIntensity;
  tailorError: string | null;
  onReset: () => void;
  onOpenPreviewStudio: () => void;
  onTriggerAnalyze: () => void;
  onRetrySave: () => void;
  onIntensityChange: (intensity: TailorIntensity) => void;
}

export default function WorkspaceAnalyzePanel({
  saveStatus,
  lastSavedTime,
  liveAtsScore,
  detectedKeywords,
  activeKeywordsList,
  loading,
  aiAvailable,
  tailorIntensity,
  tailorError,
  onReset,
  onOpenPreviewStudio,
  onTriggerAnalyze,
  onRetrySave,
  onIntensityChange,
}: WorkspaceAnalyzePanelProps) {
  const { t } = useI18n();
  const [keywordsOpen, setKeywordsOpen] = useState(false);
  const scoreTone =
    liveAtsScore >= 75 ? "emerald" : liveAtsScore >= 45 ? "amber" : "rose";

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" id="workspace-action-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-800 truncate">{t("workspaceAnalyze.title")}</h3>
            <p className="text-[9px] text-slate-500 hidden sm:block">{t("workspaceAnalyze.subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={`flex items-center gap-2 px-2 py-1 rounded-lg border ${
              scoreTone === "emerald"
                ? "bg-emerald-50 border-emerald-200"
                : scoreTone === "amber"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-rose-50 border-rose-200"
            }`}
            id="realtime-ats-score-container"
          >
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide hidden sm:inline">{t("workspaceAnalyze.ats")}</span>
            <span
              className={`text-sm font-black font-mono leading-none ${
                scoreTone === "emerald"
                  ? "text-emerald-700"
                  : scoreTone === "amber"
                    ? "text-amber-700"
                    : "text-rose-600"
              }`}
            >
              {liveAtsScore}
            </span>
            <div className="w-12 h-1 rounded-full bg-slate-200/80 overflow-hidden hidden sm:block">
              <div
                className={`h-full rounded-full ${
                  scoreTone === "emerald" ? "bg-emerald-500" : scoreTone === "amber" ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${liveAtsScore}%` }}
              />
            </div>
          </div>

          {saveStatus === "error" ? (
            <button
              type="button"
              onClick={onRetrySave}
              className="text-[9px] px-1.5 py-0.5 bg-rose-600 text-white rounded font-bold cursor-pointer"
            >
              {t("workspaceAnalyze.retry")}
            </button>
          ) : saveStatus === "saving" ? (
            <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
          ) : (
            <span className="text-emerald-600" title={lastSavedTime || t("workspaceAnalyze.saved")}>
              <Check className="w-3.5 h-3.5" />
            </span>
          )}
          <button
            type="button"
            onClick={onReset}
            className="text-[9px] text-rose-600 font-bold px-1.5 py-0.5 rounded border border-rose-100 bg-rose-50 cursor-pointer uppercase"
          >
            {t("workspaceAnalyze.reset")}
          </button>
        </div>
      </div>

      <div className="px-3 py-2.5 flex flex-col sm:flex-row gap-2 border-b border-slate-100">
        <div className="flex items-center gap-1 shrink-0" id="tailor-intensity-panel">
          {(["balanced", "aggressive"] as TailorIntensity[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onIntensityChange(mode)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold border cursor-pointer ${
                tailorIntensity === mode
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {mode === "balanced" ? t("workspaceAnalyze.balanced") : t("workspaceAnalyze.aggressive")}
            </button>
          ))}
        </div>

        <button
          id="btn-trigger-ai"
          type="button"
          disabled={loading}
          onClick={onTriggerAnalyze}
          className="flex-1 min-w-0 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white py-2 px-3 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-500 shadow-sm"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{t("workspaceAnalyze.analyzing")}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("workspaceAnalyze.optimize")}</span>
            </>
          )}
        </button>

        <button
          id="workspace-btn-preview-mode"
          type="button"
          onClick={onOpenPreviewStudio}
          className="shrink-0 px-2.5 py-2 rounded-lg text-[10px] font-bold border border-slate-200 bg-white text-emerald-700 hover:bg-emerald-50 cursor-pointer flex items-center gap-1"
          title={t("workspaceAnalyze.studioTitle")}
        >
          <Maximize2 className="w-3 h-3" />
          <span className="hidden sm:inline">{t("workspaceAnalyze.studio")}</span>
        </button>
      </div>

      {activeKeywordsList.length > 0 ? (
        <div className="px-3 py-1.5 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setKeywordsOpen((v) => !v)}
            className="w-full flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wide cursor-pointer py-0.5"
          >
            <span>
              {t("workspaceAnalyze.keywords", { found: detectedKeywords.length, total: activeKeywordsList.length })}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${keywordsOpen ? "rotate-180" : ""}`} />
          </button>
          {keywordsOpen ? (
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-1.5 pb-0.5">
              {activeKeywordsList.map((word) => {
                const present = detectedKeywords.includes(word);
                return (
                  <span
                    key={word}
                    className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                      present
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 font-bold"
                        : "bg-slate-100 text-slate-400 border-slate-200"
                    }`}
                  >
                    {present ? "✓ " : "• "}
                    {word}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {!aiAvailable && (
        <div className="mx-3 my-2 flex items-center gap-2 bg-amber-50 border border-amber-200 p-2 rounded-lg" id="server-status-info">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <p className="text-[10px] text-amber-800 font-medium leading-snug">
            {t("workspaceAnalyze.noApiKey")}
          </p>
        </div>
      )}

      {tailorError ? (
        <p className="px-3 py-2 text-[11px] text-rose-600 font-medium border-t border-rose-100 bg-rose-50/50" role="alert">
          {tailorError}
        </p>
      ) : null}
    </div>
  );
}
