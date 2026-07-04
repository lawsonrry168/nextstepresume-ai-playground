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
  // notebook-02 Legal Pad — 黃箋紙 + 雙紅邊線
  { accentBar: "from-[#C0392B] to-[#A93226]", roleAccent: "text-[#C0392B]", sectionTitle: "border-b-2 border-[#C0392B]/40" },
  // notebook-03 Graph Paper — 深湖水綠 accent
  { accentBar: "from-[#2E7D74] to-[#1F5B54]", accentText: "text-[#2E7D74]", accentBg: "bg-[#2E7D74]", tailoredBorder: "border-[#2E7D74]", expHighlightBorder: "border-[#2E7D74]", sidebarDot: "bg-[#2E7D74]", roleAccent: "text-[#2E7D74]", sectionTitle: "border-b border-[#2E7D74]/35" },
  // notebook-04 Index Card — 紅頂線卡片
  { accentBar: "from-[#C0392B] to-[#A93226]", sectionTitle: "border-b-2 border-[#C0392B]/30" },
  // notebook-05 Composition — 置中 + 雙紅底線
  { accentBar: "from-[#C0392B] to-[#A93226]", nameClass: "font-display text-[#1A2438] tracking-normal", sectionTitle: "border-b-4 border-double border-[#C0392B]/50" },
  // notebook-06 Sticky Note — mint/marker 便利貼 chip
  { accentBar: "from-[#C0392B] to-[#A93226]", skillChip: "bg-[#D4EDDA] text-[#1A2438] border-[#C5D9E8]", langChip: "bg-[#F5D76E]/60 text-[#1A2438] border-[#C5D9E8]" },
  // notebook-07 Highlighter — 螢光掃字重點
  { accentBar: "from-[#F5D76E] to-[#C0392B]", tailoredBg: "bg-[#F5D76E]/45", expHighlightBg: "bg-[#F5D76E]/35" },
  // notebook-08 Red Thread — 紅線裝訂時間軸
  { accentBar: "from-[#C0392B] to-[#A93226]", headerBorder: "border-dashed border-[#C0392B]/60", sectionTitle: "border-b border-[#C0392B]/30" },
  // notebook-09 Blueprint — 藍格線深階 accent
  { accentBar: "from-[#5B8FB9] to-[#3E6E93]", accentText: "text-[#5B8FB9]", accentBg: "bg-[#5B8FB9]", tailoredBorder: "border-[#5B8FB9]", expHighlightBorder: "border-[#5B8FB9]", sidebarDot: "bg-[#5B8FB9]", roleAccent: "text-[#5B8FB9]", sectionTitle: "border-b border-[#5B8FB9]/40" },
  // notebook-10 Teal Ledger — 湖水帳簿隔行底紋
  { accentBar: "from-[#2E7D74] to-[#1F5B54]", accentText: "text-[#2E7D74]", accentBg: "bg-[#2E7D74]", expHighlightBg: "bg-[#D4EDDA]/55", tailoredBorder: "border-[#2E7D74]", expHighlightBorder: "border-[#2E7D74]", sidebarDot: "bg-[#2E7D74]", sectionTitle: "border-b border-[#2E7D74]/35" },
  // notebook-11 Draft Stamp — 石墨為主、紅印章點綴
  { accentBar: "from-[#535C68] to-[#1A2438]", accentText: "text-[#535C68]", accentBg: "bg-[#535C68]", nameClass: "font-display text-[#1A2438]", sidebarDot: "bg-[#535C68]", roleAccent: "text-[#535C68]", sectionTitle: "border-b border-[#535C68]/30" },
];

const CLASSIC_PRESETS: Array<Pick<ResumeTemplateTheme, "accentText" | "headerBorder" | "nameClass" | "sectionTitle">> = [
  // bureau-01 Bureau Classic — 置中經典文書
  { accentText: "text-[#C0392B]", headerBorder: "border-[#C5D9E8]", nameClass: "tracking-tight", sectionTitle: "border-b border-[#C5D9E8]" },
  // bureau-02 Barrister — 英式編年體
  { accentText: "text-[#C0392B]", headerBorder: "border-[#1A2438]/30", nameClass: "uppercase tracking-wide", sectionTitle: "border-b-2 border-[#C5D9E8]" },
  // bureau-03 Registrar — 寬字距大寫
  { accentText: "text-[#C0392B]", headerBorder: "border-[#535C68]/40", nameClass: "uppercase tracking-widest", sectionTitle: "border-b border-double border-[#C5D9E8]" },
  // bureau-04 Broadsheet — 大報墨色
  { accentText: "text-[#1A2438]", headerBorder: "border-[#1A2438]/40", nameClass: "uppercase tracking-tight", sectionTitle: "border-b-4 border-double border-[#1A2438]/45" },
  // bureau-05 Minute Book — 紅色節序號
  { accentText: "text-[#C0392B]", headerBorder: "border-[#C5D9E8]", nameClass: "tracking-normal", sectionTitle: "border-b border-[#C5D9E8]" },
  // bureau-06 Treasury — 深湖水標題 + 字母磚
  { accentText: "text-[#2E7D74]", headerBorder: "border-[#C5D9E8]", nameClass: "uppercase tracking-wide", sectionTitle: "border-b border-[#2E7D74]/35" },
  // bureau-07 Chancery — 衡平斜體
  { accentText: "text-[#C0392B]", headerBorder: "border-[#C5D9E8]", nameClass: "italic", sectionTitle: "border-b border-[#C5D9E8]" },
  // bureau-08 Docket — 案卷緊湊 + 點線引導
  { accentText: "text-[#C0392B]", headerBorder: "border-[#535C68]/30", nameClass: "tracking-widest uppercase text-xl", sectionTitle: "border-b border-dotted border-[#C0392B]/50" },
  // bureau-09 Archive — 檔案室紅頂線
  { accentText: "text-[#C0392B]", headerBorder: "border-[#C0392B]/60", nameClass: "uppercase", sectionTitle: "border-b border-[#C5D9E8]" },
  // bureau-10 Signet — 印鑑置中
  { accentText: "text-[#C0392B]", headerBorder: "border-[#C5D9E8]", nameClass: "uppercase tracking-widest", sectionTitle: "border-b border-[#C5D9E8]" },
];

