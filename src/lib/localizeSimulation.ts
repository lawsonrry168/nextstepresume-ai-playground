import type {
  AIMatchAnalysisResult,
  AnalysisResult,
  GrammarToneResult,
  ReadabilityComplexityResult,
  SkillConsistencyResult,
} from "../types";
import { getActiveLocale, t } from "../i18n/translate";
import type { AppLocale } from "../i18n/types";

const ATS_CATEGORY_KEYS: Record<string, string> = {
  "Keyword Alignment": "simulation.ats.categories.keywordAlignment",
  "Experience Impact": "simulation.ats.categories.experienceImpact",
  "Format & ATS Scan": "simulation.ats.categories.formatScan",
  "Skill Relevancy": "simulation.ats.categories.skillRelevancy",
};

const MATCH_STRENGTH_PATTERNS: Array<{ test: RegExp; key: string }> = [
  { test: /^Direct alignment on core technology/i, key: "simulation.match.strengths.techAlignment" },
  { test: /^Possesses cross-functional/i, key: "simulation.match.strengths.crossFunctional" },
  { test: /^Strong career duration/i, key: "simulation.match.strengths.careerDepth" },
  { test: /^Uses high-agency/i, key: "simulation.match.strengths.metrics" },
  { test: /^Direct academic alignment/i, key: "simulation.match.strengths.academic" },
];

const MATCH_GAP_DESC_KEYS: Record<string, string> = {
  coreTech: "simulation.match.gaps.coreTech",
  historyDensity: "simulation.match.gaps.historyDensity",
  metrics: "simulation.match.gaps.metrics",
  academic: "simulation.match.gaps.academic",
  stem: "simulation.match.gaps.stem",
};

const MATCH_ACTION_PLAN_KEYS = [
  "simulation.match.actionPlan.integrateTech",
  "simulation.match.actionPlan.starMetrics",
  "simulation.match.actionPlan.optimizeSummary",
];

function shouldLocalize(locale?: AppLocale): boolean {
  const active = locale ?? getActiveLocale();
  return active === "zh-TW" || active === "zh-HK";
}

function localizeAtsCategories(data: AnalysisResult): AnalysisResult {
  return {
    ...data,
    categories: data.categories.map((cat) => {
      const base = ATS_CATEGORY_KEYS[cat.name];
      if (!base) return cat;
      return {
        ...cat,
        name: t(`${base}.name`),
        feedback: t(`${base}.feedback`),
      };
    }),
    weakPhrases: data.weakPhrases.map((wp, i) => {
      const replacementKey = `simulation.ats.weakPhrases.${i}.replacement`;
      const reasonKey = `simulation.ats.weakPhrases.${i}.reason`;
      const replacement = t(replacementKey);
      const reason = t(reasonKey);
      return {
        ...wp,
        replacement: replacement === replacementKey ? wp.replacement : replacement,
        reason: reason === reasonKey ? wp.reason : reason,
      };
    }),
    tailoredSummary: data.tailoredSummary.startsWith("Premium,")
      ? t("simulation.ats.tailoredSummary")
      : data.tailoredSummary,
  };
}

function gapKeyFromArea(area: string): string | undefined {
  const reverseMap: Record<string, string> = {
    "Core Technologies": "coreTech",
    "Professional History Density": "historyDensity",
    "Performance Metrics & KPIs": "metrics",
    "Academic Credentials": "academic",
    "Formal STEM Alignment": "stem",
  };
  return reverseMap[area];
}

function localizeMatchGaps(data: AIMatchAnalysisResult): AIMatchAnalysisResult {
  return {
    ...data,
    gaps: data.gaps.map((gap) => {
      const gapKey = gapKeyFromArea(gap.area);
      if (!gapKey || !MATCH_GAP_DESC_KEYS[gapKey]) return gap;
      const base = MATCH_GAP_DESC_KEYS[gapKey];
      const terms = gap.description.match(/[A-Z]{2,}(?:,\s*[A-Z]{2,})*/)?.[0] ?? "";
      return {
        ...gap,
        area: t(`${base}.area`),
        description: t(`${base}.description`, { terms }),
        recommendation: t(`${base}.recommendation`, { terms: terms.split(", ").slice(0, 3).join("、") || "TypeScript、Next.js、Docker" }),
      };
    }),
    matchedStrengths: data.matchedStrengths.map((s) => {
      const pattern = MATCH_STRENGTH_PATTERNS.find((p) => p.test.test(s));
      if (!pattern) return s;
      const techMatch = s.match(/including:\s*(.+)$/i);
      if (techMatch) {
        return t(pattern.key, { terms: techMatch[1] });
      }
      const countMatch = s.match(/with (\d+) distinct/);
      if (countMatch) {
        return t(pattern.key, { count: countMatch[1] });
      }
      return t(pattern.key);
    }),
    actionPlan: data.actionPlan.map((_, i) => t(MATCH_ACTION_PLAN_KEYS[i] ?? MATCH_ACTION_PLAN_KEYS[0])),
    summary: t("simulation.match.summary", {
      score: data.overallScore,
      terms: data.missingKeywords.slice(0, 2).join("、") || "產業術語",
    }),
  };
}

