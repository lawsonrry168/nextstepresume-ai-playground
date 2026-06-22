import { Copy, Loader2, MessageCircleQuestion, RefreshCw } from "lucide-react";
import type { InterviewPrepResult } from "../../types";
import { useI18n } from "../../i18n";

interface InterviewPrepPanelProps {
  data: InterviewPrepResult | null | undefined;
  loading?: boolean;
  onGenerate?: () => void;
}

export default function InterviewPrepPanel({
  data,
  loading = false,
  onGenerate,
}: InterviewPrepPanelProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400 gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t("interviewPrep.loading")}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200">
        <MessageCircleQuestion className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">{t("interviewPrep.empty")}</p>
        {onGenerate ? (
          <button
            type="button"
            onClick={onGenerate}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer hover:bg-emerald-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t("interviewPrep.generate")}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-slate-900">{data.companyName} · {data.jobTitle}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{t("interviewPrep.personalized")}</p>
        </div>
        {onGenerate ? (
          <button
            type="button"
            onClick={onGenerate}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-white cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            {t("interviewPrep.regenerate")}
          </button>
        ) : null}
      </div>

      {data.focusAreas.length > 0 && (
        <div className="rounded-lg bg-violet-50 border border-violet-100 p-3">
          <p className="text-[10px] font-bold uppercase text-violet-600 mb-1.5">{t("interviewPrep.focusAreas")}</p>
          <ul className="space-y-1">
            {data.focusAreas.map((area, i) => (
              <li key={i} className="text-xs text-violet-900">• {area}</li>
            ))}
          </ul>
        </div>
      )}

      {data.categories.map((cat) => (
        <div key={cat.type} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-800">{cat.label}</p>
          </div>
          <div className="p-3 space-y-3">
            {cat.questions.map((q, qi) => (
              <div key={qi} className="rounded-lg bg-slate-50/80 border border-slate-100 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900 leading-snug">{q.question}</p>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(`${q.question}\n\nTips: ${q.tips}\n\nOutline: ${q.sampleAnswerOutline}`)}
                    className="shrink-0 p-1 text-slate-400 hover:text-emerald-600 cursor-pointer"
                    title={t("interviewPrep.copy")}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1.5"><strong>{t("interviewPrep.tips")}</strong> {q.tips}</p>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed"><strong>{t("interviewPrep.outline")}</strong> {q.sampleAnswerOutline}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {data.preparationChecklist.length > 0 && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
          <p className="text-[10px] font-bold uppercase text-emerald-700 mb-1.5">{t("interviewPrep.checklist")}</p>
          <ul className="space-y-1">
            {data.preparationChecklist.map((item, i) => (
              <li key={i} className="text-xs text-emerald-900 flex gap-2">
                <span className="text-emerald-500">☐</span> {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
