import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import ResumeTemplateRenderer from "./ResumeTemplateRenderer";
import { initialResumeData } from "../data";
import type { ResumeData, AnalysisResult } from "../types";
import { normalizeTemplateStyle, type TemplateStyle } from "../lib/resumeTemplateCatalog";
import { ensureLocaleLoaded, setActiveLocale } from "../i18n/translate";
import type { AppLocale } from "../i18n/types";
import {
  PRINT_PAYLOAD_KEY,
  readStoredPrintPayload,
  type PrintLayoutPayload,
  type ServerPrintPayload,
} from "../lib/printExportPayload";
import { resolveResumeTheme } from "../lib/resumeThemeCustomization";
import { formatCanvasPageLabel } from "../lib/sectionLabels";
import { layerZIndex } from "../lib/canvasStudioTypes";
import { baseSectionIdFromFragment } from "../lib/layoutEntryPagination";
import { normalizePrintLayoutPayload } from "../lib/printExportBridge";

const FreeLayoutStudioCanvas = lazy(() => import("./playground/FreeLayoutStudioCanvas"));

/** A4 at 96dpi — must match CANVAS_PAGE_WIDTH so Chromium maps 794px → 210mm */
const PRINT_SHEET_WIDTH = 794;

import {
  GOOGLE_PRINT_FONTS_URL,
  waitForPrintFontsReady,
} from "../lib/printFonts";

