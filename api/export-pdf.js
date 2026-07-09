var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/exportPdfStandalone.ts
var exportPdfStandalone_exports = {};
__export(exportPdfStandalone_exports, {
  default: () => handler
});
module.exports = __toCommonJS(exportPdfStandalone_exports);

// src/lib/market/config.ts
var HK_MARKET = {
  id: "hk",
  label: "Hong Kong",
  defaultLocale: "en",
  locales: ["en", "zh-HK"],
  currency: "HKD",
  currencySymbol: "HK$",
  pricing: {
    starter: { monthly: 0, yearly: 0 },
    pro: { monthly: 88, yearly: 688 },
    max: { monthly: 188, yearly: 1688 }
  },
  sprintPassHkd: 128,
  jobs: {
    primaryPlatform: "jobsdb",
    defaultJobsdbCountry: "hk",
    defaultImportMode: "jobsdb",
    platformHints: ["JobsDB HK", "LinkedIn", "CTgoodjobs", "Indeed HK"]
  },
  spelling: "en-GB",
  salaryUnit: "monthly",
  regionLabel: "Hong Kong"
};
function getActiveMarket() {
  return HK_MARKET;
}
function isHongKongMarket() {
  return getActiveMarket().id === "hk";
}

// src/i18n/types.ts
var DEFAULT_LOCALE = getActiveMarket().defaultLocale;
function getMarketLocales() {
  const fromMarket = getActiveMarket().locales;
  return fromMarket.length ? fromMarket : ["en", "zh-HK"];
}
function normalizeStoredUiLocale(raw) {
  const allowed = getMarketLocales();
  if (raw === "zh-TW" && allowed.includes("zh-HK")) return "zh-HK";
  if (raw && allowed.includes(raw)) return raw;
  return DEFAULT_LOCALE;
}

// src/i18n/translate.ts
var MESSAGES = {};
var activeLocale = DEFAULT_LOCALE;
function getActiveLocale() {
  return activeLocale;
}
function resolvePath(tree, path) {
  const parts = path.split(".");
  let node = tree;
  for (const part of parts) {
    if (node == null || typeof node === "string") return void 0;
    node = node[part];
  }
  return typeof node === "string" ? node : void 0;
}
function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = vars[key];
    return value === void 0 ? `{{${key}}}` : String(value);
  });
}
function translate(key, vars, locale = activeLocale) {
  const tree = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
  const primary = tree ? resolvePath(tree, key) : void 0;
  if (primary) return interpolate(primary, vars);
  if (locale !== DEFAULT_LOCALE) {
    const fallbackTree = MESSAGES[DEFAULT_LOCALE];
    const fallback = fallbackTree ? resolvePath(fallbackTree, key) : void 0;
    if (fallback) return interpolate(fallback, vars);
  }
  return key;
}
function t(key, vars, locale) {
  return translate(key, vars, locale);
}

// src/lib/sectionLabels.ts
function formatCanvasPageLabel(index, locale) {
  return t("canvas.pageLabel", { index }, locale ?? getActiveLocale());
}

// src/lib/layoutDocument/geometry.ts
var LAYOUT_PAGE_WIDTH = 794;
var LAYOUT_PAGE_HEIGHT = 1123;
var LAYOUT_PAGE_MARGIN = 48;
var LAYOUT_CONTENT_WIDTH = LAYOUT_PAGE_WIDTH - LAYOUT_PAGE_MARGIN * 2;
var LAYOUT_CONTENT_HEIGHT = LAYOUT_PAGE_HEIGHT - LAYOUT_PAGE_MARGIN * 2;

// src/lib/storageKeys.ts
var NSR_STORAGE_KEYS = {
  tourSeen: "nsr_tour_seen",
  appSidebarCollapsed: "nsr_app_sidebar_collapsed",
  playgroundSidebarCollapsed: "nsr_playground_sidebar_collapsed",
  applicationPackages: "nsr_application_packages",
  editorPreviewSplit: "nsr_playground_editor_preview_split",
  followUpPrefs: "nsr_follow_up_notification_prefs",
  followUpNotified: "nsr_follow_up_notified_keys",
  workspaceResume: "nsr_workspace_resume",
  workspaceJd: "nsr_workspace_jd",
  workspaceTemplate: "nsr_workspace_template",
  themeCustomization: "nsr_theme_customization",
  freeLayoutByFamily: "nsr_free_layout_by_family",
  freeLayoutEnabled: "nsr_free_layout_enabled",
  freeLayoutSnap: "nsr_free_layout_snap",
  freeLayoutLivePreview: "nsr_free_layout_live_preview",
  canvasViewport: "nsr_canvas_viewport",
  studioViewMode: "nsr_studio_view_mode",
  canvasPages: "nsr_canvas_pages",
  canvasLayers: "nsr_canvas_layers",
  canvasStudioUi: "nsr_canvas_studio_ui",
  uiLocale: "nsr_ui_locale",
  subscriptionPlan: "nsr_subscription_plan",
  usageLedger: "nsr_usage_ledger",
  clientId: "nsr_client_id",
  workspaceCloudUpdatedAt: "nsr_workspace_cloud_updated_at",
  packagesCloudUpdatedAt: "nsr_packages_cloud_updated_at",
  /** Seed demo / two-page layout contract version — see demoSchemaMigration.ts */
  demoSchemaVersion: "nsr_demo_schema_version"
};

// src/lib/a4Page.ts
var A4_PAGE_WIDTH = LAYOUT_PAGE_WIDTH;
var A4_PAGE_HEIGHT = LAYOUT_PAGE_HEIGHT;
var A4_CONTENT_WIDTH = LAYOUT_CONTENT_WIDTH;
var A4_PAGE_INLINE_STYLE = {
  width: `${A4_PAGE_WIDTH}px`,
  maxWidth: `${A4_PAGE_WIDTH}px`,
  minHeight: `${A4_PAGE_HEIGHT}px`,
  height: `${A4_PAGE_HEIGHT}px`,
  maxHeight: `${A4_PAGE_HEIGHT}px`,
  boxSizing: "border-box"
};

// src/lib/canvasStudioTypes.ts
var CANVAS_PAGE_WIDTH = LAYOUT_PAGE_WIDTH;
var CANVAS_PAGE_HEIGHT = LAYOUT_PAGE_HEIGHT;

// src/lib/resumeFreeLayout.ts
var FREE_LAYOUT_BY_FAMILY_KEY = NSR_STORAGE_KEYS.freeLayoutByFamily;
var FREE_LAYOUT_ENABLED_KEY = NSR_STORAGE_KEYS.freeLayoutEnabled;
var FREE_LAYOUT_SNAP_KEY = NSR_STORAGE_KEYS.freeLayoutSnap;
var FREE_LAYOUT_LIVE_PREVIEW_KEY = NSR_STORAGE_KEYS.freeLayoutLivePreview;
var SNAP_GRID_SIZE = 24;
var FREE_LAYOUT_MIN_WIDTH = 180;
var FREE_LAYOUT_MAX_WIDTH = A4_CONTENT_WIDTH;
var FREE_LAYOUT_MIN_HEIGHT = 72;
var FREE_LAYOUT_MAX_HEIGHT = 1027;
var DEFAULT_SECTION_HEIGHT = {
  header: 150,
  summary: 120,
  experience: 260,
  education: 110,
  projects: 150,
  skills: 110,
  certifications: 100,
  volunteer: 100,
  languages: 80
};
function clampSectionHeight(height, maxHeight = FREE_LAYOUT_MAX_HEIGHT) {
  return Math.min(maxHeight, Math.max(FREE_LAYOUT_MIN_HEIGHT, height));
}
function snapToGrid(value, grid = SNAP_GRID_SIZE) {
  return Math.round(value / grid) * grid;
}
function clampSectionWidth(width, x, canvasWidth) {
  const maxWidth = canvasWidth - x - 8;
  return Math.min(FREE_LAYOUT_MAX_WIDTH, Math.max(FREE_LAYOUT_MIN_WIDTH, Math.min(width, maxWidth)));
}
function clampSectionPosition(pos, canvasWidth = FREE_LAYOUT_CANVAS.width) {
  const width = clampSectionWidth(pos.width, pos.x, canvasWidth);
  const next = {
    x: Math.max(0, Math.min(pos.x, canvasWidth - width)),
    y: Math.max(0, pos.y),
    width,
    height: clampSectionHeight(pos.height)
  };
  if (typeof pos.pageId === "string" && pos.pageId.trim()) {
    next.pageId = pos.pageId;
  }
  return next;
}
function defaultSectionHeight(sectionId) {
  return DEFAULT_SECTION_HEIGHT[sectionId] ?? 140;
}
var FREE_LAYOUT_CANVAS = {
  width: CANVAS_PAGE_WIDTH,
  minHeight: CANVAS_PAGE_HEIGHT
};

// src/lib/canvasPageSnap.ts
function clampPositionToA4Page(pos) {
  const width = Math.min(
    Math.max(pos.width, FREE_LAYOUT_MIN_WIDTH),
    FREE_LAYOUT_MAX_WIDTH,
    CANVAS_PAGE_WIDTH
  );
  const height = Math.min(
    Math.max(pos.height, FREE_LAYOUT_MIN_HEIGHT),
    FREE_LAYOUT_MAX_HEIGHT,
    CANVAS_PAGE_HEIGHT
  );
  const x = Math.max(0, Math.min(pos.x, CANVAS_PAGE_WIDTH - width));
  const y = Math.max(0, Math.min(pos.y, CANVAS_PAGE_HEIGHT - height));
  return { ...pos, x, y, width, height };
}

// src/lib/canvasAlignTools.ts
var CANVAS_PAGE_MARGIN = LAYOUT_PAGE_MARGIN;

// src/lib/resumeHkMeta.ts
function getHkPersonalMetaLines(info) {
  const lines = [];
  if (info.rightToWork?.trim()) lines.push(info.rightToWork.trim());
  if (info.noticePeriod?.trim()) lines.push(`Notice: ${info.noticePeriod.trim()}`);
  if (info.expectedSalary?.trim()) lines.push(`Expected: ${info.expectedSalary.trim()}`);
  return lines;
}

// src/lib/measure/textMeasure.ts
var RESUME_BODY_FONT = {
  family: 'Georgia, "Times New Roman", "Noto Serif TC", serif',
  size: 12
};
var FALLBACK_CHAR_WIDTH = 7.2;
var measureCtx;
function getMeasureContext() {
  if (measureCtx !== void 0) return measureCtx;
  try {
    if (typeof document === "undefined") {
      measureCtx = null;
      return null;
    }
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    measureCtx = ctx && typeof ctx.measureText === "function" ? ctx : null;
  } catch {
    measureCtx = null;
  }
  return measureCtx;
}
function isPixelMeasureAvailable() {
  return getMeasureContext() !== null;
}
function countWrappedLines(text, maxWidth, font = RESUME_BODY_FONT) {
  const trimmed = text.trim();
  if (!trimmed || maxWidth <= 0) return 0;
  const ctx = getMeasureContext();
  if (!ctx) {
    const charWidth = FALLBACK_CHAR_WIDTH * (font.size / 14);
    const charsPerLine = Math.max(18, Math.floor(maxWidth / charWidth));
    return fallbackWrappedLineCount(trimmed, charsPerLine);
  }
  ctx.font = `${font.weight ?? 400} ${font.size}px ${font.family}`;
  const spaceWidth = ctx.measureText(" ").width;
  const words = trimmed.split(/\s+/);
  let lines = 1;
  let lineWidth = 0;
  for (const word of words) {
    const wordWidth = ctx.measureText(word).width;
    if (wordWidth > maxWidth) {
      const remaining = lineWidth > 0 ? maxWidth - lineWidth - spaceWidth : maxWidth;
      const overflow = Math.max(0, wordWidth - Math.max(0, remaining));
      lines += Math.ceil(overflow / maxWidth);
      lineWidth = wordWidth % maxWidth;
      continue;
    }
    if (lineWidth === 0) {
      lineWidth = wordWidth;
    } else if (lineWidth + spaceWidth + wordWidth > maxWidth) {
      lines += 1;
      lineWidth = wordWidth;
    } else {
      lineWidth += spaceWidth + wordWidth;
    }
  }
  return lines;
}
function fallbackWrappedLineCount(text, charsPerLine) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const words = trimmed.split(/\s+/);
  let lines = 1;
  let col = 0;
  for (const word of words) {
    const token = word.length;
    if (token >= charsPerLine) {
      lines += Math.ceil(token / charsPerLine);
      col = 0;
      continue;
    }
    if (col === 0) {
      col = token;
    } else if (col + 1 + token > charsPerLine) {
      lines += 1;
      col = token;
    } else {
      col += 1 + token;
    }
  }
  return lines;
}

