import { t, getActiveLocale } from "../i18n/translate";
import type { AppLocale } from "../i18n/types";

const SECTION_KEYS: Record<string, string> = {
  header: "sections.header",
  summary: "sections.summary",
  experience: "sections.experience",
  education: "sections.education",
  projects: "sections.projects",
  skills: "sections.skills",
  certifications: "sections.certifications",
  volunteer: "sections.volunteer",
  languages: "sections.languages",
};

export function getSectionLabel(sectionId: string, locale?: AppLocale): string {
  const key = SECTION_KEYS[sectionId];
  if (!key) {
    if (sectionId.startsWith("el-")) {
      const kind = sectionId.split("-")[1];
      if (kind === "text" || kind === "photo" || kind === "divider") {
        return t(`canvas.elements.${kind}`, undefined, locale ?? getActiveLocale());
      }
    }
    return sectionId;
  }
  return t(key, undefined, locale ?? getActiveLocale());
}

export function getPresetLabel(presetId: string, locale?: AppLocale): string {
  return t(`layoutPresets.${presetId}`, undefined, locale ?? getActiveLocale());
}

export function formatAutoSaveTime(savedAt: number | null, locale?: AppLocale): string {
  const loc = locale ?? getActiveLocale();
  if (!savedAt) return t("studio.autoSaveEnabled", undefined, loc);
  const time = new Intl.DateTimeFormat(loc === "zh-TW" ? "zh-TW" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(savedAt));
  return t("studio.autoSaveAt", { time }, loc);
}

export function formatCanvasPageLabel(index: number, locale?: AppLocale): string {
  return t("canvas.pageLabel", { index }, locale ?? getActiveLocale());
}

export function getShortcutLabel(shortcutId: string, locale?: AppLocale): string {
  return t(`canvas.shortcuts.${shortcutId}`, undefined, locale ?? getActiveLocale());
}

const SHORTCUT_KEY_ALIASES: Record<string, string> = {
  拖曳: "drag",
  滾輪: "wheel",
  另一頁: "anotherPage",
  拖至: "dragTo",
  頁緣: "pageEdge",
  圖層: "layer",
  握把拖曳: "layerHandleDrag",
  長按: "longPress",
  握把: "handle",
  視圖: "view",
  滑桿: "slider",
};

export function getShortcutKeyLabel(key: string, locale?: AppLocale): string {
  const slug = SHORTCUT_KEY_ALIASES[key] ?? key;
  const translated = t(`canvas.shortcutKeys.${slug}`, undefined, locale ?? getActiveLocale());
  return translated.startsWith("canvas.shortcutKeys.") ? key : translated;
}
