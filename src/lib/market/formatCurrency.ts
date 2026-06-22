import type { AppLocale } from "../../i18n/types";
import { getActiveMarket } from "./config";

export function formatMarketCurrency(amount: number, locale: AppLocale): string {
  const market = getActiveMarket();
  if (amount === 0) {
    return locale === "en" ? "Free" : "免費";
  }
  const formatted = amount.toLocaleString(locale === "en" ? "en-HK" : "zh-HK", {
    maximumFractionDigits: 0,
  });
  return `${market.currencySymbol}${formatted}`;
}
