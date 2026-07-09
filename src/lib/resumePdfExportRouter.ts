import type { ResumeData } from "../types";
import type { TemplateStyle } from "./resumeTemplateCatalog";
import type { PdfExportMode } from "./resumePdfTypes";
import { isE2ePdfStubEnabled } from "./e2eExportTrack";
import {
  buildLayoutPayloadFromSnapshot,
  getPrintExportSnapshot,
} from "./printExportBridge";
import type { PrintLayoutPayload } from "./printExportPayload";
import { downloadServerVisualPdf, isServerPdfFailure } from "./resumeServerPdfExport";

export function buildResumePdfFilename(resumeData: ResumeData): string {
  return `NextStepResume_${resumeData.personalInfo.name.trim().replace(/\s+/g, "_") || "ATS_Resume"}.pdf`;
}

export async function downloadResumePdfByMode(
  mode: PdfExportMode,
  resumeData: ResumeData,
  filename: string,
  templateStyle?: TemplateStyle,
  options?: { watermark?: string; layout?: PrintLayoutPayload },
): Promise<void> {
  let exportMode = mode;
  if (exportMode === "visual" && isE2ePdfStubEnabled()) {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    pdf.text("NextStepResume E2E", 10, 10);
    pdf.save(filename);
    return;
  }

  if (exportMode === "ats" && isE2ePdfStubEnabled()) {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    pdf.text("NextStepResume ATS E2E", 10, 10);
    pdf.save(filename);
    return;
  }

  if (exportMode === "ats") {
    const { getActiveLocale } = await import("../i18n/translate");
    const locale = getActiveLocale();
    const serialized = JSON.stringify(resumeData);
    const hasCjk = locale.startsWith("zh") || /[\u3400-\u9FFF\uF900-\uFAFF]/.test(serialized);
    if (hasCjk) {
      // Helvetica-based ATS PDF cannot render CJK section labels or content.
      exportMode = "visual";
    } else {
      const { downloadResumeAtsPdf } = await import("./resumeAtsPdfExport");
      downloadResumeAtsPdf(resumeData, filename, templateStyle);
      return;
    }
  }

  const snapshot = getPrintExportSnapshot();
  const layout =
    options?.layout ??
    (snapshot ? buildLayoutPayloadFromSnapshot(snapshot) : undefined);

  const serverResult = await downloadServerVisualPdf(resumeData, templateStyle, filename, {
    watermark: options?.watermark,
    layout,
  });

  if (isServerPdfFailure(serverResult)) {
    throw new Error(serverResult.error);
  }
}
