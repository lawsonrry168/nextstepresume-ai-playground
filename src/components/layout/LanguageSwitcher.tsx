import { Languages } from "lucide-react";
import { LOCALE_LABELS, useI18n, type AppLocale } from "../../i18n";

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export default function LanguageSwitcher({ compact = false, className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, t, marketLocales } = useI18n();

  const locales = marketLocales.length >= 2 ? marketLocales : (["en", "zh-HK"] as AppLocale[]);
  const currentIndex = locales.indexOf(locale);
  const nextLocale = locales[(currentIndex + 1) % locales.length] ?? locales[0];

  return (
    <button
      type="button"
      id="locale-switcher"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer transition ${compact ? "p-2 justify-center" : "px-2.5 py-1.5 text-[10px] font-bold"} ${className}`}
      title={t("locale.switchTo", { locale: LOCALE_LABELS[nextLocale] })}
      aria-label={t("locale.switchTo", { locale: LOCALE_LABELS[nextLocale] })}
      onClick={() => setLocale(nextLocale)}
    >
      <Languages className="w-3.5 h-3.5 shrink-0" />
      {!compact ? <span data-testid="locale-switcher-label">{LOCALE_LABELS[locale]}</span> : null}
    </button>
  );
}
