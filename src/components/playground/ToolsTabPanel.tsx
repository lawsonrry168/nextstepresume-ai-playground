import React from "react";
import { motion } from "motion/react";
import {
  Wand2, Mic, MicOff, Volume2, Sparkles, RefreshCw, TrendingUp, Award,
  Download, FileUp, FileText, Grid, Layout, Check, AlertCircle, Info,
  ChevronDown, Code, Briefcase, GraduationCap, Target, Eye,
  ArrowRight, Plus, Trash2, CheckCircle, Cloud, Layers, Maximize2, LayoutGrid,
  Languages, AlertTriangle,
} from "lucide-react";
import { ResumeData, AnalysisResult, TemplateStyle } from "../../types";
import { formatSalaryRange, formatSalaryAmount, SalaryEstimate } from "../../lib/salaryBenchmark";
import { isHongKongMarket } from "../../lib/market/config";
import type { AtsLogEntry, ComparatorResult } from "../../hooks/usePlaygroundTools";
import CollapsiblePanel from "./CollapsiblePanel";
import { useI18n } from "../../i18n";

type PremiumGrammarResult = {
  score: number;
  summary: string;
  suggestions: Array<{
    original: string;
    suggested: string;
    explanation: string;
    severity: "high" | "medium" | "low";
  }>;
};

export interface ToolsTabPanelProps {
  voiceRecording: boolean;
  voiceStatus: string;
  voiceTarget: "summary" | "grammar_input" | "custom";
  setVoiceTarget: (value: "summary" | "grammar_input" | "custom") => void;
  toggleVoiceRecording: () => void;
  premiumGrammarText: string;
  setPremiumGrammarText: (value: string) => void;
  premiumGrammarChecking: boolean;
  runPremiumGrammarCheck: () => void;
  premiumGrammarResult: PremiumGrammarResult | null;
  salaryRole: string;
  setSalaryRole: (value: string) => void;
  salaryExp: number;
  setSalaryExp: (value: number) => void;
  salaryInsightsOpen: boolean;
  setSalaryInsightsOpen: (value: boolean) => void;
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  jobDescription: string;
  heatmapMetric: "proficiency" | "demand" | "relevance";
  setHeatmapMetric: (value: "proficiency" | "demand" | "relevance") => void;
  skillsDemand: Record<string, number>;
  setSkillsDemand: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  skillsProficiency: Record<string, number>;
  setSkillsProficiency: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  skillsRelevance: Record<string, number>;
  setSkillsRelevance: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  smartSuggestionsCategory: "verbs" | "industry_terms" | "ats_optimized";
  setSmartSuggestionsCategory: (value: "verbs" | "industry_terms" | "ats_optimized") => void;
  analysisResult: AnalysisResult | null;
  applySmartSuggestion: (text: string, type: "summary" | "grammar" | "skill") => void;
  isAtsCrawling: boolean;
  triggerAtsCrawlerSim: (source: string) => void;
  atsLogs: AtsLogEntry[];
  clearAtsLogs: () => void;
  crawlerSource: string;
  setCrawlerSource: (value: string) => void;
  isComparing: boolean;
  runResumeComparison: () => void;
  comparatorResult: ComparatorResult | null;
  comparatorOpen: boolean;
  setComparatorOpen: (value: boolean) => void;
  handleManualSave: () => void;
  shortcutsModalOpen: boolean;
  setShortcutsModalOpen: (value: boolean) => void;
  activeTemplate: TemplateStyle;
  setActiveTemplate: (style: TemplateStyle) => void;
  autoSaveShouldFail: boolean;
  setAutoSaveShouldFail: (value: boolean) => void;
  addSystemLog: (level: "info" | "warn" | "error", message: string) => void;
  highlightChanges: boolean;
  detectedKeywords: string[];
  activeKeywordsList: string[];
  salaryEstimate: SalaryEstimate;
  saveImmediateSnapshot: () => void;
  matcherHighlightActive: boolean;
}

const BTN_PRIMARY =
  "w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed";
const BTN_SECONDARY =
  "w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-60 disabled:cursor-not-allowed";
const BTN_DANGER =
  "w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm bg-rose-600 hover:bg-rose-700 text-white border border-rose-500";

function heatmapBarColor(level: number) {
  if (level >= 9) return "bg-emerald-500";
  if (level >= 7) return "bg-emerald-500";
  if (level >= 5) return "bg-amber-400";
  return "bg-slate-300";
}

function getHeatmapLevel(
  skill: string,
  metric: "proficiency" | "demand" | "relevance",
  skillsProficiency: Record<string, number>,
  skillsDemand: Record<string, number>,
  skillsRelevance: Record<string, number>,
) {
  if (metric === "proficiency") return skillsProficiency[skill] || 7;
  if (metric === "demand") return skillsDemand[skill] || 6;
  return skillsRelevance[skill] || 8;
}

