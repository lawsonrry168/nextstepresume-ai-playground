import React from "react";
import { motion } from "motion/react";
import {
  TrendingUp, Sparkles, RefreshCw, Award, AlertCircle, CheckCircle, Info, AlertTriangle, Check,
} from "lucide-react";
import {
  AnalysisResult,
  GrammarToneResult,
  ReadabilityComplexityResult,
  SkillConsistencyResult,
  ResumeData,
} from "../../types";
import { PlaygroundTab } from "./PlaygroundTabNav";
import { useI18n } from "../../i18n";

export interface TailorTabPanelProps {
  analysisResult: AnalysisResult | null;
  setActiveTab: (tab: PlaygroundTab) => void;
  triggerAITailor: () => void;
  lastAnalysisSimulated: boolean;
  liveAtsScore: number;
  activeKeywordsList: string[];
  detectedKeywords: string[];
  grammarResult: GrammarToneResult | null;
  grammarChecking: boolean;
  runGrammarToneCheck: () => void;
  readabilityResult: ReadabilityComplexityResult | null;
  readabilityChecking: boolean;
  runReadabilityComplexityCheck: () => void;
  setReadabilityDrawerOpen: (open: boolean) => void;
  skillConsistencyResult: SkillConsistencyResult | null;
  skillConsistencyChecking: boolean;
  runSkillConsistencyCheck: () => void;
  setSkillConsistencyDrawerOpen: (open: boolean) => void;
  resumeData: ResumeData;
  handleApplyTailoredItem: () => void;
}

