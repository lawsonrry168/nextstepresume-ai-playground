import type { ResumeData } from "../types";
import type { TemplateStyle } from "./resumeTemplateCatalog";
import type { PdfExportMode } from "./resumePdfTypes";

function isE2ePdfStubEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return (window as Window & { __NSR_E2E_STUB_PDF__?: boolean }).__NSR_E2E_STUB_PDF__ === true;
}

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

  if (mode === "ats") {
    const { downloadResumeAtsPdf } = await import("./resumeAtsPdfExport");
    downloadResumeAtsPdf(resumeData, filename, templateStyle);
    return;
  }
  const { downloadResumeVisualPdf } = await import("./resumePdfExport");
  await downloadResumeVisualPdf(filename, { watermark: options?.watermark });
}
