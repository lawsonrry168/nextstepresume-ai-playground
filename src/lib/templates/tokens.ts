import type { TemplateStyle, TemplateFamily } from "../resumeTemplateCatalog";

/**
 * Retro Stationery design tokens — single source of truth for all 31 templates.
 * Preview (CSS), DOCX, and PDF exports all derive their colors/fonts from here.
 * See docs/template-redesign-31.md for the full design spec.
 */

export const STATIONERY = {
  paper: "#FAF6EB",
  paperTint: "#FBF3DC",
  ink: "#1A2438",
  graphite: "#535C68",
  red: "#C0392B",
  redDeep: "#A93226",
  marker: "#F5D76E",
  mint: "#D4EDDA",
  teal: "#2E7D74",
  rule: "#C5D9E8",
  ruleDeep: "#5B8FB9",
  eraser: "#F2C1C1",
} as const;

export type TemplateFontId = "display-serif" | "serif" | "sans" | "mono";

export const TEMPLATE_FONTS: Record<TemplateFontId, { css: string; docx: string }> = {
  "display-serif": { css: '"Playfair Display", Georgia, "Noto Serif TC", serif', docx: "Georgia" },
  serif: { css: '"Source Serif 4", Georgia, "Noto Serif TC", serif', docx: "Georgia" },
  sans: { css: '"Public Sans", "Inter", "Noto Sans TC", sans-serif', docx: "Calibri" },
  mono: { css: '"IBM Plex Mono", Consolas, "Noto Sans Mono TC", monospace', docx: "Consolas" },
};

export type TemplateLayoutArchetype =
  | "single"
  | "sidebar-left"
  | "sidebar-right"
  | "two-column"
  | "timeline"
  | "header-band";

export type TemplateDensity = "airy" | "regular" | "compact";
export type TemplateTitleCase = "upper" | "smallcaps" | "none";

export interface TemplateColors {
  paper: string;
  ink: string;
  muted: string;
  /** The single lead accent for the design (rule: one accent per template). */
  accent: string;
  /** Soft tint used for chips/shading. */
  accentSoft: string;
  /** Highlighter sweep background (never a text color). */
  highlight: string;
  rule: string;
  datesColor: string;
  /** Name color when it differs from accent (e.g. blueprint keeps a red name). */
  nameColor?: string;
}

export interface TemplateDecorations {
  ruledLines?: boolean;
  marginLine?: { double?: boolean };
  gridPaper?: boolean;
  highlightMarker?: boolean;
  stickers?: boolean;
  numberedSections?: boolean;
  timelineThread?: boolean;
  dividerGlyph?: string;
  monogram?: boolean;
  dottedLeaders?: boolean;
  contactBand?: boolean;
  metaBox?: boolean;
  stitchedBorder?: boolean;
  rowShading?: boolean;
  sectionCards?: boolean;
  cornerTick?: boolean;
  stampContact?: boolean;
  cursorBlock?: boolean;
  nameUnderline?: "double";
  centeredHeader?: boolean;
}

export interface TemplateDefinition {
  /** Canonical id — matches TemplateStyle for storage compatibility. */
  id: TemplateStyle;
  family: TemplateFamily;
  /** Redesign catalog id (notebook/bureau/studio numbering). */
  designId: string;
  layout: TemplateLayoutArchetype;
  density: TemplateDensity;
  colors: TemplateColors;
  typography: {
    display: TemplateFontId;
    body: TemplateFontId;
    label: TemplateFontId;
    titleCase: TemplateTitleCase;
  };
  decorations: TemplateDecorations;
}

const S = STATIONERY;

function baseColors(overrides?: Partial<TemplateColors>): TemplateColors {
  return {
    paper: S.paper,
    ink: S.ink,
    muted: S.graphite,
    accent: S.red,
    accentSoft: S.mint,
    highlight: S.marker,
    rule: S.rule,
    datesColor: S.graphite,
    ...overrides,
  };
}

type PartialDef = {
  designId: string;
  layout: TemplateLayoutArchetype;
  density?: TemplateDensity;
  colors?: Partial<TemplateColors>;
  typography?: Partial<TemplateDefinition["typography"]>;
  decorations: TemplateDecorations;
};

function buildFamily(
  family: TemplateFamily,
  typographyDefaults: TemplateDefinition["typography"],
  defs: PartialDef[],
): TemplateDefinition[] {
  return defs.map((def, index) => ({
    id: `${family}-${String(index + 1).padStart(2, "0")}` as TemplateStyle,
    family,
    designId: def.designId,
    layout: def.layout,
    density: def.density ?? "regular",
    colors: baseColors(def.colors),
    typography: { ...typographyDefaults, ...def.typography },
    decorations: def.decorations,
  }));
}

