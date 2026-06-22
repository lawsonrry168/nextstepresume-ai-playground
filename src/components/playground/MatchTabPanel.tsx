import React from "react";
import { motion } from "motion/react";
import {
  Target, Sparkles, RefreshCw, AlertTriangle, Code, Briefcase, GraduationCap,
  Award, Languages, HeartHandshake, Layout, TrendingUp, CheckCircle, Info,
} from "lucide-react";
import { AIMatchAnalysisResult } from "../../types";
import { useI18n } from "../../i18n";

export interface MatchTabPanelProps {
  jobDescription: string;
  setJobDescription: (value: string) => void;
  liveAtsScore: number;
  detectedKeywords: string[];
  activeKeywordsList: string[];
  matcherHighlightActive: boolean;
  setMatcherHighlightActive: (value: boolean | ((prev: boolean) => boolean)) => void;
  matchLoading: boolean;
  matchError: string | null;
  matchAnalysisResult: AIMatchAnalysisResult | null;
  triggerAIMatchAnalysis: () => void;
}

export default function MatchTabPanel({
  jobDescription,
  setJobDescription,
  liveAtsScore,
  detectedKeywords,
  activeKeywordsList,
  matcherHighlightActive,
  setMatcherHighlightActive,
  matchLoading,
  matchError,
  matchAnalysisResult,
  triggerAIMatchAnalysis,
}: MatchTabPanelProps) {
  const { t } = useI18n();

  const scoreLabel = (score: number) =>
    score >= 85
      ? t("match.excellentFit")
      : score >= 65
        ? t("match.goodAlignment")
        : score >= 40
          ? t("match.developingCore")
          : t("match.severeMismatches");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 animate-fade-in"
      id="match-tab-view"
    >
      {/* 職缺比對主面板 — 與工作區白卡風格一致 */}
      <div className="panel-surface p-4 space-y-4" id="jd-matcher-board">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg notebook-chip">
                <Target className="w-4 h-4 text-emerald-600" />
              </span>
              <div>
                <h3 className="text-xs font-serif-heading font-bold text-slate-800 uppercase tracking-wide ui-label">{t("match.boardTitle")}</h3>
                <p className="text-[10px] text-slate-400 font-sans">
                  {t("match.boardSubtitle")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <span className="text-[10px] font-bold text-slate-600">{t("match.previewHighlight")}</span>
            <button
              type="button"
              role="switch"
              aria-checked={matcherHighlightActive}
              onClick={() => setMatcherHighlightActive(!matcherHighlightActive)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                matcherHighlightActive ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  matcherHighlightActive ? "translate-x-4" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-[10px] font-bold ${matcherHighlightActive ? "text-emerald-600" : "text-slate-400"}`}>
              {matcherHighlightActive ? t("match.enabled") : t("match.disabled")}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="matcher-jd-textarea" className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 block">
              {t("match.targetJd")}
            </label>
            <textarea
              id="matcher-jd-textarea"
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder={t("match.jdPlaceholder")}
              className="w-full text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white resize-y leading-relaxed"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>{t("match.charCount", { count: jobDescription.length })}</span>
              <button
                type="button"
                onClick={() => setJobDescription("")}
                className="text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer"
              >
                {t("match.clearContent")}
              </button>
            </div>
          </div>

          <div className="notebook-callout space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-mono ui-label">{t("match.realtimeKeywords")}</span>
                <p className="text-[10px] text-slate-500">{t("match.realtimeKeywordsHint")}</p>
              </div>
              <span
                className={`text-lg font-black font-mono px-2.5 py-1 rounded-lg border ${
                  liveAtsScore >= 75
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : liveAtsScore >= 45
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-red-50 border-red-200 text-red-600"
                }`}
              >
                {liveAtsScore}%
              </span>
            </div>

            <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  liveAtsScore >= 75 ? "bg-emerald-500" : liveAtsScore >= 45 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${liveAtsScore}%` }}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-mono font-bold uppercase text-slate-500 block">
                {t("match.matched", { count: detectedKeywords.length })}
              </span>
              {detectedKeywords.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">{t("match.noMatched")}</p>
              ) : (
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                  {detectedKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="text-[8px] font-mono px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-100 font-bold"
                    >
                      ✓ {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-mono font-bold uppercase text-slate-500 block">
                {t("match.gapKeywords", { count: activeKeywordsList.filter((w) => !detectedKeywords.includes(w)).length })}
              </span>
              {activeKeywordsList.filter((w) => !detectedKeywords.includes(w)).length === 0 ? (
                <p className="text-[10px] text-emerald-600 font-bold">{t("match.keywordsComplete")}</p>
              ) : (
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                  {activeKeywordsList
                    .filter((w) => !detectedKeywords.includes(w))
                    .map((keyword) => (
                      <span
                        key={keyword}
                        className="text-[8px] font-mono px-1.5 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-100 font-bold"
                        title={t("match.gapPreviewHint")}
                      >
                        • {keyword}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">{t("match.semanticTitle")}</h3>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              {t("match.semanticSubtitle")}
            </p>
          </div>
    
          <div className="flex items-center gap-2" id="match-analysis-controls">
            <button
              type="button"
              disabled={matchLoading}
              onClick={triggerAIMatchAnalysis}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer shadow-sm disabled:opacity-60 flex items-center justify-center gap-1.5 border border-emerald-500 transition-all active:scale-95"
            >
              {matchLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{matchAnalysisResult ? t("match.rerunAnalysis") : t("match.runAnalysis")}</span>
            </button>
          </div>
        </div>
    
        {matchLoading && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 text-center space-y-4 animate-pulse">
            <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 animate-spin">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700">{t("match.loadingTitle")}</h4>
              <p className="text-[10px] text-slate-400 font-sans max-w-sm mx-auto">
                {t("match.loadingHint")}
              </p>
            </div>
          </div>
        )}
    
        {matchError && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-rose-800">{t("match.errorTitle")}</h4>
              <p className="text-[10px] text-rose-600 font-sans">
                {t("match.errorHint", { message: matchError })}
              </p>
            </div>
          </div>
        )}
    
        {!matchAnalysisResult && !matchLoading && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center space-y-2 font-sans">
            <div className="font-bold text-xs text-slate-700">{t("match.emptyHint")}</div>
            <p className="text-[10px] text-slate-500">
              {jobDescription.trim().length > 10
                ? t("match.jdLoaded", { count: jobDescription.length })
                : t("match.pasteJdFirst")}
            </p>
          </div>
        )}
      </div>
    
      {/* Matching Results Presentation */}
      {matchAnalysisResult && !matchLoading && (
        <div className="space-y-6">
          {/* Score Section & Overall Rating */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Semantic Score Match Meter Gauge */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">{t("match.jobMatchScore")}</span>
              
              <div className="relative flex items-center justify-center w-28 h-28" id="match-score-radial">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-slate-100 fill-none"
                    strokeWidth="7"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className={`fill-none transition-all duration-300 ease-out ${
                      matchAnalysisResult.overallScore >= 85 
                        ? "stroke-emerald-500" 
                        : matchAnalysisResult.overallScore >= 65
                        ? "stroke-blue-500"
                        : matchAnalysisResult.overallScore >= 40
                        ? "stroke-amber-500"
                        : "stroke-rose-500"
                    }`}
                    strokeWidth="7"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 - (matchAnalysisResult.overallScore / 100) * (2 * Math.PI * 46)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-800 font-mono tracking-tight leading-none">
                    {matchAnalysisResult.overallScore}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">%</span>
                </div>
              </div>
    
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                matchAnalysisResult.overallScore >= 85 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : matchAnalysisResult.overallScore >= 65
                  ? "bg-emerald-50 text-emerald-700 border-blue-200"
                  : matchAnalysisResult.overallScore >= 40
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {scoreLabel(matchAnalysisResult.overallScore)}
              </span>
            </div>
    
            {/* Identified Role Details & Synthesis Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm md:col-span-2 space-y-3.5 flex flex-col justify-between">
              <div className="space-y-2 text-left">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">{t("match.identifiedPosition")}</span>
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {matchAnalysisResult.jobTitle}
                  </span>
                  {matchAnalysisResult.companyName && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      {t("match.atCompany", { company: matchAnalysisResult.companyName })}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-800 leading-snug">{t("match.synthesisReport")}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                  {matchAnalysisResult.summary}
                </p>
              </div>
    
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100" id="micro-audit-alert">
                <Info className="w-4 h-4 text-slate-450 text-slate-400 shrink-0" />
                <span className="text-[10px] text-slate-500 font-semibold font-sans">
                  {t("match.compareGapsHint")}
                </span>
              </div>
            </div>
          </div>
    
          {/* Gaps List & Strengths Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            {/* Detailed Gap Audits */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                {t("match.crucialGaps", { count: matchAnalysisResult.gaps.length })}
              </h4>
              
              {matchAnalysisResult.gaps.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-400 italic text-xs">
                  {t("match.noStructuralGaps")}
                </div>
              ) : (
                <div className="space-y-3 font-sans">
                  {matchAnalysisResult.gaps.map((gap, index) => {
                    const iconMap = {
                      skills: <Code className="w-3.5 h-3.5" />,
                      experience: <Briefcase className="w-3.5 h-3.5" />,
                      education: <GraduationCap className="w-3.5 h-3.5" />,
                      credentials: <Award className="w-3.5 h-3.5" />
                    };
                    
                    return (
                      <div 
                        key={index}
                        className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4.5 space-y-3 transition shadow-sm"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="p-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-200/60">
                              {iconMap[gap.type] || <Code className="w-3.5 h-3.5" />}
                            </span>
                            <span className="text-xs font-black text-slate-800 tracking-tight">{gap.area}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                            {(() => {
                              const gapTypeKey = `match.gapTypes.${gap.type}`;
                              const gapTypeLabel = t(gapTypeKey);
                              return gapTypeLabel === gapTypeKey ? gap.type : gapTypeLabel;
                            })()}
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                              gap.severity === 'high' 
                                ? "bg-rose-50 text-rose-700 border border-rose-100" 
                                : gap.severity === 'medium'
                                ? "bg-amber-50 text-amber-700 border border-amber-150"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}>
                              {t("match.impact", { severity: t(`match.severity.${gap.severity}`) })}
                            </span>
                          </div>
                        </div>
    
                        <div className="space-y-2">
                          <p className="text-xs text-slate-600 leading-relaxed font-sans font-semibold">
                            {gap.description}
                          </p>
                          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-1">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-600 text-emerald-500 block">{t("match.surgicalRecommendation")}</span>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed font-sans">
                              {gap.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
    
            {/* Strengths & Missing Keywords Pill Cloud */}
            <div className="space-y-6">
              {/* Missing Target Keywords */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <code className="text-emerald-600 bg-emerald-50 px-1 border border-emerald-100 rounded text-[10px]">#</code>
                    {t("match.unacknowledgedKeywords", { count: matchAnalysisResult.missingKeywords.length })}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-sans font-medium">
                    {t("match.unacknowledgedHint")}
                  </p>
                </div>
    
                {matchAnalysisResult.missingKeywords.length === 0 ? (
                  <p className="text-[10px] text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl italic font-sans font-semibold border border-emerald-100">
                    {t("match.excellentKeywordCoverage")}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5" id="missing-keywords-pill-box">
                    {matchAnalysisResult.missingKeywords.map((keyword, idx) => (
                      <span 
                        key={idx}
                        className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-xl transition cursor-default font-mono"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
    
              {/* Verified Alignment Strengths */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {t("match.verifiedStrengths")}
                </h4>
                <div className="space-y-3 font-sans">
                  {matchAnalysisResult.matchedStrengths.map((strength, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 hover:bg-emerald-50 p-3 rounded-xl transition"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 fill-emerald-50" />
                      <p className="text-xs text-slate-600 font-sans font-semibold leading-relaxed">
                        {strength}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
    
          {/* Step-by-Step Action Plan */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-left">
            <div className="pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" />
                {t("match.actionPlanTitle")}
              </h4>
              <p className="text-[10px] text-slate-400 font-sans font-medium">
                {t("match.actionPlanHint")}
              </p>
            </div>
    
            <div className="relative border-l-2 border-slate-100 pl-4 space-y-6 py-2 ml-2 font-sans" id="action-plan-timeline">
              {matchAnalysisResult.actionPlan.map((action, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-[9px] font-black font-mono">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-slate-700 font-sans font-semibold pl-2 leading-relaxed">
                    {action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
