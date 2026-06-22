import {
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
} from "docx";
import type { ApplicationPackage, CoverLetterResult, ResumeData } from "../types";
import type { TemplateStyle } from "./resumeTemplateCatalog";
import {
  buildStyledResumeParagraphs,
  createStyledResumeDocument,
  getResumeBulletNumbering,
} from "./resumeOoxmlStyledExport";
import {
  buildApplicationSummaryMarkdown,
  buildCompanyResearchMarkdown,
  buildInterviewPrepMarkdown,
  buildMatchReportMarkdown,
} from "./applicationPackageExport";

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function slug(base: string): string {
  return base.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_").slice(0, 60);
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { after: 200 } });
}

function bodyParagraph(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    spacing: { after: 120 },
  });
}

function bulletParagraph(text: string) {
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}`, size: 22 })],
    spacing: { after: 80 },
    indent: { left: 360 },
  });
}

function pageBreakParagraph() {
  return new Paragraph({ children: [new PageBreak()] });
}

function markdownSectionToParagraphs(markdown: string): Paragraph[] {
  const lines = markdown.split("\n");
  const paragraphs: Paragraph[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("# ")) {
      paragraphs.push(heading(trimmed.slice(2), HeadingLevel.HEADING_1));
    } else if (trimmed.startsWith("## ")) {
      paragraphs.push(heading(trimmed.slice(3), HeadingLevel.HEADING_2));
    } else if (trimmed.startsWith("### ")) {
      paragraphs.push(heading(trimmed.slice(4), HeadingLevel.HEADING_3));
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      paragraphs.push(bulletParagraph(trimmed.slice(2)));
    } else if (/^\d+\.\s/.test(trimmed)) {
      paragraphs.push(bodyParagraph(trimmed));
    } else {
      paragraphs.push(bodyParagraph(trimmed));
    }
  }
  return paragraphs;
}

export function buildResumeOoxmlChildren(
  resumeData: ResumeData,
  templateStyle?: TemplateStyle,
): Paragraph[] {
  return buildStyledResumeParagraphs(resumeData, templateStyle);
}

export function buildCoverLetterOoxmlChildren(letter: CoverLetterResult): Paragraph[] {
  return [
    heading("Cover Letter", HeadingLevel.HEADING_1),
    bodyParagraph(letter.salutation),
    bodyParagraph(letter.opening),
    ...letter.bodyParagraphs.map((p) => bodyParagraph(p)),
    bodyParagraph(letter.closing),
    bodyParagraph(letter.signature),
  ];
}

export async function buildApplicationPackageOoxmlBlob(pkg: ApplicationPackage): Promise<Blob> {
  const children: Paragraph[] = [
    heading(`Application Package — ${pkg.companyName}`, HeadingLevel.HEADING_1),
    bodyParagraph(`${pkg.jobTitle} · Status: ${pkg.status}`),
    pageBreakParagraph(),
    heading("Resume", HeadingLevel.HEADING_1),
    ...buildResumeOoxmlChildren(pkg.resumeSnapshot),
  ];

  if (pkg.coverLetter) {
    children.push(pageBreakParagraph(), ...buildCoverLetterOoxmlChildren(pkg.coverLetter));
  }

  if (pkg.matchAnalysis) {
    children.push(
      pageBreakParagraph(),
      ...markdownSectionToParagraphs(buildMatchReportMarkdown(pkg))
    );
  }

  if (pkg.interviewPrep) {
    children.push(
      pageBreakParagraph(),
      ...markdownSectionToParagraphs(buildInterviewPrepMarkdown(pkg.interviewPrep))
    );
  }

  if (pkg.companyResearch) {
    children.push(
      pageBreakParagraph(),
      ...markdownSectionToParagraphs(buildCompanyResearchMarkdown(pkg.companyResearch))
    );
  }

  children.push(
    pageBreakParagraph(),
    ...markdownSectionToParagraphs(buildApplicationSummaryMarkdown(pkg))
  );

  const doc = new Document({
    numbering: getResumeBulletNumbering(),
    sections: [{ children }],
  });

  return Packer.toBlob(doc);
}

export async function buildResumeOoxmlBlob(
  resumeData: ResumeData,
  templateStyle?: TemplateStyle,
): Promise<Blob> {
  const doc = createStyledResumeDocument(resumeData, templateStyle);
  return Packer.toBlob(doc);
}

export async function buildCoverLetterOoxmlBlob(letter: CoverLetterResult): Promise<Blob> {
  const doc = new Document({
    sections: [{ children: buildCoverLetterOoxmlChildren(letter) }],
  });
  return Packer.toBlob(doc);
}

export async function downloadApplicationPackageOoxml(pkg: ApplicationPackage): Promise<void> {
  const blob = await buildApplicationPackageOoxmlBlob(pkg);
  downloadBlob(blob, `${slug(`${pkg.companyName}_${pkg.jobTitle}`)}_Application_Package.docx`);
}

export async function downloadResumeOoxml(
  resumeData: ResumeData,
  filenameBase = "resume",
  templateStyle?: TemplateStyle,
): Promise<void> {
  const blob = await buildResumeOoxmlBlob(resumeData, templateStyle);
  const name = resumeData.personalInfo.name || filenameBase;
  downloadBlob(blob, `${name.replace(/\s+/g, "_")}_CV.docx`);
}

export async function downloadCoverLetterOoxml(
  letter: CoverLetterResult,
  filenameBase = "cover_letter"
): Promise<void> {
  const blob = await buildCoverLetterOoxmlBlob(letter);
  downloadBlob(blob, `${filenameBase.replace(/\s+/g, "_")}.docx`);
}
