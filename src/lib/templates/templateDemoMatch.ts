import type { AppLocale } from "../../i18n/types";
import type { ResumeData } from "../../types";
import { LEGACY_DEFAULT_RESUMES } from "../../data";
import type { TemplateStyle } from "../resumeTemplateCatalog";
import { getTemplateDemoResume } from "./templateDemoContent";

export function resumeDataEquals(a: ResumeData, b: ResumeData): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** True when resume still matches the built-in demo for this template (any UI language). */
export function isTemplateDemoResume(resume: ResumeData, style: TemplateStyle): boolean {
  return (
    resumeDataEquals(resume, getTemplateDemoResume(style, "en")) ||
    resumeDataEquals(resume, getTemplateDemoResume(style, "zh"))
  );
}

/** True for older single-page Alex Chan / Morgan Keats placeholders still in localStorage. */
export function isLegacyDefaultResume(resume: ResumeData): boolean {
  return LEGACY_DEFAULT_RESUMES.some((legacy) => resumeDataEquals(resume, legacy));
}

/** True when localStorage still holds a pre-trim two-page demo (4 jobs, old certs, etc.). */
export function isStaleTemplateDemoResume(resume: ResumeData): boolean {
  if (
    resume.experience.some(
      (entry) =>
        entry.id === "exp-4" ||
        /Victoria Tech Internship|維港科技實習/i.test(entry.company),
    )
  ) {
    return true;
  }

  const name = resume.personalInfo.name.trim();
  if (name === "Alex Chan" || name === "陳俊樂") {
    if ((resume.certifications?.length ?? 0) >= 4) return true;
    if ((resume.projects?.length ?? 0) >= 3 && resume.experience.length >= 4) return true;
  }

  return false;
}

/**
 * Whether workspace content should reload the template demo for the active UI locale.
 * Covers full two-page demos and legacy compact defaults — not user-edited resumes.
 */
export function shouldSyncTemplateDemoToLocale(
  resume: ResumeData,
  style: TemplateStyle,
  locale: AppLocale,
): boolean {
  const expected = getTemplateDemoResume(style, locale);
  if (resumeDataEquals(resume, expected)) return false;

  if (isTemplateDemoResume(resume, style)) return true;
  if (isLegacyDefaultResume(resume)) return true;
  if (isStaleTemplateDemoResume(resume)) return true;

  return false;
}

/** If resume is syncable default content, return the template demo in the requested UI locale. */
export function templateDemoResumeForLocale(
  resume: ResumeData,
  style: TemplateStyle,
  locale: AppLocale,
): ResumeData | null {
  if (!shouldSyncTemplateDemoToLocale(resume, style, locale)) return null;
  return getTemplateDemoResume(style, locale);
}