const MINIMAL_PRESETS: Array<Pick<ResumeTemplateTheme, "accentText" | "sidebarDot" | "sidebarTitle" | "roleAccent">> = [
  // studio-01 Studio Grid — 深湖水 + mint 圓點
  { accentText: "text-[#2E7D74]", sidebarDot: "bg-[#2E7D74]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#2E7D74]" },
  // studio-02 Whiteboard — teal 左邊線
  { accentText: "text-[#2E7D74]", sidebarDot: "bg-[#2E7D74]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#1A2438]" },
  // studio-03 Marker One — 全墨 + 螢光一筆
  { accentText: "text-[#1A2438]", sidebarDot: "bg-[#F5D76E]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#1A2438]" },
  // studio-04 Mint Tab — 薄荷標籤
  { accentText: "text-[#2E7D74]", sidebarDot: "bg-[#D4EDDA]", sidebarTitle: "text-[#2E7D74]", roleAccent: "text-[#2E7D74]" },
  // studio-05 Redline — 紅細線
  { accentText: "text-[#C0392B]", sidebarDot: "bg-[#C0392B]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#C0392B]" },
  // studio-06 Graphite — 全石墨無彩
  { accentText: "text-[#535C68]", sidebarDot: "bg-[#535C68]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#535C68]" },
  // studio-07 Two-Track — 石墨雙欄 + 紅摺角
  { accentText: "text-[#535C68]", sidebarDot: "bg-[#C0392B]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#1A2438]" },
  // studio-08 Eraser — mint/粉 chip
  { accentText: "text-[#2E7D74]", sidebarDot: "bg-[#F2C1C1]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#2E7D74]" },
  // studio-09 Console — mono + teal 游標
  { accentText: "text-[#2E7D74]", sidebarDot: "bg-[#2E7D74]", sidebarTitle: "text-[#2E7D74]", roleAccent: "text-[#2E7D74]" },
  // studio-10 Gallery — 紅點畫廊
  { accentText: "text-[#C0392B]", sidebarDot: "bg-[#C0392B]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#C0392B]" },
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
  accentBar: "from-[#C0392B] to-[#A93226]",
  accentText: "text-[#C0392B]",
  accentBg: "bg-[#1A2438]",
  accentBgSoft: "bg-[#FAF6EB]",
  accentBorder: "border-[#C5D9E8]",
  sectionHeading: "text-[#1A2438]",
  skillChip: "text-[#535C68]",
  langChip: "text-[#535C68]",
  tailoredBg: "bg-[#F5D76E]/30",
  tailoredBorder: "border-[#C0392B]",
  expHighlightBg: "bg-[#D4EDDA]/55",
  expHighlightBorder: "border-[#2E7D74]",
  headerBorder: "border-[#C5D9E8]",
  nameClass: "uppercase tracking-tight",
  sectionTitle: "border-b border-[#C5D9E8]",
  sheetFont: "font-serif",
};

const MINIMAL_DEFAULTS: Omit<ResumeTemplateTheme, "id" | "family"> = {
  ...MODERN_DEFAULTS,
  sheetFont: "font-sans",
};

export const MARGINALIA_NOTEBOOK_TEMPLATE: TemplateStyle = "modern-01";
export const DEFAULT_A4_TEMPLATE: TemplateStyle = "classic-02";

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
  if (!value) return DEFAULT_A4_TEMPLATE;
  if (value in LEGACY_TEMPLATE_MAP) return LEGACY_TEMPLATE_MAP[value];
  const found = RESUME_TEMPLATE_CATALOG.find((t) => t.id === value);
  return found?.id ?? DEFAULT_A4_TEMPLATE;
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
