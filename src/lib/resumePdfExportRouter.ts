import type { ResumeData } from "../types";
import type { TemplateStyle } from "./resumeTemplateCatalog";
import type { PdfExportMode } from "./resumePdfTypes";
import { isE2ePdfStubEnabled } from "./e2eExportTrack";

export function buildResumePdfFilename(resumeData: ResumeData): string {
  return `NextStepResume_${resumeData.personalInfo.name.trim().replace(/\s+/g, "_") || "ATS_Resume"}.pdf`;
}

export async function downloadResumePdfByMode(
  mode: PdfExportMode,
  resumeData: ResumeData,
  filename: string,
  templateStyle?: TemplateStyle,
  options?: { watermark?: string },
): Promise<void> {
  if (mode === "visual" && isE2ePdfStubEnabled()) {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    pdf.text("NextStepResume E2E", 10, 10);
    pdf.save(filename);
    return;
  }

  if (mode === "ats" && isE2ePdfStubEnabled()) {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    pdf.text("NextStepResume ATS E2E", 10, 10);
    pdf.save(filename);
    return;
  }

  if (mode === "ats") {
    const { downloadResumeAtsPdf } = await import("./resumeAtsPdfExport");
    downloadResumeAtsPdf(resumeData, filename, templateStyle);
    return;
  }

  // Vector-first: server Chromium print (selectable text, preview-identical).
  // Skipped when the free-layout studio is live (custom positions need the
  // DOM capture path) or when a watermark is required (client-drawn).
  if (!options?.watermark) {
    const { findLiveFreeLayoutExportPages } = await import("./resumePdfExport");
    const studioLayoutActive = findLiveFreeLayoutExportPages().length > 0;
    if (!studioLayoutActive) {
      const { tryDownloadServerVisualPdf } = await import("./resumeServerPdfExport");
      if (await tryDownloadServerVisualPdf(resumeData, templateStyle, filename)) {
        return;
      }
    }
  }

  const { downloadResumeVisualPdf } = await import("./resumePdfExport");
  await downloadResumeVisualPdf(filename, { watermark: options?.watermark });
}
