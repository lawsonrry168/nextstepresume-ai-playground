import type { AppLocale } from "./types";

export function htmlLangForLocale(locale: AppLocale): string {
  if (locale === "en") return "en-HK";
  if (locale === "zh-HK") return "zh-HK";
  return "zh-Hant";
}
