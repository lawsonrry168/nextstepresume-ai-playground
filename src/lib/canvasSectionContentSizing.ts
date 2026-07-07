import type { ResumeData } from "../types";
import type { FreeLayoutPosition } from "./resumeFreeLayout";
import {
  clampSectionHeight,
  clampSectionWidth,
  defaultSectionHeight,
  FREE_LAYOUT_MAX_WIDTH,
  snapToGrid,
  SNAP_GRID_SIZE,
} from "./resumeFreeLayout";
import { CANVAS_PAGE_WIDTH } from "./canvasStudioTypes";
import { CANVAS_PAGE_MARGIN } from "./canvasAlignTools";
import { getHkPersonalMetaLines } from "./resumeHkMeta";
import {
  countWrappedLines,
  fallbackWrappedLineCount,
  isPixelMeasureAvailable,
  FALLBACK_CHAR_WIDTH,
  RESUME_BODY_FONT,
} from "./measure/textMeasure";

const LINE_HEIGHT = 22;
const SECTION_CHROME = 48;
/** Live canvas overlay chrome + padding */
export const SECTION_CONTENT_PADDING = 24;
/** Approximate glyph width at resume body size */
const CHAR_WIDTH = FALLBACK_CHAR_WIDTH;

/** Max section height on A4 canvas (printable band) */
export const CANVAS_SECTION_MAX_HEIGHT = 1027;

export function estimateWrappedLineCount(text: string, charsPerLine: number): number {
  return fallbackWrappedLineCount(text, charsPerLine);
}

/** Wrap text at a section content width — pixel-accurate in the browser, heuristic elsewhere. */
function wrappedLinesAtWidth(text: string, contentWidth: number, charsPerLine: number): number {
  if (isPixelMeasureAvailable()) {
    return countWrappedLines(text, contentWidth, RESUME_BODY_FONT);
  }
  return fallbackWrappedLineCount(text, charsPerLine);
}

function sectionContentWidth(width: number): number {
  return Math.max(120, width - SECTION_CONTENT_PADDING * 2);
}

export function estimateBlockLines(
  texts: string[],
  charsPerLine: number,
  extraLines = 0,
  contentWidth?: number,
): number {
  const w = contentWidth ?? charsPerLine * CHAR_WIDTH;
  return extraLines + texts.reduce((sum, t) => sum + wrappedLinesAtWidth(t, w, charsPerLine), 0);
}

export function getSectionTextLength(sectionId: string, data: ResumeData): number {
  switch (sectionId) {
    case "header": {
      const p = data.personalInfo;
      return [p.name, p.title, p.email, p.phone, p.location, p.linkedin, p.website].join(" ").length;
    }
    case "summary":
      return data.summary?.trim().length ?? 0;
    case "experience":
      return data.experience.reduce(
        (sum, item) =>
          sum + item.company.length + item.role.length + item.bullets.join(" ").length + item.location.length + 20,
        0,
      );
    case "education":
      return data.education.reduce(
        (sum, item) => sum + item.institution.length + item.degree.length + item.field.length + 16,
        0,
      );
    case "projects":
      return data.projects.reduce(
        (sum, item) => sum + item.name.length + item.description.length + item.techStack.length + 16,
        0,
      );
    case "skills":
      return data.skills.join(" ").length;
    case "certifications":
      return (data.certifications ?? []).join(" ").length;
    case "volunteer":
      return (data.volunteerWork ?? []).join(" ").length;
    case "languages":
      return (data.languages ?? []).join(" ").length;
    default:
      return 0;
  }
}

export function estimateCharsPerLine(width: number): number {
  return Math.max(18, Math.floor(width / CHAR_WIDTH));
}

export function estimateSectionHeightForContent(
  sectionId: string,
  data: ResumeData,
  width: number,
): number {
  const textLen = getSectionTextLength(sectionId, data);
  if (textLen === 0) return defaultSectionHeight(sectionId);

  const charsPerLine = estimateCharsPerLine(width);
  const contentWidth = sectionContentWidth(width);
  let contentLines = 0;

  switch (sectionId) {
    case "header": {
      // Block-mode header renders each contact field and HK meta entry on its
      // own row — count them individually or the box underestimates and the
      // auto-expanding content overlaps the section below.
      const p = data.personalInfo;
      contentLines = estimateBlockLines([p.name, p.title], charsPerLine, 0, contentWidth);
      // Contact/meta rows render at ~16px (0.75 of a body line); on narrow
      // cards the icon wraps above the text, doubling each row's height.
      const contactRowFactor = contentWidth < 340 ? 1.5 : 0.75;
      const contactRows =
        [p.email, p.phone, p.location, p.website, p.linkedin].filter(Boolean).length +
        getHkPersonalMetaLines(p).length;
      contentLines += contactRows * contactRowFactor;
      break;
    }
    case "summary":
      contentLines = 1 + wrappedLinesAtWidth(data.summary ?? "", contentWidth, charsPerLine);
      break;
    case "experience": {
      contentLines = 1;
      for (const item of data.experience) {
        contentLines += estimateBlockLines(
          [
            `${item.role} at ${item.company}`,
            `${item.startDate} – ${item.endDate}${item.location ? ` · ${item.location}` : ""}`,
            ...item.bullets,
          ],
          charsPerLine,
          1,
          contentWidth,
        );
      }
      break;
    }
    case "education": {
      contentLines = 1;
      for (const item of data.education) {
        contentLines += estimateBlockLines(
          [item.degree, `${item.institution} · ${item.gradDate}${item.field ? ` · ${item.field}` : ""}`],
          charsPerLine,
          1,
          contentWidth,
        );
      }
      break;
    }
    case "projects": {
      contentLines = 1;
      for (const item of data.projects) {
        contentLines += estimateBlockLines(
          [item.name, item.description, item.techStack ? `Tech: ${item.techStack}` : ""].filter(Boolean),
          charsPerLine,
          1,
          contentWidth,
        );
      }
      break;
    }
    case "skills": {
      if (data.skills.length > 0) {
        const chipsPerRow = Math.max(2, Math.floor(width / 108));
        const chipRows = Math.ceil(data.skills.length / chipsPerRow);
        contentLines = 1 + chipRows;
      } else {
        contentLines = 2;
      }
      break;
    }
    default: {
      const bodyLines = Math.ceil(textLen / charsPerLine);
      contentLines = 1 + bodyLines;
    }
  }

  const raw = SECTION_CHROME + contentLines * LINE_HEIGHT;
  return snapToGrid(clampSectionHeight(raw, CANVAS_SECTION_MAX_HEIGHT), SNAP_GRID_SIZE);
}