/** Notebook 筆記本系 — Lined Paper / Legal Pad direct lineage (legacy family: modern). */
const NOTEBOOK: TemplateDefinition[] = buildFamily(
  "modern",
  { display: "display-serif", body: "serif", label: "sans", titleCase: "upper" },
  [
    {
      designId: "notebook-01",
      layout: "sidebar-left",
      decorations: { ruledLines: true, marginLine: {}, highlightMarker: true, stickers: true },
    },
    {
      designId: "notebook-02",
      layout: "single",
      colors: { paper: S.paperTint, datesColor: S.red },
      decorations: { marginLine: { double: true } },
    },
    {
      designId: "notebook-03",
      layout: "single",
      colors: { accent: S.teal, nameColor: S.red },
      decorations: { gridPaper: true },
    },
    {
      designId: "notebook-04",
      layout: "single",
      decorations: { sectionCards: true },
    },
    {
      designId: "notebook-05",
      layout: "single",
      typography: { titleCase: "none" },
      decorations: { centeredHeader: true, nameUnderline: "double", ruledLines: true },
    },
    {
      designId: "notebook-06",
      layout: "sidebar-right",
      decorations: { stickers: true },
    },
    {
      designId: "notebook-07",
      layout: "single",
      decorations: { highlightMarker: true },
    },
    {
      designId: "notebook-08",
      layout: "timeline",
      decorations: { timelineThread: true, stitchedBorder: true },
    },
    {
      designId: "notebook-09",
      layout: "single",
      colors: { accent: S.ruleDeep, nameColor: S.red },
      decorations: { ruledLines: true },
    },
    {
      designId: "notebook-10",
      layout: "single",
      colors: { accent: S.teal, datesColor: S.red },
      decorations: { rowShading: true },
    },
    {
      designId: "notebook-11",
      layout: "single",
      colors: { accent: S.graphite, nameColor: S.ink },
      decorations: { stampContact: true, highlightMarker: true },
    },
  ],
);

/** Bureau 文書系 — serif, conservative, max ATS safety (legacy family: classic). */
const BUREAU: TemplateDefinition[] = buildFamily(
  "classic",
  { display: "display-serif", body: "serif", label: "serif", titleCase: "smallcaps" },
  [
    {
      designId: "bureau-01",
      layout: "single",
      decorations: { centeredHeader: true },
    },
    {
      designId: "bureau-02",
      layout: "timeline",
      decorations: {},
    },
    {
      designId: "bureau-03",
      layout: "single",
      typography: { titleCase: "upper" },
      decorations: {},
    },
    {
      designId: "bureau-04",
      layout: "single",
      colors: { accent: S.ink },
      decorations: { nameUnderline: "double" },
    },
    {
      designId: "bureau-05",
      layout: "single",
      decorations: { numberedSections: true },
    },
    {
      designId: "bureau-06",
      layout: "single",
      colors: { accent: S.teal, nameColor: S.ink },
      decorations: { monogram: true },
    },
    {
      designId: "bureau-07",
      layout: "single",
      decorations: { contactBand: true },
    },
    {
      designId: "bureau-08",
      layout: "single",
      density: "compact",
      decorations: { dottedLeaders: true },
    },
    {
      designId: "bureau-09",
      layout: "header-band",
      decorations: { metaBox: true },
    },
    {
      designId: "bureau-10",
      layout: "single",
      decorations: { centeredHeader: true, dividerGlyph: "❖" },
    },
  ],
);

