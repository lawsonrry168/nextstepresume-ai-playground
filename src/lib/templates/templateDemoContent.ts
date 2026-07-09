import type { AppLocale } from "../../i18n/types";
import type { ResumeData } from "../../types";
import type { TemplateStyle } from "../resumeTemplateCatalog";
import { TEMPLATE_DEFINITION_LIST } from "./tokens";
import { buildTwoPageBaseResume, TEMPLATE_DEMO_SUMMARY_TAIL } from "./templateDemoBaseContent";
import { getTemplateDemoProfile } from "./templateDemoProfiles";
import { resolveTemplateDemoLocale, type TemplateDemoLocale } from "./templateDemoLocale";

function withTemplateProfile(base: ResumeData, style: TemplateStyle, locale: TemplateDemoLocale): ResumeData {
  const profile = getTemplateDemoProfile(style, locale);
  const tail = TEMPLATE_DEMO_SUMMARY_TAIL[locale];
  return {
    ...base,
    personalInfo: {
      ...base.personalInfo,
      title: profile.title,
    },
    summary: `${profile.summaryLead} ${profile.summaryFocus} ${tail}`,
  };
}

function buildDemoRegistry(locale: TemplateDemoLocale): Record<TemplateStyle, ResumeData> {
  const base = buildTwoPageBaseResume(locale);
  return Object.fromEntries(
    TEMPLATE_DEFINITION_LIST.map((def) => [def.id, withTemplateProfile(base, def.id, locale)]),
  ) as Record<TemplateStyle, ResumeData>;
}

/** Pre-built two-page demo resumes per UI language (en / zh). */
export const TEMPLATE_DEMO_RESUMES_EN = buildDemoRegistry("en");
export const TEMPLATE_DEMO_RESUMES_ZH = buildDemoRegistry("zh");

/** @deprecated Use getTemplateDemoResume(style, locale) */
export const TEMPLATE_DEMO_RESUMES = TEMPLATE_DEMO_RESUMES_EN;

export function getTemplateDemoResumesForLocale(locale: TemplateDemoLocale): Record<TemplateStyle, ResumeData> {
  return locale === "zh" ? TEMPLATE_DEMO_RESUMES_ZH : TEMPLATE_DEMO_RESUMES_EN;
}

export function getTemplateDemoResume(
  style: TemplateStyle,
  locale?: AppLocale | TemplateDemoLocale,
): ResumeData {
  const demoLocale = resolveTemplateDemoLocale(locale);
  const registry = getTemplateDemoResumesForLocale(demoLocale);
  const demo = registry[style];
  if (!demo) return structuredClone(registry["modern-01"]);
  return structuredClone(demo);
}

export function getDefaultTemplateDemoResume(locale?: AppLocale | TemplateDemoLocale): ResumeData {
  return getTemplateDemoResume("classic-02", locale);
}
