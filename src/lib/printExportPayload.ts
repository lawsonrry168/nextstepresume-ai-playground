import type { ResumeData } from "../types";
import type { TemplateStyle } from "./resumeTemplateCatalog";
import type { FreeLayoutPosition, FreeLayoutSectionMeta } from "./resumeFreeLayout";
import type { ResumeThemeCustomization } from "./resumeThemeCustomization";
import type { CanvasPage } from "./canvasStudioTypes";
import { getActiveLocale } from "../i18n/translate";

export const PRINT_PAYLOAD_KEY = "nsr_print_payload";

export interface PrintLayoutPayload {
  enabled: boolean;
  sections: FreeLayoutSectionMeta[];
  positions: Record<string, FreeLayoutPosition>;
  pages?: CanvasPage[];
  sectionPageMap?: Record<string, string>;
  layerOrder?: string[];
  hiddenSections?: Record<string, boolean>;
  sectionSlices?: Record<string, import("./layoutEntryPagination").SectionContentSlice>;
  themeCustomization?: ResumeThemeCustomization;
  grayscaleMode?: boolean;
}

export interface ServerPrintPayload {
  resumeData: ResumeData;
  templateStyle?: TemplateStyle;
  locale?: string;
  pageFormat?: "A4" | "Letter";
  paperMode?: "cream" | "white";
  watermark?: string;
  layout?: PrintLayoutPayload;
}

export function readExportPref(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function buildServerPrintPayload(options: {
  resumeData: ResumeData;
  templateStyle?: TemplateStyle;
  watermark?: string;
  layout?: PrintLayoutPayload;
}): ServerPrintPayload {
  const pageFormatRaw = readExportPref("nsr_export_page_format", "A4");
  const paperModeRaw = readExportPref("nsr_export_paper_mode", "cream");
  return {
    resumeData: options.resumeData,
    templateStyle: options.templateStyle,
    locale: getActiveLocale(),
    pageFormat: pageFormatRaw === "Letter" ? "Letter" : "A4",
    paperMode: paperModeRaw === "white" ? "white" : "cream",
    watermark: options.watermark,
    layout: options.layout,
  };
}

export function readStoredPrintPayload(): Partial<ServerPrintPayload> {
  try {
    const raw = localStorage.getItem(PRINT_PAYLOAD_KEY);
    return raw ? (JSON.parse(raw) as Partial<ServerPrintPayload>) : {};
  } catch {
    return {};
  }
}
