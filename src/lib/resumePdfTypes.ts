export type PdfExportMode = "visual" | "ats";

export const PDF_EXPORT_MODE_LABELS: Record<PdfExportMode, { title: string; hint: string }> = {
  visual: {
    title: "匯出 PDF（影像型）",
    hint: "直接擷取預覽畫面，與所見即所得",
  },
  ats: {
    title: "匯出 PDF（ATS）",
    hint: "可選文字，ATS 友善結構",
  },
};
