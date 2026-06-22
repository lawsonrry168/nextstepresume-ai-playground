import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import {
  ResumeData,
  AnalysisResult,
  AIMatchAnalysisResult,
  GrammarToneResult,
  GrammarSuggestion,
  ReadabilityComplexityResult,
  ReadabilitySuggestion,
  SkillConsistencyResult,
  TailorIntensity,
} from "../types";
import { parseApiJson } from "../lib/apiResponse";
import type { PlaygroundTab } from "../components/playground/PlaygroundTabNav";
import { t } from "../i18n/translate";
import {
  localizeAnalysisResult,
  localizeGrammarResult,
  localizeMatchAnalysis,
  localizeReadabilityResult,
  localizeSkillConsistencyResult,
} from "../lib/localizeSimulation";
import { useSubscription } from "../context/SubscriptionProvider";
import { AI_CREDIT_COSTS } from "../lib/subscription/creditCosts";
import type { AiCreditAction } from "../lib/subscription/types";
import type { FeatureId } from "../lib/subscription/types";

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

type MeasuredFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type ToastFn = (type: "success" | "error" | "warning" | "info", message: string) => void;

function applyTextCorrection(
  resumeData: ResumeData,
  original: string,
  suggested: string
): ResumeData {
  let updatedSummary = resumeData.summary;
  if (updatedSummary.includes(original)) {
    updatedSummary = updatedSummary.replace(original, suggested);
  }

  const updatedExperience = resumeData.experience.map((exp) => ({
    ...exp,
    bullets: exp.bullets.map((b) =>
      b === original || b.includes(original) ? suggested : b
    ),
  }));

  const updatedProjects = resumeData.projects?.map((p) => {
    let desc = p.description;
    if (desc.includes(original)) desc = desc.replace(original, suggested);
    return { ...p, description: desc };
  });

  const updatedCertifications = resumeData.certifications?.map((c) =>
    c === original || c.includes(original) ? suggested : c
  );

  const updatedVolunteerWork = resumeData.volunteerWork?.map((v) =>
    v === original || v.includes(original) ? suggested : v
  );

  return {
    ...resumeData,
    summary: updatedSummary,
    experience: updatedExperience,
    projects: updatedProjects ?? resumeData.projects,
    certifications: updatedCertifications,
    volunteerWork: updatedVolunteerWork,
  };
}

export interface UsePlaygroundAuditsOptions {
  resumeData: ResumeData;
  setResumeData: Dispatch<SetStateAction<ResumeData>>;
  jobDescription: string;
  measuredFetch: MeasuredFetch;
  onNotifyServerStatus: (reachable: boolean) => void;
  pushToast: ToastFn;
  aiAvailable: boolean;
  tailorIntensity: TailorIntensity;
  setActiveTab: (tab: PlaygroundTab) => void;
  setHighlightChanges: (value: boolean | ((prev: boolean) => boolean)) => void;
}

