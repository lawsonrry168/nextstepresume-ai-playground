import { CSSProperties } from "react";
import {
  getResumeTemplateTheme,
  getTemplateFamily,
  ResumeTemplateTheme,
  TemplateStyle,
} from "./resumeTemplateCatalog";
import { NSR_STORAGE_KEYS } from "./storageKeys";

export const THEME_CUSTOMIZATION_STORAGE_KEY = NSR_STORAGE_KEYS.themeCustomization;

export type ResumeFontId =
  | "inherit"
  | "inter"
  | "system-sans"
  | "system-serif"
  | "georgia"
  | "playfair"
  | "merriweather"
  | "lora"
  | "roboto"
  | "open-sans"
  | "source-serif"
  | "jetbrains";

export type ResumeFontSizeId = 12 | 13 | 14 | 15 | 16;
export type ResumeLineHeightId = 1.4 | 1.5 | 1.6 | 1.75;
export type ResumeNameSizeId = "xl" | "2xl" | "3xl" | "4xl";
export type ResumeSpacingId = 24 | 32 | 40 | 48;
export type ResumeSectionGapId = 16 | 24 | 32;
export type ResumeRadiusId = 0 | 4 | 8 | 12 | 16;

export interface ResumeThemeCustomization {
  enabled: boolean;
  accentColor: string | null;
  accentGradientEnd: string | null;
  bodyColor: string | null;
  headingColor: string | null;
  mutedColor: string | null;
  backgroundColor: string | null;
  cardBackgroundColor: string | null;
  borderColor: string | null;
  bodyFont: ResumeFontId | null;
  headingFont: ResumeFontId | null;
  baseFontSize: ResumeFontSizeId | null;
  lineHeight: ResumeLineHeightId | null;
  nameFontSize: ResumeNameSizeId | null;
  pagePadding: ResumeSpacingId | null;
  sectionGap: ResumeSectionGapId | null;
  /** 履歷紙張外框圓角 */
  borderRadius: ResumeRadiusId | null;
  /** 學歷／專案等卡片圓角（獨立於紙張） */
  cardBorderRadius: ResumeRadiusId | null;
  showAccentBar: boolean | null;
  uppercaseSectionTitles: boolean | null;
  showSectionBorders: boolean | null;
}

export const DEFAULT_THEME_CUSTOMIZATION: ResumeThemeCustomization = {
  enabled: false,
  accentColor: null,
  accentGradientEnd: null,
  bodyColor: null,
  headingColor: null,
  mutedColor: null,
  backgroundColor: null,
  cardBackgroundColor: null,
  borderColor: null,
  bodyFont: null,
  headingFont: null,
  baseFontSize: null,
  lineHeight: null,
  nameFontSize: null,
  pagePadding: null,
  sectionGap: null,
  borderRadius: null,
  cardBorderRadius: null,
  showAccentBar: null,
  uppercaseSectionTitles: null,
  showSectionBorders: null,
};

export interface ResumeFontOption {
  id: ResumeFontId;
  labelZh: string;
  labelEn: string;
  family: string;
  googleFont: string | null;
}

export const RESUME_FONT_OPTIONS: ResumeFontOption[] = [
  { id: "inherit", labelZh: "跟隨版型", labelEn: "Template Default", family: "", googleFont: null },
  { id: "inter", labelZh: "Inter", labelEn: "Inter", family: "Inter", googleFont: "Inter:wght@400;500;600;700;800" },
  { id: "system-sans", labelZh: "系統無襯線", labelEn: "System Sans", family: "ui-sans-serif, system-ui, sans-serif", googleFont: null },
  { id: "system-serif", labelZh: "系統襯線", labelEn: "System Serif", family: "ui-serif, Georgia, serif", googleFont: null },
  { id: "georgia", labelZh: "Georgia", labelEn: "Georgia", family: "Georgia, serif", googleFont: null },
  { id: "playfair", labelZh: "Playfair Display", labelEn: "Playfair Display", family: '"Playfair Display", Georgia, serif', googleFont: "Playfair+Display:wght@400;600;700" },
  { id: "merriweather", labelZh: "Merriweather", labelEn: "Merriweather", family: "Merriweather, Georgia, serif", googleFont: "Merriweather:wght@400;700" },
  { id: "lora", labelZh: "Lora", labelEn: "Lora", family: "Lora, Georgia, serif", googleFont: "Lora:wght@400;600;700" },
  { id: "roboto", labelZh: "Roboto", labelEn: "Roboto", family: "Roboto, sans-serif", googleFont: "Roboto:wght@400;500;700" },
  { id: "open-sans", labelZh: "Open Sans", labelEn: "Open Sans", family: '"Open Sans", sans-serif', googleFont: "Open+Sans:wght@400;600;700" },
  { id: "source-serif", labelZh: "Source Serif 4", labelEn: "Source Serif 4", family: '"Source Serif 4", Georgia, serif', googleFont: "Source+Serif+4:wght@400;600;700" },
  { id: "jetbrains", labelZh: "JetBrains Mono", labelEn: "JetBrains Mono", family: '"JetBrains Mono", monospace', googleFont: "JetBrains+Mono:wght@400;500;600" },
];

