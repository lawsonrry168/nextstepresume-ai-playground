import type {
  ApplicationPackage,
  CompanyResearchResult,
  InterviewPrepResult,
} from "../types";
import { downloadCoverLetterDocx } from "./coverLetterDocxExport";
import { downloadResumeDocx } from "./resumeDocxExport";

function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadJsonFile(data: unknown, filename: string): void {
  downloadTextFile(JSON.stringify(data, null, 2), filename);
}

function slug(base: string): string {
  return base.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_").slice(0, 60);
}

export function buildMatchReportMarkdown(pkg: ApplicationPackage): string {
  const m = pkg.matchAnalysis;
  if (!m) return `# Match Report\n\nNo match analysis available.\n`;
  const lines = [
    `# Match Report — ${pkg.companyName}`,
    ``,
    `**Role:** ${pkg.jobTitle}`,
    `**Overall Score:** ${m.overallScore}%`,
    ``,
    `## Summary`,
    m.summary,
    ``,
    `## Matched Strengths`,
    ...m.matchedStrengths.map((s) => `- ${s}`),
    ``,
    `## Gaps`,
    ...m.gaps.map((g) => `- **${g.area}** (${g.severity}): ${g.description}\n  - Recommendation: ${g.recommendation}`),
    ``,
    `## Missing Keywords`,
    m.missingKeywords.join(", ") || "None",
    ``,
    `## Action Plan`,
    ...m.actionPlan.map((step, i) => `${i + 1}. ${step}`),
  ];
  return lines.join("\n");
}

export function buildInterviewPrepMarkdown(prep: InterviewPrepResult): string {
  const lines = [
    `# Interview Prep — ${prep.companyName}`,
    ``,
    `**Role:** ${prep.jobTitle}`,
    ``,
    `## Focus Areas`,
    ...prep.focusAreas.map((f) => `- ${f}`),
    ``,
  ];
  for (const cat of prep.categories) {
    lines.push(`## ${cat.label}`, ``);
    for (const q of cat.questions) {
      lines.push(`### ${q.question}`, `**Tips:** ${q.tips}`, `**Outline:** ${q.sampleAnswerOutline}`, ``);
    }
  }
  lines.push(`## Checklist`, ...prep.preparationChecklist.map((c) => `- [ ] ${c}`));
  return lines.join("\n");
}

export function buildCompanyResearchMarkdown(research: CompanyResearchResult): string {
  return [
    `# Company Research — ${research.companyName}`,
    ``,
    `## Overview`,
    research.overview,
    ``,
    `## Mission`,
    research.mission,
    ``,
    `## Products / Services`,
    ...research.products.map((p) => `- ${p}`),
    ``,
    `## Culture Signals`,
    ...research.culture.map((c) => `- ${c}`),
    ``,
    `## Recent Themes`,
    ...research.recentNews.map((n) => `- ${n}`),
    ``,
    `## Interview Tips`,
    ...research.interviewTips.map((t) => `- ${t}`),
    ``,
    `## Talking Points`,
    ...research.talkingPoints.map((t) => `- ${t}`),
  ].join("\n");
}

export function buildApplicationSummaryMarkdown(pkg: ApplicationPackage): string {
  const ats = pkg.tailorAnalysis?.atsScore;
  const match = pkg.matchAnalysis?.overallScore;
  return [
    `# Application Package — ${pkg.companyName}`,
    ``,
    `- **Role:** ${pkg.jobTitle}`,
    `- **Status:** ${pkg.status}`,
    `- **ATS Score:** ${ats ?? "N/A"}%`,
    `- **Match Score:** ${match ?? "N/A"}%`,
    `- **Created:** ${new Date(pkg.createdAt).toLocaleString()}`,
    pkg.appliedAt ? `- **Applied:** ${new Date(pkg.appliedAt).toLocaleString()}` : "",
    pkg.interviewDate ? `- **Interview:** ${new Date(pkg.interviewDate).toLocaleString()}` : "",
    pkg.followUpDate ? `- **Follow-up:** ${new Date(pkg.followUpDate).toLocaleDateString()}` : "",
    pkg.notes ? `\n## Notes\n${pkg.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Stagger downloads to avoid browser blocking multiple files. */
export async function exportFullApplicationPackage(pkg: ApplicationPackage): Promise<void> {
  const base = slug(`${pkg.companyName}_${pkg.jobTitle}`);

  downloadResumeDocx(pkg.resumeSnapshot, base);
  await delay(300);

  if (pkg.coverLetter) {
    downloadCoverLetterDocx(pkg.coverLetter, `${base}_cover_letter`);
    await delay(300);
  }

  downloadTextFile(buildApplicationSummaryMarkdown(pkg), `${base}_summary.md`);
  await delay(200);

  if (pkg.matchAnalysis) {
    downloadTextFile(buildMatchReportMarkdown(pkg), `${base}_match_report.md`);
    await delay(200);
  }

  if (pkg.interviewPrep) {
    downloadTextFile(buildInterviewPrepMarkdown(pkg.interviewPrep), `${base}_interview_prep.md`);
    await delay(200);
  }

  if (pkg.companyResearch) {
    downloadTextFile(buildCompanyResearchMarkdown(pkg.companyResearch), `${base}_company_research.md`);
    await delay(200);
  }

  downloadJsonFile(
    {
      id: pkg.id,
      companyName: pkg.companyName,
      jobTitle: pkg.jobTitle,
      status: pkg.status,
      tailorAnalysis: pkg.tailorAnalysis,
      matchAnalysis: pkg.matchAnalysis,
      timeline: pkg.timeline,
    },
    `${base}_package.json`
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function exportCoverLetterOnly(pkg: ApplicationPackage): void {
  if (!pkg.coverLetter) return;
  downloadCoverLetterDocx(pkg.coverLetter, slug(`${pkg.companyName}_cover_letter`));
}

export function exportResumeOnly(pkg: ApplicationPackage): void {
  downloadResumeDocx(pkg.resumeSnapshot, slug(`${pkg.companyName}_resume`));
}
