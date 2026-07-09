import { getActiveMarket } from "../lib/market/config";

export type AppLocale = "en" | "zh-HK" | "zh-TW";

export const DEFAULT_LOCALE: AppLocale = getActiveMarket().defaultLocale as AppLocale;

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  "zh-HK": "繁體中文（香港）",
  "zh-TW": "繁體中文",
};

export function getMarketLocales(): AppLocale[] {
  const fromMarket = getActiveMarket().locales as AppLocale[];
  return fromMarket.length ? fromMarket : ["en", "zh-HK"];
}

/** Map legacy / out-of-market stored values onto an active market locale. */
export function normalizeStoredUiLocale(raw: string | null | undefined): AppLocale {
  const allowed = getMarketLocales();
  if (raw === "zh-TW" && allowed.includes("zh-HK")) return "zh-HK";
  if (raw && allowed.includes(raw as AppLocale)) return raw as AppLocale;
  return DEFAULT_LOCALE;
}

export type MessageTree = {
  [key: string]: string | MessageTree;
};
