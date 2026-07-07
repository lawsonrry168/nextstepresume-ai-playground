import { FileText, ScanText, Download, Loader2 } from "lucide-react";
import { useI18n } from "../../i18n";
import { useSubscription } from "../../context/SubscriptionProvider";
import type { PdfExportMode } from "../../lib/resumePdfTypes";

export interface ExportDockProps {
  pdfExporting: boolean;
  exportToPDF: (mode: PdfExportMode) => Promise<void> | void;
  exportToDocx: () => Promise<void> | void;
  exportToJson: () => void;
}

export default function ExportDock({
  pdfExporting,
  exportToPDF,
  exportToDocx,
  exportToJson,
}: ExportDockProps) {
  const { t } = useI18n();
  const { canConsume, consumeUsage, openUpgrade } = useSubscription();

  const runVisual = async () => {
    if (!canConsume("pdfVisualExport", 1)) {
      openUpgrade("pdfVisualExport");
      return;
    }
    await exportToPDF("visual");
    consumeUsage("pdfVisualExport", 1);
  };

  const runAts = async () => {
    if (!canConsume("pdfAtsExport", 1)) {
      openUpgrade("export.pdfAts");
      return;
    }
    await exportToPDF("ats");
    consumeUsage("pdfAtsExport", 1);
  };

  const runDocx = async () => {
    if (!canConsume("docxExport", 1)) {
      openUpgrade("docxExport");
      return;
    }
    await exportToDocx();
    consumeUsage("docxExport", 1);
  };

  const btnBase =
    "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div
      id="export-dock"
      className="shrink-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm px-3 py-2 flex flex-wrap items-center justify-between gap-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          id="export-dock-pdf-visual"
          type="button"
          disabled={pdfExporting}
          onClick={() => void runVisual()}
          className={`${btnBase} bg-[var(--m-paper,#faf6eb)] text-[var(--m-ink,#1a2438)] border-[var(--m-rule,#c5d9e8)] hover:border-[var(--m-margin,#c0392b)]`}
          title={t("export.pdfVisualHint")}
        >
          {pdfExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          <span>{pdfExporting ? t("common.exporting") : t("export.pdfVisual")}</span>
        </button>
        <button
          id="export-dock-pdf-ats"
          type="button"
          disabled={pdfExporting}
          onClick={() => void runAts()}
          className={`${btnBase} bg-white text-slate-700 border-slate-200 hover:bg-slate-50`}
          title={t("export.pdfAtsHint")}
        >
          <ScanText className="w-3.5 h-3.5" />
          <span>{t("export.pdfAts")}</span>
        </button>
        <button
          id="export-dock-docx"
          type="button"
          disabled={pdfExporting}
          onClick={() => void runDocx()}
          className={`${btnBase} bg-white text-slate-700 border-slate-200 hover:bg-slate-50`}
          title={t("export.docxHint")}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{t("export.docx")}</span>
        </button>
        <button
          id="export-dock-json"
          type="button"
          disabled={pdfExporting}
          onClick={exportToJson}
          className={`${btnBase} bg-white text-slate-500 border-slate-200 hover:bg-slate-50`}
          title={t("export.jsonHint")}
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t("export.json")}</span>
        </button>
      </div>
      <p className="text-[10px] text-slate-400 font-medium hidden sm:block">{t("export.dockHint")}</p>
    </div>
  );
}