const TAILWIND_TEXT_HEX: Record<string, string> = {
  "text-[#c0392b]": "#c0392b",
  "text-emerald-600": "#059669",
  "text-emerald-700": "#047857",
  "text-emerald-900": "#064e3b",
  "text-blue-600": "#2563eb",
  "text-blue-700": "#1d4ed8",
  "text-blue-950": "#172554",
  "text-slate-700": "#334155",
  "text-slate-800": "#1e293b",
  "text-slate-900": "#0f172a",
  "text-violet-600": "#7c3aed",
  "text-violet-700": "#6d28d9",
  "text-rose-600": "#e11d48",
  "text-rose-700": "#be123c",
  "text-amber-700": "#b45309",
  "text-amber-800": "#92400e",
  "text-amber-950": "#451a03",
  "text-teal-600": "#0d9488",
  "text-sky-700": "#0369a1",
  "text-red-600": "#dc2626",
  "text-zinc-800": "#27272a",
  "text-stone-800": "#292524",
  "text-neutral-800": "#262626",
  "text-neutral-900": "#171717",
};

const NAME_SIZE_MAP: Record<ResumeNameSizeId, string> = {
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
};

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function extractAccentHex(theme: ResumeTemplateTheme): string {
  return TAILWIND_TEXT_HEX[theme.accentText] ?? (theme.id === "modern-01" ? "#c0392b" : "#059669");
}

export interface ThemeFieldMeta {
  labelZh: string;
  hintZh: string;
  previewHex?: (theme: ResumeTemplateTheme) => string;
}

/** 通用配色（不含頂部色條漸層） */
export const THEME_COLOR_FIELDS: Record<
  | "accentColor"
  | "bodyColor"
  | "headingColor"
  | "mutedColor"
  | "backgroundColor"
  | "cardBackgroundColor"
  | "borderColor",
  ThemeFieldMeta
> = {
  accentColor: {
    labelZh: "主色",
    hintZh: "圖示、連結、技能標籤等強調色",
    previewHex: (t) => extractAccentHex(t),
  },
  bodyColor: { labelZh: "正文色", hintZh: "段落與列表內文", previewHex: () => "#334155" },
  headingColor: { labelZh: "標題色", hintZh: "姓名與大標題", previewHex: () => "#0f172a" },
  mutedColor: { labelZh: "次要文字", hintZh: "區塊小標與輔助說明", previewHex: () => "#64748b" },
  backgroundColor: { labelZh: "頁面背景", hintZh: "履歷紙張底色", previewHex: () => "#ffffff" },
  cardBackgroundColor: { labelZh: "卡片背景", hintZh: "學歷／專案卡片區塊", previewHex: () => "#f8fafc" },
  borderColor: { labelZh: "邊框色", hintZh: "區塊底線、分隔線與卡片邊框", previewHex: () => "#e2e8f0" },
};

export const ACCENT_BAR_GRADIENT_FIELD: ThemeFieldMeta = {
  labelZh: "色條右側色",
  hintZh: "僅 Modern 頂部色條；左側自動沿用主色",
  previewHex: (t) => extractAccentHex(t),
};

export function getColorFieldPreview(
  field: keyof typeof THEME_COLOR_FIELDS,
  customization: ResumeThemeCustomization,
  theme: ResumeTemplateTheme,
): string {
  const value = customization[field];
  if (value) return value;
  return THEME_COLOR_FIELDS[field].previewHex?.(theme) ?? "#059669";
}

