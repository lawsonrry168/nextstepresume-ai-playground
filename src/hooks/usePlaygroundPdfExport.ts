import { useCallback, useState } from "react";
import { buildResumePdfFilename, downloadResumePdfByMode } from "../lib/resumePdfExportRouter";
import { markE2eAtsPdfExportComplete, markE2ePdfExportComplete } from "../lib/e2eExportTrack";
import type { PdfExportMode } from "../lib/resumePdfTypes";
import type { ResumeData, TemplateStyle } from "../types";

type ToastFn = (type: "success" | "error" | "warning" | "info", message: string) => void;
type TranslateFn = (key: string) => string;

export interface UsePlaygroundPdfExportOptions {
  resumeData: ResumeData;
  activeTemplate: TemplateStyle;
  canUseFeature: (feature: string) => boolean;
  pushToast: ToastFn;
  t: TranslateFn;
}

export function usePlaygroundPdfExport({
  resumeData,
  activeTemplate,
  canUseFeature,
  pushToast,
  t,
}: UsePlaygroundPdfExportOptions) {
  const [pdfExporting, setPdfExporting] = useState(false);

  const exportToPDF = useCallback(
    async (mode: PdfExportMode = "visual") => {
      setPdfExporting(true);
      try {
        const filename = buildResumePdfFilename(resumeData);
        const watermark =
          mode === "visual" && !canUseFeature("export.pdfVisualClean")
            ? "NextStepResume.ai"
            : undefined;
        await downloadResumePdfByMode(mode, resumeData, filename, activeTemplate, { watermark });
        if (mode === "ats") {
          markE2eAtsPdfExportComplete();
        } else {
          markE2ePdfExportComplete();
        }
        pushToast(
          "success",
          mode === "ats" ? t("toast.export.atsPdfDownloaded") : t("toast.export.visualPdfDownloaded"),
        );
      } catch (err) {
        console.error("PDF export error:", err);
        if (mode === "ats") {
          pushToast("error", err instanceof Error ? err.message : t("toast.export.atsPdfExportFailed"));
        } else {
          pushToast("error", err instanceof Error ? err.message : t("toast.export.pdfExportFailedGeneric"));
        }
      } finally {
        setPdfExporting(false);
      }
    },
    [activeTemplate, canUseFeature, pushToast, resumeData, t],
  );

  return { pdfExporting, exportToPDF };
}
