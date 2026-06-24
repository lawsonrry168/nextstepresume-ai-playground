import { useI18n } from "../../i18n";

export default function LegalFooterLinks() {
  const { t } = useI18n();

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2 text-[10px]"
      aria-label={t("legal.nav.related")}
      id="legal-footer-links"
    >
      <a href="/privacy" className="text-emerald-700 hover:underline font-medium">
        {t("legal.nav.privacy")}
      </a>
      <span className="text-slate-300" aria-hidden>
        ·
      </span>
      <a href="/terms" className="text-emerald-700 hover:underline font-medium">
        {t("legal.nav.terms")}
      </a>
    </nav>
  );
}