function resolveFontFamily(fontId: ResumeFontId | null, theme: ResumeTemplateTheme): string | undefined {
  if (!fontId || fontId === "inherit") {
    if (theme.sheetFont === "font-serif") return "Georgia, ui-serif, serif";
    return "Inter, ui-sans-serif, system-ui, sans-serif";
  }
  return RESUME_FONT_OPTIONS.find((f) => f.id === fontId)?.family;
}

export function normalizeThemeCustomization(
  raw: Partial<ResumeThemeCustomization> | null | undefined,
): ResumeThemeCustomization {
  if (!raw) return { ...DEFAULT_THEME_CUSTOMIZATION };
  return {
    ...DEFAULT_THEME_CUSTOMIZATION,
    ...raw,
  };
}

export function countThemeOverrides(customization: ResumeThemeCustomization): number {
  return Object.entries(customization).filter(([key, value]) => key !== "enabled" && value !== null).length;
}

export interface ResolvedResumeTheme {
  customization: ResumeThemeCustomization;
  cssVars: CSSProperties;
  active: boolean;
  showAccentBar: boolean;
  uppercaseSectionTitles: boolean;
  showSectionBorders: boolean;
  useCustomPadding: boolean;
  useCustomSectionGap: boolean;
  classes: {
    accentText: string;
    accentBar: string;
    sheetFont: string;
    sectionTitle: string;
    sectionBorder: string;
    headerBorder: string;
    skillChip: string;
    langChip: string;
    sidebarDot: string;
    sidebarTitle: string;
    roleAccent: string;
    sectionHeading: string;
    nameClass: string;
    expHighlightBg: string;
    expHighlightBorder: string;
    tailoredBg: string;
    tailoredBorder: string;
  };
}

