import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NSR_STORAGE_KEYS } from "../lib/storageKeys";
import { getActiveMarket } from "../lib/market/config";
import { ensureLocaleLoaded, setActiveLocale, translate } from "./translate";
import type { AppLocale } from "./types";
import { DEFAULT_LOCALE, getMarketLocales } from "./types";

interface LocaleContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  localeReady: boolean;
  marketLocales: AppLocale[];
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): AppLocale {
  const allowed = getMarketLocales();
  try {
    const raw = localStorage.getItem(NSR_STORAGE_KEYS.uiLocale);
    if (raw && allowed.includes(raw as AppLocale)) return raw as AppLocale;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

function htmlLangForLocale(locale: AppLocale): string {
  if (locale === "en") return "en-HK";
  if (locale === "zh-HK") return "zh-HK";
  return "zh-Hant";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => readStoredLocale());
  const [localeReady, setLocaleReady] = useState(false);
  const marketLocales = useMemo(() => getMarketLocales(), []);

  useEffect(() => {
    let cancelled = false;
    void ensureLocaleLoaded(locale).then(() => {
      if (cancelled) return;
      setActiveLocale(locale);
      setLocaleReady(true);
      try {
        localStorage.setItem(NSR_STORAGE_KEYS.uiLocale, locale);
      } catch {
        /* ignore */
      }
      document.documentElement.lang = htmlLangForLocale(locale);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const setLocale = useCallback((next: AppLocale) => {
    if (next === locale) return;
    void ensureLocaleLoaded(next).then(() => {
      setLocaleState(next);
    });
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      localeReady,
      marketLocales,
      t: (key, vars) => translate(key, vars, locale),
    }),
    [locale, localeReady, marketLocales],
  );

  if (!localeReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm font-medium">
        {translate("common.loading", undefined, DEFAULT_LOCALE)}
      </div>
    );
  }

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}

export function useMarketBanner(): string {
  return translate("market.banner", undefined, getActiveMarket().defaultLocale as AppLocale);
}
