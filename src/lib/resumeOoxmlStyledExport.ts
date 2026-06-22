import {
  AlignmentType,
  BorderStyle,
  Document,
  LevelFormat,
  Paragraph,
  ShadingType,
  TextRun,
  UnderlineType,
  convertInchesToTwip,
} from "docx";
import type { ResumeData } from "../types";
import {
  MARGINALIA_NOTEBOOK_TEMPLATE,
  type TemplateStyle,
  getTemplateFamily,
  isMarginaliaNotebookTemplate,
} from "./resumeTemplateCatalog";
import type { AppLocale } from "../i18n/types";
import { getActiveLocale } from "../i18n/translate";
import { getSectionLabel } from "./sectionLabels";

export const RESUME_BULLET_LIST_REF = "resume-bullets";

export interface DocxResumePalette {
  accent: string;
  ink: string;
  muted: string;
  rule: string;
  mint: string;
  marker: string;
  nameFont: string;
  bodyFont: string;
  titleUppercase: boolean;
}

export function getResumeBulletNumbering() {
  return {
    config: [
      {
        reference: RESUME_BULLET_LIST_REF,
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 720, hanging: 360 },
              },
            },
          },
        ],
      },
    ],
  };
}

export function paletteForTemplate(templateStyle: TemplateStyle = MARGINALIA_NOTEBOOK_TEMPLATE): DocxResumePalette {
  const family = getTemplateFamily(templateStyle);
  const marginalia = isMarginaliaNotebookTemplate(templateStyle);

  if (marginalia || family === "modern") {
    return {
      accent: "C0392B",
      ink: "1A2438",
      muted: "535C68",
      rule: "C5D9E8",
      mint: "D4EDDA",
      marker: "F5D76E",
      nameFont: "Georgia",
      bodyFont: "Calibri",
      titleUppercase: true,
    };
  }

  if (family === "classic") {
    return {
      accent: "1E293B",
      ink: "0F172A",
      muted: "475569",
      rule: "CBD5E1",
      mint: "F8FAFC",
      marker: "FEF3C7",
      nameFont: "Times New Roman",
      bodyFont: "Times New Roman",
      titleUppercase: true,
    };
  }

  return {
    accent: "C0392B",
    ink: "1A2438",
    muted: "535C68",
    rule: "C5D9E8",
    mint: "D4EDDA",
    marker: "F5D76E",
    nameFont: "Calibri",
    bodyFont: "Calibri",
    titleUppercase: false,
  };
}

function sectionTitle(text: string, palette: DocxResumePalette): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: palette.titleUppercase ? text.toUpperCase() : text,
        bold: true,
        size: 20,
        color: palette.accent,
        font: palette.bodyFont,
      }),
    ],
    border: {
      bottom: { color: palette.rule, space: 1, style: BorderStyle.SINGLE, size: 4 },
    },
    spacing: { before: 280, after: 120 },
  });
}

function bodyText(
  text: string,
  palette: DocxResumePalette,
  options?: { bold?: boolean; italic?: boolean; color?: string; size?: number; shading?: string },
): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: options?.size ?? 22,
        font: palette.bodyFont,
        color: options?.color ?? palette.ink,
        bold: options?.bold,
        italics: options?.italic,
      }),
    ],
    shading: options?.shading ? { fill: options.shading, type: ShadingType.CLEAR } : undefined,
    spacing: { after: 100 },
  });
}

function bulletItem(text: string, palette: DocxResumePalette): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: palette.bodyFont, color: palette.ink })],
    numbering: { reference: RESUME_BULLET_LIST_REF, level: 0 },
    spacing: { after: 60 },
  });
}

function shadedLine(
  runs: TextRun[],
  palette: DocxResumePalette,
  fill: string,
  spacing?: { before?: number; after?: number },
): Paragraph {
  return new Paragraph({
    children: runs,
    shading: { fill, type: ShadingType.CLEAR },
    spacing: { before: spacing?.before ?? 0, after: spacing?.after ?? 80 },
  });
}