export function resolveResumeTheme(
  templateStyle: TemplateStyle,
  customization: ResumeThemeCustomization,
): ResolvedResumeTheme {
  const theme = getResumeTemplateTheme(templateStyle);
  const family = getTemplateFamily(templateStyle);
  const enabled = customization.enabled;

  const cssVars: CSSProperties = {};
  const themeAccent = extractAccentHex(theme);
  const accent = customization.accentColor ?? (enabled && customization.accentGradientEnd ? themeAccent : null);
  const accentEnd = customization.accentGradientEnd ?? accent;

  if (enabled && accent) {
    cssVars["--resume-accent" as string] = accent;
    cssVars["--resume-accent-soft" as string] = hexToRgba(accent, 0.08);
    cssVars["--resume-accent-border" as string] = hexToRgba(accent, 0.25);
    cssVars["--resume-accent-end" as string] = accentEnd ?? accent;
  }

  if (enabled && customization.bodyColor) cssVars["--resume-body-color" as string] = customization.bodyColor;
  if (enabled && customization.headingColor) cssVars["--resume-heading-color" as string] = customization.headingColor;
  if (enabled && customization.mutedColor) cssVars["--resume-muted-color" as string] = customization.mutedColor;
  if (enabled && customization.backgroundColor) cssVars["--resume-bg-color" as string] = customization.backgroundColor;
  if (enabled && customization.cardBackgroundColor) cssVars["--resume-card-bg" as string] = customization.cardBackgroundColor;
  if (enabled && customization.borderColor) cssVars["--resume-border-color" as string] = customization.borderColor;

  const bodyFont = customization.bodyFont ? resolveFontFamily(customization.bodyFont, theme) : undefined;
  const headingFont = customization.headingFont
    ? resolveFontFamily(customization.headingFont, theme)
    : customization.bodyFont
      ? bodyFont
      : undefined;
  if (enabled && bodyFont) cssVars["--resume-body-font" as string] = bodyFont;
  if (enabled && headingFont) cssVars["--resume-heading-font" as string] = headingFont;
  if (enabled && customization.baseFontSize) cssVars["--resume-base-size" as string] = `${customization.baseFontSize}px`;
  if (enabled && customization.lineHeight) cssVars["--resume-line-height" as string] = String(customization.lineHeight);
  if (enabled && customization.nameFontSize) cssVars["--resume-name-size" as string] = NAME_SIZE_MAP[customization.nameFontSize];
  if (enabled && customization.pagePadding) cssVars["--resume-page-padding" as string] = `${customization.pagePadding}px`;
  if (enabled && customization.sectionGap) cssVars["--resume-section-gap" as string] = `${customization.sectionGap}px`;
  if (enabled && customization.borderRadius !== null && customization.borderRadius !== undefined) {
    cssVars["--resume-sheet-radius" as string] = `${customization.borderRadius}px`;
  }
  if (enabled && customization.cardBorderRadius !== null && customization.cardBorderRadius !== undefined) {
    cssVars["--resume-card-radius" as string] = `${customization.cardBorderRadius}px`;
  }

  const showAccentBar = enabled
    ? customization.showAccentBar ?? family === "modern"
    : family === "modern";
  const uppercaseSectionTitles = enabled
    ? customization.uppercaseSectionTitles ?? true
    : true;
  const showSectionBorders = enabled
    ? customization.showSectionBorders ?? true
    : true;

  const hasAccent = enabled && !!customization.accentColor;
  const hasAccentBarGradient = enabled && !!(customization.accentColor || customization.accentGradientEnd);
  const hasMuted = enabled && !!customization.mutedColor;
  const hasBorder = enabled && !!customization.borderColor;
  const hasBodyFont = enabled && !!bodyFont;
  const hasHighlight = enabled && !!accent;

  const sectionBorder = !showSectionBorders
    ? ""
    : enabled
      ? "resume-theme-section-heading-border"
      : theme.sectionTitle;

  return {
    customization,
    cssVars,
    active: enabled,
    showAccentBar,
    uppercaseSectionTitles,
    showSectionBorders,
    useCustomPadding: enabled && customization.pagePadding !== null,
    useCustomSectionGap: enabled && customization.sectionGap !== null,
    classes: {
      accentText: hasAccent ? "resume-theme-accent" : theme.accentText,
      accentBar: hasAccentBarGradient ? "resume-theme-accent-bar" : `bg-gradient-to-r ${theme.accentBar}`,
      sheetFont: hasBodyFont ? "resume-theme-body-font" : theme.sheetFont,
      sectionTitle: sectionBorder,
      sectionBorder,
      headerBorder: hasBorder ? "resume-theme-border" : theme.headerBorder,
      skillChip: hasAccent ? "resume-theme-chip" : theme.skillChip,
      langChip: hasAccent ? "resume-theme-chip" : theme.langChip,
      sidebarDot: hasAccent ? "resume-theme-dot" : theme.sidebarDot,
      sidebarTitle: hasMuted ? "resume-theme-muted" : theme.sidebarTitle,
      roleAccent: hasAccent ? "resume-theme-accent" : theme.roleAccent,
      sectionHeading: hasMuted ? "resume-theme-section-heading" : theme.sectionHeading,
      nameClass: theme.nameClass,
      expHighlightBg: hasHighlight ? "resume-theme-highlight-bg" : theme.expHighlightBg,
      expHighlightBorder: hasHighlight ? "resume-theme-highlight-border" : theme.expHighlightBorder,
      tailoredBg: hasHighlight ? "resume-theme-tailored-bg" : theme.tailoredBg,
      tailoredBorder: hasHighlight ? "resume-theme-tailored-border" : theme.tailoredBorder,
    },
  };
}

export function collectGoogleFonts(customization: ResumeThemeCustomization): string[] {
  if (!customization.enabled) return [];
  const ids = new Set<ResumeFontId>();
  if (customization.bodyFont && customization.bodyFont !== "inherit") ids.add(customization.bodyFont);
  if (customization.headingFont && customization.headingFont !== "inherit") ids.add(customization.headingFont);
  const families: string[] = [];
  for (const id of ids) {
    const option = RESUME_FONT_OPTIONS.find((f) => f.id === id);
    if (option?.googleFont) families.push(option.googleFont);
  }
  return families;
}

export function buildGoogleFontsUrl(fonts: string[]): string | null {
  if (fonts.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${fonts.map((f) => `family=${f}`).join("&")}&display=swap`;
}

export function resetThemeCustomization(): ResumeThemeCustomization {
  return { ...DEFAULT_THEME_CUSTOMIZATION };
}
