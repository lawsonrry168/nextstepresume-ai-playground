import type { ApplicationPackage, ResumeData, TemplateStyle } from "../types";
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
  const companyName = input.companyName.trim() || "待確認公司";
  const jobTitle = input.jobTitle.trim() || "待確認職缺";
  const sourceNote = input.sourceUrl ? `來源：${input.sourceUrl}` : undefined;

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
      createApplicationEvent(
        "created",
        "從職缺匯入建立草稿",
        `${companyName} · ${jobTitle}${sourceNote ? ` · ${sourceNote}` : ""}`
      ),
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
