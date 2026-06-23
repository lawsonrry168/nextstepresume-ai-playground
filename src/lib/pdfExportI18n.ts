import { t } from "../i18n/translate";
import type { PdfExportMode } from "./resumePdfTypes";

export function pdfExportError(key: keyof typeof EXPORT_ERROR_KEYS): string {
  return t(EXPORT_ERROR_KEYS[key]);
}

const EXPORT_ERROR_KEYS = {
  snapshotReadFailed: "exportErrors.snapshotReadFailed",
  snapshotNoInk: "exportErrors.snapshotNoInk",
  snapshotEmpty: "exportErrors.snapshotEmpty",
  contentTooShort: "exportErrors.contentTooShort",
  previewNotFound: "exportErrors.previewNotFound",
  colorFormatUnsupported: "exportErrors.colorFormatUnsupported",
} as const;

export function getPdfExportModeLabels(): Record<PdfExportMode, { title: string; hint: string }> {
  return {
    visual: {
      title: t("pdfExportModes.visual.title"),
      hint: t("pdfExportModes.visual.hint"),
    },
    ats: {
      title: t("pdfExportModes.ats.title"),
      hint: t("pdfExportModes.ats.hint"),
    },
  };
}
