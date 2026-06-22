import type { AppLocale } from "../i18n/types";
import { getActiveLocale, t } from "../i18n/translate";

export type TemplateFamily = "modern" | "classic" | "minimalist";

export type TemplateStyle =
  | `modern-${"01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "11"}`
  | `classic-${"01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10"}`
  | `minimalist-${"01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10"}`;

export interface ResumeTemplateTheme {
  id: TemplateStyle;
  family: TemplateFamily;
  accentBar: string;
  accentText: string;
  accentBg: string;
  accentBgSoft: string;
  accentBorder: string;
  sectionHeading: string;
  skillChip: string;
  langChip: string;
  tailoredBg: string;
  tailoredBorder: string;
  expHighlightBg: string;
  expHighlightBorder: string;
  headerBorder: string;
  nameClass: string;
  sectionTitle: string;
  sidebarDot: string;
  sidebarTitle: string;
  roleAccent: string;
  sheetFont: string;
}


const MODERN_PRESETS: Array<Partial<ResumeTemplateTheme>> = [
  {
    accentBar: "resume-marginalia-accent-bar",
    accentText: "text-[#c0392b]",
    accentBg: "bg-[#c0392b]",
    accentBgSoft: "bg-[#d4edda]",
    accentBorder: "border-[#c5d9e8]",
    sectionHeading: "text-[#535c68] font-sans tracking-widest",
    skillChip: "bg-[#d4edda]/90 text-[#1a2438] border-[#c5d9e8]",
    langChip: "bg-[#f5d76e]/45 text-[#1a2438] border-[#c5d9e8]",
    tailoredBg: "bg-[#f5d76e]/30",
    tailoredBorder: "border-[#c0392b]",
    expHighlightBg: "bg-[#f5d76e]/25",
    expHighlightBorder: "border-[#c0392b]",
    headerBorder: "border-[#c5d9e8]",
    nameClass: "font-display text-[#1a2438]",
    sectionTitle: "border-b border-[#c5d9e8]",
    sidebarDot: "bg-[#c0392b]",
    sidebarTitle: "text-[#535c68]",
    roleAccent: "text-[#c0392b]",
    sheetFont: "font-serif",
  },
  { accentBar: "from-teal-600 via-emerald-600 to-emerald-800", accentText: "text-emerald-600", accentBg: "bg-emerald-600", accentBgSoft: "bg-emerald-50", accentBorder: "border-emerald-100" },
  { accentBar: "from-emerald-500 via-blue-600 to-blue-800", accentText: "text-emerald-600", accentBg: "bg-emerald-600", accentBgSoft: "bg-emerald-50", accentBorder: "border-emerald-100" },
  { accentBar: "from-emerald-500 via-teal-600 to-emerald-800", accentText: "text-emerald-600", accentBg: "bg-emerald-600", accentBgSoft: "bg-emerald-50", accentBorder: "border-emerald-100" },
  { accentBar: "from-slate-500 via-slate-700 to-slate-900", accentText: "text-slate-700", accentBg: "bg-slate-700", accentBgSoft: "bg-slate-100", accentBorder: "border-slate-200" },
  { accentBar: "from-violet-500 via-purple-600 to-violet-900", accentText: "text-violet-600", accentBg: "bg-violet-600", accentBgSoft: "bg-violet-50", accentBorder: "border-violet-100" },
  { accentBar: "from-rose-400 via-pink-600 to-rose-800", accentText: "text-rose-600", accentBg: "bg-rose-600", accentBgSoft: "bg-rose-50", accentBorder: "border-rose-100" },
  { accentBar: "from-amber-400 via-orange-500 to-amber-700", accentText: "text-amber-700", accentBg: "bg-amber-600", accentBgSoft: "bg-amber-50", accentBorder: "border-amber-100" },
  { accentBar: "from-teal-400 via-cyan-600 to-teal-800", accentText: "text-teal-600", accentBg: "bg-teal-600", accentBgSoft: "bg-teal-50", accentBorder: "border-teal-100" },
  { accentBar: "from-emerald-900 via-slate-900 to-black", accentText: "text-emerald-900", accentBg: "bg-emerald-900", accentBgSoft: "bg-emerald-50", accentBorder: "border-emerald-200" },
  { accentBar: "from-zinc-600 via-neutral-800 to-zinc-950", accentText: "text-zinc-800", accentBg: "bg-zinc-800", accentBgSoft: "bg-zinc-100", accentBorder: "border-zinc-200" },
];