export default function TailorTabPanel({
  analysisResult,
  setActiveTab,
  triggerAITailor,
  lastAnalysisSimulated,
  liveAtsScore,
  activeKeywordsList,
  detectedKeywords,
  grammarResult,
  grammarChecking,
  runGrammarToneCheck,
  readabilityResult,
  readabilityChecking,
  runReadabilityComplexityCheck,
  setReadabilityDrawerOpen,
  skillConsistencyResult,
  skillConsistencyChecking,
  runSkillConsistencyCheck,
  setSkillConsistencyDrawerOpen,
  resumeData,
  handleApplyTailoredItem,
}: TailorTabPanelProps) {
  const { t } = useI18n();

  return (
    <>
      {!analysisResult && (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-4" id="tailor-empty-state">
          <TrendingUp className="w-10 h-10 text-blue-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">{t("tailor.emptyTitle")}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {t("tailor.emptyHint")}
          </p>
          <button
            type="button"
            onClick={() => { setActiveTab('content'); triggerAITailor(); }}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> {t("tailor.runNow")}
          </button>
        </div>
      )}
      
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
          id="tailor-tab-view"
        >
          {/* Realtime Competence Ring Gauge */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center space-y-4 shadow-sm" id="ats-gauge-panel">
            <div className="flex items-center justify-center gap-2">
              <div className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">{t("tailor.calculatedScore")}</div>
              {lastAnalysisSimulated && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">{t("tailor.simulatedBadge")}</span>
              )}
            </div>
            
            <div className="relative inline-flex items-center justify-center" id="score-gauge">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  strokeWidth="8"
                  stroke="#e2e8f0"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  strokeWidth="8"
                  stroke="#2563eb"
                  fill="transparent"
                  strokeDasharray="326.7"
                  strokeDashoffset={326.7 - (326.7 * analysisResult.atsScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold text-slate-800">{analysisResult.atsScore}</span>
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{t("tailor.percent")}</span>
              </div>
            </div>
      
            {/* Progress feedback overview */}
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto font-medium">
              {t("tailor.applyDraftHint")}
            </p>
      
            <button
              id="btn-apply-draft"
              type="button"
              onClick={handleApplyTailoredItem}
              className="w-full bg-emerald-650 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-white" />
              <span>{t("tailor.applyDraft")}</span>
            </button>
          </div>
      
          {/* Category score breakdown (API categories) */}
          {analysisResult.categories && analysisResult.categories.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3" id="ats-categories-panel">
              <div className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">{t("tailor.categoryBreakdown")}</div>
              <div className="space-y-3">
                {analysisResult.categories.map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{cat.name}</span>
                      <span className="font-mono">{cat.score}/{cat.max}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (cat.score / cat.max) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{cat.feedback}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
      
          {/* Keyword alignments & presence indexes */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" id="keywords-match-panel">
            <div className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-3">{t("tailor.keywordGaps")}</div>
            <div className="grid grid-cols-2 gap-2" id="keywords-list">
              {analysisResult.keywords.map((kw, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100 hover:bg-white hover:shadow-sm transition-all font-medium">
                  <span className="text-xs font-sans font-semibold text-slate-850 text-slate-800 truncate max-w-[100px]">{kw.word}</span>
                  <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded leading-none ${
                    kw.present 
                      ? "bg-emerald-50 text-emerald-755 text-emerald-750 text-emerald-700 border border-emerald-100" 
                      : "bg-rose-50 text-rose-755 text-rose-750 text-rose-750 text-rose-700 border border-rose-100"
                  }`}>
                    {kw.present ? t("tailor.found") : t("tailor.missing")}
                  </span>
                </div>
              ))}
            </div>
          </div>
      
          {/* Clichés / Weak Phrases Highlight and correction */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm" id="cliche-audit-panel">
            <div className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">{t("tailor.weakPhrases")}</div>
            <div className="space-y-3" id="weak-phrases-alignment">
              {analysisResult.weakPhrases.map((wp, index) => (
                <div key={index} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5 hover:shadow-sm transition-all hover:bg-white font-medium">
                  <div className="flex items-center gap-2 text-rose-600">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span className="font-mono font-bold uppercase text-[9px]">{t("tailor.originalWeak")}</span>
                  </div>
                  <p className="text-slate-500 italic font-medium">"{wp.original}"</p>
                  <div className="flex items-center gap-2 text-emerald-600 pt-1">
                    <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span className="font-mono font-bold uppercase text-[9px]">{t("tailor.atsRecommended")}</span>
                  </div>
                  <p className="text-slate-800 font-bold">"{wp.replacement}"</p>
                  <p className="text-[10px] text-slate-400 leading-normal pt-1 font-bold">{wp.reason}</p>
                </div>
              ))}
            </div>
          </div>
      
          {/* Readability & Complexity indicators */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm" id="readability-card-panel">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 font-sans">{t("tailor.readabilityComplexity")}</div>
              {readabilityResult && (
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                  readabilityResult.complexityLevel === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                  readabilityResult.complexityLevel === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {t("tailor.complexity", { level: readabilityResult.complexityLevel })}
                </span>
              )}
            </div>
            
            {readabilityResult ? (
              <div className="space-y-4 font-sans">
                {/* Miniature score bar / gauge */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-sans font-bold text-slate-700">{t("tailor.readabilityIndex")}</span>
                    <strong className="text-emerald-600 font-bold text-sm font-mono">{readabilityResult.readabilityScore}/100</strong>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-150">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-600 rounded-full transition-all duration-550"
                      style={{ width: `${readabilityResult.readabilityScore}%` }}
                    ></div>
                  </div>
                </div>
      
                {/* Quantitative metrics grid */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">{t("tailor.sentenceWordCount")}</span>
                    <strong className="text-sm font-extrabold text-slate-800 font-mono block">{t("tailor.words", { count: readabilityResult.averageSentenceLength })}</strong>
                    <span className={`text-[9px] font-bold block mt-0.5 ${
                      readabilityResult.averageSentenceLength > 18 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {readabilityResult.averageSentenceLength > 18 ? t("tailor.convoluted") : t("tailor.optimal")}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">{t("tailor.jargonDensity")}</span>
                    <strong className="text-sm font-extrabold text-slate-800 font-mono block">{readabilityResult.jargonDensity}%</strong>
                    <span className={`text-[9px] font-bold block mt-0.5 ${
                      readabilityResult.jargonDensity > 15 ? 'text-amber-600' : 'text-emerald-400'
                    }`}>
                      {readabilityResult.jargonDensity > 15 ? t("tailor.highDensity") : t("tailor.standardTech")}
                    </span>
                  </div>
                </div>
      
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-150 p-3 rounded-xl font-medium font-sans">
                  {readabilityResult.summary}
                </p>
      
                <button
                  type="button"
                  onClick={() => setReadabilityDrawerOpen(true)}
                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 hover:border-emerald-200 py-2.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>{t("tailor.openReadabilityDrawer")}</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-50/50 border border-slate-150 border-dashed rounded-xl p-6 text-center space-y-3 font-sans">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
                  <TrendingUp className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">{t("tailor.noReadabilityLoaded")}</h5>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[240px] mx-auto mt-1">
                    {t("tailor.noReadabilityHint")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={readabilityChecking}
                  onClick={runReadabilityComplexityCheck}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-xs cursor-pointer shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 mx-auto border border-emerald-600"
                >
                  {readabilityChecking && <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />}
                  <span>{t("tailor.auditReadability")}</span>
                </button>
              </div>
            )}
          </div>
      
          {/* Skill-Job Consistency indicators */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm animate-fade-in" id="skill-consistency-card-panel">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 font-sans">{t("tailor.skillJobConsistency")}</div>
              {skillConsistencyResult && (
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                  skillConsistencyResult.consistencyScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  skillConsistencyResult.consistencyScore >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {skillConsistencyResult.consistencyScore >= 80 ? t("tailor.aligned") : t("tailor.misaligned")}
                </span>
              )}
            </div>
            
            {skillConsistencyResult ? (
              <div className="space-y-4 font-sans">
                {/* Miniature score bar / gauge */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-sans font-bold text-slate-700 font-medium">{t("tailor.skillsAlignmentScore")}</span>
                    <strong className="text-emerald-600 font-bold text-sm font-mono">{skillConsistencyResult.consistencyScore}/100</strong>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-150">
                    <div 
                      className="h-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-600 rounded-full transition-all duration-550"
                      style={{ width: `${skillConsistencyResult.consistencyScore}%` }}
                    ></div>
                  </div>
                </div>
      
                {/* Quantitative metrics grid */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">{t("tailor.missingCoreSkills")}</span>
                    <strong className="text-sm font-extrabold text-slate-800 font-mono block">{t("tailor.expected", { count: skillConsistencyResult.missingCrucialSkills.length })}</strong>
                    <span className={`text-[9px] font-bold block mt-0.5 ${
                      skillConsistencyResult.missingCrucialSkills.length > 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {skillConsistencyResult.missingCrucialSkills.length > 0 ? t("tailor.gapDetected") : t("tailor.standardMet")}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1">{t("tailor.outdatedMismatched")}</span>
                    <strong className="text-sm font-extrabold text-slate-800 font-mono block">{t("tailor.flagged", { count: skillConsistencyResult.redundantOrMismatchedSkills.length })}</strong>
                    <span className={`text-[9px] font-bold block mt-0.5 ${
                      skillConsistencyResult.redundantOrMismatchedSkills.length > 0 ? 'text-amber-100 bg-amber-900/10 text-amber-700 px-1 py-0.5 rounded' : 'text-emerald-650 text-emerald-600'
                    }`}>
                      {skillConsistencyResult.redundantOrMismatchedSkills.length > 0 ? t("tailor.cleanUp") : t("tailor.cleanInventory")}
                    </span>
                  </div>
                </div>
      
                <p className="text-xs text-slate-650 leading-relaxed bg-slate-50 border border-slate-150 p-3 rounded-xl font-medium font-sans">
                  {skillConsistencyResult.summary}
                </p>
      
                <button
                  type="button"
                  onClick={() => setSkillConsistencyDrawerOpen(true)}
                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150 hover:border-emerald-200 py-3 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>{t("tailor.openSkillDrawer")}</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-50/50 border border-slate-150 border-dashed rounded-xl p-6 text-center space-y-3 font-sans">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
                  <Award className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">{t("tailor.noSkillIndexLoaded")}</h5>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[240px] mx-auto mt-1">
                    {t("tailor.noSkillIndexHint", { role: resumeData.personalInfo?.title || "your target role" })}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={skillConsistencyChecking}
                  onClick={runSkillConsistencyCheck}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-xs cursor-pointer shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 mx-auto border border-emerald-505"
                >
                  {skillConsistencyChecking && <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />}
                  <span>{t("tailor.auditSkillAlignment")}</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}
