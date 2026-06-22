import type { ReactNode } from "react";
import { Building2, Copy, Loader2, RefreshCw } from "lucide-react";
import type { CompanyResearchResult } from "../../types";
import { useI18n } from "../../i18n";

interface CompanyResearchPanelProps {
  data: CompanyResearchResult | null | undefined;
  loading?: boolean;
  onGenerate?: () => void;
}

export default function CompanyResearchPanel({
  data,
  loading = false,
  onGenerate,
}: CompanyResearchPanelProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400 gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t("companyResearch.loading")}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200">
        <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">{t("companyResearch.empty")}</p>
        {onGenerate ? (
          <button
            type="button"
            onClick={onGenerate}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer hover:bg-emerald-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t("companyResearch.generate")}
          </button>
        ) : null}
      </div>
    );
  }

  const copyAll = () => {
    const text = [
      `# ${data.companyName}`,
      data.overview,
      "",
      "Mission:",
      data.mission,
      "",
      "Talking Points:",
      ...data.talkingPoints.map((tp) => `- ${tp}`),
    ].join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-900">{data.companyName}</p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={copyAll}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-white cursor-pointer"
          >
            <Copy className="w-3 h-3" />
            {t("companyResearch.copySummary")}
          </button>
          {onGenerate ? (
            <button
              type="button"
              onClick={onGenerate}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-white cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              {t("companyResearch.regenerate")}
            </button>
          ) : null}
        </div>
      </div>

      <Section title={t("companyResearch.overview")}>{data.overview}</Section>
      <Section title={t("companyResearch.mission")}>{data.mission}</Section>

      {data.products.length > 0 && (
        <Section title={t("companyResearch.products")}>
          <ul className="space-y-1">
            {data.products.map((p, i) => (
              <li key={i} className="text-xs text-slate-700">• {p}</li>
            ))}
          </ul>
        </Section>
      )}

      {data.culture.length > 0 && (
        <Section title={t("companyResearch.culture")}>
          <div className="flex flex-wrap gap-1.5">
            {data.culture.map((c, i) => (
              <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                {c}
              </span>
            ))}
          </div>
        </Section>
      )}

      {data.recentNews.length > 0 && (
        <Section title={t("companyResearch.recentNews")}>
          <ul className="space-y-1">
            {data.recentNews.map((n, i) => (
              <li key={i} className="text-xs text-slate-700">• {n}</li>
            ))}
          </ul>
        </Section>
      )}

      {data.interviewTips.length > 0 && (
        <Section title={t("companyResearch.interviewTips")}>
          <ul className="space-y-1">
            {data.interviewTips.map((tip, i) => (
              <li key={i} className="text-xs text-amber-900 bg-amber-50 rounded px-2 py-1">• {tip}</li>
            ))}
          </ul>
        </Section>
      )}

      {data.talkingPoints.length > 0 && (
        <Section title={t("companyResearch.talkingPoints")}>
          <ul className="space-y-1">
            {data.talkingPoints.map((tp, i) => (
              <li key={i} className="text-xs text-emerald-900 bg-emerald-50 rounded px-2 py-1">• {tp}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{title}</p>
      <div className="text-xs text-slate-700 leading-relaxed">{children}</div>
    </div>
  );
}
