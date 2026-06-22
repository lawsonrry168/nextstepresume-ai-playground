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

export type MessageTree = {
  [key: string]: string | MessageTree;
};