/** Studio 極簡系 — sans, whitespace-driven (legacy family: minimalist). */
const STUDIO: TemplateDefinition[] = buildFamily(
  "minimalist",
  { display: "sans", body: "sans", label: "sans", titleCase: "upper" },
  [
    {
      designId: "studio-01",
      layout: "sidebar-left",
      colors: { accent: S.teal },
      decorations: {},
    },
    {
      designId: "studio-02",
      layout: "single",
      colors: { accent: S.teal },
      decorations: {},
    },
    {
      designId: "studio-03",
      layout: "single",
      density: "airy",
      colors: { accent: S.ink },
      decorations: { highlightMarker: true },
    },
    {
      designId: "studio-04",
      layout: "sidebar-right",
      colors: { accent: S.teal },
      decorations: {},
    },
    {
      designId: "studio-05",
      layout: "single",
      density: "airy",
      decorations: {},
    },
    {
      designId: "studio-06",
      layout: "single",
      colors: { accent: S.graphite },
      decorations: {},
    },
    {
      designId: "studio-07",
      layout: "two-column",
      colors: { accent: S.graphite },
      decorations: { cornerTick: true },
    },
    {
      designId: "studio-08",
      layout: "sidebar-left",
      colors: { accent: S.teal },
      decorations: { stickers: true },
    },
    {
      designId: "studio-09",
      layout: "single",
      colors: { accent: S.teal },
      typography: { display: "mono", label: "mono" },
      decorations: { cursorBlock: true },
    },
    {
      designId: "studio-10",
      layout: "single",
      density: "airy",
      decorations: {},
    },
  ],
);

export const TEMPLATE_DEFINITION_LIST: TemplateDefinition[] = [...NOTEBOOK, ...BUREAU, ...STUDIO];

const DEFINITION_MAP = new Map<string, TemplateDefinition>();
for (const def of TEMPLATE_DEFINITION_LIST) {
  DEFINITION_MAP.set(def.id, def);
  DEFINITION_MAP.set(def.designId, def);
}

export function getTemplateDefinition(style: TemplateStyle | string): TemplateDefinition {
  return DEFINITION_MAP.get(style) ?? TEMPLATE_DEFINITION_LIST[0];
}

/** CSS custom properties for the preview surface (phase 3 renderers consume these). */
export function templateCssVariables(def: TemplateDefinition): Record<string, string> {
  const vars: Record<string, string> = {
    "--tpl-paper": def.colors.paper,
    "--tpl-ink": def.colors.ink,
    "--tpl-muted": def.colors.muted,
    "--tpl-accent": def.colors.accent,
    "--tpl-accent-soft": def.colors.accentSoft,
    "--tpl-highlight": def.colors.highlight,
    "--tpl-rule": def.colors.rule,
    "--tpl-dates": def.colors.datesColor,
    "--tpl-name": def.colors.nameColor ?? def.colors.accent,
    "--tpl-font-display": TEMPLATE_FONTS[def.typography.display].css,
    "--tpl-font-body": TEMPLATE_FONTS[def.typography.body].css,
    "--tpl-font-label": TEMPLATE_FONTS[def.typography.label].css,
  };
  if (def.decorations.dividerGlyph) {
    vars["--tpl-divider"] = `"${def.decorations.dividerGlyph}"`;
  }
  return vars;
}

/**
 * Decoration classes for the sheet root — each `tpl-*` class activates a
 * token-driven CSS rule in index.css. Marginalia keeps its own bespoke chrome.
 */
export function templateDecorClasses(def: TemplateDefinition): string {
  if (def.designId === "notebook-01") return "";
  const d = def.decorations;
  const classes: string[] = ["tpl-paper", "tpl-fonts"];

  if (d.ruledLines) classes.push("tpl-ruled");
  if (d.gridPaper) classes.push("tpl-grid-paper");
  if (d.marginLine) classes.push(d.marginLine.double ? "tpl-margin-line tpl-margin-line--double" : "tpl-margin-line");
  if (d.stitchedBorder) classes.push("tpl-stitched");
  if (d.cornerTick) classes.push("tpl-corner-tick");
  if (d.numberedSections) classes.push("tpl-numbered");
  if (d.dividerGlyph) classes.push("tpl-divider-glyph");
  if (d.cursorBlock) classes.push("tpl-cursor-title");
  if (d.highlightMarker) classes.push("tpl-marker-title");
  if (d.nameUnderline === "double") classes.push("tpl-name-underline");
  if (d.centeredHeader) classes.push("tpl-header-centered");
  if (d.timelineThread || def.layout === "timeline") classes.push("tpl-timeline");
  if (d.rowShading) classes.push("tpl-row-shading");
  if (d.stampContact) classes.push("tpl-stamp-contact");
  if (d.monogram) classes.push("tpl-monogram");
  if (d.metaBox) classes.push("tpl-meta-box");
  if (d.sectionCards) classes.push("tpl-section-cards");
  if (def.layout === "two-column") classes.push("tpl-two-col");
  if (def.layout === "sidebar-right") classes.push("tpl-sidebar-right");
  if (def.density === "compact") classes.push("tpl-density-compact");
  if (def.density === "airy") classes.push("tpl-density-airy");

  return classes.join(" ");
}
