import React from "react";
import { TrendingUp, Check, CheckCircle } from "lucide-react";
import { ReadabilityComplexityResult, ReadabilitySuggestion } from "../../types";
import { useI18n } from "../../i18n";

export interface ReadabilityDrawerProps {
  open: boolean;
  onClose: () => void;
  readabilityResult: ReadabilityComplexityResult | null;
  appliedSuggestions: Set<string>;
  onApplyCorrection: (suggestion: ReadabilitySuggestion) => void;
}

export default function ReadabilityDrawer({
  open,
  onClose,
  readabilityResult,
  appliedSuggestions,
  onApplyCorrection
}: ReadabilityDrawerProps) {
  const { t } = useI18n();

  if (!open) return null;

  const complexityLabel = readabilityResult
    ? t(`drawers.readability.level.${readabilityResult.complexityLevel}`)
    : "";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
          onClick={() => onClose()}
        />
    
        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-md md:max-w-lg">
            <div className="h-full flex flex-col bg-white shadow-2xl overflow-y-auto border-l border-slate-100">
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-405 text-amber-400 animate-pulse" />
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">{t("drawers.readability.title")}</h2>
                    <p className="text-xs text-slate-400">{t("drawers.readability.subtitle")}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onClose()}
                  className="p-1 px-2.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-xs"
                >
                  ✕ {t("drawers.close")}
                </button>
              </div>
    
              <div className="flex-1 p-6 space-y-6">
                {readabilityResult ? (
                  <>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">{t("drawers.readability.scoreLabel")}</span>
                        <span className={`text-2xl font-black font-sans px-3 py-1 rounded-xl border ${
                          readabilityResult.readabilityScore >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          readabilityResult.readabilityScore >= 60 ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {readabilityResult.readabilityScore}/100
                        </span>
                      </div>
    
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-550 ${
                            readabilityResult.readabilityScore >= 80 ? "bg-emerald-500" :
                            readabilityResult.readabilityScore >= 60 ? "bg-amber-500" :
                            "bg-red-500"
                          }`}
                          style={{ width: `${readabilityResult.readabilityScore}%` }}
                        />
                      </div>
    
                      <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                        <div className="bg-white border border-slate-150 rounded-lg p-2.5 shadow-xs">
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block">{t("drawers.readability.complexityImpact")}</span>
                          <span className={`font-bold text-xs mt-0.5 block ${
                            readabilityResult.complexityLevel === 'High' ? 'text-red-600' :
                            readabilityResult.complexityLevel === 'Medium' ? 'text-amber-605 text-amber-600' : 'text-emerald-600'
                          }`}>
                            {t("drawers.readability.cognitiveLoad", { level: complexityLabel })}
                          </span>
                        </div>
                        <div className="bg-white border border-slate-150 rounded-lg p-2.5 shadow-xs">
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block">{t("drawers.readability.jargonIndex")}</span>
                          <span className="font-bold text-slate-700 text-xs mt-0.5 block">
                            {t("drawers.readability.concentration", { percent: readabilityResult.jargonDensity })}
                          </span>
                        </div>
                      </div>
    
                      <p className="text-xs md:text-sm text-slate-650 leading-relaxed font-sans font-medium">
                        {readabilityResult.summary}
                      </p>
                    </div>
    
                    <div className="space-y-4">
                      <h3 className="text-xs font-black font-mono text-slate-500 uppercase tracking-widest flex items-center justify-between">
                        <span>{t("drawers.readability.simplificationSuggestions")}</span>
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-sans font-bold border border-amber-100">
                          {t("drawers.readability.available", { count: readabilityResult.suggestions.length })}
                        </span>
                      </h3>
    
                      {readabilityResult.suggestions.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 opacity-60 mb-2" />
                          <p className="font-bold text-xs text-slate-700">{t("drawers.readability.perfectlyReadable")}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{t("drawers.readability.perfectlyReadableHint")}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {readabilityResult.suggestions.map((sug, index) => {
                            const isApplied = appliedSuggestions.has(sug.original);
                            const typeKey = sug.type === 'sentence_structure' ? 'sentence_structure' : 'jargon_reduction';
                            return (
                              <div 
                                key={index} 
                                className={`border rounded-xl transition-all p-4 flex flex-col gap-3 relative ${
                                  isApplied 
                                    ? "bg-slate-50 border-slate-200 opacity-75" 
                                    : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider max-w-[200px] truncate">
                                    {sug.section}
                                  </span>
                                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase border tracking-wider ${
                                    sug.type === 'sentence_structure' 
                                      ? "bg-purple-50 text-violet-700 text-purple-700 border-violet-100" 
                                      : "bg-emerald-50 text-blue-755 text-emerald-700 border-blue-150"
                                  }`}>
                                    {t(`drawers.readability.type.${typeKey}`)}
                                  </span>
                                </div>
    
                                <div className="space-y-2 text-xs font-sans">
                                  <div className="p-2.5 bg-red-50 text-red-800 border-l-2 border-red-400 rounded italic line-through text-[11px] leading-relaxed">
                                    "{sug.original}"
                                  </div>
                                  <div className="p-2.5 bg-emerald-50 text-emerald-900 border-l-2 border-emerald-400 rounded font-medium text-[11px] leading-relaxed">
                                    "{sug.suggested}"
                                  </div>
                                  <p className="text-[10px] text-slate-550 leading-normal font-sans">
                                    <strong className="text-slate-700 font-bold">{t("drawers.readability.auditAdvice")}</strong> {sug.reason}
                                  </p>
                                </div>
    
                                <div className="flex justify-end pt-1">
                                  {isApplied ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                                      <Check className="w-3.5 h-3.5" /> {t("drawers.readability.replacedInstantly")}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => onApplyCorrection(sug)}
                                      className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:bg-emerald-50 font-bold border border-emerald-200 px-3 py-1.5 rounded transition cursor-pointer"
                                    >
                                      {t("drawers.readability.simplifyWording")}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 text-slate-400">
                    <p className="text-sm font-medium">{t("drawers.readability.noAnalysis")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
