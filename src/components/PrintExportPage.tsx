import { useEffect, useState } from "react";
import ResumeTemplateRenderer from "./ResumeTemplateRenderer";
import { initialResumeData } from "../data";
import type { ResumeData } from "../types";
import { normalizeTemplateStyle, type TemplateStyle } from "../lib/resumeTemplateCatalog";
import { ensureLocaleLoaded, setActiveLocale } from "../i18n/translate";
import type { AppLocale } from "../i18n/types";

const PRINT_PAYLOAD_KEY = "nsr_print_payload";
/** A4 at 96dpi — must match CANVAS_PAGE_WIDTH so Chromium maps 794px → 210mm */
const PRINT_SHEET_WIDTH = 794;

interface PrintPayload {
  resumeData?: ResumeData;
  templateStyle?: string;
  locale?: string;
  /** "white" swaps the cream paper token for pure white (physical printing) */
  paperMode?: string;
}

function readPrintPayload(): PrintPayload {
  try {
    const raw = localStorage.getItem(PRINT_PAYLOAD_KEY);
    return raw ? (JSON.parse(raw) as PrintPayload) : {};
  } catch {
    return {};
  }
}

/**
 * Minimal print surface for the server-side PDF export (?print=1).
 * Renders only the resume sheet — no app chrome — and flags readiness
 * via data-print-ready for the headless browser to await.
 */
export default function PrintExportPage() {
  const [ready, setReady] = useState(false);
  const payload = readPrintPayload();
  const data = payload.resumeData ?? initialResumeData;
  const style: TemplateStyle = normalizeTemplateStyle(payload.templateStyle);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    let cancelled = false;

    // Headless/serverless Chromium ships no system fonts — load the design
    // fonts (incl. Traditional Chinese) as webfonts before flagging ready.
    const FONT_CSS =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Source+Serif+4:wght@400;600;700&family=Public+Sans:wght@400;600;700&family=Noto+Serif+TC:wght@400;700&family=Noto+Sans+TC:wght@400;500;700&display=swap";
    let fontsLoaded: Promise<unknown> = Promise.resolve();
    if (!document.querySelector('link[data-print-fonts="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = FONT_CSS;
      link.setAttribute("data-print-fonts", "true");
      fontsLoaded = new Promise<void>((resolve) => {
        link.onload = () => resolve();
        link.onerror = () => resolve();
        setTimeout(resolve, 6000);
      });
      document.head.appendChild(link);
    }

    const isKnownLocale =
      payload.locale === "en" || payload.locale === "zh-TW" || payload.locale === "zh-HK";
    const localeReady = isKnownLocale
      ? ensureLocaleLoaded(payload.locale as AppLocale).then(() => {
          setActiveLocale(payload.locale as AppLocale);
        })
      : Promise.resolve();

    void Promise.all([localeReady, fontsLoaded])
      .then(() => document.fonts.ready)
      .then(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [payload.locale]);

  return (
    <div
      data-print-export-root
      data-print-ready={ready ? "true" : "false"}
      className="marginalia-theme"
      style={{ width: PRINT_SHEET_WIDTH, margin: 0, padding: 0, background: "white" }}
    >
      <style>{`
        @page { margin: 0; }
        ${payload.paperMode === "white" ? "[data-print-export-root] * { --tpl-paper: #ffffff; } [data-print-export-root] .tpl-paper, [data-print-export-root] .resume-a4-surface { background-color: #ffffff !important; }" : ""}
        html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
        [data-print-export-root] .resume-a4-surface,
        [data-print-export-root] #resume-printable-sheet {
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          margin: 0 !important;
        }
      `}</style>
      <ResumeTemplateRenderer
        data={data}
        style={style}
        highlightChanges={false}
        layout="page"
      />
    </div>
  );
}
