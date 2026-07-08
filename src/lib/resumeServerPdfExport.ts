import type { ResumeData } from "../types";
import type { TemplateStyle } from "./resumeTemplateCatalog";
import { withApiAuthHeaders } from "./apiAuthHeaders";
import {
  buildServerPrintPayload,
  type PrintLayoutPayload,
  type ServerPrintPayload,
} from "./printExportPayload";

const MIN_VALID_PDF_BYTES = 2_000;

export type ServerPdfExportFailure = {
  ok: false;
  status?: number;
  code?: string;
  error: string;
};

export type ServerPdfExportResult = { ok: true } | ServerPdfExportFailure;

function isServerPdfFailure(result: ServerPdfExportResult): result is ServerPdfExportFailure {
  return result.ok === false;
}

export { isServerPdfFailure };

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

async function parseServerError(response: Response): Promise<{ error: string; code?: string }> {
  try {
    const data = (await response.json()) as { error?: string; code?: string };
    return {
      error: data.error ?? `Server PDF export failed (${response.status})`,
      code: data.code,
    };
  } catch {
    return { error: `Server PDF export failed (${response.status})` };
  }
}

/**
 * Server-side vector PDF (Chromium print of the same React renderer + print plan).
 * Returns structured failure so callers can surface errors instead of silent fallback.
 */
export async function downloadServerVisualPdf(
  resumeData: ResumeData,
  templateStyle: TemplateStyle | undefined,
  filename: string,
  options?: {
    watermark?: string;
    layout?: PrintLayoutPayload;
  },
): Promise<ServerPdfExportResult> {
  try {
    const payload: ServerPrintPayload = buildServerPrintPayload({
      resumeData,
      templateStyle,
      watermark: options?.watermark,
      layout: options?.layout,
    });

    const headers = withApiAuthHeaders({ "Content-Type": "application/json" });
    const response = await fetch("/api/export/pdf", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const parsed = await parseServerError(response);
      return {
        ok: false,
        status: response.status,
        code: parsed.code,
        error: parsed.error,
      };
    }

    const blob = await response.blob();
    if (blob.size < MIN_VALID_PDF_BYTES) {
      return { ok: false, error: "PDF file too small — render may have failed", code: "EMPTY_PDF" };
    }
    if (blob.type && !blob.type.includes("pdf")) {
      return { ok: false, error: "Server returned non-PDF response", code: "INVALID_MIME" };
    }

    triggerBlobDownload(blob, filename);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error during PDF export";
    return { ok: false, error: message, code: "NETWORK_ERROR" };
  }
}

