import React from "react";
import { Award, Plus, Trash2, CheckCircle } from "lucide-react";
import { SkillConsistencyResult, ResumeData } from "../../types";
import { useI18n } from "../../i18n";

export interface SkillConsistencyDrawerProps {
  open: boolean;
  onClose: () => void;
  skillConsistencyResult: SkillConsistencyResult | null;
  resumeData: ResumeData;
  onAddSuggestedSkill: (skill: string) => void;
  onRemoveFlaggedSkill: (skill: string) => void;
}

export default function SkillConsistencyDrawer({
  open,
  onClose,
  skillConsistencyResult,
  resumeData,
  onAddSuggestedSkill,
  onRemoveFlaggedSkill
}: SkillConsistencyDrawerProps) {
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
                  <Award className="w-5 h-5 text-emerald-400 animate-pulse text-emerald-400" />
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">{t("drawers.skill.title")}</h2>
                    <p className="text-xs text-slate-400">{t("drawers.skill.subtitle")}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onClose()}
                  className="p-1 px-2.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-xs font-bold"
                >
                  ✕ {t("drawers.close")}
                </button>
              </div>
    
              <div className="flex-1 p-6 space-y-6">
                {skillConsistencyResult ? (
                  <>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">{t("drawers.skill.consistencyIndex")}</span>
                        <span className={`text-2xl font-black font-sans px-3 py-1 rounded-xl border ${
                          skillConsistencyResult.consistencyScore >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          skillConsistencyResult.consistencyScore >= 60 ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {skillConsistencyResult.consistencyScore}/100
                        </span>
                      </div>
    
                      <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-550 ${
                            skillConsistencyResult.consistencyScore >= 80 ? "bg-emerald-500" :
                            skillConsistencyResult.consistencyScore >= 60 ? "bg-amber-500" :
                            "bg-red-500"
                          }`}
                          style={{ width: `${skillConsistencyResult.consistencyScore}%` }}
                        />
                      </div>
    
                      <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
                        <span>{t("drawers.skill.auditedRole")}</span>
                        <strong className="text-slate-850 font-bold bg-slate-200/60 px-2 py-0.5 rounded">"{skillConsistencyResult.jobTitleAnalyzed}"</strong>
                      </div>
    
                      <p className="text-xs md:text-sm text-slate-655 leading-relaxed font-sans font-medium bg-white/60 p-3 rounded-lg border border-slate-150">
                        {skillConsistencyResult.summary}
                      </p>
                    </div>
    
                    {skillConsistencyResult.missingCrucialSkills.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-widest">
                          💡 {t("drawers.skill.expectedGaps")}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {skillConsistencyResult.missingCrucialSkills.map((skill, idx) => (
                            <button
                              key={idx}
                              onClick={() => onAddSuggestedSkill(skill)}
                              className="group inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 px-3 py-1.5 rounded-full transition-all duration-200 shadow-xs cursor-pointer"
                              title={t("drawers.skill.addSkillTitle", { skill })}
                            >
                              <Plus className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white group-hover:scale-110 transition-transform" />
                              <span className="font-semibold">{skill}</span>
                              <span className="text-[9px] opacity-70 font-mono font-medium hidden sm:inline ml-0.5">{t("drawers.skill.addToSkills")}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
    
                    {skillConsistencyResult.redundantOrMismatchedSkills.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-widest">
                          🗑️ {t("drawers.skill.suggestedPruning")}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {skillConsistencyResult.redundantOrMismatchedSkills.map((skill, idx) => (
                            <button
                              key={idx}
                              onClick={() => onRemoveFlaggedSkill(skill)}
                              className="group inline-flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-150 hover:bg-rose-600 hover:text-white hover:border-rose-605 px-3 py-1.5 rounded-full transition-all duration-200 shadow-xs cursor-pointer"
                              title={t("drawers.skill.pruneTitle", { skill })}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:text-white group-hover:scale-110 transition-transform" />
                              <span className="font-semibold">{skill}</span>
                              <span className="text-[9px] opacity-70 font-mono font-medium hidden sm:inline ml-0.5">{t("drawers.skill.prune")}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
    
                    <div className="space-y-4">
                      <h3 className="text-xs font-black font-mono text-slate-500 uppercase tracking-widest flex items-center justify-between border-b pb-2">
                        <span>{t("drawers.skill.sectorFeedback")}</span>
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-sans font-bold border border-emerald-100">
                          {t("drawers.skill.elementsFlagged", { count: skillConsistencyResult.issues.length })}
                        </span>
                      </h3>
    
                      {skillConsistencyResult.issues.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 opacity-60 mb-2" />
                          <p className="font-bold text-xs text-slate-700">{t("drawers.skill.flawlessTitle")}</p>
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{t("drawers.skill.flawlessHint")}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {skillConsistencyResult.issues.map((issue, index) => (
                            <div 
                              key={index} 
                              className="border rounded-xl p-4 flex flex-col gap-3 relative bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full max-w-[200px] truncate uppercase tracking-wider">
                                  {t("drawers.skill.skillLabel", { skill: issue.skill })}
                                </span>
                                <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase border tracking-wider ${
                                  issue.severity === 'critical' 
                                    ? "bg-red-50 text-red-700 border-red-150" 
                                    : issue.severity === 'warning'
                                    ? "bg-amber-50 text-amber-700 border-amber-150"
                                    : "bg-emerald-50 text-emerald-700 border-blue-150"
                                }`}>
                                  {t(`drawers.skill.severity.${issue.severity}`)}
                                </span>
                              </div>
    
                              <div className="space-y-2 text-xs font-sans">
                                <p className="text-[11px] text-slate-650 leading-relaxed font-sans font-semibold">
                                  {issue.message}
                                </p>
                              </div>
    
                              <div className="flex gap-2 justify-end pt-1">
                                {resumeData.skills.includes(issue.skill) ? (
                                  <button
                                    onClick={() => onRemoveFlaggedSkill(issue.skill)}
                                    className="text-[10px] text-rose-700 hover:bg-rose-50 font-bold border border-rose-200 px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3" /> {t("drawers.skill.removeSkill")}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => onAddSuggestedSkill(issue.skill)}
                                    className="text-[10px] text-emerald-700 hover:bg-emerald-50 font-bold border border-emerald-200 px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1"
                                  >
                                    <Plus className="w-3" /> {t("drawers.skill.addSkill")}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 text-slate-400">
                    <p className="text-sm font-medium">{t("drawers.skill.noAnalysis")}</p>
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
