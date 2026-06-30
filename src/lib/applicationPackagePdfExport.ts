import type { ApplicationPackage } from "../types";
import {
  buildApplicationSummaryMarkdown,
  buildCompanyResearchMarkdown,
  buildInterviewPrepMarkdown,
  buildMatchReportMarkdown,
} from "./applicationPackageExport";
import { markdownToHtml, renderHtmlSectionsToPdf } from "./pdfHtmlRenderer";
import { formatAtsDateRange, formatAtsInlineList } from "./resumeAtsPdfExport";

function slug(base: string): string {
  return base.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_").slice(0, 60);
}

function buildResumeMarkdown(pkg: ApplicationPackage): string {
  const r = pkg.resumeSnapshot;
  const lines = [
    `# ${r.personalInfo.name || "Resume"}`,
    r.personalInfo.title || "",
    [r.personalInfo.email, r.personalInfo.phone, r.personalInfo.location].filter(Boolean).join(" | "),
    "",
    "## Professional Summary",
    r.summary || "",
    "",
    "## Skills",
    r.skills.join(", "),
    "",
    "## Experience",
  ];

  for (const exp of r.experience) {
    lines.push(`### ${exp.role} - ${exp.company}`);
    lines.push(formatAtsDateRange(exp.startDate, exp.endDate));
    for (const b of exp.bullets) lines.push(`- ${b}`);
    lines.push("");
  }

  if (pkg.coverLetter) {
    lines.push("## Cover Letter", pkg.coverLetter.fullText);
  }

  return lines.join("\n");
}

/** Export a single merged PDF (CJK-safe via html2canvas + system fonts). */
export async function downloadApplicationPackagePdf(pkg: ApplicationPackage): Promise<void> {
  const sections: string[] = [
    markdownToHtml(
      `# Application Package\n${formatAtsInlineList([pkg.companyName, pkg.jobTitle])}\nStatus: ${pkg.status}`
    ),
    markdownToHtml(buildResumeMarkdown(pkg)),
  ];

  if (pkg.matchAnalysis) {
    sections.push(markdownToHtml(buildMatchReportMarkdown(pkg)));
  }
  if (pkg.interviewPrep) {
    sections.push(markdownToHtml(buildInterviewPrepMarkdown(pkg.interviewPrep)));
  }
  if (pkg.companyResearch) {
    sections.push(markdownToHtml(buildCompanyResearchMarkdown(pkg.companyResearch)));
  }
  sections.push(markdownToHtml(buildApplicationSummaryMarkdown(pkg)));

  await renderHtmlSectionsToPdf(
    sections,
    `${slug(`${pkg.companyName}_${pkg.jobTitle}`)}_Application_Package.pdf`
  );
}

export { slug as applicationPackageSlug };
