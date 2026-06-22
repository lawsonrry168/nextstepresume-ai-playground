import React from "react";
import { Sparkles, Check } from "lucide-react";
import { GrammarToneResult, GrammarSuggestion } from "../../types";
import { useI18n } from "../../i18n";

export interface GrammarToneDrawerProps {
  open: boolean;
  onClose: () => void;
  grammarResult: GrammarToneResult | null;
  appliedSuggestions: Set<string>;
  onApplySuggestion: (suggestion: GrammarSuggestion) => void;
}

export default function GrammarToneDrawer({
  open,
  onClose,
  grammarResult,
  appliedSuggestions,
  onApplySuggestion
}: GrammarToneDrawerProps) {
  const { t } = useI18n();

  if (!open) return null;

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
                  <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">{t("drawers.grammar.title")}</h2>
                    <p className="text-xs text-slate-400">{t("drawers.grammar.subtitle")}</p>
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
                {grammarResult ? (
                  <>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">{t("drawers.grammar.scoreLabel")}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-black font-sans px-3 py-1 rounded-xl ${
                            grammarResult.score >= 90 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            grammarResult.score >= 80 ? "bg-emerald-50 text-emerald-700 border border-blue-200" :
                            "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {grammarResult.score}/100
                          </span>
                        </div>
                      </div>
                      
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            grammarResult.score >= 90 ? "bg-emerald-500" :
                            grammarResult.score >= 80 ? "bg-emerald-500" :
                            "bg-amber-500"
                          }`}
                          style={{ width: `${grammarResult.score}%` }}
                        />
                      </div>
    
                      <p className="text-xs md:text-sm text-slate-650 leading-relaxed font-sans">
                        {grammarResult.summary}
                      </p>
                    </div>
    
                    <div className="space-y-4">
                      <h3 className="text-xs font-black font-mono text-slate-500 uppercase tracking-widest flex items-center justify-between">
                        <span>{t("drawers.grammar.suggestedCorrections")}</span>
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-sans font-bold">
                          {t("drawers.grammar.suggestionsCount", { count: grammarResult.suggestions.length })}
                        </span>
                      </h3>
    
                      {grammarResult.suggestions.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <Check className="w-10 h-10 mx-auto text-emerald-500 opacity-60 mb-2" />
                          <p className="font-semibold text-xs">{t("drawers.grammar.pristineTitle")}</p>
                          <p className="text-[10px]">{t("drawers.grammar.pristineHint")}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {grammarResult.suggestions.map((sug, index) => {
                            const isApplied = appliedSuggestions.has(sug.original);
                            return (
                              <div 
                                key={index} 
                                className={`border rounded-xl transition-all p-4 flex flex-col gap-3 relative ${
                                  isApplied 
                                    ? "bg-slate-50 border-slate-200 opacity-75" 
                                    : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider max-w-[200px] truncate">
                                    {sug.section}
                                  </span>
                                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    sug.severity === 'high' ? "bg-red-50 text-red-600 border border-red-200" :
                                    sug.severity === 'medium' ? "bg-amber-50 text-amber-600 border border-amber-200" :
                                    "bg-emerald-50 text-emerald-600 border border-blue-200"
                                  }`}>
                                    {t(`drawers.grammar.priority.${sug.severity}`)}
                                  </span>
                                </div>
    
                                <div className="space-y-2 text-xs">
                                  <div className="p-2.5 bg-red-50/70 text-red-800 border-l-2 border-red-400 rounded font-sans italic line-through">
                                    "{sug.original}"
                                  </div>
                                  <div className="p-2.5 bg-emerald-50/70 text-emerald-900 border-l-2 border-emerald-400 rounded font-sans font-medium">
                                    "{sug.suggested}"
                                  </div>
                                  <p className="text-[11px] text-slate-600 font-normal leading-relaxed mt-1">
                                    <strong className="text-slate-800">{t("drawers.grammar.whyThisHelps")}</strong> {sug.explanation}
                                  </p>
                                </div>
    
                                <div className="flex justify-end pt-1">
                                  {isApplied ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                                      <Check className="w-3.5 h-3.5" /> {t("drawers.grammar.applied")}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => onApplySuggestion(sug)}
                                      className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:bg-emerald-50 font-bold border border-emerald-200 px-3 py-1.5 rounded transition cursor-pointer"
                                    >
                                      {t("drawers.grammar.applySuggestion")}
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
                    <p className="text-sm">{t("drawers.grammar.noAnalysis")}</p>
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
