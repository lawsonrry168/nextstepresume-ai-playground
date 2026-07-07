import {
  AlignmentType,
  BorderStyle,
  Document,
  LevelFormat,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
  VerticalAlign,
  WidthType,
  convertInchesToTwip,
} from "docx";
import type { ResumeData } from "../types";
import {
  MARGINALIA_NOTEBOOK_TEMPLATE,
  type TemplateStyle,
} from "./resumeTemplateCatalog";
import { getTemplateDefinition, TEMPLATE_FONTS } from "./templates/tokens";
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

function toDocxHex(color: string): string {
  return color.replace("#", "").toUpperCase();
}

/** Per-template palette derived from the Retro Stationery tokens — 31 distinct palettes. */
export function paletteForTemplate(templateStyle: TemplateStyle = MARGINALIA_NOTEBOOK_TEMPLATE): DocxResumePalette {
  const def = getTemplateDefinition(templateStyle);
  return {
    accent: toDocxHex(def.colors.accent),
    ink: toDocxHex(def.colors.ink),
    muted: toDocxHex(def.colors.muted),
    rule: toDocxHex(def.colors.rule),
    mint: toDocxHex(def.colors.accentSoft),
    marker: toDocxHex(def.colors.highlight),
    nameFont: TEMPLATE_FONTS[def.typography.display].docx,
    bodyFont: TEMPLATE_FONTS[def.typography.body].docx,
    titleUppercase: def.typography.titleCase !== "none",
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

function buildHeaderParagraphs(
  resumeData: ResumeData,
  palette: DocxResumePalette,
  options?: { centered?: boolean },
): Paragraph[] {
  const info = resumeData.personalInfo;
  const contactParts = [info.email, info.phone, info.location, info.website, info.linkedin].filter(Boolean);
  const alignment = options?.centered ? AlignmentType.CENTER : undefined;

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
      alignment,
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
      alignment,
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
        alignment,
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

  return children;
}

function buildSummaryParagraphs(resumeData: ResumeData, palette: DocxResumePalette, locale: AppLocale): Paragraph[] {
  if (!resumeData.summary) return [];
  return [sectionTitle(getSectionLabel("summary", locale), palette), bodyText(resumeData.summary, palette)];
}

function buildExperienceParagraphs(resumeData: ResumeData, palette: DocxResumePalette, locale: AppLocale): Paragraph[] {
  if (!resumeData.experience?.length) return [];
  const children: Paragraph[] = [sectionTitle(getSectionLabel("experience", locale), palette)];
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
  return children;
}

function buildEducationParagraphs(resumeData: ResumeData, palette: DocxResumePalette, locale: AppLocale): Paragraph[] {
  if (!resumeData.education?.length) return [];
  const children: Paragraph[] = [sectionTitle(getSectionLabel("education", locale), palette)];
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
  return children;
}

function buildProjectParagraphs(resumeData: ResumeData, palette: DocxResumePalette, locale: AppLocale): Paragraph[] {
  if (!resumeData.projects?.length) return [];
  const children: Paragraph[] = [sectionTitle(getSectionLabel("projects", locale), palette)];
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
  return children;
}

function buildCertificationParagraphs(resumeData: ResumeData, palette: DocxResumePalette, locale: AppLocale): Paragraph[] {
  if (!resumeData.certifications?.length) return [];
  return [
    sectionTitle(getSectionLabel("certifications", locale), palette),
    bodyText(resumeData.certifications.join("  ·  "), palette),
  ];
}

function buildVolunteerParagraphs(resumeData: ResumeData, palette: DocxResumePalette, locale: AppLocale): Paragraph[] {
  if (!resumeData.volunteerWork?.length) return [];
  return [
    sectionTitle(getSectionLabel("volunteer", locale), palette),
    ...resumeData.volunteerWork.map((item) => bulletItem(item, palette)),
  ];
}

function buildLanguageParagraphs(resumeData: ResumeData, palette: DocxResumePalette, locale: AppLocale): Paragraph[] {
  if (!resumeData.languages?.length) return [];
  return [
    sectionTitle(getSectionLabel("languages", locale), palette),
    bodyText(resumeData.languages.join("  ·  "), palette, { bold: true }),
  ];
}

function buildSkillParagraphs(resumeData: ResumeData, palette: DocxResumePalette, locale: AppLocale): Paragraph[] {
  if (!resumeData.skills?.length) return [];
  return [
    sectionTitle(getSectionLabel("skills", locale), palette),
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
  ];
}

function buildFooterParagraph(palette: DocxResumePalette): Paragraph {
  return new Paragraph({
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
  });
}

function buildTimelineExperienceRows(
  resumeData: ResumeData,
  palette: DocxResumePalette,
  locale: AppLocale,
): TableRow[] {
  if (!resumeData.experience?.length) return [];
  const rows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 22, type: WidthType.PERCENTAGE },
          borders: CELL_BORDERS,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: getSectionLabel("experience", locale).toUpperCase(),
                  bold: true,
                  size: 20,
                  color: palette.accent,
                  font: palette.bodyFont,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 78, type: WidthType.PERCENTAGE },
          borders: CELL_BORDERS,
          children: [new Paragraph({ children: [] })],
        }),
      ],
    }),
  ];

  for (const exp of resumeData.experience) {
    const dates = [exp.startDate, exp.endDate].filter(Boolean).join(" – ");
    const meta = [dates, exp.location].filter(Boolean).join("\n");
    const content: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({ text: exp.role, bold: true, size: 24, color: palette.ink, font: palette.bodyFont }),
          new TextRun({ text: " · ", size: 22, color: palette.muted, font: palette.bodyFont }),
          new TextRun({ text: exp.company, bold: true, size: 24, color: palette.accent, font: palette.bodyFont }),
        ],
        spacing: { before: 120, after: 60 },
      }),
      ...exp.bullets.map((bullet) => bulletItem(bullet, palette)),
    ];
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 22, type: WidthType.PERCENTAGE },
            borders: CELL_BORDERS,
            verticalAlign: VerticalAlign.TOP,
            children: meta ? [bodyText(meta, palette, { color: palette.muted, size: 18 })] : [new Paragraph({})],
          }),
          new TableCell({
            width: { size: 78, type: WidthType.PERCENTAGE },
            borders: CELL_BORDERS,
            verticalAlign: VerticalAlign.TOP,
            children: content,
          }),
        ],
      }),
    );
  }
  return rows;
}