function WatermarkStyles({ text }: { text: string }) {
  const safe = text.replace(/"/g, "'");
  return (
    <style>{`
      [data-print-watermark]::before {
        content: "${safe}";
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-30deg);
        font: 700 48px "Public Sans", sans-serif;
        color: #64748b;
        opacity: 0.1;
        pointer-events: none;
        z-index: 9999;
        white-space: nowrap;
      }
      [data-print-watermark]::after {
        content: "${safe}";
        position: fixed;
        right: 24px;
        bottom: 16px;
        font: 500 11px "Public Sans", sans-serif;
        color: #94a3b8;
        opacity: 0.55;
        pointer-events: none;
        z-index: 9999;
      }
    `}</style>
  );
}

function buildCanvasLayout(layout: PrintLayoutPayload) {
  const normalized = normalizePrintLayoutPayload(layout);
  const pages = normalized.pages?.length
    ? normalized.pages
    : [{ id: "print-page-1", label: formatCanvasPageLabel(1) }];
  const primaryPageId = pages[0]!.id;
  return {
    pages,
    activePageId: primaryPageId,
    sectionPageMap: normalized.sectionPageMap ?? {},
    hiddenSections: normalized.hiddenSections ?? {},
    lockedSections: {},
    selectedSectionId: null,
    onSelectSection: () => {},
    getZIndex: (id: string) => layerZIndex(baseSectionIdFromFragment(id), normalized.layerOrder ?? []),
  };
}

/**
 * Minimal print surface for server-side PDF export (?print=1).
 * Renders template flow OR free-layout print plan — same sources as the hidden export surface.
 */
export default function PrintExportPage() {
  const [ready, setReady] = useState(false);
  const payload: Partial<ServerPrintPayload> = readStoredPrintPayload();
  const data: ResumeData = payload.resumeData ?? initialResumeData;
  const style: TemplateStyle = normalizeTemplateStyle(payload.templateStyle);
  const layout = payload.layout
    ? payload.layout.enabled
      ? normalizePrintLayoutPayload(payload.layout as PrintLayoutPayload)
      : payload.layout
    : undefined;
  const useFreeLayout = layout?.enabled === true && (layout.sections?.length ?? 0) > 0;

  const resolvedTheme = useMemo(
    () => resolveResumeTheme(style, layout?.themeCustomization),
    [style, layout?.themeCustomization],
  );

  const canvasLayout = useMemo(
    () => (useFreeLayout && layout ? buildCanvasLayout(layout) : undefined),
    [layout, useFreeLayout],
  );

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    let cancelled = false;

    // Bound every readiness dependency so a slow/failed resource (external
    // webfonts, a dynamic chunk, document.fonts.ready) can never leave the
    // surface hanging — which would stall the serverless exporter until its
    // waitForSelector times out and returns a 500.
    const settleWithin = <T,>(promise: Promise<T> | T, ms: number): Promise<T | undefined> =>
      Promise.race([
        Promise.resolve(promise).catch(() => undefined),
        new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms)),
      ]);

    let fontsLoaded: Promise<unknown> = Promise.resolve();
    if (!document.querySelector('link[data-print-fonts="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = GOOGLE_PRINT_FONTS_URL;
      link.setAttribute("data-print-fonts", "true");
      fontsLoaded = new Promise<void>((resolve) => {
        link.onload = () => resolve();
        link.onerror = () => resolve();
        setTimeout(resolve, 8000);
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

    // Preload the lazily-imported canvas chunk so it mounts in the same commit
    // that flips data-print-ready — otherwise Chromium can snapshot an empty page.
    const canvasReady: Promise<unknown> = useFreeLayout
      ? import("./playground/FreeLayoutStudioCanvas")
      : Promise.resolve();

    // Absolute safety net: flip ready even if a dependency wedges, so the
    // exporter always gets a snapshot instead of a hard timeout.
    const hardFallback = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 20000);

    void Promise.all([
      settleWithin(localeReady, 8000),
      settleWithin(fontsLoaded, 8000),
      settleWithin(canvasReady, 12000),
    ])
      .then(() => settleWithin(waitForPrintFontsReady(12000), 12000))
      .then(() => settleWithin(document.fonts.ready, 8000))
      .then(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .finally(() => clearTimeout(hardFallback));

    return () => {
      cancelled = true;
      clearTimeout(hardFallback);
    };
  }, [payload.locale]);

  const pageSize = payload.pageFormat === "Letter" ? "Letter" : "A4";
  const paperWhiteCss =
    payload.paperMode === "white"
      ? "[data-print-export-root] * { --tpl-paper: #ffffff; } [data-print-export-root] .tpl-paper, [data-print-export-root] .resume-a4-surface { background-color: #ffffff !important; }"
      : "";

  return (
    <div
      data-print-export-root
      data-print-ready={ready ? "true" : "false"}
      data-print-watermark={payload.watermark ? "" : undefined}
      className="marginalia-theme"
      style={{ width: PRINT_SHEET_WIDTH, margin: 0, padding: 0, background: "white" }}
    >
      <style>{`
        @page { margin: 0; size: ${pageSize}; }
        ${paperWhiteCss}
        html, body { margin: 0 !important; padding: 0 !important; background: white !important; height: auto !important; overflow: hidden !important; }
        [data-print-export-root] {
          height: auto !important;
          overflow: hidden !important;
        }
        [data-print-export-root] .resume-a4-surface,
        [data-print-export-root] #resume-printable-sheet,
        [data-print-export-root] #resume-export-surface {
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          margin: 0 !important;
        }
        [data-print-export-root] .canvas-multi-page-desk {
          gap: 0 !important;
        }
        [data-print-export-root] .canvas-multi-page-desk {
          gap: 0 !important;
          height: auto !important;
          overflow: hidden !important;
        }
        [data-print-export-root] .canvas-page-sheet {
          position: relative !important;
          top: auto !important;
          left: auto !important;
          page-break-after: always;
          break-after: page;
        }
        [data-print-export-root] .canvas-page-sheet:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        [data-print-export-root] .resume-a4-surface {
          overflow: hidden !important;
          max-height: var(--layout-page-height, 1123px) !important;
          height: var(--layout-page-height, 1123px) !important;
        }
        /* Free-layout export: section x/y already include margins. */
        [data-print-export-root] .resume-a4-surface.resume-free-layout-sheet {
          padding: 0 !important;
        }
        [data-print-export-root] .resume-a4-surface:not(.resume-template-marginalia) {
          --a4-section-gap: 12px;
          --a4-block-gap: 6px;
          --a4-item-gap: 3px;
          font-size: 10px;
        }
        /* Chromium print + Inter/Noto mix can insert visible gaps between CJK
           glyphs when letter-spacing / tracking utilities inherit. Reset body
           copy; keep intentional tracking only on Latin uppercase labels. */
        [data-print-export-root] .resume-a4-surface,
        [data-print-export-root] .resume-a4-surface p,
        [data-print-export-root] .resume-a4-surface li,
        [data-print-export-root] .resume-a4-surface span,
        [data-print-export-root] .resume-a4-surface h1,
        [data-print-export-root] .resume-a4-surface h2,
        [data-print-export-root] .resume-a4-surface h3 {
          letter-spacing: normal !important;
          word-spacing: normal !important;
          font-kerning: normal;
          font-feature-settings: "kern" 1;
        }
        [data-print-export-root] .resume-a4-surface .uppercase.tracking-wider,
        [data-print-export-root] .resume-a4-surface .uppercase.tracking-wide,
        [data-print-export-root] .resume-a4-surface .uppercase.tracking-widest {
          letter-spacing: 0.05em !important;
        }
      `}</style>
      {payload.watermark ? <WatermarkStyles text={payload.watermark} /> : null}
      {useFreeLayout && layout ? (
        <Suspense fallback={null}>
          <FreeLayoutStudioCanvas
            variant="export"
            resumeData={data}
            highlightChanges={false}
            analysisResult={null as AnalysisResult | null}
            previewZoom={100}
            grayscaleMode={layout.grayscaleMode ?? false}
            sections={layout.sections}
            positions={layout.positions}
            onPositionChange={() => {}}
            chromeMode="full"
            autoFitContentHeight={false}
            templateStyle={style}
            resolvedTheme={resolvedTheme}
            containerId="resume-export-surface-inner"
            outerClassName="resume-export-surface-inner"
            showGrid={false}
            showMargins={false}
            snapEnabled={false}
            canvasLayout={canvasLayout}
            exportSections={layout.sections}
            sectionSlices={layout.sectionSlices}
          />
        </Suspense>
      ) : (
        <ResumeTemplateRenderer data={data} style={style} highlightChanges={false} layout="page" />
      )}
    </div>
  );
}

export { PRINT_PAYLOAD_KEY };
