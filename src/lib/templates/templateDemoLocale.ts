import type { AppLocale } from "../../i18n/types";
import { DEFAULT_LOCALE, normalizeStoredUiLocale } from "../../i18n/types";
import { getActiveLocale } from "../../i18n/translate";
import { NSR_STORAGE_KEYS } from "../storageKeys";

/** Binary demo locale — UI zh-HK / zh-TW both map to zh. */
export type TemplateDemoLocale = "en" | "zh";

export function readStoredUiLocale(): AppLocale {
  try {
    return normalizeStoredUiLocale(localStorage.getItem(NSR_STORAGE_KEYS.uiLocale));
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

export function resolveTemplateDemoLocale(locale?: AppLocale | TemplateDemoLocale): TemplateDemoLocale {
  const raw = locale ?? getActiveLocale();
  if (raw === "en") return "en";
  return "zh";
}

export function isChineseDemoLocale(locale: TemplateDemoLocale): boolean {
  return locale === "zh";
}
