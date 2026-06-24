import { ArrowLeft } from "lucide-react";
import { useI18n } from "../../i18n";
import {
  LEGAL_PAGE_SECTIONS,
  legalPageTitleKey,
  legalPageUpdatedKey,
  legalSectionBodyKey,
  legalSectionTitleKey,
  type LegalPageId,
} from "../../lib/legal/pages";

interface LegalPageProps {
  pageId: LegalPageId;
}

export default function LegalPage({ pageId }: LegalPageProps) {
  const { t } = useI18n();
  const sections = LEGAL_PAGE_SECTIONS[pageId];

  return (
    <div className="marginalia-theme min-h-[100dvh] bg-slate-50 text-slate-800" id={`legal-page-${pageId}`}>
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-3">
          <a
            href="/"
            id="legal-back-home"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            {t("legal.nav.back")}
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        <h1 className="text-2xl font-serif-heading font-bold text-slate-900 tracking-tight">
          {t(legalPageTitleKey(pageId))}
        </h1>
        <p className="mt-2 text-xs text-slate-500">{t(legalPageUpdatedKey(pageId))}</p>

        <nav className="mt-6 flex flex-wrap gap-3 text-xs" aria-label={t("legal.nav.related")}>
          {pageId !== "privacy" ? (
            <a href="/privacy" className="text-emerald-700 hover:underline font-medium">
              {t("legal.nav.privacy")}
            </a>
          ) : null}
          {pageId !== "terms" ? (
            <a href="/terms" className="text-emerald-700 hover:underline font-medium">
              {t("legal.nav.terms")}
            </a>
          ) : null}
        </nav>

        <article className="mt-8 space-y-8">
          {sections.map((sectionId) => (
            <section key={sectionId} id={`legal-section-${sectionId}`}>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {t(legalSectionTitleKey(pageId, sectionId))}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                {t(legalSectionBodyKey(pageId, sectionId))}
              </p>
            </section>
          ))}
        </article>

        <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400">
          <p>{t("overview.footer.copyright")}</p>
        </footer>
      </main>
    </div>
  );
}
