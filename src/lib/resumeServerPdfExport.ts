import type { ResumeData } from "../types";
import type { TemplateStyle } from "./resumeTemplateCatalog";
import { withApiAuthHeaders } from "./apiAuthHeaders";
import { getActiveLocale } from "../i18n/translate";

const MIN_VALID_PDF_BYTES = 2_000;

function readExportPref(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Server-side vector PDF (Chromium print of the same React renderer).
 * Returns false on any failure so the caller can fall back to the
 * client-side html2canvas raster path.
 */
export async function tryDownloadServerVisualPdf(
  resumeData: ResumeData,
  templateStyle: TemplateStyle | undefined,
  filename: string,
): Promise<boolean> {
  try {
    const headers = withApiAuthHeaders({ "Content-Type": "application/json" });
    const response = await fetch("/api/export/pdf", {
      method: "POST",
      headers,
      body: JSON.stringify({
        resumeData,
        templateStyle,
        locale: getActiveLocale(),
        pageFormat: readExportPref("nsr_export_page_format", "A4"),
        paperMode: readExportPref("nsr_export_paper_mode", "cream"),
      }),
    });
    if (!response.ok) return false;

    const blob = await response.blob();
    if (blob.size < MIN_VALID_PDF_BYTES) return false;
    if (blob.type && !blob.type.includes("pdf")) return false;

    triggerBlobDownload(blob, filename);
    return true;
  } catch {
    return false;
  }
}
