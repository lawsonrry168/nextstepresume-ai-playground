import type { AppLocale } from "../../i18n/types";
import type { ResumeData } from "../../types";
import type { TemplateStyle } from "../resumeTemplateCatalog";
import { getTemplateFamily } from "../resumeTemplateCatalog";
import { saveCanvasDocument } from "../canvasDocument";
import {
  buildFreeLayoutSections,
  FREE_LAYOUT_ENABLED_KEY,
  readFamilyLayoutStorage,
  writeFamilyLayoutStorage,
} from "../resumeFreeLayout";
import { getTemplateDemoResume } from "./templateDemoContent";
import {
  buildTemplateDemoPagesDocument,
  createTemplateDemoLayoutPositions,
} from "./templateDemoLayout";
import type { FreeLayoutPosition } from "../resumeFreeLayout";
import type { CanvasPagesDocument } from "../canvasStudioTypes";
import type { TemplateDemoLocale } from "./templateDemoLocale";

/** Draft stack → print plan → editor positions (A4-safe, matches PDF export). */
export function resolveTemplateDemoEditorPositions(
  style: TemplateStyle,
  sectionIds: string[],
  resumeData: ResumeData,
): Record<string, FreeLayoutPosition> {
  return createTemplateDemoLayoutPositions(style, sectionIds, resumeData);
}

export interface TemplateDemoBundle {
  style: TemplateStyle;
  resumeData: ResumeData;
  sectionIds: string[];
  positions: Record<string, FreeLayoutPosition>;
  pages: CanvasPagesDocument;
}

export function buildTemplateDemoBundle(
  style: TemplateStyle,
  locale?: AppLocale | TemplateDemoLocale,
): TemplateDemoBundle {
  const resumeData = getTemplateDemoResume(style, locale);
  const sectionIds = buildFreeLayoutSections(resumeData).map((section) => section.id);
  const positions = resolveTemplateDemoEditorPositions(style, sectionIds, resumeData);
  return {
    style,
    resumeData,
    sectionIds,
    positions,
    pages: buildTemplateDemoPagesDocument(),
  };
}

/** Persist demo layout to local family storage so free-layout hooks can reload it. */
export function persistTemplateDemoLayout(
  style: TemplateStyle,
  locale?: AppLocale | TemplateDemoLocale,
  bundle = buildTemplateDemoBundle(style, locale),
): void {
  const family = getTemplateFamily(style);
  const storage = readFamilyLayoutStorage();
  storage[family] = bundle.positions;
  writeFamilyLayoutStorage(storage);
  saveCanvasDocument(family, { pages: bundle.pages });
  try {
    localStorage.setItem(FREE_LAYOUT_ENABLED_KEY, "true");
  } catch {
    /* ignore */
  }
}

/** Recompute two-page stack layout for the current resume without swapping content. */
export function persistRecalculatedLayout(style: TemplateStyle, resumeData: ResumeData): void {
  const family = getTemplateFamily(style);
  const sectionIds = buildFreeLayoutSections(resumeData).map((section) => section.id);
  const positions = resolveTemplateDemoEditorPositions(style, sectionIds, resumeData);
  const storage = readFamilyLayoutStorage();
  storage[family] = positions;
  writeFamilyLayoutStorage(storage);
  saveCanvasDocument(family, { pages: buildTemplateDemoPagesDocument() });
}