export function estimateSectionHeightAtWidth(
  sectionId: string,
  data: ResumeData,
  width: number,
): number {
  return estimateSectionHeightForContent(sectionId, data, width);
}

export function estimateSectionWidthForContent(
  sectionId: string,
  data: ResumeData,
  pageInnerWidth: number,
  x = CANVAS_PAGE_MARGIN,
): number {
  const textLen = getSectionTextLength(sectionId, data);
  if (textLen === 0) {
    return snapToGrid(clampSectionWidth(320, x, CANVAS_PAGE_WIDTH), SNAP_GRID_SIZE);
  }

  let target: number;
  if (sectionId === "skills") {
    const count = data.skills.length;
    const totalLen = textLen;
    if (count <= 4 && totalLen < 80) {
      target = Math.max(240, count * 76 + 48);
    } else if (totalLen > 180) {
      target = Math.min(pageInnerWidth, 580);
    } else if (totalLen > 90) {
      target = Math.min(pageInnerWidth, 440);
    } else {
      target = Math.min(pageInnerWidth, 320);
    }
  } else if (textLen > 520 || sectionId === "experience" || sectionId === "summary") {
    target = pageInnerWidth;
  } else if (textLen > 220 || sectionId === "projects" || sectionId === "education") {
    target = Math.min(pageInnerWidth, 580);
  } else if (textLen > 90) {
    target = Math.min(pageInnerWidth, 440);
  } else {
    target = Math.min(pageInnerWidth, 300);
  }

  return snapToGrid(clampSectionWidth(target, x, CANVAS_PAGE_WIDTH), SNAP_GRID_SIZE);
}

/** Gap between sections based on average content height */
export function estimateContentAwareGap(heights: number[]): number {
  if (!heights.length) return 12;
  const avg = heights.reduce((a, b) => a + b, 0) / heights.length;
  if (avg >= 240) return 16;
  if (avg >= 160) return 12;
  if (avg >= 100) return 10;
  return 8;
}

export function pageInnerWidth(pageWidth = CANVAS_PAGE_WIDTH, margin = CANVAS_PAGE_MARGIN): number {
  return Math.min(pageWidth - margin * 2, FREE_LAYOUT_MAX_WIDTH);
}

export function fitSectionPositionToContent(
  sectionId: string,
  position: FreeLayoutPosition,
  data: ResumeData,
): FreeLayoutPosition {
  const inner = pageInnerWidth();
  const width = estimateSectionWidthForContent(sectionId, data, inner, position.x);
  const height = estimateSectionHeightForContent(sectionId, data, width);
  return { ...position, width, height };
}

export function buildContentFitSignature(sectionIds: string[], data: ResumeData): string {
  return sectionIds.map((id) => `${id}:${getSectionTextLength(id, data)}`).join("|");
}

/** Tracks template + theme tokens that affect rendered section dimensions */
export function buildThemeFitSignature(
  templateStyle: string,
  templateFamily: string,
  customization: {
    enabled?: boolean;
    baseFontSize?: number | null;
    bodyFont?: string | null;
    headingFont?: string | null;
    lineHeight?: number | null;
    sectionSpacing?: number | null;
  },
): string {
  return [
    templateStyle,
    templateFamily,
    customization.enabled ? "1" : "0",
    customization.baseFontSize ?? "",
    customization.bodyFont ?? "",
    customization.headingFont ?? "",
    customization.lineHeight ?? "",
    customization.sectionSpacing ?? "",
  ].join("|");
}

export function themeContentScale(customization: { enabled?: boolean; baseFontSize?: number | null }): number {
  if (!customization.enabled || !customization.baseFontSize) return 1;
  return customization.baseFontSize / 16;
}

/** Measure unconstrained content height (avoids clipped scrollHeight in fixed-height boxes) */
export function measureSectionContentHeight(node: HTMLElement, contentWidth: number): number {
  const host = node.parentElement;
  if (!host) return node.scrollHeight;

  const saved = {
    hostHeight: host.style.height,
    hostOverflow: host.style.overflow,
    nodeHeight: node.style.height,
    nodeMinHeight: node.style.minHeight,
    nodeOverflow: node.style.overflow,
    nodeWidth: node.style.width,
  };

  host.style.height = "auto";
  host.style.overflow = "visible";
  node.style.height = "auto";
  node.style.minHeight = "0";
  node.style.overflow = "visible";
  node.style.width = `${contentWidth}px`;

  const measured = node.scrollHeight;

  host.style.height = saved.hostHeight;
  host.style.overflow = saved.hostOverflow;
  node.style.height = saved.nodeHeight;
  node.style.minHeight = saved.nodeMinHeight;
  node.style.overflow = saved.nodeOverflow;
  node.style.width = saved.nodeWidth;

  return measured;
}
