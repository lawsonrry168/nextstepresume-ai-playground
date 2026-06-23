import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { estimateSalary } from "../lib/salaryBenchmark";
import type { ResumeData } from "../types";
import type { ContentEditSection } from "./usePlaygroundContentEditor";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export interface UsePlaygroundPremiumMetricsOptions {
  resumeData: ResumeData;
  setResumeData: Dispatch<SetStateAction<ResumeData>>;
  setPremiumGrammarText: (text: string) => void;
  setEditSection: (section: ContentEditSection) => void;
  saveImmediateSnapshot: () => void;
  t: TranslateFn;
}

export function usePlaygroundPremiumMetrics({
  resumeData,
  setResumeData,
  setPremiumGrammarText,
  setEditSection,
  saveImmediateSnapshot,
  t,
}: UsePlaygroundPremiumMetricsOptions) {
  const [salaryInsightsOpen, setSalaryInsightsOpen] = useState(false);
  const [salaryRole, setSalaryRole] = useState("");
  const [salaryExp, setSalaryExp] = useState(4);
  const [heatmapMetric, setHeatmapMetric] = useState<"proficiency" | "demand" | "relevance">("proficiency");
  const [skillsProficiency, setSkillsProficiency] = useState<Record<string, number>>({});
  const [skillsDemand, setSkillsDemand] = useState<Record<string, number>>({});
  const [skillsRelevance, setSkillsRelevance] = useState<Record<string, number>>({});
  const [smartSuggestionsCategory, setSmartSuggestionsCategory] = useState<
    "verbs" | "industry_terms" | "ats_optimized"
  >("verbs");

  useEffect(() => {
    if (resumeData.personalInfo?.title && !salaryRole) {
      setSalaryRole(resumeData.personalInfo.title);
    }

    const prof: Record<string, number> = { ...skillsProficiency };
    const dem: Record<string, number> = { ...skillsDemand };
    const rel: Record<string, number> = { ...skillsRelevance };
    let updated = false;

    resumeData.skills.forEach((skill) => {
      if (prof[skill] === undefined) {
        const hash = skill.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        prof[skill] = (hash % 4) + 6;
        dem[skill] = (hash % 5) + 5;
        rel[skill] = (hash % 3) + 7;
        updated = true;
      }
    });

    if (updated) {
      setSkillsProficiency(prof);
      setSkillsDemand(dem);
      setSkillsRelevance(rel);
    }
  }, [resumeData.personalInfo?.title, resumeData.skills, salaryRole, skillsDemand, skillsProficiency, skillsRelevance]);

  const salaryEstimate = useMemo(
    () => estimateSalary(salaryRole || resumeData.personalInfo?.title || "Software Engineer", salaryExp),
    [salaryRole, salaryExp, resumeData.personalInfo?.title],
  );

  const applySmartSuggestion = useCallback(
    (text: string, type: "summary" | "grammar" | "skill") => {
      saveImmediateSnapshot();
      if (type === "summary") {
        setResumeData((prev) => {
          const currentSummary = prev.summary || "";
          const updated = currentSummary ? `${currentSummary} ${text}` : text;
          return { ...prev, summary: updated };
        });
        alert(t("playgroundUi.appliedSummary"));
      } else if (type === "grammar") {
        setPremiumGrammarText(text);
        setEditSection("summary");
        alert(t("playgroundUi.copiedGrammar"));
      } else if (type === "skill") {
        const cleanSkill = text.replace(/^[•-\s]+/, "").trim();
        setResumeData((prev) => {
          if (prev.skills.some((s) => s.toLowerCase() === cleanSkill.toLowerCase())) return prev;
          return { ...prev, skills: [...prev.skills, cleanSkill] };
        });
        alert(t("playgroundUi.addedSkill", { skill: cleanSkill }));
      }
    },
    [saveImmediateSnapshot, setEditSection, setPremiumGrammarText, setResumeData, t],
  );

  return {
    salaryInsightsOpen,
    setSalaryInsightsOpen,
    salaryRole,
    setSalaryRole,
    salaryExp,
    setSalaryExp,
    heatmapMetric,
    setHeatmapMetric,
    skillsProficiency,
    setSkillsProficiency,
    skillsDemand,
    setSkillsDemand,
    skillsRelevance,
    setSkillsRelevance,
    smartSuggestionsCategory,
    setSmartSuggestionsCategory,
    salaryEstimate,
    applySmartSuggestion,
  };
}