function localizeSkillConsistency(data: SkillConsistencyResult): SkillConsistencyResult {
  const level =
    data.consistencyScore >= 80 ? "outstanding" : data.consistencyScore >= 60 ? "moderate" : "deficient";
  return {
    ...data,
    summary: t(`simulation.skill.summary.${level}`, {
      title: data.jobTitleAnalyzed,
      missing: data.missingCrucialSkills.length,
    }),
    issues: data.issues.map((issue) => {
      if (issue.severity === "critical" && issue.message.includes("Missing key tool")) {
        return {
          ...issue,
          message: t("simulation.skill.issues.missingTool", { skill: issue.skill, title: data.jobTitleAnalyzed }),
        };
      }
      if (issue.severity === "warning" && issue.message.includes("too basic")) {
        return {
          ...issue,
          message: t("simulation.skill.issues.basicSkill", { skill: issue.skill, title: data.jobTitleAnalyzed }),
        };
      }
      if (issue.message.includes("Strategic competence")) {
        return {
          ...issue,
          message: t("simulation.skill.issues.strategic", { skill: issue.skill }),
        };
      }
      if (issue.message.includes("soft competencies")) {
        return { ...issue, message: t("simulation.skill.issues.softComp") };
      }
      return issue;
    }),
  };
}

function localizeGrammar(data: GrammarToneResult): GrammarToneResult {
  const nameMatch = data.summary.match(/resume for (.+?) possesses/i);
  const name = nameMatch?.[1] ?? "應徵者";
  return {
    ...data,
    summary: t("simulation.grammar.summary", { name }),
    suggestions: data.suggestions.map((sug, i) => ({
      ...sug,
      section: sug.section.startsWith("Professional Summary")
        ? t("simulation.grammar.sections.summary")
        : sug.section.startsWith("Experience:")
          ? t("simulation.grammar.sections.experience", {
              role: sug.section.replace("Experience: ", ""),
            })
          : sug.section,
      explanation: t(`simulation.grammar.explanations.${Math.min(i, 2)}`),
      suggested:
        i === 0
          ? t("simulation.grammar.suggested.summary")
          : i === 1
            ? t("simulation.grammar.suggested.experience1")
            : t("simulation.grammar.suggested.experience2"),
    })),
  };
}

function localizeReadability(data: ReadabilityComplexityResult): ReadabilityComplexityResult {
  return {
    ...data,
    summary: t("simulation.readability.summary", { avg: data.averageSentenceLength }),
    suggestions: data.suggestions.map((sug, i) => ({
      ...sug,
      section: sug.section.startsWith("Professional Summary")
        ? t("simulation.readability.sections.summary")
        : t("simulation.readability.sections.experience", {
            role: sug.section.replace("Experience: ", ""),
          }),
      reason: t(`simulation.readability.reasons.${Math.min(i, 2)}`),
      suggested:
        i === 0
          ? t("simulation.readability.suggested.summary")
          : i === 1
            ? t("simulation.readability.suggested.experience1")
            : t("simulation.readability.suggested.experience2"),
    })),
  };
}

export function localizeAnalysisResult(
  data: AnalysisResult,
  locale?: AppLocale,
): AnalysisResult {
  if (!shouldLocalize(locale)) return data;
  return localizeAtsCategories(data);
}

export function localizeMatchAnalysis(
  data: AIMatchAnalysisResult,
  locale?: AppLocale,
): AIMatchAnalysisResult {
  if (!shouldLocalize(locale)) return data;
  return localizeMatchGaps(data);
}

export function localizeSkillConsistencyResult(
  data: SkillConsistencyResult,
  locale?: AppLocale,
): SkillConsistencyResult {
  if (!shouldLocalize(locale)) return data;
  return localizeSkillConsistency(data);
}

export function localizeGrammarResult(
  data: GrammarToneResult,
  locale?: AppLocale,
): GrammarToneResult {
  if (!shouldLocalize(locale)) return data;
  return localizeGrammar(data);
}

export function localizeReadabilityResult(
  data: ReadabilityComplexityResult,
  locale?: AppLocale,
): ReadabilityComplexityResult {
  if (!shouldLocalize(locale)) return data;
  return localizeReadability(data);
}
