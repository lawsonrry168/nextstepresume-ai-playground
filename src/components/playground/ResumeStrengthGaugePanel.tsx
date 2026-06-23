import { useState } from "react";
import { AlertCircle, Check, CheckCircle, ChevronDown } from "lucide-react";
import { useI18n } from "../../i18n";
import type { ResumeStrengthResult } from "../../lib/resumeStrengthScore";
import CollapsiblePanel from "./CollapsiblePanel";

export interface ResumeStrengthGaugePanelProps {
  resumeStrength: ResumeStrengthResult;
}

export default function ResumeStrengthGaugePanel({ resumeStrength }: ResumeStrengthGaugePanelProps) {
  const { t } = useI18n();
  const [expandedStrengthSec, setExpandedStrengthSec] = useState<string | null>(null);

  return (
    <CollapsiblePanel
      id="strength-gauge-card-panel-wrap"
      title={t("strengthGauge.title")}
      subtitle={t("strengthGauge.subtitle", { score: resumeStrength.score })}
      defaultOpen={false}
      badge={
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          {resumeStrength.score >= 85
            ? t("strengthGauge.excellent")
            : resumeStrength.score >= 65
              ? t("strengthGauge.good")
              : t("strengthGauge.needsWork")}
        </span>
      }
    >
      <div className="space-y-3" id="strength-gauge-card-panel">
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-3 rounded-xl">
          <div className="relative shrink-0 flex items-center justify-center w-20 h-20">
            <svg className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="32" className="stroke-slate-200/80 fill-none" strokeWidth="5.5" />
              <circle
                cx="40"
                cy="40"
                r="32"
                className={`fill-none transition-all duration-550 ease-out ${
                  resumeStrength.score >= 85
                    ? "stroke-emerald-500"
                    : resumeStrength.score >= 65
                      ? "stroke-blue-500"
                      : resumeStrength.score >= 40
                        ? "stroke-amber-500"
                        : "stroke-rose-500"
                }`}
                strokeWidth="5.5"
                strokeDasharray={2 * Math.PI * 32}
                strokeDashoffset={2 * Math.PI * 32 - (resumeStrength.score / 100) * (2 * Math.PI * 32)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-base font-black text-slate-800 font-mono tracking-tight leading-none">
                {resumeStrength.score}
              </span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                %
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <div className="text-xs font-bold text-slate-700 font-sans">
              {resumeStrength.score === 100
                ? t("strengthGauge.perfect")
                : resumeStrength.score >= 85
                  ? t("strengthGauge.strong")
                  : resumeStrength.score >= 65
                    ? t("strengthGauge.moderate")
                    : t("strengthGauge.weak")}
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed font-sans">
              {t("strengthGauge.progress", {
                score: resumeStrength.score,
                remaining: 100 - resumeStrength.score,
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 font-sans">
        <span className="text-[9px] font-black font-mono uppercase tracking-widest text-slate-400 block mb-1">
          {t("strengthGauge.checklist")}
        </span>
        {resumeStrength.breakdown.map((item) => (
          <div key={item.id} className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 transition select-none">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedStrengthSec(expandedStrengthSec === item.id ? null : item.id)}
            >
              <div className="flex items-center gap-2">
                {item.completed ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                ) : (
                  <AlertCircle
                    className={`w-4 h-4 ${item.score > 0 ? "text-amber-500 fill-amber-50" : "text-slate-300"}`}
                  />
                )}
                <span className="text-xs font-bold text-slate-700">{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200/50 px-1.5 py-0.5 rounded">
                  {item.score}/{item.weight}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedStrengthSec === item.id ? "rotate-180" : ""}`}
                />
              </div>
            </div>

            {expandedStrengthSec === item.id && (
              <div className="mt-2 pt-2 border-t border-slate-200/60 pl-6 space-y-1.5 animate-fade-in text-xs">
                {item.details.length === 0 ? (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>{t("strengthGauge.sectionComplete")}</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wide text-amber-600 block">
                      {t("strengthGauge.todo")}
                    </span>
                    {item.details.map((detail, idx) => (
                      <div key={idx} className="flex gap-1.5 text-[10px] text-slate-500 leading-relaxed">
                        <span className="text-amber-500 select-none shrink-0">•</span>
                        <span className="font-semibold text-slate-600">{detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  );
}
