import { jsPDF } from "jspdf";
import type { ResumeData } from "../types";
import { MARGINALIA_NOTEBOOK_TEMPLATE, type TemplateStyle } from "./resumeTemplateCatalog";
import { paletteForTemplate } from "./resumeOoxmlStyledExport";
import type { AppLocale } from "../i18n/types";
import { getActiveLocale } from "../i18n/translate";
import { getSectionLabel } from "./sectionLabels";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 48;
const MARGIN_Y = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const ATS_RANGE_SEPARATOR = " - ";
const ATS_INLINE_SEPARATOR = " | ";
const ATS_BULLET_PREFIX = "- ";

function joinNonEmpty(parts: Array<string | null | undefined>, separator: string): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(separator);
}

export function formatAtsDateRange(startDate?: string, endDate?: string): string {
  return joinNonEmpty([startDate, endDate], ATS_RANGE_SEPARATOR);
}

export function formatAtsInlineList(items: Array<string | null | undefined>): string {
  return joinNonEmpty(items, ATS_INLINE_SEPARATOR);
}

export function formatAtsBullet(text: string): string {
  return `${ATS_BULLET_PREFIX}${text}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

class AtsPdfWriter {
  private pdf: jsPDF;
  private y = MARGIN_Y;
  private lastPageWithContent = 1;

  constructor() {
    this.pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  }

  private ensureSpace(height: number): void {
    if (this.y + height > PAGE_HEIGHT - MARGIN_Y) {
      this.pdf.addPage();
      this.y = MARGIN_Y;
    }
  }

  private writeLines(
    lines: string[],
    options: {
      size?: number;
      bold?: boolean;
      color?: string;
      indent?: number;
      lineGap?: number;
    } = {},
  ): void {
    const size = options.size ?? 11;
    const lineGap = options.lineGap ?? size * 0.45;
    const indent = options.indent ?? 0;
    const [r, g, b] = hexToRgb(options.color ?? "1A2438");

    this.pdf.setFont("helvetica", options.bold ? "bold" : "normal");
    this.pdf.setFontSize(size);
    this.pdf.setTextColor(r, g, b);

    for (const line of lines) {
      this.ensureSpace(size + lineGap);
      this.pdf.text(line, MARGIN_X + indent, this.y);
      this.y += size + lineGap;
      this.lastPageWithContent = this.pdf.getCurrentPageInfo().pageNumber;
    }
  }

  private writeWrapped(
    text: string,
    options: {
      size?: number;
      bold?: boolean;
      color?: string;
      indent?: number;
      lineGap?: number;
    } = {},
  ): void {
    const size = options.size ?? 11;
    const lineGap = options.lineGap ?? size * 0.45;
    const width = CONTENT_WIDTH - (options.indent ?? 0);
    const lines = this.pdf.splitTextToSize(text, width) as string[];
    this.writeLines(lines, { ...options, size, lineGap });
  }

  sectionTitle(title: string, accent: string, uppercase: boolean): void {
    this.y += 8;
    this.writeWrapped(uppercase ? title.toUpperCase() : title, {
      size: 10,
      bold: true,
      color: accent,
      lineGap: 6,
    });
    const [r, g, b] = hexToRgb("C5D9E8");
    this.ensureSpace(8);
    this.pdf.setDrawColor(r, g, b);
    this.pdf.setLineWidth(0.75);
    this.pdf.line(MARGIN_X, this.y, PAGE_WIDTH - MARGIN_X, this.y);
    this.y += 10;
  }

  save(filename: string): void {
    while (this.pdf.getNumberOfPages() > this.lastPageWithContent) {
      this.pdf.deletePage(this.pdf.getNumberOfPages());
    }
    this.pdf.save(filename);
  }

  render(resumeData: ResumeData, templateStyle: TemplateStyle, locale: AppLocale = getActiveLocale()): void {
    const palette = paletteForTemplate(templateStyle);
    const info = resumeData.personalInfo;
    const contact = formatAtsInlineList([info.email, info.phone, info.location, info.website, info.linkedin]);

    this.writeWrapped(info.name || "Resume", {
      size: 22,
      bold: true,
      color: palette.ink,
      lineGap: 8,
    });
    this.writeWrapped(palette.titleUppercase ? (info.title || "").toUpperCase() : info.title || "", {
      size: 11,
      bold: true,
      color: palette.accent,
      lineGap: 6,
    });
    if (contact) {
      this.writeWrapped(contact, { size: 9.5, color: palette.muted, lineGap: 5 });
    }
    this.y += 6;

    if (resumeData.summary) {
      this.sectionTitle(getSectionLabel("summary", locale), palette.accent, palette.titleUppercase);
      this.writeWrapped(resumeData.summary, { size: 10.5, color: palette.ink });
    }

    if (resumeData.experience?.length) {
      this.sectionTitle(getSectionLabel("experience", locale), palette.accent, palette.titleUppercase);
      for (const exp of resumeData.experience) {
        this.writeWrapped(`${exp.role} at ${exp.company}`, {
          size: 11,
          bold: true,
          color: palette.ink,
          lineGap: 4,
        });
        const meta = formatAtsInlineList([formatAtsDateRange(exp.startDate, exp.endDate), exp.location]);
        if (meta) {
          this.writeWrapped(meta, { size: 9.5, color: palette.muted, lineGap: 4 });
        }
        for (const bullet of exp.bullets) {
          this.writeWrapped(formatAtsBullet(bullet), {
            size: 10,
            color: palette.ink,
            indent: 12,
            lineGap: 4,
          });
        }
        this.y += 4;
      }
    }

    if (resumeData.education?.length) {
      this.sectionTitle(getSectionLabel("education", locale), palette.accent, palette.titleUppercase);
      for (const edu of resumeData.education) {
        this.writeWrapped(edu.institution, { size: 11, bold: true, color: palette.ink, lineGap: 3 });
        this.writeWrapped(`${edu.degree} in ${edu.field}`, { size: 10, color: palette.ink, lineGap: 3 });
        const educationMeta = formatAtsInlineList([
          edu.gradDate ? `Conferred: ${edu.gradDate}` : "",
          edu.location,
        ]);
        if (educationMeta) {
          this.writeWrapped(educationMeta, {
            size: 9,
            color: palette.muted,
            lineGap: 6,
          });
        }
      }
    }

    if (resumeData.projects?.length) {
      this.sectionTitle(getSectionLabel("projects", locale), palette.accent, palette.titleUppercase);
      for (const proj of resumeData.projects) {
        this.writeWrapped(proj.name, { size: 11, bold: true, color: palette.ink, lineGap: 3 });
        if (proj.url) {
          this.writeWrapped(proj.url, { size: 9, color: palette.accent, lineGap: 3 });
        }
        if (proj.techStack) {
          this.writeWrapped(`Stack: ${proj.techStack}`, { size: 9, color: palette.muted, lineGap: 3 });
        }
        this.writeWrapped(proj.description, { size: 10, color: palette.ink, lineGap: 6 });
      }
    }

    if (resumeData.certifications?.length) {
      this.sectionTitle(getSectionLabel("certifications", locale), palette.accent, palette.titleUppercase);
      this.writeWrapped(formatAtsInlineList(resumeData.certifications), { size: 10, color: palette.ink });
    }

    if (resumeData.volunteerWork?.length) {
      this.sectionTitle(getSectionLabel("volunteer", locale), palette.accent, palette.titleUppercase);
      for (const item of resumeData.volunteerWork) {
        this.writeWrapped(formatAtsBullet(item), { size: 10, color: palette.ink, indent: 12, lineGap: 4 });
      }
    }

    if (resumeData.languages?.length) {
      this.sectionTitle(getSectionLabel("languages", locale), palette.accent, palette.titleUppercase);
      this.writeWrapped(formatAtsInlineList(resumeData.languages), {
        size: 10,
        bold: true,
        color: palette.ink,
      });
    }

    if (resumeData.skills?.length) {
      this.sectionTitle(getSectionLabel("skills", locale), palette.accent, palette.titleUppercase);
      this.writeWrapped(resumeData.skills.join(", "), { size: 10, color: palette.ink });
    }
  }
}

export function downloadResumeAtsPdf(
  resumeData: ResumeData,
  filename: string,
  templateStyle: TemplateStyle = MARGINALIA_NOTEBOOK_TEMPLATE,
  locale: AppLocale = getActiveLocale(),
): void {
  const writer = new AtsPdfWriter();
  writer.render(resumeData, templateStyle, locale);
  writer.save(filename);
}