export function usePlaygroundAudits({
  resumeData,
  setResumeData,
  jobDescription,
  measuredFetch,
  onNotifyServerStatus,
  pushToast,
  aiAvailable,
  tailorIntensity,
  setActiveTab,
  setHighlightChanges,
}: UsePlaygroundAuditsOptions) {
  const subscription = useSubscription();

  const ensureAiAccess = useCallback(
    (action: AiCreditAction, feature?: FeatureId): boolean => {
      if (feature && !subscription.canUseFeature(feature)) {
        subscription.openUpgrade(feature);
        return false;
      }
      const cost = AI_CREDIT_COSTS[action];
      if (!subscription.canConsume("aiCredits", cost)) {
        subscription.openUpgrade("aiCredits");
        return false;
      }
      return true;
    },
    [subscription],
  );

  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [tailorError, setTailorError] = useState<string | null>(null);
  const [lastAnalysisSimulated, setLastAnalysisSimulated] = useState(false);

  const [matchAnalysisResult, setMatchAnalysisResult] = useState<AIMatchAnalysisResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  const [grammarChecking, setGrammarChecking] = useState(false);
  const [grammarResult, setGrammarResult] = useState<GrammarToneResult | null>(null);
  const [grammarDrawerOpen, setGrammarDrawerOpen] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const [readabilityChecking, setReadabilityChecking] = useState(false);
  const [readabilityResult, setReadabilityResult] = useState<ReadabilityComplexityResult | null>(null);
  const [readabilityDrawerOpen, setReadabilityDrawerOpen] = useState(false);

  const [skillConsistencyChecking, setSkillConsistencyChecking] = useState(false);
  const [skillConsistencyResult, setSkillConsistencyResult] = useState<SkillConsistencyResult | null>(null);
  const [skillConsistencyDrawerOpen, setSkillConsistencyDrawerOpen] = useState(false);

  const [premiumGrammarText, setPremiumGrammarText] = useState("");
  const [premiumGrammarChecking, setPremiumGrammarChecking] = useState(false);
  const [premiumGrammarResult, setPremiumGrammarResult] = useState<PremiumGrammarResult | null>(null);

  const runGrammarToneCheck = useCallback(async () => {
    if (!ensureAiAccess("auditBundle", "ai.auditBundle")) return;
    setGrammarChecking(true);
    try {
      const response = await measuredFetch("/api/grammar-tone-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData }),
      });
      const { data, usedFallback } = await parseApiJson<GrammarToneResult>(response);
      onNotifyServerStatus(true);
      if (usedFallback) pushToast("warning", t("toast.audits.grammarSimulation"));
      setGrammarResult(usedFallback ? localizeGrammarResult(data) : data);
      setAppliedSuggestions(new Set());
      setGrammarDrawerOpen(true);
    } catch (e) {
      console.error(e);
      onNotifyServerStatus(false);
      pushToast("error", t("toast.audits.grammarCheckFailed"));
    } finally {
      setGrammarChecking(false);
    }
  }, [ensureAiAccess, measuredFetch, onNotifyServerStatus, pushToast, resumeData, subscription]);

  const runPremiumGrammarCheck = useCallback(
    async (textToCheck?: string) => {
      const text = textToCheck || premiumGrammarText || resumeData.summary || "";
      if (!text.trim()) return;
      if (!ensureAiAccess("auditBundle", "ai.auditBundle")) return;
      setPremiumGrammarChecking(true);
      try {
        const response = await measuredFetch("/api/grammar-tone-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeData: text }),
        });
        const { data, usedFallback } = await parseApiJson<GrammarToneResult>(response);
        onNotifyServerStatus(true);
        if (usedFallback) pushToast("warning", t("toast.audits.premiumGrammarSimulation"));
        setPremiumGrammarResult({
          score: data.score || 85,
          summary: data.summary || "Grammar check successfully executed.",
          suggestions: data.suggestions || [],
        });
      } catch (err) {
        console.error(err);
        onNotifyServerStatus(false);
        setPremiumGrammarResult({
          score: 75,
          summary: "無法與 AI 語法模型建立連線，已為您載入離線語法修復建議：",
          suggestions: [
            {
              original: "Currently leading front-end architecture development",
              suggested: "Leading front-end system design and core architecture",
              explanation:
                "將副詞開頭的 passive 贅字 'Currently' 捨棄，可加強 ATS 識別權重並顯得更具領導權威性。",
              severity: "low",
            },
            {
              original: "focusing on WebGL optimization, CSS grids",
              suggested: "architecting high-performance WebGL modules and responsive CSS Grid structures",
              explanation:
                "使用更生動的、以行動為導向的動詞（如 'architecting' 代替 'focusing on'）能顯著增加技術履歷的通過機率。",
              severity: "medium",
            },
            {
              original: "cross-team collaborations",
              suggested: "orchestrating cross-functional team collaborations",
              explanation:
                "此改寫能完美傳達現代敏捷開發（Agile Methodologies）中的當責與領導魅力。",
              severity: "low",
            },
          ],
        });
      } finally {
        setPremiumGrammarChecking(false);
      }
    },
    [ensureAiAccess, measuredFetch, onNotifyServerStatus, premiumGrammarText, pushToast, resumeData.summary, subscription]
  );

  const runReadabilityComplexityCheck = useCallback(async () => {
    if (!ensureAiAccess("auditBundle", "ai.auditBundle")) return;
    setReadabilityChecking(true);
    try {
      const response = await measuredFetch("/api/readability-complexity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData }),
      });
      const { data, usedFallback } = await parseApiJson<ReadabilityComplexityResult>(response);
      onNotifyServerStatus(true);
      if (usedFallback) pushToast("warning", t("toast.audits.readabilitySimulation"));
      setReadabilityResult(usedFallback ? localizeReadabilityResult(data) : data);
      setAppliedSuggestions(new Set());
      setReadabilityDrawerOpen(true);
    } catch (e) {
      console.error(e);
      onNotifyServerStatus(false);
      pushToast("error", t("toast.audits.readabilityCheckFailed"));
    } finally {
      setReadabilityChecking(false);
    }
  }, [ensureAiAccess, measuredFetch, onNotifyServerStatus, pushToast, resumeData, subscription]);

  const runSkillConsistencyCheck = useCallback(async () => {
    if (!ensureAiAccess("auditBundle", "ai.auditBundle")) return;
    setSkillConsistencyChecking(true);
    try {
      const response = await measuredFetch("/api/skill-job-consistency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, jobDescription }),
      });
      const { data, usedFallback } = await parseApiJson<SkillConsistencyResult>(response);
      onNotifyServerStatus(true);
      if (usedFallback) pushToast("warning", t("toast.audits.skillConsistencySimulation"));
      setSkillConsistencyResult(usedFallback ? localizeSkillConsistencyResult(data) : data);
      setSkillConsistencyDrawerOpen(true);
    } catch (e) {
      console.error(e);
      onNotifyServerStatus(false);
      pushToast("error", t("toast.audits.skillConsistencyCheckFailed"));
    } finally {
      setSkillConsistencyChecking(false);
    }
  }, [ensureAiAccess, jobDescription, measuredFetch, onNotifyServerStatus, pushToast, resumeData, subscription]);

  const applySuggestedCorrection = useCallback(
    (sug: GrammarSuggestion) => {
      setResumeData((prev) => applyTextCorrection(prev, sug.original, sug.suggested));
      setAppliedSuggestions((prev) => {
        const next = new Set(prev);
        next.add(sug.original);
        return next;
      });
    },
    [setResumeData]
  );

  const applyReadabilityCorrection = useCallback(
    (sug: ReadabilitySuggestion) => {
      setResumeData((prev) => applyTextCorrection(prev, sug.original, sug.suggested));
      setAppliedSuggestions((prev) => {
        const next = new Set(prev);
        next.add(sug.original);
        return next;
      });
    },
    [setResumeData]
  );

  const handleAddSuggestedSkill = useCallback(
    (newSkill: string) => {
      if (!resumeData.skills.includes(newSkill)) {
        setResumeData((prev) => ({
          ...prev,
          skills: [...prev.skills, newSkill],
        }));
      }
      setSkillConsistencyResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          missingCrucialSkills: prev.missingCrucialSkills.filter((s) => s !== newSkill),
          issues: prev.issues.filter((issue) => issue.skill !== newSkill),
        };
      });
    },
    [resumeData.skills, setResumeData]
  );

  const handleRemoveFlaggedSkill = useCallback(
    (oldSkill: string) => {
      setResumeData((prev) => ({
        ...prev,
        skills: prev.skills.filter((s) => s !== oldSkill),
      }));
      setSkillConsistencyResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          redundantOrMismatchedSkills: prev.redundantOrMismatchedSkills.filter((s) => s !== oldSkill),
          issues: prev.issues.filter((issue) => issue.skill !== oldSkill),
        };
      });
    },
    [setResumeData]
  );

  const triggerAITailor = useCallback(async () => {
    if (!ensureAiAccess("tailor", "ai.tailor")) return;
    setLoading(true);
    setTailorError(null);
    try {
      const response = await measuredFetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData,
          jobDescription,
          intensity: tailorIntensity,
        }),
      });
      const { data, usedFallback } = await parseApiJson<AnalysisResult>(response);
      setAnalysisResult(usedFallback ? localizeAnalysisResult(data) : data);
      setLastAnalysisSimulated(usedFallback || !aiAvailable);
      onNotifyServerStatus(true);
      if (usedFallback || !aiAvailable) {
        pushToast("warning", t("toast.audits.atsAnalysisSimulation"));
      } else {
        pushToast("success", t("toast.audits.atsAnalysisComplete"));
      }
      setActiveTab("tailor");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("toast.audits.atsAnalysisFailed");
      console.error("API error during tailoring analysis:", err);
      setTailorError(message);
      onNotifyServerStatus(false);
      pushToast("error", message || t("toast.audits.atsAnalysisFailed"));
    } finally {
      setLoading(false);
    }
  }, [
    aiAvailable,
    ensureAiAccess,
    jobDescription,
    measuredFetch,
    onNotifyServerStatus,
    pushToast,
    resumeData,
    setActiveTab,
    subscription,
    tailorIntensity,
  ]);

  const triggerAIMatchAnalysis = useCallback(async () => {
    if (!ensureAiAccess("match", "ai.match")) return;
    setMatchLoading(true);
    setMatchError(null);
    try {
      const response = await measuredFetch("/api/match-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, jobDescription }),
      });
      const { data, usedFallback } = await parseApiJson<AIMatchAnalysisResult>(response);
      setMatchAnalysisResult(usedFallback ? localizeMatchAnalysis(data) : data);
      onNotifyServerStatus(true);
      if (usedFallback) pushToast("warning", t("toast.audits.matchAnalysisSimulation"));
      else {
        pushToast("success", t("toast.audits.matchAnalysisComplete"));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("toast.audits.matchAnalysisFailed");
      console.error("API error during AI Match Analysis:", err);
      setMatchError(message);
      onNotifyServerStatus(false);
      pushToast("error", message || t("toast.audits.matchAnalysisFailed"));
    } finally {
      setMatchLoading(false);
    }
  }, [ensureAiAccess, jobDescription, measuredFetch, onNotifyServerStatus, pushToast, resumeData, subscription]);

  const handleApplyTailoredItem = useCallback(() => {
    if (!analysisResult) return;
    const updatedExperiences = resumeData.experience.map((exp) => {
      const match = analysisResult.tailoredBulletPoints.find((tb) => tb.experienceId === exp.id);
      if (match?.optimizedBullets?.length) {
        return { ...exp, bullets: match.optimizedBullets };
      }
      return exp;
    });

    setResumeData({
      ...resumeData,
      summary: analysisResult.tailoredSummary || resumeData.summary,
      experience: updatedExperiences,
    });
    setHighlightChanges(false);
  }, [analysisResult, resumeData, setHighlightChanges, setResumeData]);

  return {
    loading,
    analysisResult,
    tailorError,
    lastAnalysisSimulated,
    triggerAITailor,
    matchAnalysisResult,
    matchLoading,
    matchError,
    triggerAIMatchAnalysis,
    grammarChecking,
    grammarResult,
    grammarDrawerOpen,
    setGrammarDrawerOpen,
    appliedSuggestions,
    runGrammarToneCheck,
    applySuggestedCorrection,
    readabilityChecking,
    readabilityResult,
    readabilityDrawerOpen,
    setReadabilityDrawerOpen,
    runReadabilityComplexityCheck,
    applyReadabilityCorrection,
    skillConsistencyChecking,
    skillConsistencyResult,
    skillConsistencyDrawerOpen,
    setSkillConsistencyDrawerOpen,
    runSkillConsistencyCheck,
    handleAddSuggestedSkill,
    handleRemoveFlaggedSkill,
    premiumGrammarText,
    setPremiumGrammarText,
    premiumGrammarChecking,
    premiumGrammarResult,
    runPremiumGrammarCheck,
    handleApplyTailoredItem,
    setAnalysisResult,
    setMatchAnalysisResult,
  };
}