export default function ToolsTabPanel({
  voiceRecording,
  voiceStatus,
  voiceTarget,
  setVoiceTarget,
  toggleVoiceRecording,
  premiumGrammarText,
  setPremiumGrammarText,
  premiumGrammarChecking,
  runPremiumGrammarCheck,
  premiumGrammarResult,
  salaryRole,
  setSalaryRole,
  salaryExp,
  setSalaryExp,
  salaryInsightsOpen,
  setSalaryInsightsOpen,
  resumeData,
  setResumeData,
  jobDescription,
  heatmapMetric,
  setHeatmapMetric,
  skillsDemand,
  setSkillsDemand,
  skillsProficiency,
  setSkillsProficiency,
  skillsRelevance,
  setSkillsRelevance,
  smartSuggestionsCategory,
  setSmartSuggestionsCategory,
  analysisResult,
  applySmartSuggestion,
  isAtsCrawling,
  triggerAtsCrawlerSim,
  atsLogs,
  clearAtsLogs,
  crawlerSource,
  setCrawlerSource,
  isComparing,
  runResumeComparison,
  comparatorResult,
  comparatorOpen,
  setComparatorOpen,
  handleManualSave,
  shortcutsModalOpen,
  setShortcutsModalOpen,
  activeTemplate,
  setActiveTemplate,
  autoSaveShouldFail,
  setAutoSaveShouldFail,
  addSystemLog,
  highlightChanges,
  detectedKeywords,
  activeKeywordsList,
  salaryEstimate,
  saveImmediateSnapshot,
  matcherHighlightActive,
}: ToolsTabPanelProps) {
  const { t } = useI18n();

  const HEATMAP_METRICS = [
    ["proficiency", t("tools.heatmap.metrics.proficiency")],
    ["demand", t("tools.heatmap.metrics.demand")],
    ["relevance", t("tools.heatmap.metrics.relevance")],
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
      id="premium-tools-tab-view"
    >
      <CollapsiblePanel
        title={t("tools.sections.writing.title")}
        subtitle={t("tools.sections.writing.subtitle")}
        defaultOpen
        icon={
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Languages className="w-4 h-4" />
          </span>
        }
      >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-100 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 block">
                <Languages className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase">{t("tools.grammar.title")}</h4>
                <p className="text-[10px] text-slate-400">{t("tools.grammar.hint")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPremiumGrammarText(resumeData.summary || "")}
              className="text-[10px] text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded font-bold cursor-pointer"
              title={t("tools.grammar.loadSummaryTitle")}
            >
              {t("tools.grammar.loadSummary")}
            </button>
          </div>
    
          <div className="space-y-3">
            <textarea
              rows={2}
              value={premiumGrammarText}
              onChange={(e) => setPremiumGrammarText(e.target.value)}
              placeholder={t("tools.grammar.placeholder")}
              className="w-full text-xs font-sans bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl p-3 focus:outline-none text-slate-700 shadow-inner"
            ></textarea>
    
            <button
              type="button"
              onClick={() => runPremiumGrammarCheck()}
              disabled={premiumGrammarChecking}
              className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${BTN_PRIMARY}`}
            >
              {premiumGrammarChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>{t("tools.grammar.analyzing")}</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>{t("tools.grammar.runCheck")}</span>
                </>
              )}
            </button>
    
            {/* Grammar results pane */}
            {premiumGrammarResult && (
              <div className="bg-emerald-50/40 rounded-xl p-3 border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-emerald-900 font-sans">{t("tools.grammar.scoreLabel")}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    premiumGrammarResult.score >= 85 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>{premiumGrammarResult.score}/100</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-700 font-sans">{premiumGrammarResult.summary}</p>
                
                {premiumGrammarResult.suggestions && premiumGrammarResult.suggestions.length > 0 && (
                  <div className="space-y-2 mt-2 max-h-[160px] overflow-y-auto">
                    {premiumGrammarResult.suggestions.map((sug, i) => (
                      <div key={i} className="bg-white p-2.5 rounded-lg border border-emerald-100/60 text-[10px] leading-normal space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-550 text-rose-500 line-through truncate max-w-[40%]">{sug.original}</span>
                          <span className="font-extrabold text-emerald-600 truncate max-w-[40%]">👉 {sug.suggested}</span>
                        </div>
                        <p className="text-slate-500 italic text-[10px]">{sug.explanation}</p>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              saveImmediateSnapshot();
                              setPremiumGrammarText(sug.suggested);
                              setResumeData(prev => ({
                                ...prev,
                                summary: sug.suggested
                              }));
                              alert(t("tools.grammar.appliedAlert"));
                            }}
                            className="text-[9px] px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded font-bold cursor-pointer transition-all"
                          >
                            {t("tools.grammar.applyToSummary")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 rounded-lg text-rose-600 block">
                <Mic className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase">{t("tools.voice.title")}</h4>
              </div>
            </div>
            {voiceRecording && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {([
                ["summary", t("tools.voice.targets.summary")],
                ["grammar_input", t("tools.voice.targets.grammar_input")],
                ["custom", t("tools.voice.targets.custom")],
              ] as const).map(([target, label]) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setVoiceTarget(target)}
                  className={`text-[11px] p-2 rounded-lg border font-bold transition-all cursor-pointer ${
                    voiceTarget === target
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={voiceRecording ? BTN_DANGER : BTN_PRIMARY}
            >
              {voiceRecording ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>{t("tools.voice.stop")}</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>{t("tools.voice.start")}</span>
                </>
              )}
            </button>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 min-h-[48px] flex items-center justify-center">
              <span className="text-[10px] text-slate-600 text-center font-sans">
                {voiceStatus || (voiceRecording ? t("tools.voice.listening") : t("tools.voice.idle"))}
              </span>
            </div>
          </div>
        </div>
      </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        title={t("tools.sections.market.title")}
        subtitle={t("tools.sections.market.subtitle")}
        defaultOpen={false}
        icon={
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <TrendingUp className="w-4 h-4" />
          </span>
        }
      >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-100 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 block">
                <TrendingUp className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase">{t("tools.salary.title")}</h4>
                <p className="text-[10px] text-slate-400">{t("tools.salary.hint")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSalaryInsightsOpen(true)}
              className="text-[10px] text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded font-bold cursor-pointer"
            >
              {t("tools.salary.expand")}
            </button>
          </div>
    
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t("tools.salary.roleLabel")}</label>
                <input
                  type="text"
                  value={salaryRole}
                  onChange={(e) => setSalaryRole(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-800"
                  placeholder={t("tools.salary.rolePlaceholder")}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t("tools.salary.expLabel", { years: salaryExp })}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={salaryExp}
                  onChange={(e) => setSalaryExp(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-2.5"
                />
              </div>
            </div>
    
            {/* Embedded high fidelity market data panel */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">{t("tools.salary.top25")}</span>
                  <strong className="text-xs text-slate-800 font-mono">{formatSalaryAmount(salaryEstimate.low, salaryEstimate)}</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-250 ring-2 ring-emerald-50">
                  <span className="text-[9px] uppercase font-bold text-emerald-600 block">{t("tools.salary.median")}</span>
                  <strong className="text-xs text-emerald-700 font-mono">{formatSalaryAmount(salaryEstimate.mid, salaryEstimate)}</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">{t("tools.salary.top10")}</span>
                  <strong className="text-xs text-emerald-700 font-mono">{formatSalaryAmount(salaryEstimate.high, salaryEstimate)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 p-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 block">
                <Grid className="w-4 h-4" />
              </span>
              <h4 className="text-xs font-bold text-slate-800">{t("tools.heatmap.title")}</h4>
            </div>
            <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto sm:min-w-[200px]">
              {HEATMAP_METRICS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setHeatmapMetric(key)}
                  className={`text-[10px] py-1.5 px-2 rounded-lg border font-bold transition-all cursor-pointer ${
                    heatmapMetric === key
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {resumeData.skills.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400 italic">{t("tools.heatmap.empty")}</p>
          ) : (
            <div className="space-y-2 max-h-[min(280px,45vh)] overflow-y-auto pr-0.5">
              {resumeData.skills.map((skill, index) => {
                const level = getHeatmapLevel(
                  skill,
                  heatmapMetric,
                  skillsProficiency,
                  skillsDemand,
                  skillsRelevance,
                );

                const adjustLevel = (delta: number) => {
                  saveImmediateSnapshot();
                  const updateRating = (r: Record<string, number>) => ({
                    ...r,
                    [skill]: Math.min(10, Math.max(1, (r[skill] || level) + delta)),
                  });
                  if (heatmapMetric === "proficiency") setSkillsProficiency(updateRating);
                  else if (heatmapMetric === "demand") setSkillsDemand(updateRating);
                  else setSkillsRelevance(updateRating);
                };

                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-800 truncate">{skill}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0 tabular-nums">
                          {level}/10
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${heatmapBarColor(level)}`}
                          style={{ width: `${level * 10}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => adjustLevel(-1)}
                        disabled={level <= 1}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label={t("tools.heatmap.decrease", { skill })}
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustLevel(1)}
                        disabled={level >= 10}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold cursor-pointer flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label={t("tools.heatmap.increase", { skill })}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        title={t("tools.sections.ats.title")}
        subtitle={t("tools.sections.ats.subtitle")}
        defaultOpen={false}
        icon={
          <span className="p-1.5 rounded-lg bg-slate-100 text-emerald-600 border border-slate-200">
            <Code className="w-4 h-4" />
          </span>
        }
      >
      <div className="space-y-4" id="premium-expansion-suite">
        <div className="rounded-xl border border-slate-100 p-4 space-y-3" id="ats-log-console-module">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-slate-50 rounded-lg text-emerald-600 border border-emerald-100 block">
                <Code className="w-4 h-4" />
              </span>
              <h4 className="text-xs font-bold text-slate-800 uppercase">{t("tools.crawler.title")}</h4>
            </div>
            {isAtsCrawling && (
              <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                {t("tools.crawler.crawling")}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <label className="text-[9.5px] uppercase font-bold text-slate-400">{t("tools.crawler.source")}</label>
              <select
                value={crawlerSource}
                onChange={(e) => setCrawlerSource(e.target.value)}
                className="text-[10px] text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 font-bold focus:outline-none"
              >
                <option value="JobsDB HK">JobsDB HK</option>
                <option value="LinkedIn Jobs">LinkedIn Jobs</option>
                <option value="CTgoodjobs">CTgoodjobs</option>
                <option value="Indeed HK">Indeed HK</option>
              </select>
            </div>
            <button
              type="button"
              onClick={clearAtsLogs}
              className="text-[9px] font-bold text-slate-400 hover:text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 cursor-pointer"
            >
              {t("tools.crawler.clear")}
            </button>
          </div>

          <div
            id="crawler-terminal-box"
            className="bg-slate-50 text-slate-700 border border-slate-200 rounded-xl p-3 h-28 overflow-y-auto font-mono text-[9px] space-y-1.5 leading-normal shadow-inner"
          >
            {atsLogs.length === 0 ? (
              <div className="text-slate-400 h-full flex items-center justify-center italic text-center text-[10px] font-sans">
                {t("tools.crawler.idle")}
              </div>
            ) : (
              atsLogs.map((log) => {
                let levelColor = "text-emerald-700";
                let tagBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
                if (log.level === "warn") {
                  levelColor = "text-amber-700";
                  tagBg = "bg-amber-50 text-amber-700 border-amber-200";
                } else if (log.level === "error") {
                  levelColor = "text-rose-700";
                  tagBg = "bg-rose-50 text-rose-700 border-rose-200";
                }

                return (
                  <div key={log.id} className="border-b border-slate-200/80 pb-1 text-left">
                    <span className="text-slate-400 font-bold mr-1.5">[{log.timestamp}]</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border mr-1 uppercase ${tagBg}`}>
                      {log.level}
                    </span>
                    <span className={`${levelColor} font-sans tracking-wide`}>{log.text}</span>
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={() => triggerAtsCrawlerSim(crawlerSource)}
            disabled={isAtsCrawling}
            className={`${BTN_PRIMARY} ${isAtsCrawling ? "opacity-60 cursor-not-allowed animate-pulse" : ""}`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>{isAtsCrawling ? t("tools.crawler.parsing") : t("tools.crawler.start", { source: crawlerSource })}</span>
          </button>
        </div>

        <div className="rounded-xl border border-slate-100 p-4 space-y-3" id="resume-comparator-module">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 block">
                <Maximize2 className="w-4 h-4" />
              </span>
              <h4 className="text-xs font-bold text-slate-800 uppercase">{t("tools.comparator.title")}</h4>
            </div>
            {comparatorResult && (
              <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 rounded-lg text-emerald-700 text-[10px] font-black font-mono">
                {comparatorResult.matchRate}%
              </span>
            )}
          </div>

          {comparatorResult ? (
            <div className="space-y-2 bg-slate-50 border border-slate-200 p-3 rounded-xl text-[10px]">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 font-bold block">{t("tools.comparator.matched")}</span>
                  <span className="text-xs font-black text-emerald-600 font-mono">{comparatorResult.keyMatches.length}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 font-bold block">{t("tools.comparator.gaps")}</span>
                  <span className="text-xs font-black text-rose-500 font-mono">{comparatorResult.missingSkills.length}</span>
                </div>
              </div>
              {comparatorResult.criticalGaps.length > 0 && (
                <div className="p-2 bg-rose-50 rounded-lg border border-rose-100 flex gap-1.5 text-rose-800 text-[9.5px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{t("tools.comparator.criticalGaps", { gaps: comparatorResult.criticalGaps.join("、") })}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 italic text-center py-3">{t("tools.comparator.noSnapshot")}</p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                runResumeComparison();
                setComparatorOpen(true);
              }}
              className={BTN_PRIMARY}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{t("tools.comparator.expand")}</span>
            </button>
            <button
              type="button"
              onClick={() => runResumeComparison()}
              disabled={isComparing}
              className={BTN_SECONDARY}
            >
              {isComparing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              <span>{t("tools.comparator.rerun")}</span>
            </button>
          </div>
        </div>
      </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        title={t("tools.sections.smartFill.title")}
        subtitle={t("tools.sections.smartFill.subtitle")}
        defaultOpen={false}
        icon={
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Sparkles className="w-4 h-4" />
          </span>
        }
      >
      <div className="space-y-3" id="smart-autofill-management-suite">
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg w-fit scale-95 origin-left mb-3">
              <button
                type="button"
                onClick={() => setSmartSuggestionsCategory("verbs")}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  smartSuggestionsCategory === "verbs" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t("tools.smartSuggestions.verbs")}
              </button>
              <button
                type="button"
                onClick={() => setSmartSuggestionsCategory("industry_terms")}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  smartSuggestionsCategory === "industry_terms" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t("tools.smartSuggestions.industry")}
              </button>
              <button
                type="button"
                onClick={() => setSmartSuggestionsCategory("ats_optimized")}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  smartSuggestionsCategory === "ats_optimized" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t("tools.smartSuggestions.atsSummary")}
              </button>
            </div>
    
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {smartSuggestionsCategory === "verbs" && ["0", "1", "2"].map((key) => ({
                  title: t(`tools.smartSuggestions.examples.verbs.${key}.title`),
                  desc: t(`tools.smartSuggestions.examples.verbs.${key}.desc`),
                  type: "summary" as const
                })).map((item, i) => (
                <div key={i} className="notebook-item p-2.5 space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <strong className="text-[10px] text-slate-800 font-black uppercase font-sans">{item.title}</strong>
                    <span className="text-[8.5px] px-1.5 py-0.5 bg-emerald-100/50 text-emerald-700 rounded font-bold uppercase">{t("tools.smartSuggestions.verbBadge")}</span>
                  </div>
                  <p className="text-[9.5px] text-slate-600 font-mono italic">{item.desc}</p>
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => applySmartSuggestion(item.desc, 'summary')}
                      className="bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[8.5px] font-bold cursor-pointer"
                    >
                      {t("tools.smartSuggestions.fillSummary")}
                    </button>
                    <button
                      type="button"
                      onClick={() => applySmartSuggestion(item.desc, 'grammar')}
                      className="bg-white hover:bg-slate-100 text-slate-650 border border-slate-200 px-2 py-0.5 rounded text-[8.5px] font-semibold cursor-pointer"
                    >
                      {t("tools.smartSuggestions.fillGrammar")}
                    </button>
                  </div>
                </div>
              ))}
    
              {smartSuggestionsCategory === "industry_terms" && [
                { skill: "Distributed State Synchronization", cat: t("tools.smartSuggestions.category", { cat: "Core" }).replace("Category: Core", "Core") },
                { skill: "CI/CD Deployment Pipelines", cat: "部署雲基礎" },
                { skill: "System Latency & Load Balancing", cat: "負載均衡" },
                { skill: "WebGL & Canvas Hardware Acceleration", cat: "渲染核心" },
                { skill: "Heuristic Search Optimization", cat: "算法診斷" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-white border border-slate-150 p-2 rounded-xl text-[10px] shadow-2xs">
                  <div className="space-y-0.5 animate-fade-in text-left">
                    <span className="font-mono text-slate-800 font-bold">{item.skill}</span>
                    <p className="text-[8px] text-slate-400 font-sans">{t("tools.smartSuggestions.category", { cat: item.cat })}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => applySmartSuggestion(item.skill, 'skill')}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded text-[8.5px] font-bold cursor-pointer transition-all"
                    >
                      {t("tools.smartSuggestions.addSkill")}
                    </button>
                    <button
                      type="button"
                      onClick={() => applySmartSuggestion(item.skill, 'grammar')}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded text-[8.5px] cursor-pointer"
                    >
                      {t("tools.smartSuggestions.bringToGrammar")}
                    </button>
                  </div>
                </div>
              ))}
    
              {smartSuggestionsCategory === "ats_optimized" && ["0", "1"].map((key) => ({
                  title: t(`tools.smartSuggestions.examples.ats.${key}.title`),
                  desc: t(`tools.smartSuggestions.examples.ats.${key}.desc`),
                })).map((item, i) => (
                <div key={i} className="notebook-item p-2.5 space-y-1.5 text-left">
                  <strong className="text-[10px] text-slate-800 font-black uppercase font-sans block">{item.title}</strong>
                  <p className="text-[9.5px] text-slate-600 font-mono italic leading-relaxed">{item.desc}</p>
                  <div className="flex gap-1.5 justify-end">
                    <button
                      type="button"
                      onClick={() => applySmartSuggestion(item.desc, 'summary')}
                      className="bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded text-[8.5px] font-black cursor-pointer shadow-2xs"
                    >
                      {t("tools.smartSuggestions.pasteSummary")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
      </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        title={t("tools.sections.devTools.title")}
        subtitle={t("tools.sections.devTools.subtitle")}
        defaultOpen={false}
        icon={
          <span className="p-1.5 rounded-lg bg-rose-50 text-rose-500 border border-rose-100">
            <Cloud className="w-4 h-4" />
          </span>
        }
      >
        <div className="space-y-3" id="autosave-simulation-tool-card">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <span className="text-[10px] font-extrabold text-slate-800">{t("tools.devTools.simulateFail")}</span>
                <p className="text-[9px] text-slate-400">{t("tools.devTools.simulateFailHint")}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSaveShouldFail}
                  onChange={(e) => setAutoSaveShouldFail(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <button
                type="button"
                onClick={() => {
                  setAutoSaveShouldFail(true);
                  setResumeData(prev => ({ ...prev }));
                  alert(t("tools.devTools.triggerFailAlert"));
                }}
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-bold cursor-pointer"
              >
                {t("tools.devTools.triggerFail")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAutoSaveShouldFail(false);
                  handleManualSave();
                  alert(t("tools.devTools.recoverAlert"));
                }}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-bold cursor-pointer"
              >
                {t("tools.devTools.recover")}
              </button>
            </div>
          </div>
        </div>
      </CollapsiblePanel>
    
      {/* Salary Insights Modal Overlay */}
      {salaryInsightsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4 no-print animate-fade-in" id="salary-insights-modal">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase font-sans">{t("tools.salary.modalTitle")}</h3>
                  <p className="text-[10px] text-slate-500">{t("tools.salary.modalSubtitle")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSalaryInsightsOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs bg-slate-100 px-3 py-1.5 rounded-lg cursor-pointer"
              >
                {t("tools.salary.close")}
              </button>
            </div>
    
            <div className="space-y-4 text-xs leading-relaxed text-slate-600 font-sans">
              <p>
                {t("tools.salary.modalBodyPrefix")} <strong>{salaryEstimate.roleTier}</strong>（{salaryRole || t("tools.salary.currentRole")}）<strong>{salaryExp}</strong> {t("tools.salary.yearsUnit")} {t("tools.salary.modalBodySuffix")}{formatSalaryRange(salaryEstimate)}。{salaryEstimate.marketNote}
              </p>

              <div className="space-y-3">
                <div className="relative border border-emerald-250 bg-emerald-50/20 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold text-emerald-600 uppercase block">{t("tools.salary.medianLabel")}</span>
                    <span className="text-sm font-black text-emerald-700 font-mono">
                      {isHongKongMarket()
                        ? `${formatSalaryAmount(salaryEstimate.mid, salaryEstimate)} / mo`
                        : t("tools.salary.medianPerYear", { amount: salaryEstimate.mid.toLocaleString() })}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full">{t("tools.salary.aboveAverage")}</span>
                </div>
    
                <div className="border border-slate-200 rounded-xl p-3 space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-800 block">
                    {isHongKongMarket() ? t("tools.salary.regionLabel") : t("tools.salary.regionTitle")}
                  </span>
                  {isHongKongMarket() ? (
                    <p className="text-[10px] text-slate-600 leading-relaxed">{t("tools.salary.monthlyNote")}</p>
                  ) : (
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                    <div className="bg-slate-50 p-2 rounded flex justify-between">
                      <span>{t("tools.salary.regions.us")}</span>
                      <span className="font-mono text-slate-800 font-bold">{formatSalaryAmount(salaryEstimate.mid, salaryEstimate)}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded flex justify-between">
                      <span>{t("tools.salary.regions.tw")}</span>
                      <span className="font-mono text-slate-800 font-bold">{formatSalaryAmount(Math.round(salaryEstimate.mid * 0.65), salaryEstimate)}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded flex justify-between">
                      <span>{t("tools.salary.regions.sg")}</span>
                      <span className="font-mono text-slate-800 font-bold">{formatSalaryAmount(Math.round(salaryEstimate.mid * 0.85), salaryEstimate)}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded flex justify-between">
                      <span>{t("tools.salary.regions.jp")}</span>
                      <span className="font-mono text-slate-800 font-bold">{formatSalaryAmount(Math.round(salaryEstimate.mid * 0.75), salaryEstimate)}</span>
                    </div>
                  </div>
                  )}
                </div>
    
              </div>
              
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex gap-2">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-normal">
                  <strong>{t("tools.salary.upgradeGuide")}</strong> {t("tools.salary.upgradeBody")} <strong>{resumeData.skills[0] || t("tools.salary.coreSkills")}</strong> {t("tools.salary.upgradeSuffix")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    
      {/* 1. Resume Comparator Dual-Column Modal Details */}
      {comparatorOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[120] p-4 no-print animate-fade-in" id="resume-comparator-modal">
          <div className="bg-white rounded-3xl max-w-5xl w-full h-[85vh] p-6 shadow-2xl border border-slate-200 flex flex-col justify-between animate-scale-up">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase font-sans">{t("tools.comparator.modalTitle")}</h3>
                  <p className="text-[10px] text-slate-500 font-sans">{t("tools.comparator.modalSubtitle")}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => runResumeComparison()}
                  className="text-white hover:bg-emerald-700 bg-emerald-600 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t("tools.comparator.reanalyze")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setComparatorOpen(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-xs bg-slate-100 px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  {t("tools.comparator.closeCompare")}
                </button>
              </div>
            </div>
    
            {/* Dual Column Content Body */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-4 overflow-hidden flex-1">
              
              {/* Left Column: Your Resume Draft */}
              <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between bg-slate-50/50 overflow-y-auto min-h-0 text-left">
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-black uppercase text-emerald-900 font-sans tracking-wider">{t("tools.comparator.columnA")}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{t("tools.comparator.liveSync")}</span>
                  </div>
    
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      {resumeData.personalInfo.name || t("tools.comparator.yourName")} - {resumeData.personalInfo.title || t("tools.comparator.defaultTitle")}
                    </h4>
                    <span className="text-[9px] text-slate-400">{resumeData.personalInfo.email} | {resumeData.personalInfo.phone}</span>
                  </div>
    
                  {/* Summary Block */}
                  <div className="space-y-1">
                    <strong className="text-[9px] uppercase font-bold text-slate-400">{t("tools.comparator.summaryLabel")}</strong>
                    <p className="text-[10.5px] leading-relaxed text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 font-mono italic">
                      {resumeData.summary || t("tools.comparator.noSummary")}
                    </p>
                  </div>
    
                  {/* Skills Highlight tags */}
                  <div className="space-y-2">
                    <strong className="text-[9px] uppercase font-bold text-slate-400">{t("tools.comparator.skillsLabel")}</strong>
                    <div className="flex flex-wrap gap-1.5 font-sans">
                      {resumeData.skills.length === 0 ? (
                        <span className="text-[10px] italic text-slate-400">{t("tools.comparator.noSkills")}</span>
                      ) : (
                        resumeData.skills.map((skill, index) => {
                          // Highlight if it matches job keywords computed in results
                          const isMatched = comparatorResult?.keyMatches.some(s => s.toLowerCase() === skill.toLowerCase()) || false;
                          return (
                            <span
                              key={index}
                              className={`px-2 py-1 rounded text-[10px] tracking-wide font-bold uppercase transition-all duration-350 ${
                                isMatched
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs"
                                  : "bg-white text-slate-700 border border-slate-200"
                              }`}
                            >
                              {isMatched ? "✓ " : ""}{skill}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
    
                  {/* Experience Bullets block */}
                  <div className="space-y-2">
                    <strong className="text-[9px] uppercase font-bold text-slate-400">{t("tools.comparator.achievementsLabel")}</strong>
                    <div className="space-y-1.5">
                      {resumeData.experience.map((exp, expIdx) => (
                        <div key={expIdx} className="bg-white p-2.5 rounded-xl border border-slate-200/50 space-y-1">
                          <span className="text-[9.5px] font-bold text-slate-705 text-slate-800">{exp.company} | {exp.role}</span>
                          <div className="space-y-1 text-slate-500 text-[10px] leading-relaxed italic">
                            {exp.bullets.map((b, bIdx) => (
                              <p key={bIdx} className="pl-1.5 border-l border-slate-200">• {b}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
    
                </div>
              </div>
    
              {/* Right Column: Comparison Targets & Match Analytics */}
              <div className="border border-emerald-100 rounded-2xl p-4 flex flex-col justify-between bg-emerald-50/10 overflow-y-auto min-h-0 text-left">
                <div className="space-y-4 font-sans">
                  <div className="flex justify-between items-baseline border-b border-emerald-100 pb-2">
                    <span className="text-[10px] font-black uppercase text-emerald-900 font-sans tracking-wider">{t("tools.comparator.columnB")}</span>
                    <span className="text-[9px] px-1.5 bg-emerald-100 text-emerald-800 rounded font-black font-sans uppercase">{t("tools.comparator.atsView")}</span>
                  </div>
    
                  {comparatorResult ? (
                    <div className="space-y-4">
                      {/* Score Ring Gauge */}
                      <div className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-emerald-100">
                        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center bg-emerald-50 rounded-full border-2 border-emerald-200 font-mono text-base font-black text-emerald-800">
                          {comparatorResult.matchRate}%
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-emerald-800 block uppercase">{t("tools.comparator.matchIndex")}</span>
                          <p className="text-[10.5px] text-slate-600 leading-normal">
                            {t("tools.comparator.matchBody")} <strong>{comparatorResult.matchRate}%</strong>。
                            {comparatorResult.matchRate >= 85 
                              ? t("tools.comparator.matchExcellent")
                              : t("tools.comparator.matchImprove")}
                          </p>
                        </div>
                      </div>
    
                      {/* Key Matches in Green */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          <strong className="text-[10px] uppercase font-bold text-emerald-800">{t("tools.comparator.matchedKeywords")}</strong>
                        </div>
                        <div className="flex flex-wrap gap-1.5 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100">
                          {comparatorResult.keyMatches.length === 0 ? (
                            <span className="text-[9px] italic text-emerald-600">{t("tools.comparator.noMatches")}</span>
                          ) : (
                            comparatorResult.keyMatches.map((m, idx) => (
                              <span key={idx} className="bg-emerald-100 text-emerald-800 font-mono font-bold px-1.5 py-0.5 rounded text-[9.5px] uppercase shadow-2xs border border-emerald-200">
                                {m}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
    
                      {/* Missing Skills in Orange/Red */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          <strong className="text-[10px] uppercase font-bold text-rose-800">{t("tools.comparator.missingSkills")}</strong>
                        </div>
                        <div className="flex flex-wrap gap-1.5 bg-rose-50/45 p-2.5 rounded-xl border border-rose-100">
                          {comparatorResult.missingSkills.length === 0 ? (
                            <span className="text-[9px] italic text-emerald-600">{t("tools.comparator.allMatched")}</span>
                          ) : (
                            comparatorResult.missingSkills.map((m, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  applySmartSuggestion(m, 'skill');
                                  runResumeComparison();
                                }}
                                title={t("tools.comparator.addSkillTitle")}
                                className="bg-white hover:bg-rose-100 text-rose-700 font-mono font-extrabold px-1.5 py-0.5 rounded text-[9.5px] uppercase border border-rose-200 transition-all cursor-pointer shadow-3xs hover:scale-105"
                              >
                                + {m}
                              </button>
                            ))
                          )}
                        </div>
                        <p className="text-[8.5px] text-slate-400 italic font-sans pr-2">
                          {t("tools.comparator.tipPrefix")} <strong>{t("tools.comparator.tipBody")}</strong>
                        </p>
                      </div>
    
                      {/* JD text detail snippet */}
                      <div className="space-y-1">
                        <strong className="text-[9px] uppercase font-bold text-slate-400">{t("tools.comparator.jdLabel")}</strong>
                        <p className="text-[9px] text-slate-500 font-mono line-clamp-3 bg-white p-2 border border-slate-100 rounded-lg">
                          {jobDescription || t("tools.comparator.noJd")}
                        </p>
                      </div>
    
                    </div>
                  ) : (
                    <div className="py-20 text-center text-xs italic text-slate-400">
                      {t("tools.comparator.loading")}
                    </div>
                  )}
    
                </div>
              </div>
    
            </div>
    
            {/* Dialog Modality Footer Help Banner */}
            <div className="bg-emerald-900 text-white rounded-2xl p-3 flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <Sparkles className="text-amber-300 w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                <p className="text-[10px] leading-normal font-sans text-emerald-100 pr-4 text-left">
                  <strong>{t("tools.comparator.footerGuide")}</strong> {t("tools.comparator.footerBody")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComparatorOpen(false)}
                className="bg-white hover:bg-slate-100 text-emerald-900 font-black cursor-pointer px-4 py-1.5 rounded-lg text-xs shrink-0 transition-all font-sans"
              >
                {t("tools.comparator.footerClose")}
              </button>
            </div>
    
          </div>
        </div>
      )}
    
      {/* 全域鍵盤快捷鍵說明中心 (Keyboard Shortcuts Diagnostics Help Modal) */}
      {shortcutsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4 no-print animate-fade-in" id="keyboard-shortcuts-help-modal">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-emerald-600 animate-pulse" />
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase font-sans">{t("tools.shortcuts.title")}</h3>
                  <p className="text-[10px] text-slate-400 font-sans font-medium">{t("tools.shortcuts.subtitle")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShortcutsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                {t("tools.salary.close")}
              </button>
            </div>
    
            <div className="space-y-3 font-sans text-xs">
              <p className="text-slate-500 leading-normal mb-1 font-semibold">
                {t("tools.shortcuts.intro")}
              </p>
    
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 font-medium text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{t("tools.shortcuts.manualSave")}</span>
                  </span>
                  <span className="font-mono text-[10px] bg-white border border-slate-300 font-bold px-2 py-0.5 rounded shadow-3xs uppercase text-slate-800">
                    Ctrl + S / ⌘ + S
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{t("tools.shortcuts.closePanels")}</span>
                  </span>
                  <span className="font-mono text-[10px] bg-white border border-slate-300 font-bold px-2 py-0.5 rounded shadow-3xs uppercase text-slate-800">
                    ESC
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{t("tools.shortcuts.togglePanel")}</span>
                  </span>
                  <span className="font-mono text-[10px] bg-white border border-slate-300 font-bold px-2 py-0.5 rounded shadow-3xs uppercase text-slate-800">
                    {t("tools.shortcuts.keyHint")}
                  </span>
                </div>
              </div>
    
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex gap-2">
                <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-emerald-800 leading-normal font-sans pr-1">
                  <strong>{t("tools.shortcuts.tip")}</strong> {t("tools.shortcuts.tipBody")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