function buildMainColumnParagraphs(resumeData: ResumeData, palette: DocxResumePalette, locale: AppLocale): Paragraph[] {
  return [
    ...buildSummaryParagraphs(resumeData, palette, locale),
    ...buildExperienceParagraphs(resumeData, palette, locale),
    ...buildProjectParagraphs(resumeData, palette, locale),
  ];
}

function buildSideColumnParagraphs(resumeData: ResumeData, palette: DocxResumePalette, locale: AppLocale): Paragraph[] {
  return [
    ...buildSkillParagraphs(resumeData, palette, locale),
    ...buildLanguageParagraphs(resumeData, palette, locale),
    ...buildEducationParagraphs(resumeData, palette, locale),
    ...buildCertificationParagraphs(resumeData, palette, locale),
    ...buildVolunteerParagraphs(resumeData, palette, locale),
  ];
}

const NO_TABLE_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } as const;
const CELL_BORDERS = {
  top: NO_TABLE_BORDER,
  bottom: NO_TABLE_BORDER,
  left: NO_TABLE_BORDER,
  right: NO_TABLE_BORDER,
} as const;

function layoutColumnsTable(
  columns: Array<{ paragraphs: Paragraph[]; widthPct: number }>,
): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: NO_TABLE_BORDER,
      bottom: NO_TABLE_BORDER,
      left: NO_TABLE_BORDER,
      right: NO_TABLE_BORDER,
      insideHorizontal: NO_TABLE_BORDER,
      insideVertical: NO_TABLE_BORDER,
    },
    rows: [
      new TableRow({
        children: columns.map(
          (column) =>
            new TableCell({
              children: column.paragraphs,
              width: { size: column.widthPct, type: WidthType.PERCENTAGE },
              borders: CELL_BORDERS,
              verticalAlign: VerticalAlign.TOP,
              margins: { left: 120, right: 120 },
            }),
        ),
      }),
    ],
  });
}

