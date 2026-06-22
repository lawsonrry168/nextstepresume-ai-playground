import type { ResumeData } from "../types";
import type { TemplateStyle } from "./resumeTemplateCatalog";
import type { PdfExportMode } from "./resumePdfTypes";

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
  if (mode === "ats") {
    const { downloadResumeAtsPdf } = await import("./resumeAtsPdfExport");
    downloadResumeAtsPdf(resumeData, filename, templateStyle);
    return;
  }
  const { downloadResumeVisualPdf } = await import("./resumePdfExport");
  await downloadResumeVisualPdf(filename, { watermark: options?.watermark });
}