const CLASSIC_PRESETS: Array<Pick<ResumeTemplateTheme, "accentText" | "headerBorder" | "nameClass" | "sectionTitle">> = [
  { accentText: "text-slate-800", headerBorder: "border-slate-300", nameClass: "uppercase tracking-tight", sectionTitle: "border-b border-slate-200" },
  { accentText: "text-stone-800", headerBorder: "border-stone-400", nameClass: "uppercase tracking-wide", sectionTitle: "border-b-2 border-stone-300" },
  { accentText: "text-neutral-900", headerBorder: "border-neutral-400", nameClass: "uppercase", sectionTitle: "border-b border-double border-neutral-300" },
  { accentText: "text-emerald-900", headerBorder: "border-emerald-300", nameClass: "uppercase tracking-tight", sectionTitle: "border-b border-emerald-200" },
  { accentText: "text-slate-900", headerBorder: "border-slate-500", nameClass: "tracking-normal", sectionTitle: "border-b border-slate-300" },
  { accentText: "text-amber-950", headerBorder: "border-amber-300", nameClass: "uppercase tracking-wide", sectionTitle: "border-b border-amber-200" },
  { accentText: "text-slate-700", headerBorder: "border-slate-200", nameClass: "italic", sectionTitle: "border-b border-dashed border-slate-300" },
  { accentText: "text-zinc-800", headerBorder: "border-zinc-300", nameClass: "tracking-widest uppercase text-xl", sectionTitle: "border-b border-zinc-200" },
  { accentText: "text-blue-950", headerBorder: "border-blue-200", nameClass: "uppercase", sectionTitle: "border-b-2 border-emerald-100" },
  { accentText: "text-neutral-800", headerBorder: "border-neutral-300", nameClass: "font-black uppercase", sectionTitle: "border-b border-neutral-200" },
];

const MINIMAL_PRESETS: Array<Pick<ResumeTemplateTheme, "accentText" | "sidebarDot" | "sidebarTitle" | "roleAccent">> = [
  { accentText: "text-emerald-600", sidebarDot: "bg-emerald-500", sidebarTitle: "text-slate-400", roleAccent: "text-emerald-600" },
  { accentText: "text-slate-700", sidebarDot: "bg-slate-500", sidebarTitle: "text-slate-500", roleAccent: "text-slate-700" },
  { accentText: "text-zinc-800", sidebarDot: "bg-zinc-600", sidebarTitle: "text-zinc-400", roleAccent: "text-zinc-800" },
  { accentText: "text-emerald-700", sidebarDot: "bg-emerald-500", sidebarTitle: "text-blue-300", roleAccent: "text-emerald-700" },
  { accentText: "text-red-600", sidebarDot: "bg-red-500", sidebarTitle: "text-red-300", roleAccent: "text-red-600" },
  { accentText: "text-emerald-700", sidebarDot: "bg-emerald-400", sidebarTitle: "text-emerald-300", roleAccent: "text-emerald-700" },
  { accentText: "text-rose-700", sidebarDot: "bg-rose-400", sidebarTitle: "text-rose-300", roleAccent: "text-rose-700" },
  { accentText: "text-violet-700", sidebarDot: "bg-violet-500", sidebarTitle: "text-violet-300", roleAccent: "text-violet-700" },
  { accentText: "text-emerald-600", sidebarDot: "bg-emerald-500", sidebarTitle: "text-emerald-300", roleAccent: "text-emerald-600" },
  { accentText: "text-amber-800", sidebarDot: "bg-amber-500", sidebarTitle: "text-amber-400", roleAccent: "text-amber-800" },
];

function buildFamilyThemes(
  family: TemplateFamily,
  presets: Array<Partial<ResumeTemplateTheme>>,
  defaults: Omit<ResumeTemplateTheme, "id" | "family">,
): ResumeTemplateTheme[] {
  return presets.map((preset, index) => {
    const id = `${family}-${String(index + 1).padStart(2, "0")}` as TemplateStyle;
    return {
      ...defaults,
      ...preset,
      id,
      family,
    } as ResumeTemplateTheme;
  });
}