export function buildStyledResumeParagraphs(
  resumeData: ResumeData,
  templateStyle: TemplateStyle = MARGINALIA_NOTEBOOK_TEMPLATE,
  locale: AppLocale = getActiveLocale(),
): Paragraph[] {
  const palette = paletteForTemplate(templateStyle);
  return [
    ...buildHeaderParagraphs(resumeData, palette),
    ...buildSummaryParagraphs(resumeData, palette, locale),
    ...buildExperienceParagraphs(resumeData, palette, locale),
    ...buildEducationParagraphs(resumeData, palette, locale),
    ...buildProjectParagraphs(resumeData, palette, locale),
    ...buildCertificationParagraphs(resumeData, palette, locale),
    ...buildVolunteerParagraphs(resumeData, palette, locale),
    ...buildLanguageParagraphs(resumeData, palette, locale),
    ...buildSkillParagraphs(resumeData, palette, locale),
    buildFooterParagraph(palette),
  ];
}

/**
 * Word document children following the template's layout archetype:
 * sidebar/two-column templates render as a borderless table so the DOCX
 * mirrors the on-screen layout, not just its colors.
 */
export function buildLayoutAwareResumeChildren(
  resumeData: ResumeData,
  templateStyle: TemplateStyle = MARGINALIA_NOTEBOOK_TEMPLATE,
  locale: AppLocale = getActiveLocale(),
): Array<Paragraph | Table> {
  const palette = paletteForTemplate(templateStyle);
  const def = getTemplateDefinition(templateStyle);
  const centered = def.decorations.centeredHeader === true;
  const header = buildHeaderParagraphs(resumeData, palette, { centered });

  if (def.layout === "sidebar-left" || def.layout === "sidebar-right") {
    const side = { paragraphs: buildSideColumnParagraphs(resumeData, palette, locale), widthPct: 32 };
    const main = { paragraphs: buildMainColumnParagraphs(resumeData, palette, locale), widthPct: 68 };
    const columns = def.layout === "sidebar-right" ? [main, side] : [side, main];
    return [...header, layoutColumnsTable(columns), buildFooterParagraph(palette)];
  }

  if (def.layout === "two-column") {
    const left = {
      paragraphs: [
        ...buildSummaryParagraphs(resumeData, palette, locale),
        ...buildExperienceParagraphs(resumeData, palette, locale),
      ],
      widthPct: 50,
    };
    const right = {
      paragraphs: [
        ...buildProjectParagraphs(resumeData, palette, locale),
        ...buildEducationParagraphs(resumeData, palette, locale),
        ...buildSkillParagraphs(resumeData, palette, locale),
        ...buildLanguageParagraphs(resumeData, palette, locale),
        ...buildCertificationParagraphs(resumeData, palette, locale),
        ...buildVolunteerParagraphs(resumeData, palette, locale),
      ],
      widthPct: 50,
    };
    return [...header, layoutColumnsTable([left, right]), buildFooterParagraph(palette)];
  }

  if (def.layout === "timeline") {
    const timelineRows = buildTimelineExperienceRows(resumeData, palette, locale);
    const timelineTable =
      timelineRows.length > 0
        ? new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: NO_TABLE_BORDER,
              bottom: NO_TABLE_BORDER,
              left: NO_TABLE_BORDER,
              right: NO_TABLE_BORDER,
              insideHorizontal: NO_TABLE_BORDER,
              insideVertical: NO_TABLE_BORDER,
            },
            rows: timelineRows,
          })
        : null;
    const tail = [
      ...buildSummaryParagraphs(resumeData, palette, locale),
      ...buildEducationParagraphs(resumeData, palette, locale),
      ...buildProjectParagraphs(resumeData, palette, locale),
      ...buildSkillParagraphs(resumeData, palette, locale),
      ...buildLanguageParagraphs(resumeData, palette, locale),
      ...buildCertificationParagraphs(resumeData, palette, locale),
      ...buildVolunteerParagraphs(resumeData, palette, locale),
    ];
    return [
      ...header,
      ...(timelineTable ? [timelineTable] : []),
      ...tail,
      buildFooterParagraph(palette),
    ];
  }

  return buildStyledResumeParagraphs(resumeData, templateStyle, locale);
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
        children: buildLayoutAwareResumeChildren(resumeData, templateStyle, locale),
      },
    ],
  });
}