export function buildStyledResumeParagraphs(
  resumeData: ResumeData,
  templateStyle: TemplateStyle = MARGINALIA_NOTEBOOK_TEMPLATE,
  locale: AppLocale = getActiveLocale(),
): Paragraph[] {
  const palette = paletteForTemplate(templateStyle);
  const info = resumeData.personalInfo;
  const contactParts = [info.email, info.phone, info.location, info.website, info.linkedin].filter(Boolean);

  const children: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: " ", size: 4 })],
      border: { bottom: { color: palette.accent, style: BorderStyle.SINGLE, size: 24, space: 1 } },
      spacing: { after: 160 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: info.name || "Resume",
          bold: true,
          size: 52,
          color: palette.ink,
          font: palette.nameFont,
        }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: palette.titleUppercase ? (info.title || "").toUpperCase() : info.title || "",
          bold: true,
          size: 22,
          color: palette.accent,
          font: palette.bodyFont,
        }),
      ],
      spacing: { after: 80 },
    }),
  ];

  if (contactParts.length) {
    children.push(
      new Paragraph({
        children: contactParts.flatMap((part, index) => {
          const runs: TextRun[] = [];
          if (index > 0) {
            runs.push(new TextRun({ text: "  |  ", size: 20, color: palette.muted, font: palette.bodyFont }));
          }
          runs.push(new TextRun({ text: part, size: 20, color: palette.muted, font: palette.bodyFont }));
          return runs;
        }),
        spacing: { after: 160 },
      }),
    );
  }

  children.push(
    new Paragraph({
      border: { bottom: { color: palette.rule, style: BorderStyle.SINGLE, size: 4, space: 1 } },
      spacing: { after: 200 },
    }),
  );

  if (resumeData.summary) {
    children.push(sectionTitle(getSectionLabel("summary", locale), palette));
    children.push(bodyText(resumeData.summary, palette));
  }

  if (resumeData.experience?.length) {
    children.push(sectionTitle(getSectionLabel("experience", locale), palette));
    for (const exp of resumeData.experience) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.role, bold: true, size: 24, color: palette.ink, font: palette.bodyFont }),
            new TextRun({ text: " at ", size: 22, color: palette.muted, font: palette.bodyFont }),
            new TextRun({ text: exp.company, bold: true, size: 24, color: palette.accent, font: palette.bodyFont }),
          ],
          spacing: { before: 160, after: 40 },
        }),
      );
      const dates = [exp.startDate, exp.endDate].filter(Boolean).join(" – ");
      const meta = [dates, exp.location].filter(Boolean).join("  |  ");
      if (meta) children.push(bodyText(meta, palette, { color: palette.muted, size: 18 }));
      for (const bullet of exp.bullets) {
        children.push(bulletItem(bullet, palette));
      }
    }
  }

  if (resumeData.education?.length) {
    children.push(sectionTitle(getSectionLabel("education", locale), palette));
    for (const edu of resumeData.education) {
      children.push(
        shadedLine(
          [new TextRun({ text: edu.institution, bold: true, size: 22, font: palette.bodyFont, color: palette.ink })],
          palette,
          palette.mint,
          { before: 80, after: 40 },
        ),
        shadedLine(
          [
            new TextRun({
              text: `${edu.degree} in ${edu.field}`,
              size: 22,
              font: palette.bodyFont,
              color: palette.ink,
            }),
          ],
          palette,
          palette.mint,
          { after: 40 },
        ),
        shadedLine(
          [
            new TextRun({
              text: `Conferred: ${edu.gradDate} | ${edu.location}`,
              size: 18,
              font: palette.bodyFont,
              color: palette.muted,
            }),
          ],
          palette,
          palette.mint,
          { after: 120 },
        ),
      );
    }
  }

  if (resumeData.projects?.length) {
    children.push(sectionTitle(getSectionLabel("projects", locale), palette));
    for (const proj of resumeData.projects) {
      children.push(
        shadedLine(
          [new TextRun({ text: proj.name, bold: true, size: 22, font: palette.bodyFont, color: palette.ink })],
          palette,
          palette.marker,
          { before: 80, after: 40 },
        ),
      );
      if (proj.url) {
        children.push(
          shadedLine(
            [
              new TextRun({
                text: proj.url,
                size: 18,
                font: palette.bodyFont,
                color: palette.accent,
                underline: { type: UnderlineType.SINGLE },
              }),
            ],
            palette,
            palette.marker,
            { after: 40 },
          ),
        );
      }
      if (proj.techStack) {
        children.push(
          shadedLine(
            [
              new TextRun({
                text: `Stack: ${proj.techStack}`,
                size: 18,
                font: palette.bodyFont,
                color: palette.muted,
                italics: true,
              }),
            ],
            palette,
            palette.marker,
            { after: 40 },
          ),
        );
      }
      children.push(
        shadedLine(
          [new TextRun({ text: proj.description, size: 22, font: palette.bodyFont, color: palette.ink })],
          palette,
          palette.marker,
          { after: 120 },
        ),
      );
    }
  }

  if (resumeData.certifications?.length) {
    children.push(sectionTitle(getSectionLabel("certifications", locale), palette));
    children.push(bodyText(resumeData.certifications.join("  ·  "), palette));
  }

  if (resumeData.volunteerWork?.length) {
    children.push(sectionTitle(getSectionLabel("volunteer", locale), palette));
    for (const item of resumeData.volunteerWork) {
      children.push(bulletItem(item, palette));
    }
  }

  if (resumeData.languages?.length) {
    children.push(sectionTitle(getSectionLabel("languages", locale), palette));
    children.push(bodyText(resumeData.languages.join("  ·  "), palette, { bold: true }));
  }

  if (resumeData.skills?.length) {
    children.push(sectionTitle(getSectionLabel("skills", locale), palette));
    children.push(
      new Paragraph({
        children: resumeData.skills.flatMap((skill, index) => {
          const runs: TextRun[] = [];
          if (index > 0) {
            runs.push(new TextRun({ text: ", ", size: 22, font: palette.bodyFont, color: palette.muted }));
          }
          runs.push(new TextRun({ text: skill, size: 22, font: palette.bodyFont, color: palette.ink, bold: true }));
          return runs;
        }),
        spacing: { after: 120 },
      }),
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Generated by NextStepResume.ai",
          size: 16,
          color: palette.muted,
          italics: true,
          font: palette.bodyFont,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 360 },
    }),
  );

  return children;
}

export function createStyledResumeDocument(
  resumeData: ResumeData,
  templateStyle: TemplateStyle = MARGINALIA_NOTEBOOK_TEMPLATE,
  locale: AppLocale = getActiveLocale(),
): Document {
  return new Document({
    numbering: getResumeBulletNumbering(),
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.65),
              right: convertInchesToTwip(0.7),
              bottom: convertInchesToTwip(0.65),
              left: convertInchesToTwip(0.85),
            },
          },
        },
        children: buildStyledResumeParagraphs(resumeData, templateStyle, locale),
      },
    ],
  });
}