// src/lib/canvasSectionContentSizing.ts
var LINE_HEIGHT = 22;
var SECTION_CHROME = 36;
var SECTION_CONTENT_PADDING = 16;
var CHAR_WIDTH = FALLBACK_CHAR_WIDTH;
var CANVAS_SECTION_MAX_HEIGHT = 1027;
function wrappedLinesAtWidth(text, contentWidth2, charsPerLine) {
  if (isPixelMeasureAvailable()) {
    return countWrappedLines(text, contentWidth2, RESUME_BODY_FONT);
  }
  return fallbackWrappedLineCount(text, charsPerLine);
}
function sectionContentWidth(width) {
  return Math.max(120, width - SECTION_CONTENT_PADDING * 2);
}
function estimateBlockLines(texts, charsPerLine, extraLines = 0, contentWidth2) {
  const w = contentWidth2 ?? charsPerLine * CHAR_WIDTH;
  return extraLines + texts.reduce((sum, t2) => sum + wrappedLinesAtWidth(t2, w, charsPerLine), 0);
}
function getSectionTextLength(sectionId, data) {
  switch (sectionId) {
    case "header": {
      const p = data.personalInfo;
      return [
        p.name,
        p.title,
        p.email,
        p.phone,
        p.location,
        p.linkedin,
        p.website,
        ...getHkPersonalMetaLines(p)
      ].join(" ").length;
    }
    case "summary":
      return data.summary?.trim().length ?? 0;
    case "experience":
      return data.experience.reduce(
        (sum, item) => sum + item.company.length + item.role.length + item.bullets.join(" ").length + item.location.length + 20,
        0
      );
    case "education":
      return data.education.reduce(
        (sum, item) => sum + item.institution.length + item.degree.length + item.field.length + 16,
        0
      );
    case "projects":
      return data.projects.reduce(
        (sum, item) => sum + item.name.length + item.description.length + item.techStack.length + 16,
        0
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
function estimateCharsPerLine(width) {
  return Math.max(18, Math.floor(width / CHAR_WIDTH));
}
function marginaliaSectionChrome(sectionId) {
  if (sectionId === "experience" || sectionId === "projects") return 56;
  if (sectionId === "header") return 28;
  if (sectionId === "skills") return 32;
  return 20;
}
function estimateSectionHeightForContent(sectionId, data, width) {
  const textLen = getSectionTextLength(sectionId, data);
  if (textLen === 0) return defaultSectionHeight(sectionId);
  const charsPerLine = estimateCharsPerLine(width);
  const contentWidth2 = sectionContentWidth(width);
  let contentLines = 0;
  switch (sectionId) {
    case "header": {
      const p = data.personalInfo;
      contentLines = estimateBlockLines([p.name, p.title], charsPerLine, 0, contentWidth2);
      const contactFields = [p.email, p.phone, p.location, p.website, p.linkedin].filter(Boolean).length;
      const hkMetaRows = getHkPersonalMetaLines(p).length;
      const contactRowFactor = contentWidth2 < 340 ? 1.5 : 0.85;
      const hkMetaFactor = contentWidth2 < 340 ? 1.85 : 1.75;
      contentLines += contactFields * contactRowFactor + hkMetaRows * hkMetaFactor;
      break;
    }
    case "summary":
      contentLines = 1 + wrappedLinesAtWidth(data.summary ?? "", contentWidth2, charsPerLine);
      break;
    case "experience": {
      contentLines = 1;
      for (const item of data.experience) {
        contentLines += estimateBlockLines(
          [
            `${item.role} at ${item.company}`,
            `${item.startDate} \u2013 ${item.endDate}${item.location ? ` \xB7 ${item.location}` : ""}`,
            ...item.bullets
          ],
          charsPerLine,
          1,
          contentWidth2
        );
      }
      break;
    }
    case "education": {
      contentLines = 1;
      for (const item of data.education) {
        contentLines += estimateBlockLines(
          [item.degree, `${item.institution} \xB7 ${item.gradDate}${item.field ? ` \xB7 ${item.field}` : ""}`],
          charsPerLine,
          1,
          contentWidth2
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
          contentWidth2
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
function estimateContentAwareGap(heights) {
  if (!heights.length) return 12;
  const avg = heights.reduce((a, b) => a + b, 0) / heights.length;
  if (avg >= 240) return 16;
  if (avg >= 160) return 12;
  if (avg >= 100) return 10;
  return 8;
}

// src/lib/resumeTemplateCatalog.ts
var MODERN_PRESETS = [
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
    sheetFont: "font-serif"
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
  { accentBar: "from-[#535C68] to-[#1A2438]", accentText: "text-[#535C68]", accentBg: "bg-[#535C68]", nameClass: "font-display text-[#1A2438]", sidebarDot: "bg-[#535C68]", roleAccent: "text-[#535C68]", sectionTitle: "border-b border-[#535C68]/30" }
];
var CLASSIC_PRESETS = [
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
  { accentText: "text-[#C0392B]", headerBorder: "border-[#C5D9E8]", nameClass: "uppercase tracking-widest", sectionTitle: "border-b border-[#C5D9E8]" }
];
var MINIMAL_PRESETS = [
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
  { accentText: "text-[#C0392B]", sidebarDot: "bg-[#C0392B]", sidebarTitle: "text-[#535C68]", roleAccent: "text-[#C0392B]" }
];
function buildFamilyThemes(family, presets, defaults) {
  return presets.map((preset, index) => {
    const id = `${family}-${String(index + 1).padStart(2, "0")}`;
    return {
      ...defaults,
      ...preset,
      id,
      family
    };
  });
}
var MODERN_DEFAULTS = {
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
  sheetFont: "font-serif"
};
var CLASSIC_DEFAULTS = {
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
  sheetFont: "font-serif"
};
var MINIMAL_DEFAULTS = {
  ...MODERN_DEFAULTS,
  sheetFont: "font-sans"
};
var MARGINALIA_NOTEBOOK_TEMPLATE = "modern-01";
var DEFAULT_A4_TEMPLATE = "classic-02";
function isMarginaliaNotebookTemplate(style) {
  return style === MARGINALIA_NOTEBOOK_TEMPLATE;
}
var RESUME_TEMPLATE_CATALOG = [
  ...buildFamilyThemes("modern", MODERN_PRESETS, MODERN_DEFAULTS),
  ...buildFamilyThemes("classic", CLASSIC_PRESETS, CLASSIC_DEFAULTS),
  ...buildFamilyThemes("minimalist", MINIMAL_PRESETS, MINIMAL_DEFAULTS)
];
var LEGACY_TEMPLATE_MAP = {
  modern: "modern-01",
  academic: "classic-01",
  classic: "classic-01",
  minimalist: "minimalist-01"
};
function normalizeTemplateStyle(value) {
  if (!value) return DEFAULT_A4_TEMPLATE;
  if (value in LEGACY_TEMPLATE_MAP) return LEGACY_TEMPLATE_MAP[value];
  const found = RESUME_TEMPLATE_CATALOG.find((t2) => t2.id === value);
  return found?.id ?? DEFAULT_A4_TEMPLATE;
}

// src/lib/canvasLayoutTools.ts
var DEFAULT_OPTS = {
  margin: CANVAS_PAGE_MARGIN,
  gap: 16,
  pageWidth: CANVAS_PAGE_WIDTH,
  pageHeight: CANVAS_PAGE_HEIGHT,
  layerOrder: []
};
function resolveOpts(options) {
  return { ...DEFAULT_OPTS, ...options };
}
function mergeLayoutOptions(options, content) {
  const resumeData = content?.resumeData ?? options?.resumeData;
  const layerOrder = content?.layerOrder ?? options?.layerOrder;
  if (!options && !resumeData && !layerOrder) return void 0;
  return { ...options, resumeData, layerOrder };
}
function sortSectionsByPanelOrder(sectionIds, layerOrder) {
  const panelOrder = [...layerOrder].reverse();
  const rank = new Map(panelOrder.map((id, index) => [id, index]));
  return [...sectionIds].sort((a, b) => {
    const ra = rank.get(a);
    const rb = rank.get(b);
    if (ra !== void 0 && rb !== void 0) return ra - rb;
    if (ra !== void 0) return -1;
    if (rb !== void 0) return 1;
    return a.localeCompare(b);
  });
}
function sectionsOnPage(sectionIds, positions, pageId, getPageId, layerOrder) {
  const onPage = sectionIds.filter((id) => getPageId(id) === pageId);
  if (layerOrder?.length) {
    return sortSectionsByPanelOrder(onPage, layerOrder);
  }
  return onPage.sort((a, b) => {
    const ya = positions[a]?.y ?? 0;
    const yb = positions[b]?.y ?? 0;
    if (ya !== yb) return ya - yb;
    return a.localeCompare(b);
  });
}
function resolveStackGap(heights, opts, preferredGap) {
  if (heights.length <= 1) return preferredGap ?? opts.gap;
  const totalH = heights.reduce((a, b) => a + b, 0);
  const usable = opts.pageHeight - opts.margin * 2;
  let gap = preferredGap ?? (opts.resumeData ? estimateContentAwareGap(heights) : opts.gap);
  if (totalH + gap * (heights.length - 1) > usable) {
    gap = Math.floor((usable - totalH) / (heights.length - 1));
  } else if (opts.resumeData && totalH < usable * 0.88) {
    const fillGap = Math.floor((usable - totalH) / (heights.length - 1));
    gap = Math.min(48, Math.max(gap, fillGap));
  }
  return Math.max(8, gap);
}
var A4_PRINTABLE_HEIGHT = CANVAS_PAGE_HEIGHT - CANVAS_PAGE_MARGIN * 2;
var A4_MIN_SECTION_GAP = 8;
var A4_COMPACT_SECTION_GAP = 8;
function computeA4VerticalStack(orderedIds, patches, opts, mode, preferredGap, startY) {
  if (!orderedIds.length) return patches;
  const stackTop = startY ?? opts.margin;
  const next = { ...patches };
  const heights = orderedIds.map((id) => next[id]?.height ?? 0);
  const totalH = heights.reduce((a, b) => a + b, 0);
  const usable = opts.pageHeight - stackTop - opts.margin;
  const count = orderedIds.length;
  let gap;
  const gaps = [];
  if (mode === "compact" && count > 1) {
    gap = snapToGrid(Math.max(A4_MIN_SECTION_GAP, preferredGap ?? opts.gap ?? A4_COMPACT_SECTION_GAP), SNAP_GRID_SIZE);
  } else if (mode === "fill-page-exact" && count > 1) {
    const slack = Math.max(0, usable - totalH);
    if (slack <= 0) {
      gap = A4_MIN_SECTION_GAP;
    } else {
      const base = Math.floor(slack / (count - 1));
      const remainder = slack - base * (count - 1);
      for (let i = 0; i < count - 1; i++) {
        gaps.push(Math.max(A4_MIN_SECTION_GAP, base + (i < remainder ? 1 : 0)));
      }
      gap = gaps[0] ?? A4_MIN_SECTION_GAP;
    }
  } else if (mode === "fill-page" && count > 1) {
    const slack = Math.max(0, usable - totalH);
    gap = slack <= 0 ? A4_MIN_SECTION_GAP : Math.max(A4_MIN_SECTION_GAP, Math.floor(slack / (count - 1)));
  } else if (mode === "align-bottom") {
    gap = count > 1 ? snapToGrid(Math.max(A4_MIN_SECTION_GAP, preferredGap ?? estimateContentAwareGap(heights)), SNAP_GRID_SIZE) : 0;
  } else {
    gap = resolveStackGap(heights, opts, preferredGap);
    if (count > 1 && totalH + gap * (count - 1) > usable) {
      gap = Math.max(A4_MIN_SECTION_GAP, Math.floor((usable - totalH) / (count - 1)));
    }
  }
  let y;
  if (mode === "align-bottom") {
    let bottomY = opts.pageHeight - opts.margin;
    for (let i = count - 1; i >= 0; i--) {
      const id = orderedIds[i];
      const pos = next[id];
      if (!pos) continue;
      bottomY -= pos.height;
      next[id] = { ...pos, y: bottomY };
      if (i > 0) bottomY -= gap;
    }
    return next;
  }
  y = stackTop;
  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i];
    const pos = next[id];
    if (!pos) continue;
    next[id] = { ...pos, y };
    const stepGap = mode === "fill-page-exact" && gaps.length ? gaps[i] ?? gap : gap;
    y += pos.height + stepGap;
  }
  return next;
}
function groupIdsByColumnX(patches) {
  const entries = Object.entries(patches);
  if (!entries.length) return /* @__PURE__ */ new Map();
  const xs = [...new Set(entries.map(([, pos]) => pos.x))].sort((a, b) => a - b);
  const anchors = [];
  for (const x of xs) {
    if (anchors.some((anchor) => Math.abs(anchor - x) <= SNAP_GRID_SIZE * 2)) continue;
    anchors.push(x);
  }
  const byColumn = /* @__PURE__ */ new Map();
  for (const [id, pos] of entries) {
    let anchor = anchors[0];
    let best = Infinity;
    for (const candidate of anchors) {
      const dist = Math.abs(pos.x - candidate);
      if (dist < best) {
        best = dist;
        anchor = candidate;
      }
    }
    const bucket = byColumn.get(anchor) ?? [];
    bucket.push(id);
    byColumn.set(anchor, bucket);
  }
  return byColumn;
}
var FULL_WIDTH_BAND_RATIO = 0.7;
var BAND_TO_COLUMN_GAP = 16;
function fillColumnsToA4(patches, opts, mode = "fill-page-exact") {
  const printableWidth = opts.pageWidth - opts.margin * 2;
  const bandIds = [];
  const columnPatches = {};
  for (const [id, pos] of Object.entries(patches)) {
    if (pos.width >= printableWidth * FULL_WIDTH_BAND_RATIO) {
      bandIds.push(id);
    } else {
      columnPatches[id] = pos;
    }
  }
  let next = { ...patches };
  bandIds.sort((a, b) => (patches[a]?.y ?? 0) - (patches[b]?.y ?? 0));
  let bandBottom = opts.margin;
  for (const id of bandIds) {
    const pos = next[id];
    if (!pos) continue;
    next[id] = { ...pos, y: bandBottom };
    bandBottom += pos.height + A4_MIN_SECTION_GAP;
  }
  const columnStartY = bandIds.length ? bandBottom - A4_MIN_SECTION_GAP + BAND_TO_COLUMN_GAP : opts.margin;
  const byColumn = groupIdsByColumnX(columnPatches);
  for (const [columnX, ids] of byColumn.entries()) {
    const ordered = [...ids].sort((a, b) => (patches[a]?.y ?? 0) - (patches[b]?.y ?? 0));
    for (const id of ordered) {
      const pos = next[id];
      if (pos) next[id] = { ...pos, x: columnX };
    }
    next = computeA4VerticalStack(ordered, next, opts, mode, void 0, columnStartY);
  }
  return next;
}
function reflowPageColumnsNatural(sectionIds, positions, pageId, getPageId, content) {
  const opts = resolveOpts(mergeLayoutOptions(void 0, content));
  const onPage = sectionsOnPage(sectionIds, positions, pageId, getPageId, opts.layerOrder);
  if (!onPage.length) return positions;
  const patches = {};
  for (const id of onPage) {
    const pos = positions[id];
    if (pos) patches[id] = { ...pos, pageId };
  }
  const xs = onPage.map((id) => patches[id]?.x ?? opts.margin);
  const xSpread = xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
  const centers = onPage.map((id) => {
    const pos = patches[id];
    return pos ? pos.x + pos.width / 2 : opts.pageWidth / 2;
  });
  const centerSpread = centers.length ? Math.max(...centers) - Math.min(...centers) : 0;
  const isSingleColumnStack = xSpread <= SNAP_GRID_SIZE || centerSpread < 96;
  if (isSingleColumnStack) {
    const stackMode = content?.stackFillMode ?? "natural";
    const orderedByY = [...onPage].sort((a, b) => (patches[a]?.y ?? 0) - (patches[b]?.y ?? 0));
    const reflowed2 = computeA4VerticalStack(orderedByY, patches, opts, stackMode);
    return patchPositions(positions, reflowed2);
  }
  const reflowed = fillColumnsToA4(patches, opts, "natural");
  return patchPositions(positions, reflowed);
}
function patchPositions(positions, patches) {
  const next = {};
  for (const [id, pos] of Object.entries(patches)) {
    next[id] = clampSectionPosition({ ...positions[id], ...pos });
  }
  return next;
}

// src/lib/layoutEntryPagination.ts
var EXPORT_PAGE_PREFIX = "export-page-";
function createContinuationPageId(existingPageIds) {
  let index = existingPageIds.length;
  let candidate = `${EXPORT_PAGE_PREFIX}${index + 1}`;
  while (existingPageIds.includes(candidate)) {
    index += 1;
    candidate = `${EXPORT_PAGE_PREFIX}${index + 1}`;
  }
  return candidate;
}
var SECTION_FRAGMENT_SEP = "@f";
var LINE_HEIGHT2 = 22;
var SECTION_HEADING_LINES = 2;
var SPLITTABLE_SECTION_IDS = [
  "experience",
  "education",
  "projects"
];
function isSectionFragmentId(sectionId) {
  return sectionId.includes(SECTION_FRAGMENT_SEP);
}
function makeFragmentId(baseSectionId, fragmentIndex) {
  return `${baseSectionId}${SECTION_FRAGMENT_SEP}${fragmentIndex}`;
}
function contentWidth(width) {
  return Math.max(120, width - SECTION_CONTENT_PADDING * 2);
}
function linesToHeight(lines) {
  return snapToGrid(SECTION_CONTENT_PADDING + lines * LINE_HEIGHT2, SNAP_GRID_SIZE);
}
function estimateExperienceEntryLines(exp, bulletStart, bulletEnd, showHeader, width, themeFontScale) {
  const charsPerLine = estimateCharsPerLine(width);
  const w = contentWidth(width);
  const bullets = exp.bullets.slice(bulletStart, bulletEnd);
  let lines = showHeader ? estimateBlockLines(
    [
      `${exp.role} at ${exp.company}`,
      `${exp.startDate} \u2013 ${exp.endDate}${exp.location ? ` \xB7 ${exp.location}` : ""}`
    ],
    charsPerLine,
    0,
    w
  ) : 0;
  if (bullets.length > 0) {
    lines += estimateBlockLines(bullets, charsPerLine, 1, w);
  }
  if (themeFontScale !== 1) {
    lines = Math.ceil(lines * themeFontScale);
  }
  return Math.max(lines, 1);
}
function estimateEducationEntryLines(edu, width, themeFontScale) {
  const charsPerLine = estimateCharsPerLine(width);
  const w = contentWidth(width);
  let lines = estimateBlockLines(
    [edu.degree, `${edu.institution} \xB7 ${edu.gradDate}${edu.field ? ` \xB7 ${edu.field}` : ""}`],
    charsPerLine,
    0,
    w
  );
  if (themeFontScale !== 1) {
    lines = Math.ceil(lines * themeFontScale);
  }
  return Math.max(lines, 1);
}
function estimateProjectEntryLines(project, width, themeFontScale) {
  const charsPerLine = estimateCharsPerLine(width);
  const w = contentWidth(width);
  let lines = estimateBlockLines(
    [project.name, project.description, project.techStack ? `Tech: ${project.techStack}` : ""].filter(Boolean),
    charsPerLine,
    1,
    w
  );
  if (themeFontScale !== 1) {
    lines = Math.ceil(lines * themeFontScale);
  }
  return Math.max(lines, 1);
}
function splitExperienceSection(baseSectionId, pos, data, themeFontScale, continuationPageIds) {
  const maxBottom = CANVAS_PAGE_HEIGHT - CANVAS_PAGE_MARGIN;
  const fragments = [];
  let fragmentIndex = 0;
  let pageIndex = 0;
  let y = pos.y;
  const pageIdFor = (index) => index === 0 ? pos.pageId ?? continuationPageIds[0] : continuationPageIds[index] ?? continuationPageIds[continuationPageIds.length - 1];
  const available = () => maxBottom - y;
  const availableLines = () => Math.max(1, Math.floor(available() / LINE_HEIGHT2));
  let builder = {
    slices: [],
    lines: SECTION_HEADING_LINES,
    showHeading: true,
    pageIndex,
    y
  };
  const flush = () => {
    if (!builder.slices.length) return;
    const fragmentId = makeFragmentId(baseSectionId, fragmentIndex++);
    fragments.push({
      fragmentId,
      position: {
        ...pos,
        pageId: pageIdFor(builder.pageIndex),
        y: builder.y,
        height: clampSectionHeight(linesToHeight(builder.lines))
      },
      slice: {
        baseSectionId,
        fragmentIndex: fragmentIndex - 1,
        showHeading: builder.showHeading,
        continued: !builder.showHeading,
        experience: [...builder.slices]
      }
    });
    pageIndex += 1;
    y = CANVAS_PAGE_MARGIN;
    builder = {
      slices: [],
      lines: 0,
      showHeading: false,
      pageIndex,
      y
    };
  };
  for (const exp of data.experience) {
    let bulletStart = 0;
    while (bulletStart <= exp.bullets.length) {
      const showEntryHeader = bulletStart === 0;
      let bulletEnd = bulletStart === exp.bullets.length ? bulletStart : bulletStart + 1;
      let chunkLines = estimateExperienceEntryLines(
        exp,
        bulletStart,
        bulletEnd,
        showEntryHeader,
        pos.width,
        themeFontScale
      );
      while (bulletEnd < exp.bullets.length) {
        const tryLines = estimateExperienceEntryLines(
          exp,
          bulletStart,
          bulletEnd + 1,
          showEntryHeader,
          pos.width,
          themeFontScale
        );
        if (builder.lines + tryLines > availableLines()) break;
        bulletEnd += 1;
        chunkLines = tryLines;
      }
      if (builder.lines + chunkLines > availableLines() && builder.slices.length > 0) {
        flush();
      }
      if (bulletStart >= exp.bullets.length) {
        if (showEntryHeader) {
          const headerOnlyLines = estimateExperienceEntryLines(exp, 0, 0, true, pos.width, themeFontScale);
          if (builder.lines + headerOnlyLines > availableLines() && builder.slices.length > 0) {
            flush();
          }
          builder.slices.push({
            entryId: exp.id,
            bulletStart: 0,
            bulletEnd: 0,
            showEntryHeader: true
          });
          builder.lines += headerOnlyLines;
        }
        break;
      }
      builder.slices.push({
        entryId: exp.id,
        bulletStart,
        bulletEnd,
        showEntryHeader
      });
      builder.lines += chunkLines;
      bulletStart = bulletEnd;
    }
  }
  if (builder.slices.length) {
    flush();
  }
  return fragments.length > 1 ? fragments : [];
}
function splitEducationSection(baseSectionId, pos, data, themeFontScale, continuationPageIds) {
  const maxBottom = CANVAS_PAGE_HEIGHT - CANVAS_PAGE_MARGIN;
  const fragments = [];
  let fragmentIndex = 0;
  let pageIndex = 0;
  let y = pos.y;
  let showHeading = true;
  let currentEntries = [];
  let currentLines = SECTION_HEADING_LINES;
  const pageIdFor = (index) => index === 0 ? pos.pageId ?? continuationPageIds[0] : continuationPageIds[index] ?? continuationPageIds[continuationPageIds.length - 1];
  const available = () => maxBottom - y;
  const availableLines = () => Math.max(1, Math.floor(available() / LINE_HEIGHT2));
  const flush = () => {
    if (!currentEntries.length) return;
    const fragmentId = makeFragmentId(baseSectionId, fragmentIndex++);
    fragments.push({
      fragmentId,
      position: {
        ...pos,
        pageId: pageIdFor(pageIndex),
        y,
        height: clampSectionHeight(linesToHeight(currentLines))
      },
      slice: {
        baseSectionId,
        fragmentIndex: fragmentIndex - 1,
        showHeading,
        continued: !showHeading,
        education: [...currentEntries]
      }
    });
    showHeading = false;
    pageIndex += 1;
    y = CANVAS_PAGE_MARGIN;
    currentEntries = [];
    currentLines = 0;
  };
  for (const edu of data.education) {
    const entryLines = estimateEducationEntryLines(edu, pos.width, themeFontScale);
    if (currentLines + entryLines > availableLines() && currentEntries.length > 0) {
      flush();
    }
    currentEntries.push({ entryId: edu.id });
    currentLines += entryLines;
  }
  if (currentEntries.length) {
    flush();
  }
  return fragments.length > 1 ? fragments : [];
}
function splitProjectsSection(baseSectionId, pos, data, themeFontScale, continuationPageIds) {
  const maxBottom = CANVAS_PAGE_HEIGHT - CANVAS_PAGE_MARGIN;
  const fragments = [];
  let fragmentIndex = 0;
  let pageIndex = 0;
  let y = pos.y;
  let showHeading = true;
  let currentEntries = [];
  let currentLines = SECTION_HEADING_LINES;
  const pageIdFor = (index) => index === 0 ? pos.pageId ?? continuationPageIds[0] : continuationPageIds[index] ?? continuationPageIds[continuationPageIds.length - 1];
  const available = () => maxBottom - y;
  const availableLines = () => Math.max(1, Math.floor(available() / LINE_HEIGHT2));
  const flush = () => {
    if (!currentEntries.length) return;
    const fragmentId = makeFragmentId(baseSectionId, fragmentIndex++);
    fragments.push({
      fragmentId,
      position: {
        ...pos,
        pageId: pageIdFor(pageIndex),
        y,
        height: clampSectionHeight(linesToHeight(currentLines))
      },
      slice: {
        baseSectionId,
        fragmentIndex: fragmentIndex - 1,
        showHeading,
        continued: !showHeading,
        projects: [...currentEntries]
      }
    });
    showHeading = false;
    pageIndex += 1;
    y = CANVAS_PAGE_MARGIN;
    currentEntries = [];
    currentLines = 0;
  };
  for (const project of data.projects) {
    const entryLines = estimateProjectEntryLines(project, pos.width, themeFontScale);
    if (currentLines + entryLines > availableLines() && currentEntries.length > 0) {
      flush();
    }
    currentEntries.push({ entryId: project.id, showEntryHeader: true });
    currentLines += entryLines;
  }
  if (currentEntries.length) {
    flush();
  }
  return fragments.length > 1 ? fragments : [];
}
function shouldSplitSectionAtEntryLevel(sectionId, pos, resumeData) {
  if (!SPLITTABLE_SECTION_IDS.includes(sectionId)) return false;
  if (!sectionOverflowsPrintPage(pos)) return false;
  if (sectionId === "experience") return resumeData.experience.length > 0;
  if (sectionId === "education") return resumeData.education.length > 0;
  if (sectionId === "projects") return resumeData.projects.length > 0;
  return false;
}
function splitSectionIntoEntryFragments(sectionId, pos, resumeData, themeFontScale = 1, continuationPageIds = []) {
  const pageIds = pos.pageId ? [pos.pageId, ...continuationPageIds] : continuationPageIds;
  if (sectionId === "experience") return splitExperienceSection(sectionId, pos, resumeData, themeFontScale, pageIds);
  if (sectionId === "education") return splitEducationSection(sectionId, pos, resumeData, themeFontScale, pageIds);
  if (sectionId === "projects") return splitProjectsSection(sectionId, pos, resumeData, themeFontScale, pageIds);
  return [];
}
function applyEntryLevelPagination(sectionIds, positions, pageIds, resumeData, options) {
  if (options?.enabled === false) {
    return { positions, sectionSlices: {}, pageIds };
  }
  const themeFontScale = options?.themeFontScale ?? 1;
  const next = { ...positions };
  const sectionSlices = {};
  let workingPageIds = [...pageIds];
  for (const sectionId of sectionIds) {
    const pos = next[sectionId];
    if (!pos || isSectionFragmentId(sectionId)) continue;
    if (!shouldSplitSectionAtEntryLevel(sectionId, pos, resumeData)) continue;
    const startPageIndex = Math.max(0, workingPageIds.indexOf(pos.pageId ?? workingPageIds[0]));
    const continuationPageIds = workingPageIds.slice(startPageIndex + 1);
    let fragments = splitSectionIntoEntryFragments(sectionId, pos, resumeData, themeFontScale, continuationPageIds);
    if (fragments.length <= 1) continue;
    const extendedPageIds = [...workingPageIds];
    for (let i = 1; i < fragments.length; i++) {
      const targetIndex = startPageIndex + i;
      while (extendedPageIds.length <= targetIndex) {
        extendedPageIds.push(createContinuationPageId(extendedPageIds));
      }
    }
    fragments = fragments.map((frag, index) => {
      const pageId = extendedPageIds[startPageIndex + index];
      return {
        ...frag,
        position: {
          ...frag.position,
          pageId,
          y: index === 0 ? frag.position.y : CANVAS_PAGE_MARGIN
        }
      };
    });
    delete next[sectionId];
    for (const frag of fragments) {
      next[frag.fragmentId] = frag.position;
      sectionSlices[frag.fragmentId] = frag.slice;
    }
    workingPageIds = extendedPageIds;
  }
  return { positions: next, sectionSlices, pageIds: workingPageIds };
}

// src/lib/layoutExportSurface.ts
var EXPORT_PAGE_PREFIX2 = "export-page-";
function sectionPageBottom(pos) {
  return pos.y + pos.height;
}
function sectionOverflowsPrintPage(pos, pageHeight = CANVAS_PAGE_HEIGHT, margin = CANVAS_PAGE_MARGIN) {
  return sectionPageBottom(pos) > pageHeight - margin;
}
function printPlanPageHasContent(plan, sectionIds, pageId, layerOrder) {
  const getPageId = (id) => plan.positions[id]?.pageId ?? plan.pageIds[0] ?? pageId;
  if (sectionsOnPage(sectionIds, plan.positions, pageId, getPageId, layerOrder).length > 0) {
    return true;
  }
  return Object.entries(plan.positions).some(
    ([id, pos]) => !sectionIds.includes(id) && pos?.pageId === pageId
  );
}
function filterPrintPlanToNonemptyPages(plan, sectionIds, layerOrder) {
  const pageIds = plan.pageIds.filter(
    (pageId) => printPlanPageHasContent(plan, sectionIds, pageId, layerOrder)
  );
  return {
    ...plan,
    pageIds: pageIds.length ? pageIds : plan.pageIds.slice(0, 1)
  };
}
function createExportPageId(index) {
  return `${EXPORT_PAGE_PREFIX2}${index + 1}`;
}
function fitSectionHeightForExport(sectionId, pos, resumeData, themeFontScale, templateStyle) {
  let height = estimateSectionHeightForContent(sectionId, resumeData, pos.width);
  if (templateStyle && isMarginaliaNotebookTemplate(templateStyle)) {
    height = snapToGrid(height + marginaliaSectionChrome(sectionId), SNAP_GRID_SIZE);
  }
  if (themeFontScale !== 1) {
    height = Math.round(height * themeFontScale);
  }
  return snapToGrid(clampSectionHeight(height), SNAP_GRID_SIZE);
}
function studioUsesMultiplePages(sectionIds, studioPages, studioSectionPageMap, positions) {
  if (studioPages.length <= 1) return false;
  const primary = studioPages[0].id;
  return sectionIds.some((id) => {
    const pid = studioSectionPageMap[id] ?? positions[id]?.pageId;
    return pid && pid !== primary;
  });
}
var PRESERVE_PAGE_GAP = 12;
function paginatePreservePlacements(sectionIds, positions, pageIds, content, maxStudioPageIds) {
  let current = { ...positions };
  let pages = [...pageIds];
  const maxBottom = CANVAS_PAGE_HEIGHT - CANVAS_PAGE_MARGIN;
  const maxIterations = Math.max(4, sectionIds.length * 4);
  for (let iter = 0; iter < maxIterations; iter++) {
    let moved = false;
    const getPageId2 = (id) => current[id]?.pageId ?? pages[0];
    for (const pageId of [...pages]) {
      const onPage = sectionsOnPage(sectionIds, current, pageId, getPageId2, content.layerOrder);
      const sorted = [...onPage].sort(
        (a, b) => sectionPageBottom(current[b] ?? { x: 0, y: 0, width: 0, height: 0 }) - sectionPageBottom(current[a] ?? { x: 0, y: 0, width: 0, height: 0 })
      );
      for (const id of sorted) {
        const pos = current[id];
        if (!pos || pos.y + pos.height <= maxBottom) continue;
        const pageIndex = pages.indexOf(pageId);
        let targetPageId = pages[pageIndex + 1];
        if (!targetPageId) {
          if (maxStudioPageIds?.length) {
            targetPageId = pageIndex + 1 < maxStudioPageIds.length ? maxStudioPageIds[pageIndex + 1] : maxStudioPageIds[maxStudioPageIds.length - 1];
            if (!pages.includes(targetPageId)) {
              pages.push(targetPageId);
            }
          } else {
            targetPageId = createExportPageId(pages.length);
            pages.push(targetPageId);
          }
        }
        const onTarget = sectionsOnPage(sectionIds, current, targetPageId, getPageId2, content.layerOrder).filter(
          (sid) => {
            if (sid === id) return false;
            const peer = current[sid];
            return peer ? Math.abs(peer.x - pos.x) <= SNAP_GRID_SIZE * 2 : false;
          }
        );
        let nextY = CANVAS_PAGE_MARGIN;
        for (const sid of onTarget) {
          const peer = current[sid];
          if (peer) nextY = Math.max(nextY, peer.y + peer.height + PRESERVE_PAGE_GAP);
        }
        current[id] = clampPositionToA4Page({
          ...pos,
          pageId: targetPageId,
          y: nextY
        });
        moved = true;
      }
    }
    if (!moved) break;
  }
  const getPageId = (id) => current[id]?.pageId ?? pages[0];
  const usedPages = pages.filter(
    (pid) => sectionsOnPage(sectionIds, current, pid, getPageId, content.layerOrder).length > 0
  );
  return { positions: current, pageIds: usedPages.length ? usedPages : [pages[0]] };
}
function paginateExportOverflow(sectionIds, positions, pageIds, content, maxStudioPageIds) {
  let current = { ...positions };
  let pages = [...pageIds];
  const maxIterations = Math.max(4, sectionIds.length * 4);
  for (let iter = 0; iter < maxIterations; iter++) {
    let moved = false;
    const getPageId2 = (id) => current[id]?.pageId ?? pages[0];
    for (const pageId of [...pages]) {
      const onPage = sectionsOnPage(sectionIds, current, pageId, getPageId2, content.layerOrder);
      const sorted = [...onPage].sort((a, b) => {
        const posA = current[a];
        const posB = current[b];
        return sectionPageBottom(posB ?? { x: 0, y: 0, width: 0, height: 0 }) - sectionPageBottom(posA ?? { x: 0, y: 0, width: 0, height: 0 });
      });
      for (const id of sorted) {
        const pos = current[id];
        if (!pos || !sectionOverflowsPrintPage(pos)) continue;
        const pageIndex = pages.indexOf(pageId);
        let targetPageId = pages[pageIndex + 1];
        if (!targetPageId) {
          if (maxStudioPageIds?.length) {
            targetPageId = pageIndex + 1 < maxStudioPageIds.length ? maxStudioPageIds[pageIndex + 1] : maxStudioPageIds[maxStudioPageIds.length - 1];
            if (!pages.includes(targetPageId)) {
              pages.push(targetPageId);
            }
          } else {
            targetPageId = createExportPageId(pages.length);
            pages.push(targetPageId);
          }
        }
        current[id] = clampPositionToA4Page({
          ...pos,
          pageId: targetPageId,
          y: CANVAS_PAGE_MARGIN
        });
        moved = true;
      }
    }
    if (!moved) break;
    const getPageIdAfterMove = (id) => current[id]?.pageId ?? pages[0];
    for (const pageId of pages) {
      current = { ...current, ...reflowPageColumnsNatural(sectionIds, current, pageId, getPageIdAfterMove, content) };
    }
  }
  const getPageId = (id) => current[id]?.pageId ?? pages[0];
  const usedPages = pages.filter(
    (pid) => sectionsOnPage(sectionIds, current, pid, getPageId, content.layerOrder).length > 0
  );
  return { positions: current, pageIds: usedPages.length ? usedPages : [pages[0]] };
}
function studioLayoutHasOverflow(sectionIds, positions) {
  return sectionIds.some((id) => {
    const pos = positions[id];
    return pos ? sectionOverflowsPrintPage(pos) : false;
  });
}
function finalizeStudioPageLayout(sectionIds, positions, pageIds, content, maxStudioPageIds) {
  let laid = { ...positions };
  let pages = [...pageIds];
  if (studioLayoutHasOverflow(sectionIds, laid)) {
    const paginated = paginateExportOverflow(sectionIds, laid, pages, content, maxStudioPageIds);
    laid = paginated.positions;
    pages = paginated.pageIds;
    const getPageId2 = (id) => laid[id]?.pageId ?? pages[0];
    for (const pageId of pages) {
      laid = { ...laid, ...reflowPageColumnsNatural(sectionIds, laid, pageId, getPageId2, content) };
    }
  }
  const getPageId = (id) => laid[id]?.pageId ?? pages[0];
  const scopedPages = maxStudioPageIds?.length ? maxStudioPageIds : pages;
  const usedPages = scopedPages.filter(
    (pid) => sectionsOnPage(sectionIds, laid, pid, getPageId, content.layerOrder).length > 0
  );
  return { positions: laid, pageIds: usedPages.length ? usedPages : pages.slice(0, 1) };
}
function buildPrintReadyExportLayout(sectionIds, positions, resumeData, options) {
  const content = {
    resumeData,
    layerOrder: options?.layerOrder,
    themeFontScale: options?.themeFontScale ?? 1
  };
  const themeFontScale = options?.themeFontScale ?? 1;
  const templateStyle = options?.templateStyle;
  const studioPages = options?.studioPages ?? [];
  const studioMap = options?.studioSectionPageMap ?? {};
  const useStudioPages = studioUsesMultiplePages(sectionIds, studioPages, studioMap, positions);
  const maxStudioPageIds = useStudioPages ? studioPages.map((p) => p.id) : void 0;
  let pageIds = useStudioPages ? studioPages.map((p) => p.id) : [createExportPageId(0)];
  const current = {};
  for (const id of sectionIds) {
    const pos = positions[id];
    if (!pos) continue;
    const pageId = useStudioPages ? studioMap[id] ?? pos.pageId ?? studioPages[0].id : pageIds[0];
    current[id] = { ...pos, pageId };
  }
  for (const id of sectionIds) {
    if (options?.manualSizedSections?.has(id)) continue;
    const pos = current[id];
    if (!pos) continue;
    current[id] = clampPositionToA4Page({
      ...pos,
      height: fitSectionHeightForExport(id, pos, resumeData, themeFontScale, templateStyle)
    });
  }
  let laid = { ...current };
  const getPageId = (id) => laid[id]?.pageId ?? pageIds[0];
  const preservePlacements = options?.preservePlacements === true;
  for (const pageId of pageIds) {
    laid = { ...laid, ...reflowPageColumnsNatural(sectionIds, laid, pageId, getPageId, content) };
  }
  if (!useStudioPages) {
    const paginated = preservePlacements ? paginatePreservePlacements(sectionIds, laid, pageIds, content, maxStudioPageIds) : paginateExportOverflow(sectionIds, laid, pageIds, content);
    laid = paginated.positions;
    pageIds = paginated.pageIds;
  } else {
    pageIds = pageIds.filter(
      (pid) => sectionsOnPage(sectionIds, laid, pid, (id) => laid[id]?.pageId ?? pid, content.layerOrder).length > 0
    );
    if (preservePlacements) {
      const paginated = paginatePreservePlacements(sectionIds, laid, pageIds, content, maxStudioPageIds);
      laid = paginated.positions;
      pageIds = paginated.pageIds;
      const finalized = finalizeStudioPageLayout(sectionIds, laid, pageIds, content, maxStudioPageIds);
      laid = finalized.positions;
      pageIds = finalized.pageIds;
    } else {
      const finalized = finalizeStudioPageLayout(sectionIds, laid, pageIds, content, maxStudioPageIds);
      laid = finalized.positions;
      pageIds = finalized.pageIds;
    }
  }
  const filtered = filterPrintPlanToNonemptyPages(
    {
      positions: laid,
      pageIds: pageIds.length ? pageIds : [createExportPageId(0)],
      sectionSlices: void 0
    },
    sectionIds,
    content.layerOrder
  );
  const entrySplit = applyEntryLevelPagination(sectionIds, filtered.positions, filtered.pageIds, resumeData, {
    themeFontScale,
    enabled: options?.enableEntrySplit === true
  });
  laid = entrySplit.positions;
  pageIds = entrySplit.pageIds;
  return filterPrintPlanToNonemptyPages(
    {
      positions: laid,
      pageIds: pageIds.length ? pageIds : [createExportPageId(0)],
      sectionSlices: Object.keys(entrySplit.sectionSlices).length ? entrySplit.sectionSlices : void 0
    },
    sectionIds,
    content.layerOrder
  );
}

// src/lib/layoutDocument/buildLayoutDocument.ts
function buildLayoutDocument(input) {
  const {
    sectionIds,
    draftPositions,
    resumeData,
    freeLayoutEnabled,
    manualSizedSections,
    layerOrder,
    themeFontScale,
    templateStyle,
    studioPages,
    studioSectionPageMap
  } = input;
  const printPlan = buildPrintReadyExportLayout(sectionIds, draftPositions, resumeData, {
    manualSizedSections,
    layerOrder,
    themeFontScale,
    templateStyle,
    studioPages,
    studioSectionPageMap,
    preservePlacements: freeLayoutEnabled
  });
  return {
    sectionIds,
    draftPositions,
    printPlan,
    editMode: freeLayoutEnabled ? "free" : "flow",
    resumeData
  };
}

// src/lib/templates/tokens.ts
var STATIONERY = {
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
  eraser: "#F2C1C1"
};
var S = STATIONERY;
function baseColors(overrides) {
  return {
    paper: S.paper,
    ink: S.ink,
    muted: S.graphite,
    accent: S.red,
    accentSoft: S.mint,
    highlight: S.marker,
    rule: S.rule,
    datesColor: S.graphite,
    ...overrides
  };
}
function buildFamily(family, typographyDefaults, defs) {
  return defs.map((def, index) => ({
    id: `${family}-${String(index + 1).padStart(2, "0")}`,
    family,
    designId: def.designId,
    layout: def.layout,
    density: def.density ?? "compact",
    colors: baseColors(def.colors),
    typography: { ...typographyDefaults, ...def.typography },
    decorations: def.decorations
  }));
}
var NOTEBOOK = buildFamily(
  "modern",
  { display: "display-serif", body: "serif", label: "sans", titleCase: "upper" },
  [
    {
      designId: "notebook-01",
      layout: "sidebar-left",
      decorations: { ruledLines: true, marginLine: {}, highlightMarker: true, stickers: true }
    },
    {
      designId: "notebook-02",
      layout: "single",
      colors: { paper: S.paperTint, datesColor: S.red },
      decorations: { marginLine: { double: true } }
    },
    {
      designId: "notebook-03",
      layout: "single",
      colors: { accent: S.teal, nameColor: S.red },
      decorations: { gridPaper: true }
    },
    {
      designId: "notebook-04",
      layout: "single",
      decorations: { sectionCards: true }
    },
    {
      designId: "notebook-05",
      layout: "single",
      typography: { titleCase: "none" },
      decorations: { centeredHeader: true, nameUnderline: "double", ruledLines: true }
    },
    {
      designId: "notebook-06",
      layout: "sidebar-right",
      decorations: { stickers: true }
    },
    {
      designId: "notebook-07",
      layout: "single",
      decorations: { highlightMarker: true }
    },
    {
      designId: "notebook-08",
      layout: "timeline",
      decorations: { timelineThread: true, stitchedBorder: true }
    },
    {
      designId: "notebook-09",
      layout: "single",
      colors: { accent: S.ruleDeep, nameColor: S.red },
      decorations: { ruledLines: true }
    },
    {
      designId: "notebook-10",
      layout: "single",
      colors: { accent: S.teal, datesColor: S.red },
      decorations: { rowShading: true }
    },
    {
      designId: "notebook-11",
      layout: "single",
      colors: { accent: S.graphite, nameColor: S.ink },
      decorations: { stampContact: true, highlightMarker: true }
    }
  ]
);
var BUREAU = buildFamily(
  "classic",
  { display: "display-serif", body: "serif", label: "serif", titleCase: "smallcaps" },
  [
    {
      designId: "bureau-01",
      layout: "single",
      decorations: { centeredHeader: true }
    },
    {
      designId: "bureau-02",
      layout: "timeline",
      decorations: {}
    },
    {
      designId: "bureau-03",
      layout: "single",
      typography: { titleCase: "upper" },
      decorations: {}
    },
    {
      designId: "bureau-04",
      layout: "single",
      colors: { accent: S.ink },
      decorations: { nameUnderline: "double" }
    },
    {
      designId: "bureau-05",
      layout: "single",
      decorations: { numberedSections: true }
    },
    {
      designId: "bureau-06",
      layout: "single",
      colors: { accent: S.teal, nameColor: S.ink },
      decorations: { monogram: true }
    },
    {
      designId: "bureau-07",
      layout: "single",
      decorations: { contactBand: true }
    },
    {
      designId: "bureau-08",
      layout: "single",
      density: "compact",
      decorations: { dottedLeaders: true }
    },
    {
      designId: "bureau-09",
      layout: "header-band",
      decorations: { metaBox: true }
    },
    {
      designId: "bureau-10",
      layout: "single",
      decorations: { centeredHeader: true, dividerGlyph: "\u2756" }
    }
  ]
);
var STUDIO = buildFamily(
  "minimalist",
  { display: "sans", body: "sans", label: "sans", titleCase: "upper" },
  [
    {
      designId: "studio-01",
      layout: "sidebar-left",
      colors: { accent: S.teal },
      decorations: {}
    },
    {
      designId: "studio-02",
      layout: "single",
      colors: { accent: S.teal },
      decorations: {}
    },
    {
      designId: "studio-03",
      layout: "single",
      density: "airy",
      colors: { accent: S.ink },
      decorations: { highlightMarker: true }
    },
    {
      designId: "studio-04",
      layout: "sidebar-right",
      colors: { accent: S.teal },
      decorations: {}
    },
    {
      designId: "studio-05",
      layout: "single",
      density: "airy",
      decorations: {}
    },
    {
      designId: "studio-06",
      layout: "single",
      colors: { accent: S.graphite },
      decorations: {}
    },
    {
      designId: "studio-07",
      layout: "two-column",
      colors: { accent: S.graphite },
      decorations: { cornerTick: true }
    },
    {
      designId: "studio-08",
      layout: "sidebar-left",
      colors: { accent: S.teal },
      decorations: { stickers: true }
    },
    {
      designId: "studio-09",
      layout: "single",
      colors: { accent: S.teal },
      typography: { display: "mono", label: "mono" },
      decorations: { cursorBlock: true }
    },
    {
      designId: "studio-10",
      layout: "single",
      density: "airy",
      decorations: {}
    }
  ]
);
var TEMPLATE_DEFINITION_LIST = [...NOTEBOOK, ...BUREAU, ...STUDIO];
var DEFINITION_MAP = /* @__PURE__ */ new Map();
for (const def of TEMPLATE_DEFINITION_LIST) {
  DEFINITION_MAP.set(def.id, def);
  DEFINITION_MAP.set(def.designId, def);
}
function getTemplateDefinition(style) {
  return DEFINITION_MAP.get(style) ?? TEMPLATE_DEFINITION_LIST[0];
}

// src/lib/templates/templateDemoLayout.ts
var TEMPLATE_DEMO_PAGE_IDS = {
  page1: "demo-page-1",
  page2: "demo-page-2"
};
var M = CANVAS_PAGE_MARGIN;
var PAGE_W = CANVAS_PAGE_WIDTH;
var PAGE_H = CANVAS_PAGE_HEIGHT;
var USABLE_W = PAGE_W - M * 2;
var PAGE_BOTTOM = PAGE_H - M;
var SECTION_GAP = snapToGrid(8, SNAP_GRID_SIZE);
var CENTER_COL_W = snapToGrid(Math.min(600, USABLE_W), SNAP_GRID_SIZE);
var READING_ORDER = [
  "header",
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
  "languages",
  "certifications",
  "volunteer"
];
function sortForPagination(sectionIds) {
  const rank = new Map(READING_ORDER.map((id, index) => [id, index]));
  return [...sectionIds].sort((a, b) => (rank.get(a) ?? 99) - (rank.get(b) ?? 99));
}
function columnForFamily(family) {
  if (family === "classic") {
    const x = snapToGrid(Math.round((PAGE_W - CENTER_COL_W) / 2), SNAP_GRID_SIZE);
    return { x, width: CENTER_COL_W };
  }
  return { x: M, width: USABLE_W };
}
function sectionHeight(id, width, resumeData, style) {
  let height = estimateSectionHeightForContent(id, resumeData, width);
  if (style && isMarginaliaNotebookTemplate(style)) {
    height = snapToGrid(height + marginaliaSectionChrome(id), SNAP_GRID_SIZE);
  }
  return height;
}
function stackHeight(sizes, from, to) {
  let total = M;
  for (let i = from; i < to; i++) {
    if (i > from) total += SECTION_GAP;
    total += sizes[i].height;
  }
  return total;
}
function findBalancedSplit(sizes) {
  const count = sizes.length;
  if (count <= 1) return count;
  for (let split = 1; split < count; split++) {
    if (stackHeight(sizes, 0, split) <= PAGE_BOTTOM && stackHeight(sizes, split, count) <= PAGE_BOTTOM) {
      return split;
    }
  }
  let bestSplit = 1;
  let bestOverflow = Infinity;
  for (let split = 1; split < count; split++) {
    const page1Over = Math.max(0, stackHeight(sizes, 0, split) - PAGE_BOTTOM);
    const page2Over = Math.max(0, stackHeight(sizes, split, count) - PAGE_BOTTOM);
    const overflow = Math.max(page1Over, page2Over);
    if (overflow < bestOverflow) {
      bestOverflow = overflow;
      bestSplit = split;
    }
  }
  return bestSplit;
}
function stackHeightForIds(sizes, ids) {
  const heightById = new Map(sizes.map((entry) => [entry.id, entry.height]));
  let total = M;
  for (let index = 0; index < ids.length; index++) {
    if (index > 0) total += SECTION_GAP;
    total += heightById.get(ids[index]) ?? 0;
  }
  return total;
}
function paginateLayoutToTwoPages(sectionIds, resumeData, family, style) {
  const ordered = sortForPagination(sectionIds);
  const column = columnForFamily(family);
  const sizes = ordered.map((id) => ({
    id,
    height: sectionHeight(id, column.width, resumeData, style)
  }));
  if (!sizes.length) return {};
  const splitAt = findBalancedSplit(sizes);
  const page1Ids = ordered.slice(0, splitAt);
  const page2Ids = ordered.slice(splitAt);
  while (page2Ids.length > 0 && stackHeightForIds(sizes, page2Ids) > PAGE_BOTTOM) {
    const movedId = page2Ids.pop();
    const nextPage1 = [...page1Ids, movedId];
    if (stackHeightForIds(sizes, nextPage1) <= PAGE_BOTTOM) {
      page1Ids.push(movedId);
      continue;
    }
    page2Ids.push(movedId);
    break;
  }
  while (page1Ids.length > 1 && stackHeightForIds(sizes, page1Ids) > PAGE_BOTTOM) {
    const movedId = page1Ids.pop();
    page2Ids.unshift(movedId);
  }
  const result = {};
  const layoutPage = (ids, pageId) => {
    let cursorY = M;
    for (const id of ids) {
      const height = sizes.find((entry) => entry.id === id)?.height ?? defaultSectionHeight(id);
      result[id] = {
        x: column.x,
        y: cursorY,
        width: column.width,
        height,
        pageId
      };
      cursorY += height + SECTION_GAP;
    }
  };
  layoutPage(page1Ids, TEMPLATE_DEMO_PAGE_IDS.page1);
  layoutPage(page2Ids, TEMPLATE_DEMO_PAGE_IDS.page2);
  return result;
}
function createTemplateDemoLayoutPositions(style, sectionIds, resumeData) {
  const def = getTemplateDefinition(style);
  return createTemplateDemoLayoutPositionsForFamily(def.family, sectionIds, resumeData, style);
}
function createTemplateDemoLayoutPositionsForFamily(family, sectionIds, resumeData, style) {
  return paginateLayoutToTwoPages(sectionIds, resumeData, family, style);
}
function demoLayoutPageAssignmentDriftForFamily(positions, family, sectionIds, resumeData) {
  if (!isDemoPageLayout(positions)) return false;
  const expected = createTemplateDemoLayoutPositionsForFamily(family, sectionIds, resumeData);
  return sectionIds.some((id) => expected[id]?.pageId !== positions[id]?.pageId);
}
function buildTemplateDemoPagesDocument() {
  return {
    pages: [
      { id: TEMPLATE_DEMO_PAGE_IDS.page1, label: formatCanvasPageLabel(1) },
      { id: TEMPLATE_DEMO_PAGE_IDS.page2, label: formatCanvasPageLabel(2) }
    ],
    activePageId: TEMPLATE_DEMO_PAGE_IDS.page1
  };
}
function layoutUsesTwoDemoPages(positions) {
  const pageIds = /* @__PURE__ */ new Set();
  for (const pos of Object.values(positions)) {
    if (pos.pageId) pageIds.add(pos.pageId);
  }
  return pageIds.has(TEMPLATE_DEMO_PAGE_IDS.page1) && pageIds.has(TEMPLATE_DEMO_PAGE_IDS.page2);
}
function demoLayoutMissingSecondPage(positions) {
  const usesDemoPage1 = Object.values(positions).some(
    (pos) => pos.pageId === TEMPLATE_DEMO_PAGE_IDS.page1
  );
  if (!usesDemoPage1) return false;
  return !layoutUsesTwoDemoPages(positions);
}
function demoLayoutPageAssignmentDrift(positions, style, sectionIds, resumeData) {
  const def = getTemplateDefinition(style);
  return demoLayoutPageAssignmentDriftForFamily(positions, def.family, sectionIds, resumeData);
}
function isDemoPageLayout(positions) {
  return Object.values(positions).some(
    (pos) => pos.pageId === TEMPLATE_DEMO_PAGE_IDS.page1 || pos.pageId === TEMPLATE_DEMO_PAGE_IDS.page2
  );
}

// src/lib/templates/templateDemoBaseContent.ts
var EN_BASE = {
  personalInfo: {
    name: "Alex Chan",
    title: "Frontend Product Engineer",
    email: "alex.chan@email.com",
    phone: "+852 9123 4567",
    website: "https://alexchan.dev",
    location: "Hong Kong SAR",
    linkedin: "linkedin.com/in/alexchan",
    rightToWork: "Permanent Hong Kong Resident",
    noticePeriod: "1 month",
    expectedSalary: "HK$42,000 / month"
  },
  summary: "",
  experience: [
    {
      id: "exp-1",
      company: "Harbour Digital Solutions",
      role: "Frontend Product Engineer",
      startDate: "2022-08",
      endDate: "Present",
      location: "Quarry Bay, Hong Kong",
      bullets: [
        "Rebuilt a merchant operations workspace in React and TypeScript, cutting support task time by 22%.",
        "Built a shared component library and token system adopted across admin, analytics, and marketing surfaces."
      ]
    },
    {
      id: "exp-2",
      company: "Kowloon Commerce Cloud",
      role: "Software Engineer",
      startDate: "2020-07",
      endDate: "2022-07",
      location: "Kowloon Bay, Hong Kong",
      bullets: [
        "Delivered internal order and catalog tooling with React, Node.js, and REST APIs for three APAC markets.",
        "Migrated legacy jQuery modules to TypeScript with shared Tailwind utilities and Storybook documentation."
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      institution: "The Hong Kong Polytechnic University",
      degree: "BSc",
      field: "Computing",
      gradDate: "2021-06",
      location: "Hung Hom, Hong Kong"
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "Sprintboard HK",
      description: "Kanban planning tool with drag-and-drop boards, command palette actions, and keyboard-first workflows for distributed teams.",
      techStack: "React, TypeScript, Tailwind CSS, Zustand",
      url: "https://github.com/alexchan/sprintboard-hk"
    },
    {
      id: "proj-2",
      name: "Token Studio",
      description: "Design-token explorer that syncs Figma variables to CSS custom properties and documents contrast ratios for each theme.",
      techStack: "Next.js, TypeScript, Figma API",
      url: "https://github.com/alexchan/token-studio"
    }
  ],
  skills: [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Tailwind CSS",
    "Design Systems",
    "Accessibility (WCAG 2.1)",
    "REST APIs",
    "GraphQL",
    "Playwright",
    "Storybook",
    "Vite",
    "Performance Profiling",
    "Git & CI/CD",
    "Cantonese",
    "English"
  ],
  certifications: [
    "AWS Certified Cloud Practitioner (2023)",
    "Meta Front-End Developer Professional Certificate (2022)"
  ],
  volunteerWork: [
    "Code for Hong Kong \u2014 mentor for weekend React workshops (2021\u2013Present)"
  ],
  languages: ["English (Fluent)", "Cantonese (Native)", "Mandarin (Conversational)"]
};
var ZH_BASE = {
  personalInfo: {
    name: "\u9673\u4FCA\u6A02",
    title: "\u524D\u7AEF\u7522\u54C1\u5DE5\u7A0B\u5E2B",
    email: "alex.chan@email.com",
    phone: "+852 9123 4567",
    website: "https://alexchan.dev",
    location: "\u9999\u6E2F\u7279\u5225\u884C\u653F\u5340",
    linkedin: "linkedin.com/in/alexchan",
    rightToWork: "\u9999\u6E2F\u6C38\u4E45\u6027\u5C45\u6C11",
    noticePeriod: "1 \u500B\u6708",
    expectedSalary: "HK$42,000 / \u6708"
  },
  summary: "",
  experience: [
    {
      id: "exp-1",
      company: "\u6D77\u6E2F\u6578\u78BC\u65B9\u6848",
      role: "\u524D\u7AEF\u7522\u54C1\u5DE5\u7A0B\u5E2B",
      startDate: "2022-08",
      endDate: "Present",
      location: "\u9999\u6E2F\u9C02\u9B5A\u6D8C",
      bullets: [
        "\u4EE5 React \u8207 TypeScript \u91CD\u69CB\u5546\u6236\u71DF\u904B\u5DE5\u4F5C\u53F0\uFF0C\u652F\u63F4\u5DE5\u55AE\u8655\u7406\u6642\u9593\u7E2E\u77ED 22%\u3002",
        "\u5EFA\u7ACB\u5171\u7528\u5143\u4EF6\u5EAB\u8207 Design Token \u7CFB\u7D71\uFF0C\u61C9\u7528\u65BC\u5F8C\u53F0\u3001\u5206\u6790\u8207\u884C\u92B7\u4ECB\u9762\u3002",
        "\u8207\u8A2D\u8A08\u5718\u968A\u5408\u4F5C\u4EA4\u4ED8\u7B26\u5408 WCAG 2.1 AA \u7684\u8868\u683C\u3001\u7BE9\u9078\u8207\u8868\u55AE\u5143\u4EF6\u3002"
      ]
    },
    {
      id: "exp-2",
      company: "\u4E5D\u9F8D\u5546\u96F2\u79D1\u6280",
      role: "\u8EDF\u9AD4\u5DE5\u7A0B\u5E2B",
      startDate: "2020-07",
      endDate: "2022-07",
      location: "\u9999\u6E2F\u4E5D\u9F8D\u7063",
      bullets: [
        "\u4EE5 React\u3001Node.js \u8207 REST API \u4EA4\u4ED8\u5167\u90E8\u8A02\u55AE\u8207\u578B\u9304\u5DE5\u5177\uFF0C\u652F\u63F4\u4E09\u500B\u4E9E\u592A\u5E02\u5834\u3002",
        "\u4EE5\u5100\u8868\u677F\u6A21\u7D44\u53D6\u4EE3\u8A66\u7B97\u8868\u5831\u8868\uFF0C\u71DF\u904B\u8207\u8CA1\u52D9\u5718\u968A\u6BCF\u9031\u56FA\u5B9A\u4F7F\u7528\u3002",
        "\u5C07\u820A\u7248 jQuery \u6A21\u7D44\u9077\u79FB\u81F3 TypeScript\uFF0C\u4E26\u4EE5 Tailwind \u8207 Storybook \u5EFA\u7ACB\u5171\u7528\u898F\u7BC4\u3002"
      ]
    },
    {
      id: "exp-3",
      company: "\u73E0\u6C5F\u91D1\u878D\u79D1\u6280",
      role: "\u521D\u7D1A\u524D\u7AEF\u958B\u767C\u5DE5\u7A0B\u5E2B",
      startDate: "2019-01",
      endDate: "2020-06",
      location: "\u9999\u6E2F\u4E2D\u74B0",
      bullets: [
        "\u70BA\u53D7\u76E3\u7BA1\u91D1\u878D\u79D1\u6280\u7522\u54C1\u5BE6\u4F5C\u5E33\u6236\u8A2D\u5B9A\u3001KYC \u6D41\u7A0B\u8207\u901A\u77E5\u4E2D\u5FC3\u3002",
        "\u8207\u5F8C\u7AEF\u5DE5\u7A0B\u5E2B\u5354\u4F5C OpenAPI \u5408\u7D04\u8207\u4ED8\u6B3E\u72C0\u614B\u7684 optimistic UI\u3002",
        "\u64B0\u5BEB React \u6E2C\u8A66\u6A21\u5F0F\u5167\u90E8 wiki\uFF0C\u7372\u5169\u500B\u529F\u80FD\u5C0F\u968A\u63A1\u7528\u3002"
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      institution: "\u9999\u6E2F\u7406\u5DE5\u5927\u5B78",
      degree: "\u7406\u5B78\u58EB",
      field: "\u8A08\u7B97\u6A5F",
      gradDate: "2021-06",
      location: "\u9999\u6E2F\u7D05\u78E1"
    },
    {
      id: "edu-2",
      institution: "\u9999\u6E2F\u5927\u5B78\u5C08\u696D\u9032\u4FEE\u5B78\u9662",
      degree: "\u5C08\u696D\u8B49\u66F8",
      field: "UX \u8A2D\u8A08\u8207\u524D\u7AEF\u958B\u767C",
      gradDate: "2019-08",
      location: "\u9999\u6E2F\u91D1\u9418"
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "Sprintboard HK",
      description: "\u770B\u677F\u898F\u5283\u5DE5\u5177\uFF0C\u652F\u63F4\u62D6\u653E\u6B04\u4F4D\u3001\u6307\u4EE4\u9762\u677F\u8207\u9375\u76E4\u512A\u5148\u64CD\u4F5C\uFF0C\u9069\u5408\u5206\u6563\u5F0F\u5718\u968A\u3002",
      techStack: "React, TypeScript, Tailwind CSS, Zustand",
      url: "https://github.com/alexchan/sprintboard-hk"
    },
    {
      id: "proj-2",
      name: "Token Studio",
      description: "Design Token \u63A2\u7D22\u5668\uFF0C\u540C\u6B65 Figma \u8B8A\u6578\u81F3 CSS \u81EA\u8A02\u5C6C\u6027\uFF0C\u4E26\u8A18\u9304\u5404\u4E3B\u984C\u5C0D\u6BD4\u5EA6\u3002",
      techStack: "Next.js, TypeScript, Figma API",
      url: "https://github.com/alexchan/token-studio"
    }
  ],
  skills: [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Tailwind CSS",
    "\u8A2D\u8A08\u7CFB\u7D71",
    "\u7121\u969C\u7919\uFF08WCAG 2.1\uFF09",
    "REST API",
    "GraphQL",
    "Playwright",
    "Storybook",
    "Vite",
    "\u6548\u80FD\u5206\u6790",
    "Git \u8207 CI/CD",
    "\u7CB5\u8A9E",
    "\u82F1\u8A9E"
  ],
  certifications: [
    "AWS Certified Cloud Practitioner\uFF082023\uFF09",
    "Meta \u524D\u7AEF\u958B\u767C\u5C08\u696D\u8B49\u66F8\uFF082022\uFF09"
  ],
  volunteerWork: [
    "Code for Hong Kong \u2014 \u9031\u672B React \u5DE5\u4F5C\u574A\u5C0E\u5E2B\uFF082021\u2013\u81F3\u4ECA\uFF09"
  ],
  languages: ["\u82F1\u8A9E\uFF08\u6D41\u5229\uFF09", "\u7CB5\u8A9E\uFF08\u6BCD\u8A9E\uFF09", "\u666E\u901A\u8A71\uFF08\u65E5\u5E38\u6703\u8A71\uFF09"]
};
var TEMPLATE_DEMO_SUMMARY_TAIL = {
  en: "Four years of shipping production UI for cross-functional product teams.",
  zh: "\u64C1\u6709\u56DB\u5E74\u524D\u7AEF\u7522\u54C1\u4EA4\u4ED8\u7D93\u9A57\uFF0C\u9577\u671F\u8207\u8DE8\u8077\u80FD\u5718\u968A\u5354\u4F5C\u3002"
};
function buildTwoPageBaseResume(locale) {
  return locale === "zh" ? structuredClone(ZH_BASE) : structuredClone(EN_BASE);
}

// src/lib/templates/templateDemoProfiles.ts
var MODERN_PROFILES_EN = [
  {
    title: "Frontend Product Engineer",
    summaryLead: "Product-minded frontend engineer shipping React and TypeScript experiences for Hong Kong and APAC users.",
    summaryFocus: "Design systems, accessible UI, and measurable delivery impact."
  },
  {
    title: "Senior UI Engineer",
    summaryLead: "UI engineer focused on editorial layouts, typography rhythm, and crisp component APIs.",
    summaryFocus: "Turning complex workflows into calm, readable interfaces."
  },
  {
    title: "Design Systems Engineer",
    summaryLead: "Engineer bridging design tokens, component libraries, and production React surfaces.",
    summaryFocus: "Consistent visual language across admin, marketing, and analytics products."
  },
  {
    title: "Full-Stack Product Developer",
    summaryLead: "Full-stack developer building merchant tooling with React, Node.js, and cloud-native services.",
    summaryFocus: "End-to-end ownership from API design to polished UI states."
  },
  {
    title: "Lead Frontend Developer",
    summaryLead: "Lead frontend developer guiding squads through migrations, performance budgets, and release quality.",
    summaryFocus: "Mentorship, code review culture, and predictable delivery cadence."
  },
  {
    title: "Creative Technologist",
    summaryLead: "Creative technologist crafting interactive dashboards and brand-forward product surfaces.",
    summaryFocus: "Motion, micro-interactions, and storytelling through data visualization."
  },
  {
    title: "Platform UI Engineer",
    summaryLead: "Platform engineer improving shared UI infrastructure, build pipelines, and developer experience.",
    summaryFocus: "Reusable primitives that accelerate feature teams without sacrificing craft."
  },
  {
    title: "Product Engineer \u2014 Growth",
    summaryLead: "Growth-oriented engineer optimizing onboarding, activation funnels, and experimentation tooling.",
    summaryFocus: "A/B testing infrastructure paired with accessible, conversion-aware UI."
  },
  {
    title: "Frontend Architect",
    summaryLead: "Frontend architect defining module boundaries, state management patterns, and rendering strategy.",
    summaryFocus: "Scalable architecture for multi-market SaaS with strong TypeScript contracts."
  },
  {
    title: "Web Performance Engineer",
    summaryLead: "Performance engineer profiling Core Web Vitals, bundle budgets, and server/client rendering trade-offs.",
    summaryFocus: "Faster dashboards for large datasets without sacrificing clarity."
  },
  {
    title: "Staff Frontend Engineer",
    summaryLead: "Staff engineer partnering with design and product to raise the bar on craft and reliability.",
    summaryFocus: "Cross-team initiatives, technical RFCs, and production incident follow-through."
  }
];
var MODERN_PROFILES_ZH = [
  {
    title: "\u524D\u7AEF\u7522\u54C1\u5DE5\u7A0B\u5E2B",
    summaryLead: "\u5177\u7522\u54C1\u601D\u7DAD\u7684\u524D\u7AEF\u5DE5\u7A0B\u5E2B\uFF0C\u70BA\u9999\u6E2F\u53CA\u4E9E\u592A\u7528\u6236\u4EA4\u4ED8 React \u8207 TypeScript \u9AD4\u9A57\u3002",
    summaryFocus: "\u5C08\u7CBE\u8A2D\u8A08\u7CFB\u7D71\u3001\u7121\u969C\u7919\u4ECB\u9762\u8207\u53EF\u91CF\u5316\u7684\u4EA4\u4ED8\u6210\u679C\u3002"
  },
  {
    title: "\u8CC7\u6DF1 UI \u5DE5\u7A0B\u5E2B",
    summaryLead: "\u5C08\u6CE8\u7DE8\u8F2F\u5F0F\u7248\u9762\u3001\u5B57\u7D1A\u7BC0\u594F\u8207\u6E05\u6670\u5143\u4EF6 API \u7684 UI \u5DE5\u7A0B\u5E2B\u3002",
    summaryFocus: "\u5C07\u8907\u96DC\u6D41\u7A0B\u8F49\u5316\u70BA\u6C89\u7A69\u3001\u6613\u8B80\u7684\u64CD\u4F5C\u4ECB\u9762\u3002"
  },
  {
    title: "\u8A2D\u8A08\u7CFB\u7D71\u5DE5\u7A0B\u5E2B",
    summaryLead: "\u9023\u7D50 Design Token\u3001\u5143\u4EF6\u5EAB\u8207\u6B63\u5F0F\u74B0\u5883 React \u4ECB\u9762\u7684\u5DE5\u7A0B\u5E2B\u3002",
    summaryFocus: "\u5728\u5F8C\u53F0\u3001\u884C\u92B7\u8207\u5206\u6790\u7522\u54C1\u9593\u7DAD\u6301\u4E00\u81F4\u7684\u8996\u89BA\u8A9E\u8A00\u3002"
  },
  {
    title: "\u5168\u7AEF\u7522\u54C1\u958B\u767C\u5DE5\u7A0B\u5E2B",
    summaryLead: "\u4EE5 React\u3001Node.js \u8207\u96F2\u7AEF\u670D\u52D9\u5EFA\u69CB\u5546\u6236\u5DE5\u5177\u7684\u958B\u767C\u8005\u3002",
    summaryFocus: "\u5F9E API \u8A2D\u8A08\u5230\u7CBE\u7DFB UI \u72C0\u614B\u7684\u5168\u6D41\u7A0B\u8CA0\u8CAC\u3002"
  },
  {
    title: "\u524D\u7AEF\u958B\u767C\u7D44\u9577",
    summaryLead: "\u5E36\u9818\u5C0F\u7D44\u5B8C\u6210\u9077\u79FB\u3001\u6548\u80FD\u9810\u7B97\u8207\u767C\u5E03\u54C1\u8CEA\u7684\u524D\u7AEF\u7D44\u9577\u3002",
    summaryFocus: "\u91CD\u8996\u6307\u5C0E\u3001Code Review \u6587\u5316\u8207\u53EF\u9810\u671F\u7684\u4EA4\u4ED8\u7BC0\u594F\u3002"
  },
  {
    title: "\u5275\u610F\u6280\u8853\u5DE5\u7A0B\u5E2B",
    summaryLead: "\u6253\u9020\u4E92\u52D5\u5100\u8868\u677F\u8207\u5177\u54C1\u724C\u611F\u7522\u54C1\u4ECB\u9762\u7684\u5275\u610F\u6280\u8853\u5DE5\u7A0B\u5E2B\u3002",
    summaryFocus: "\u52D5\u6548\u3001\u5FAE\u4E92\u52D5\u8207\u6578\u64DA\u8996\u89BA\u5316\u6558\u4E8B\u3002"
  },
  {
    title: "\u5E73\u53F0 UI \u5DE5\u7A0B\u5E2B",
    summaryLead: "\u6539\u5584\u5171\u7528 UI \u57FA\u790E\u8A2D\u65BD\u3001\u5EFA\u7F6E\u6D41\u7A0B\u8207\u958B\u767C\u8005\u9AD4\u9A57\u7684\u5E73\u53F0\u5DE5\u7A0B\u5E2B\u3002",
    summaryFocus: "\u53EF\u91CD\u7528\u57FA\u790E\u5143\u4EF6\uFF0C\u52A0\u901F\u529F\u80FD\u5718\u968A\u800C\u4E0D\u72A7\u7272\u54C1\u8CEA\u3002"
  },
  {
    title: "\u7522\u54C1\u5DE5\u7A0B\u5E2B \u2014 \u6210\u9577",
    summaryLead: "\u512A\u5316 onboarding\u3001\u6FC0\u6D3B\u6F0F\u6597\u8207\u5BE6\u9A57\u5DE5\u5177\u7684\u6210\u9577\u5C0E\u5411\u5DE5\u7A0B\u5E2B\u3002",
    summaryFocus: "A/B \u6E2C\u8A66\u57FA\u790E\u5EFA\u8A2D\u642D\u914D\u7121\u969C\u7919\u3001\u8F49\u63DB\u5C0E\u5411 UI\u3002"
  },
  {
    title: "\u524D\u7AEF\u67B6\u69CB\u5E2B",
    summaryLead: "\u5B9A\u7FA9\u6A21\u7D44\u908A\u754C\u3001\u72C0\u614B\u7BA1\u7406\u6A21\u5F0F\u8207\u6E32\u67D3\u7B56\u7565\u7684\u524D\u7AEF\u67B6\u69CB\u5E2B\u3002",
    summaryFocus: "\u591A\u5E02\u5834 SaaS \u7684\u53EF\u64F4\u5C55\u67B6\u69CB\u8207\u56B4\u8B39 TypeScript \u5408\u7D04\u3002"
  },
  {
    title: "\u7DB2\u9801\u6548\u80FD\u5DE5\u7A0B\u5E2B",
    summaryLead: "\u5206\u6790 Core Web Vitals\u3001bundle \u9810\u7B97\u8207 SSR/CSR \u6B0A\u8861\u7684\u6548\u80FD\u5DE5\u7A0B\u5E2B\u3002",
    summaryFocus: "\u5728\u5927\u91CF\u8CC7\u6599\u5100\u8868\u677F\u4E2D\u63D0\u5347\u901F\u5EA6\u800C\u4E0D\u640D\u5931\u6E05\u6670\u5EA6\u3002"
  },
  {
    title: "\u8CC7\u6DF1\u524D\u7AEF\u5DE5\u7A0B\u5E2B",
    summaryLead: "\u8207\u8A2D\u8A08\u3001\u7522\u54C1\u5354\u4F5C\uFF0C\u63D0\u5347\u5DE5\u7A0B\u54C1\u8CEA\u8207\u53EF\u9760\u5EA6\u7684 Staff \u5DE5\u7A0B\u5E2B\u3002",
    summaryFocus: "\u8DE8\u5718\u968A\u5C08\u6848\u3001\u6280\u8853 RFC \u8207\u6B63\u5F0F\u74B0\u5883\u4E8B\u6545\u5F8C\u7E8C\u3002"
  }
];
var CLASSIC_PROFILES_EN = [
  {
    title: "Software Engineer \u2014 Applications",
    summaryLead: "Applications engineer with a conservative, ATS-friendly presentation and clear achievement metrics.",
    summaryFocus: "Stable releases, regression prevention, and stakeholder-ready documentation."
  },
  {
    title: "Senior Software Developer",
    summaryLead: "Senior developer delivering enterprise dashboards, reporting modules, and integration layers.",
    summaryFocus: "Readable code, structured delivery, and dependable cross-functional communication."
  },
  {
    title: "Technical Lead \u2014 Web Platform",
    summaryLead: "Technical lead coordinating roadmap delivery for internal web platforms and shared services.",
    summaryFocus: "Risk-managed rollouts, runbooks, and operational excellence."
  },
  {
    title: "Principal Engineer \u2014 Frontend",
    summaryLead: "Principal engineer setting engineering standards for large React codebases and release trains.",
    summaryFocus: "Architecture reviews, quality gates, and long-term maintainability."
  },
  {
    title: "Engineering Manager \u2014 Product UI",
    summaryLead: "Engineering manager balancing people leadership with hands-on UI architecture guidance.",
    summaryFocus: "Hiring, career growth, and predictable quarterly outcomes."
  },
  {
    title: "Solutions Engineer",
    summaryLead: "Solutions engineer translating client requirements into implementable product specifications.",
    summaryFocus: "Pre-sales demos, proof-of-concept builds, and smooth handoff to delivery teams."
  },
  {
    title: "Integration Engineer",
    summaryLead: "Integration engineer connecting CRM, billing, and analytics systems through robust APIs.",
    summaryFocus: "Data integrity, observability, and pragmatic error handling."
  },
  {
    title: "Quality Engineering Lead",
    summaryLead: "Quality lead establishing automated regression suites for customer-facing web applications.",
    summaryFocus: "Playwright coverage, release checklists, and defect trend analysis."
  },
  {
    title: "Programmer Analyst",
    summaryLead: "Programmer analyst modernizing legacy intranet tools into responsive React modules.",
    summaryFocus: "Incremental migration, user training, and change management."
  },
  {
    title: "IT Applications Specialist",
    summaryLead: "Applications specialist supporting business units with custom workflow and reporting tools.",
    summaryFocus: "Requirements gathering, SLA adherence, and knowledge base upkeep."
  }
];
var CLASSIC_PROFILES_ZH = [
  {
    title: "\u61C9\u7528\u7A0B\u5F0F\u8EDF\u9AD4\u5DE5\u7A0B\u5E2B",
    summaryLead: "\u4EE5\u4FDD\u5B88\u3001ATS \u53CB\u5584\u683C\u5F0F\u5448\u73FE\uFF0C\u4E26\u4EE5\u660E\u78BA\u91CF\u5316\u6210\u679C\u70BA\u91CD\u7684\u61C9\u7528\u5DE5\u7A0B\u5E2B\u3002",
    summaryFocus: "\u7A69\u5B9A\u767C\u5E03\u3001\u8FF4\u6B78\u9632\u8B77\u8207\u5229\u5BB3\u95DC\u4FC2\u4EBA\u53EF\u8B80\u7684\u6587\u4EF6\u3002"
  },
  {
    title: "\u8CC7\u6DF1\u8EDF\u9AD4\u958B\u767C\u5DE5\u7A0B\u5E2B",
    summaryLead: "\u4EA4\u4ED8\u4F01\u696D\u5100\u8868\u677F\u3001\u5831\u8868\u6A21\u7D44\u8207\u6574\u5408\u5C64\u7684\u8CC7\u6DF1\u958B\u767C\u8005\u3002",
    summaryFocus: "\u53EF\u8B80\u7A0B\u5F0F\u78BC\u3001\u7D50\u69CB\u5316\u4EA4\u4ED8\u8207\u53EF\u9760\u7684\u8DE8\u8077\u80FD\u6E9D\u901A\u3002"
  },
  {
    title: "\u6280\u8853\u4E3B\u7BA1 \u2014 \u7DB2\u9801\u5E73\u53F0",
    summaryLead: "\u5354\u8ABF\u5167\u90E8\u7DB2\u9801\u5E73\u53F0\u8207\u5171\u7528\u670D\u52D9\u8DEF\u7DDA\u5716\u4EA4\u4ED8\u7684\u6280\u8853\u4E3B\u7BA1\u3002",
    summaryFocus: "\u98A8\u96AA\u63A7\u7BA1\u4E0A\u7DDA\u3001Runbook \u8207\u71DF\u904B\u5353\u8D8A\u3002"
  },
  {
    title: "\u9996\u5E2D\u5DE5\u7A0B\u5E2B \u2014 \u524D\u7AEF",
    summaryLead: "\u70BA\u5927\u578B React \u7A0B\u5F0F\u5EAB\u8207\u767C\u5E03\u7BC0\u594F\u8A02\u7ACB\u5DE5\u7A0B\u6A19\u6E96\u7684\u9996\u5E2D\u5DE5\u7A0B\u5E2B\u3002",
    summaryFocus: "\u67B6\u69CB\u5BE9\u67E5\u3001\u54C1\u8CEA\u95DC\u5361\u8207\u9577\u671F\u53EF\u7DAD\u8B77\u6027\u3002"
  },
  {
    title: "\u5DE5\u7A0B\u7D93\u7406 \u2014 \u7522\u54C1 UI",
    summaryLead: "\u5E73\u8861\u4EBA\u54E1\u7BA1\u7406\u8207 UI \u67B6\u69CB\u6307\u5C0E\u7684\u5DE5\u7A0B\u7D93\u7406\u3002",
    summaryFocus: "\u62DB\u52DF\u3001\u8077\u6DAF\u767C\u5C55\u8207\u53EF\u9810\u671F\u7684\u5B63\u5EA6\u6210\u679C\u3002"
  },
  {
    title: "\u89E3\u6C7A\u65B9\u6848\u5DE5\u7A0B\u5E2B",
    summaryLead: "\u5C07\u5BA2\u6236\u9700\u6C42\u8F49\u5316\u70BA\u53EF\u5BE6\u4F5C\u7522\u54C1\u898F\u683C\u7684\u89E3\u6C7A\u65B9\u6848\u5DE5\u7A0B\u5E2B\u3002",
    summaryFocus: "\u552E\u524D Demo\u3001PoC \u5EFA\u7F6E\u8207\u9806\u66A2\u7684\u4EA4\u4ED8\u4EA4\u63A5\u3002"
  },
  {
    title: "\u6574\u5408\u5DE5\u7A0B\u5E2B",
    summaryLead: "\u900F\u904E\u7A69\u5065 API \u4E32\u63A5 CRM\u3001\u5E33\u52D9\u8207\u5206\u6790\u7CFB\u7D71\u7684\u6574\u5408\u5DE5\u7A0B\u5E2B\u3002",
    summaryFocus: "\u8CC7\u6599\u5B8C\u6574\u6027\u3001\u53EF\u89C0\u6E2C\u6027\u8207\u52D9\u5BE6\u7684\u932F\u8AA4\u8655\u7406\u3002"
  },
  {
    title: "\u54C1\u8CEA\u5DE5\u7A0B\u7D44\u9577",
    summaryLead: "\u70BA\u9762\u5411\u5BA2\u6236\u7684\u7DB2\u9801\u61C9\u7528\u5EFA\u7ACB\u81EA\u52D5\u5316\u8FF4\u6B78\u6E2C\u8A66\u7684\u54C1\u8CEA\u7D44\u9577\u3002",
    summaryFocus: "Playwright \u8986\u84CB\u7387\u3001\u767C\u5E03\u6AA2\u67E5\u6E05\u55AE\u8207\u7F3A\u9677\u8DA8\u52E2\u5206\u6790\u3002"
  },
  {
    title: "\u7A0B\u5F0F\u5206\u6790\u5E2B",
    summaryLead: "\u5C07\u820A\u7248\u5167\u7DB2\u5DE5\u5177\u73FE\u4EE3\u5316\u70BA\u97FF\u61C9\u5F0F React \u6A21\u7D44\u7684\u7A0B\u5F0F\u5206\u6790\u5E2B\u3002",
    summaryFocus: "\u6F38\u9032\u5F0F\u9077\u79FB\u3001\u4F7F\u7528\u8005\u57F9\u8A13\u8207\u8B8A\u9769\u7BA1\u7406\u3002"
  },
  {
    title: "IT \u61C9\u7528\u5C08\u54E1",
    summaryLead: "\u70BA\u5404\u4E8B\u696D\u55AE\u4F4D\u652F\u63F4\u81EA\u8A02\u6D41\u7A0B\u8207\u5831\u8868\u5DE5\u5177\u7684\u61C9\u7528\u5C08\u54E1\u3002",
    summaryFocus: "\u9700\u6C42\u8A2A\u8AC7\u3001SLA \u9075\u5FAA\u8207\u77E5\u8B58\u5EAB\u7DAD\u8B77\u3002"
  }
];
var MINIMALIST_PROFILES_EN = [
  {
    title: "Product Designer \u2014 UI Engineering",
    summaryLead: "Designer-engineer hybrid shaping whitespace-driven product UI with systematic typography.",
    summaryFocus: "Minimal layouts that still communicate hierarchy and trust."
  },
  {
    title: "UX Engineer",
    summaryLead: "UX engineer prototyping flows in code and shipping production-ready React components.",
    summaryFocus: "Research-informed interaction design with fast iteration loops."
  },
  {
    title: "Interface Developer",
    summaryLead: "Interface developer crafting calm admin tools with strong grid discipline and neutral palettes.",
    summaryFocus: "Clarity over decoration; every pixel earns its place."
  },
  {
    title: "Design Ops Engineer",
    summaryLead: "Design ops engineer connecting Figma libraries to coded tokens and CI visual checks.",
    summaryFocus: "Single source of truth for color, spacing, and component variants."
  },
  {
    title: "Frontend Engineer \u2014 SaaS",
    summaryLead: "SaaS frontend engineer building settings, billing, and onboarding with restrained visual language.",
    summaryFocus: "Predictable patterns users can scan in seconds."
  },
  {
    title: "Web Developer \u2014 Studio Practice",
    summaryLead: "Studio-minded developer delivering portfolio-grade marketing sites and product landing pages.",
    summaryFocus: "Responsive grids, subtle motion, and accessible contrast."
  },
  {
    title: "Product Engineer \u2014 Mobile Web",
    summaryLead: "Product engineer optimizing mobile-first dashboards for field teams across APAC.",
    summaryFocus: "Touch targets, offline-tolerant states, and lightweight bundles."
  },
  {
    title: "UI Developer \u2014 Analytics",
    summaryLead: "UI developer presenting dense analytics with generous margins and typographic hierarchy.",
    summaryFocus: "Tables, filters, and charts that remain legible under load."
  },
  {
    title: "Creative Developer",
    summaryLead: "Creative developer experimenting with monospace accents and editorial grid systems.",
    summaryFocus: "Distinctive but readable interfaces for developer-facing products."
  },
  {
    title: "Digital Product Builder",
    summaryLead: "Product builder launching MVPs quickly while maintaining a polished, gallery-like presentation.",
    summaryFocus: "Scope discipline, user feedback loops, and craft in the details."
  }
];
var MINIMALIST_PROFILES_ZH = [
  {
    title: "\u7522\u54C1\u8A2D\u8A08\u5E2B \u2014 UI \u5DE5\u7A0B",
    summaryLead: "\u8A2D\u8A08\u8207\u5DE5\u7A0B\u96D9\u4FEE\uFF0C\u4EE5\u7559\u767D\u8207\u7CFB\u7D71\u5316\u5B57\u7D1A\u5851\u9020\u7522\u54C1 UI\u3002",
    summaryFocus: "\u6975\u7C21\u7248\u9762\u4ECD\u80FD\u50B3\u9054\u5C64\u7D1A\u8207\u4FE1\u4EFB\u611F\u3002"
  },
  {
    title: "UX \u5DE5\u7A0B\u5E2B",
    summaryLead: "\u4EE5\u7A0B\u5F0F\u78BC\u539F\u578B\u5316\u6D41\u7A0B\u4E26\u4EA4\u4ED8\u53EF\u4E0A\u7DDA React \u5143\u4EF6\u7684 UX \u5DE5\u7A0B\u5E2B\u3002",
    summaryFocus: "\u7814\u7A76\u9A45\u52D5\u7684\u4E92\u52D5\u8A2D\u8A08\u8207\u5FEB\u901F\u8FED\u4EE3\u3002"
  },
  {
    title: "\u4ECB\u9762\u958B\u767C\u5DE5\u7A0B\u5E2B",
    summaryLead: "\u4EE5\u56B4\u8B39\u683C\u7DDA\u8207\u4E2D\u6027\u8272\u8ABF\u6253\u9020\u6C89\u7A69\u5F8C\u53F0\u5DE5\u5177\u7684\u4ECB\u9762\u958B\u767C\u8005\u3002",
    summaryFocus: "\u6E05\u6670\u512A\u65BC\u88DD\u98FE\uFF1B\u6BCF\u500B\u50CF\u7D20\u90FD\u6709\u5B58\u5728\u7406\u7531\u3002"
  },
  {
    title: "\u8A2D\u8A08\u71DF\u904B\u5DE5\u7A0B\u5E2B",
    summaryLead: "\u9023\u7D50 Figma \u51FD\u5F0F\u5EAB\u3001\u7A0B\u5F0F Token \u8207 CI \u8996\u89BA\u6AA2\u67E5\u7684\u8A2D\u8A08\u71DF\u904B\u5DE5\u7A0B\u5E2B\u3002",
    summaryFocus: "\u8272\u5F69\u3001\u9593\u8DDD\u8207\u5143\u4EF6\u8B8A\u9AD4\u7684\u55AE\u4E00\u4E8B\u5BE6\u4F86\u6E90\u3002"
  },
  {
    title: "\u524D\u7AEF\u5DE5\u7A0B\u5E2B \u2014 SaaS",
    summaryLead: "\u4EE5\u514B\u5236\u8996\u89BA\u8A9E\u8A00\u5EFA\u69CB\u8A2D\u5B9A\u3001\u5E33\u52D9\u8207 onboarding \u7684 SaaS \u524D\u7AEF\u5DE5\u7A0B\u5E2B\u3002",
    summaryFocus: "\u4F7F\u7528\u8005\u6578\u79D2\u5167\u53EF\u6383\u8B80\u7684\u53EF\u9810\u671F\u6A21\u5F0F\u3002"
  },
  {
    title: "\u7DB2\u9801\u958B\u767C\u5DE5\u7A0B\u5E2B \u2014 \u5DE5\u4F5C\u5BA4",
    summaryLead: "\u4EA4\u4ED8\u4F5C\u54C1\u96C6\u7D1A\u884C\u92B7\u7DB2\u7AD9\u8207\u7522\u54C1\u8457\u9678\u9801\u7684\u5DE5\u4F5C\u5BA4\u578B\u958B\u767C\u8005\u3002",
    summaryFocus: "\u97FF\u61C9\u5F0F\u683C\u7DDA\u3001\u7D30\u7DFB\u52D5\u6548\u8207\u7121\u969C\u7919\u5C0D\u6BD4\u3002"
  },
  {
    title: "\u7522\u54C1\u5DE5\u7A0B\u5E2B \u2014 \u884C\u52D5\u7DB2\u9801",
    summaryLead: "\u70BA\u4E9E\u592A\u5916\u52E4\u5718\u968A\u512A\u5316\u884C\u52D5\u512A\u5148\u5100\u8868\u677F\u7684\u7522\u54C1\u5DE5\u7A0B\u5E2B\u3002",
    summaryFocus: "\u89F8\u63A7\u76EE\u6A19\u3001\u96E2\u7DDA\u5BB9\u932F\u72C0\u614B\u8207\u8F15\u91CF bundle\u3002"
  },
  {
    title: "UI \u958B\u767C\u5DE5\u7A0B\u5E2B \u2014 \u5206\u6790",
    summaryLead: "\u4EE5\u5BEC\u88D5\u908A\u8DDD\u8207\u5B57\u7D1A\u5C64\u7D1A\u5448\u73FE\u9AD8\u5BC6\u5EA6\u5206\u6790\u4ECB\u9762\u7684 UI \u958B\u767C\u8005\u3002",
    summaryFocus: "\u9AD8\u8CA0\u8F09\u4E0B\u4ECD\u6E05\u6670\u7684\u8868\u683C\u3001\u7BE9\u9078\u8207\u5716\u8868\u3002"
  },
  {
    title: "\u5275\u610F\u958B\u767C\u5DE5\u7A0B\u5E2B",
    summaryLead: "\u63A2\u7D22\u7B49\u5BEC\u5B57\u5F37\u8ABF\u8207\u7DE8\u8F2F\u683C\u7DDA\u7CFB\u7D71\u7684\u5275\u610F\u958B\u767C\u8005\u3002",
    summaryFocus: "\u9762\u5411\u958B\u767C\u8005\u7522\u54C1\u7684\u7368\u7279\u4F46\u53EF\u8B80\u4ECB\u9762\u3002"
  },
  {
    title: "\u6578\u4F4D\u7522\u54C1\u5EFA\u69CB\u8005",
    summaryLead: "\u5FEB\u901F\u63A8\u51FA MVP \u540C\u6642\u7DAD\u6301\u7CBE\u7DFB\u3001\u756B\u5ECA\u611F\u5448\u73FE\u7684\u7522\u54C1\u5EFA\u69CB\u8005\u3002",
    summaryFocus: "\u7BC4\u570D\u7D00\u5F8B\u3001\u4F7F\u7528\u8005\u56DE\u994B\u8FF4\u5708\u8207\u7D30\u7BC0\u5DE5\u85DD\u3002"
  }
];
var PROFILES_BY_LOCALE = {
  en: {},
  zh: {}
};
function familyProfiles(family, locale) {
  if (family === "classic") return locale === "zh" ? CLASSIC_PROFILES_ZH : CLASSIC_PROFILES_EN;
  if (family === "minimalist") return locale === "zh" ? MINIMALIST_PROFILES_ZH : MINIMALIST_PROFILES_EN;
  return locale === "zh" ? MODERN_PROFILES_ZH : MODERN_PROFILES_EN;
}
for (const locale of ["en", "zh"]) {
  for (const def of TEMPLATE_DEFINITION_LIST) {
    const index = Number(def.id.split("-")[1]) - 1;
    const profiles = familyProfiles(def.family, locale);
    PROFILES_BY_LOCALE[locale][def.id] = profiles[index] ?? profiles[0];
  }
}
var TEMPLATE_DEMO_PROFILES = PROFILES_BY_LOCALE.en;
function getTemplateDemoProfile(style, locale = "en") {
  return PROFILES_BY_LOCALE[locale][style] ?? PROFILES_BY_LOCALE.en["modern-01"];
}

// src/lib/templates/templateDemoLocale.ts
function readStoredUiLocale() {
  try {
    return normalizeStoredUiLocale(localStorage.getItem(NSR_STORAGE_KEYS.uiLocale));
  } catch {
  }
  return DEFAULT_LOCALE;
}
function resolveTemplateDemoLocale(locale) {
  const raw = locale ?? getActiveLocale();
  if (raw === "en") return "en";
  return "zh";
}

// src/lib/templates/templateDemoContent.ts
function withTemplateProfile(base, style, locale) {
  const profile = getTemplateDemoProfile(style, locale);
  const tail = TEMPLATE_DEMO_SUMMARY_TAIL[locale];
  return {
    ...base,
    personalInfo: {
      ...base.personalInfo,
      title: profile.title
    },
    summary: `${profile.summaryLead} ${profile.summaryFocus} ${tail}`
  };
}
function buildDemoRegistry(locale) {
  const base = buildTwoPageBaseResume(locale);
  return Object.fromEntries(
    TEMPLATE_DEFINITION_LIST.map((def) => [def.id, withTemplateProfile(base, def.id, locale)])
  );
}
var TEMPLATE_DEMO_RESUMES_EN = buildDemoRegistry("en");
var TEMPLATE_DEMO_RESUMES_ZH = buildDemoRegistry("zh");
function getTemplateDemoResumesForLocale(locale) {
  return locale === "zh" ? TEMPLATE_DEMO_RESUMES_ZH : TEMPLATE_DEMO_RESUMES_EN;
}
function getTemplateDemoResume(style, locale) {
  const demoLocale = resolveTemplateDemoLocale(locale);
  const registry = getTemplateDemoResumesForLocale(demoLocale);
  const demo = registry[style];
  if (!demo) return structuredClone(registry["modern-01"]);
  return structuredClone(demo);
}
function getDefaultTemplateDemoResume(locale) {
  return getTemplateDemoResume("classic-02", locale);
}

// src/data.ts
var HK_RESUME = {
  personalInfo: {
    name: "Alex Chan",
    title: "Frontend Product Engineer",
    email: "alex.chan@email.com",
    phone: "+852 9123 4567",
    website: "https://alexchan.dev",
    location: "Hong Kong SAR",
    linkedin: "linkedin.com/in/alexchan",
    rightToWork: "Permanent Hong Kong Resident",
    noticePeriod: "1 month",
    expectedSalary: "HK$42,000 / month"
  },
  summary: "Frontend engineer with 4 years shipping React and TypeScript products for Hong Kong and APAC teams. Focused on accessible UI, design systems, and measurable delivery impact.",
  experience: [
    {
      id: "exp-1",
      company: "Harbour Digital Solutions",
      role: "Frontend Product Engineer",
      startDate: "2022-08",
      endDate: "Present",
      location: "Quarry Bay, Hong Kong",
      bullets: [
        "Rebuilt a merchant operations workspace in React and TypeScript, cutting support task time by 22%.",
        "Built a shared component library and token system adopted across admin and analytics surfaces."
      ]
    },
    {
      id: "exp-2",
      company: "Kowloon Commerce Cloud",
      role: "Software Engineer",
      startDate: "2020-07",
      endDate: "2022-07",
      location: "Kowloon Bay, Hong Kong",
      bullets: [
        "Delivered internal order and catalog tooling with React, Node.js, and REST APIs for three markets.",
        "Replaced manual spreadsheet reporting with dashboard modules used weekly by operations teams."
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      institution: "The Hong Kong Polytechnic University",
      degree: "BSc",
      field: "Computing",
      gradDate: "2021-06",
      location: "Hung Hom, Hong Kong"
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "Sprintboard HK",
      description: "Kanban planning tool with drag-and-drop boards and keyboard shortcuts.",
      techStack: "React, TypeScript, Tailwind CSS, Zustand",
      url: "https://github.com/alexchan/sprintboard-hk"
    }
  ],
  skills: [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Tailwind CSS",
    "Design Systems",
    "Accessibility",
    "REST APIs",
    "Cantonese",
    "English"
  ],
  languages: ["English (Fluent)", "Cantonese (Native)", "Mandarin (Conversational)"]
};
var DEFAULT_RESUME = {
  personalInfo: {
    name: "Morgan Keats",
    title: "Senior Frontend Developer",
    email: "morgan.keats@proton.me",
    phone: "+1 (312) 847-1928",
    website: "https://morgankeats.dev",
    location: "Chicago, Illinois",
    linkedin: "linkedin.com/in/morgan-keats"
  },
  summary: "Frontend developer with 5 years building React dashboards, ecommerce journeys, and internal tools for product-led teams.",
  experience: [
    {
      id: "exp-1",
      company: "Northline Digital",
      role: "Senior Frontend Developer",
      startDate: "2022-02",
      endDate: "Present",
      location: "Chicago, IL (Hybrid)",
      bullets: [
        "Owned frontend delivery for a B2B operations suite used by sales and finance teams, shipping roadmap items across onboarding, reporting, and approvals workflows.",
        "Introduced reusable React patterns, table primitives, and token-based styling that made new feature delivery more predictable."
      ]
    },
    {
      id: "exp-2",
      company: "Harborstack Labs",
      role: "Frontend Developer",
      startDate: "2020-06",
      endDate: "2022-01",
      location: "Remote",
      bullets: [
        "Built and maintained client-facing marketing sites, lead-capture journeys, and lightweight dashboards for startup clients.",
        "Helped migrate legacy UI to TypeScript and reusable Tailwind patterns, improving consistency across new builds."
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of Illinois Chicago",
      degree: "Bachelor of Science",
      field: "Computer Science",
      gradDate: "2023-05",
      location: "Chicago, IL"
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "Sprintboard",
      description: "Kanban planning tool with drag-and-drop columns and command palette actions.",
      techStack: "React, TypeScript, Tailwind, DnD Kit",
      url: "https://github.com/morgankeats/sprintboard"
    }
  ],
  skills: [
    "JavaScript",
    "React.js",
    "TypeScript",
    "Next.js",
    "Tailwind CSS",
    "Design Systems",
    "Accessibility",
    "Git & GitHub",
    "REST APIs",
    "Jira",
    "Node.js"
  ],
  languages: ["English (Native)", "Spanish (Professional Working Proficiency)"]
};
var initialResumeData = getDefaultTemplateDemoResume(readStoredUiLocale());
var compactResumeFixture = isHongKongMarket() ? HK_RESUME : DEFAULT_RESUME;
var HK_JOB_DESCRIPTION = `
Software Engineer (React / TypeScript) \u2014 Hong Kong

About the role:
We are hiring an engineer to grow our regional dashboard platform serving Hong Kong and APAC clients. You will build performant, accessible UI components and improve large data views.

Requirements:
- 3+ years building responsive SPAs in production.
- Strong TypeScript, React, and modern CSS (Tailwind preferred).
- Track record of measurable impact (performance, quality, or delivery metrics).
- Eligible to work in Hong Kong; fluent English; Cantonese a plus.
- Comfortable in Agile teams with cross-functional stakeholders.

Nice to have:
- Fintech or regulated industry experience.
- Experience with Vite, Node.js, and CI/CD pipelines.
`;
var initialJobDescription = isHongKongMarket() ? HK_JOB_DESCRIPTION : `
Senior Frontend Engineer (React/TypeScript)

Job Description:
We are looking for an engineer to grow our enterprise dashboard platform. You will build fast, accessible UI components and help resolve performance bottlenecks on large data views.

Required Qualifications:
- 3+ years building responsive SPAs at product scale.
- Strong TypeScript, React Hooks, and Tailwind CSS experience.
- Track record of measurable impact (performance, velocity, or quality metrics).
- Comfort with modular architecture, profiling, and Vite-based builds.
`;
var COMPILED_ENDPOINTS = [
  { path: "/api/resume/parse", method: "POST", localeKey: "parse" },
  { path: "/api/resume/parse-pdf", method: "POST", localeKey: "parsePdf" },
  { path: "/api/analyze", method: "POST", localeKey: "analyze" },
  { path: "/api/jobsdb/search", method: "POST", localeKey: "jobsdb" },
  { path: "/api/health", method: "GET", localeKey: "health" }
];
var reverseEngineeringOverview = {
  compiledEndpoints: COMPILED_ENDPOINTS.map(({ path, method }) => ({ path, method }))
};

// src/lib/templates/templateDemoMatch.ts
function resumeDataEquals(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function isTemplateDemoResume(resume, style) {
  return resumeDataEquals(resume, getTemplateDemoResume(style, "en")) || resumeDataEquals(resume, getTemplateDemoResume(style, "zh"));
}

// src/lib/printExportBridge.ts
function exportSectionPageMapFromPositions(sections, positions, fallbackPageId) {
  const primary = fallbackPageId ?? Object.values(positions).find((p) => p.pageId)?.pageId ?? "page-1";
  return Object.fromEntries(
    sections.filter((s) => positions[s.id]).map((s) => [s.id, positions[s.id].pageId ?? primary])
  );
}
function distinctPositionPageCount(positions) {
  return new Set(Object.values(positions).map((pos) => pos.pageId).filter(Boolean)).size;
}
function healDemoExportLayoutSnapshot(snap) {
  if (!isTemplateDemoResume(snap.resumeData, snap.activeTemplate)) {
    return { exportSurfacePositions: snap.exportSurfacePositions, exportPages: snap.exportPages };
  }
  const singleExportPage = snap.exportPages.length <= 1 || distinctPositionPageCount(snap.exportSurfacePositions) <= 1;
  const sectionIds = snap.sections.map((section) => section.id);
  const needsHeal = demoLayoutMissingSecondPage(snap.exportSurfacePositions) || demoLayoutPageAssignmentDrift(
    snap.exportSurfacePositions,
    snap.activeTemplate,
    sectionIds,
    snap.resumeData
  ) || singleExportPage && snap.sections.length > 5;
  if (!needsHeal) {
    return { exportSurfacePositions: snap.exportSurfacePositions, exportPages: snap.exportPages };
  }
  const draftPositions = createTemplateDemoLayoutPositions(
    snap.activeTemplate,
    sectionIds,
    snap.resumeData
  );
  const studioPages = buildTemplateDemoPagesDocument();
  const doc = buildLayoutDocument({
    sectionIds,
    draftPositions,
    resumeData: snap.resumeData,
    freeLayoutEnabled: true,
    studioPages: studioPages.pages,
    studioSectionPageMap: exportSectionPageMapFromPositions(
      snap.sections,
      draftPositions,
      studioPages.pages[0].id
    )
  });
  return {
    exportSurfacePositions: doc.printPlan.positions,
    exportPages: doc.printPlan.pageIds.map((id, index) => ({
      id,
      label: formatCanvasPageLabel(index + 1)
    }))
  };
}
function healDemoPrintLayoutPayload(resumeData, templateStyle, layout) {
  if (!layout.enabled) return layout;
  const healed = healDemoExportLayoutSnapshot({
    resumeData,
    activeTemplate: templateStyle,
    highlightChanges: false,
    analysisResult: null,
    grayscaleMode: layout.grayscaleMode ?? false,
    themeCustomization: layout.themeCustomization ?? {},
    freeLayoutEnabled: true,
    sections: layout.sections,
    exportSurfacePositions: layout.positions,
    exportPages: layout.pages ?? [],
    sectionPageMap: layout.sectionPageMap ?? {},
    layerOrder: layout.layerOrder ?? [],
    hiddenSections: layout.hiddenSections ?? {},
    sectionSlices: layout.sectionSlices
  });
  return {
    ...layout,
    positions: healed.exportSurfacePositions,
    pages: healed.exportPages
  };
}
function normalizePrintLayoutPayload(layout) {
  if (!layout.enabled || !layout.sections.length || !Object.keys(layout.positions).length) {
    return layout;
  }
  const primaryPageId = layout.pages?.[0]?.id;
  const sectionPageMap = exportSectionPageMapFromPositions(
    layout.sections,
    layout.positions,
    primaryPageId
  );
  const referencedIds = [];
  const pushId = (pageId) => {
    if (pageId && !referencedIds.includes(pageId)) referencedIds.push(pageId);
  };
  for (const pageId of Object.values(sectionPageMap)) pushId(pageId);
  for (const pos of Object.values(layout.positions)) pushId(pos.pageId);
  for (const page of layout.pages ?? []) pushId(page.id);
  const pageById = new Map((layout.pages ?? []).map((page) => [page.id, page]));
  const pages = referencedIds.map((id, index) => pageById.get(id) ?? { id, label: formatCanvasPageLabel(index + 1) });
  return {
    ...layout,
    sectionPageMap,
    pages: pages.length ? pages : layout.pages
  };
}

// server/exportPdfHandler.ts
var PRINT_READY_SELECTOR = '[data-print-ready="true"]';
var PRINT_TIMEOUT_MS = 45e3;
var FONT_READY_TIMEOUT_MS = 18e3;
var IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
async function launchChromium() {
  if (IS_SERVERLESS) {
    try {
      const sparticuz = (await import("@sparticuz/chromium")).default;
      const { chromium } = await import("playwright-core");
      const executablePath = await sparticuz.executablePath();
      return await chromium.launch({
        headless: true,
        executablePath,
        args: [...sparticuz.args, "--disable-dev-shm-usage"]
      });
    } catch (error) {
      console.error("[export/pdf] serverless chromium launch failed:", error);
      return null;
    }
  }
  try {
    const pw = await import("playwright-core");
    return await pw.chromium.launch({ headless: true });
  } catch {
    try {
      const pw = await import("playwright");
      return await pw.chromium.launch({ headless: true });
    } catch {
      return null;
    }
  }
}
function firstHeaderValue(value) {
  if (!value) return void 0;
  const raw = Array.isArray(value) ? value[0] : value;
  return raw.split(",")[0]?.trim() || void 0;
}
function isProtectedVercelDeploymentHost(host) {
  const hostname = host.trim().toLowerCase().split(":")[0] ?? "";
  if (!hostname.endsWith(".vercel.app")) return false;
  const sub = hostname.slice(0, -".vercel.app".length);
  return /-[a-z0-9]{8,}-[a-z0-9-]+$/i.test(sub);
}
function configuredPublicOrigin() {
  const raw = process.env.PRINT_ORIGIN || process.env.PUBLIC_APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : void 0);
  if (!raw) return void 0;
  return raw.replace(/\/$/, "");
}
function resolvePrintOrigin(req) {
  const serverless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (serverless) {
    const publicOrigin = configuredPublicOrigin();
    if (publicOrigin) return publicOrigin;
    const host = firstHeaderValue(req.headers["x-forwarded-host"]) ?? firstHeaderValue(req.headers.host);
    const proto = firstHeaderValue(req.headers["x-forwarded-proto"]) ?? "https";
    if (host && !isProtectedVercelDeploymentHost(host)) {
      return `${proto}://${host}`;
    }
    if (host) return `${proto}://${host}`;
  }
  const port = Number(process.env.PORT) || 3e3;
  return `http://127.0.0.1:${port}`;
}
function buildPrintUrl(origin) {
  const url = new URL("/?print=1", origin.endsWith("/") ? origin : `${origin}/`);
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypass) {
    url.searchParams.set("x-vercel-protection-bypass", bypass);
    url.searchParams.set("x-vercel-set-bypass-cookie", "true");
  }
  return url.toString();
}
async function handleExportPdf(req, res) {
  const body = req.body ?? {};
  const format = body.pageFormat === "Letter" ? "Letter" : "A4";
  if (!body.resumeData || typeof body.resumeData !== "object" || !("personalInfo" in body.resumeData)) {
    res.status(400).json({ error: "resumeData is required", code: "MISSING_RESUME_DATA" });
    return;
  }
  const browser = await launchChromium();
  if (!browser) {
    res.status(501).json({
      error: "PDF renderer unavailable in this environment",
      code: "CHROMIUM_UNAVAILABLE"
    });
    return;
  }
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });
    let normalizedLayout = body.layout && typeof body.layout === "object" && body.layout.enabled === true ? body.layout : body.layout;
    if (normalizedLayout && typeof normalizedLayout === "object" && normalizedLayout.enabled === true) {
      const healed = healDemoPrintLayoutPayload(
        body.resumeData,
        normalizeTemplateStyle(body.templateStyle),
        normalizedLayout
      );
      normalizedLayout = normalizePrintLayoutPayload(healed);
    }
    const payload = JSON.stringify({
      resumeData: body.resumeData,
      templateStyle: body.templateStyle,
      locale: body.locale,
      pageFormat: format,
      paperMode: body.paperMode === "white" ? "white" : "cream",
      watermark: typeof body.watermark === "string" ? body.watermark : void 0,
      layout: normalizedLayout
    });
    await page.addInitScript((raw) => {
      try {
        localStorage.setItem("nsr_print_payload", raw);
      } catch {
      }
    }, payload);
    const printUrl = buildPrintUrl(resolvePrintOrigin(req));
    await page.goto(printUrl, {
      waitUntil: "domcontentloaded",
      timeout: PRINT_TIMEOUT_MS
    });
    await page.waitForSelector(PRINT_READY_SELECTOR, { timeout: PRINT_TIMEOUT_MS });
    await page.evaluate(async (fontTimeoutMs) => {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, fontTimeoutMs))
      ]);
    }, FONT_READY_TIMEOUT_MS);
    const pdf = await page.pdf({
      format,
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      preferCSSPageSize: true
    });
    if (!pdf || pdf.byteLength < 2e3) {
      res.status(500).json({ error: "PDF render produced empty output", code: "EMPTY_PDF" });
      return;
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=resume.pdf");
    res.send(Buffer.from(pdf));
  } catch (error) {
    console.error("[export/pdf] render failed:", error);
    if (!res.headersSent) {
      const message = error instanceof Error ? error.message : "PDF render failed";
      res.status(500).json({ error: message, code: "RENDER_FAILED" });
    }
  } finally {
    await browser.close().catch(() => void 0);
  }
}

// server/exportPdfStandalone.ts
async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  await handleExportPdf(req, res);
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
module.exports = module.exports.default ?? module.exports;
//# sourceMappingURL=export-pdf.js.map