const MODERN_DEFAULTS: Omit<ResumeTemplateTheme, "id" | "family"> = {
  accentBar: "resume-marginalia-accent-bar",
  accentText: "text-[#c0392b]",
  accentBg: "bg-[#c0392b]",
  accentBgSoft: "bg-[#d4edda]",
  accentBorder: "border-[#c5d9e8]",
  sectionHeading: "text-[#535c68]",
  skillChip: "bg-[#d4edda]/90 text-[#1a2438] border-[#c5d9e8]",
  langChip: "bg-[#f5d76e]/45 text-[#1a2438] border-[#c5d9e8]",
  tailoredBg: "bg-[#f5d76e]/35",
  tailoredBorder: "border-[#c0392b]",
  expHighlightBg: "bg-[#f5d76e]/30",
  expHighlightBorder: "border-[#c0392b]",
  headerBorder: "border-[#c5d9e8]",
  nameClass: "font-display",
  sectionTitle: "border-b border-[#c5d9e8]",
  sidebarDot: "bg-[#c0392b]",
  sidebarTitle: "text-[#535c68]",
  roleAccent: "text-[#c0392b]",
  sheetFont: "font-serif",
};

const CLASSIC_DEFAULTS: Omit<ResumeTemplateTheme, "id" | "family"> = {
  ...MODERN_DEFAULTS,
  accentBar: "from-stone-400 to-stone-600",
  accentText: "text-slate-800",
  accentBg: "bg-slate-800",
  accentBgSoft: "bg-stone-50",
  accentBorder: "border-stone-200",
  sectionHeading: "text-slate-800",
  skillChip: "text-slate-700",
  langChip: "text-slate-700",
  tailoredBg: "bg-amber-50",
  tailoredBorder: "border-amber-400",
  expHighlightBg: "bg-emerald-50/55",
  expHighlightBorder: "border-emerald-400",
  headerBorder: "border-slate-300",
  nameClass: "uppercase tracking-tight",
  sectionTitle: "border-b border-slate-200",
  sheetFont: "font-serif",
};

const MINIMAL_DEFAULTS: Omit<ResumeTemplateTheme, "id" | "family"> = {
  ...MODERN_DEFAULTS,
  sheetFont: "font-sans",
};

export const MARGINALIA_NOTEBOOK_TEMPLATE: TemplateStyle = "modern-01";

export function isMarginaliaNotebookTemplate(style: TemplateStyle): boolean {
  return style === MARGINALIA_NOTEBOOK_TEMPLATE;
}

export const RESUME_TEMPLATE_CATALOG: ResumeTemplateTheme[] = [
  ...buildFamilyThemes("modern", MODERN_PRESETS, MODERN_DEFAULTS),
  ...buildFamilyThemes("classic", CLASSIC_PRESETS, CLASSIC_DEFAULTS),
  ...buildFamilyThemes("minimalist", MINIMAL_PRESETS, MINIMAL_DEFAULTS),
];

export const TEMPLATE_FAMILIES: TemplateFamily[] = ["modern", "classic", "minimalist"];

const LEGACY_TEMPLATE_MAP: Record<string, TemplateStyle> = {
  modern: "modern-01",
  academic: "classic-01",
  classic: "classic-01",
  minimalist: "minimalist-01",
};

export function normalizeTemplateStyle(value: string | null | undefined): TemplateStyle {
  if (!value) return "modern-01";
  if (value in LEGACY_TEMPLATE_MAP) return LEGACY_TEMPLATE_MAP[value];
  const found = RESUME_TEMPLATE_CATALOG.find((t) => t.id === value);
  return found?.id ?? "modern-01";
}

export function getTemplateFamily(style: TemplateStyle): TemplateFamily {
  if (style.startsWith("classic-")) return "classic";
  if (style.startsWith("minimalist-")) return "minimalist";
  return "modern";
}

export function getResumeTemplateTheme(style: TemplateStyle): ResumeTemplateTheme {
  return RESUME_TEMPLATE_CATALOG.find((t) => t.id === style) ?? RESUME_TEMPLATE_CATALOG[0];
}

export function getTemplatesByFamily(family: TemplateFamily): ResumeTemplateTheme[] {
  return RESUME_TEMPLATE_CATALOG.filter((t) => t.family === family);
}

export function getFamilyLabel(family: TemplateFamily, locale?: AppLocale) {
  return t(`templateFamilies.${family}`, undefined, locale);
}

export function getTemplateThemeLabel(
  theme: Pick<ResumeTemplateTheme, "id">,
  locale?: AppLocale,
): string {
  const loc = locale ?? getActiveLocale();
  const key = `templateThemes.${theme.id}`;
  const translated = t(key, undefined, loc);
  if (!translated.startsWith("templateThemes.")) {
    return translated;
  }
  return theme.id;
}

export function isTemplateInFamily(style: TemplateStyle, family: TemplateFamily): boolean {
  return getTemplateFamily(style) === family;
}
