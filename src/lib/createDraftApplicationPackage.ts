import type { ApplicationPackage, ResumeData, TemplateStyle } from "../types";
import { t } from "../i18n/translate";
import { createApplicationEvent } from "./applicationTimeline";

export interface ImportedJobInput {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  resumeSnapshot: ResumeData;
  templateStyle: TemplateStyle;
  sourceUrl?: string;
}

export function buildDraftApplicationPackage(
  input: ImportedJobInput
): Omit<ApplicationPackage, "id" | "createdAt" | "updatedAt"> {
  const companyName = input.companyName.trim() || t("applicationDraft.companyTbd");
  const jobTitle = input.jobTitle.trim() || t("applicationDraft.jobTbd");
  const sourceNote = input.sourceUrl
    ? t("applicationDraft.sourcePrefix", { url: input.sourceUrl })
    : undefined;

  const detail = sourceNote
    ? t("applicationDraft.createdDetailWithSource", { company: companyName, jobTitle, source: sourceNote })
    : t("applicationDraft.createdDetail", { company: companyName, jobTitle });

  return {
    status: "draft",
    companyName,
    jobTitle,
    jobDescription: input.jobDescription.trim(),
    resumeSnapshot: input.resumeSnapshot,
    templateStyle: input.templateStyle,
    tailorAnalysis: null,
    matchAnalysis: null,
    coverLetter: null,
    interviewPrep: null,
    companyResearch: null,
    notes: sourceNote,
    timeline: [
      createApplicationEvent("created", t("applicationDraft.createdFromImport"), detail),
    ],
  };
}

export function mergeImportedJobMeta(
  headline: string,
  extracted: { jobTitle: string; companyName: string }
): { jobTitle: string; companyName: string } {
  let jobTitle = extracted.jobTitle;
  let companyName = extracted.companyName;

  if (!jobTitle && headline) {
    const parts = headline.split(/\s*[|\-–—]\s*/);
    if (parts.length >= 2) {
      jobTitle = parts[0]?.trim() || jobTitle;
      companyName = companyName || parts[parts.length - 1]?.trim() || "";
    } else {
      jobTitle = headline.trim();
    }
  }

  return { jobTitle, companyName };
}
