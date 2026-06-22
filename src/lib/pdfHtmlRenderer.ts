import { jsPDF } from "jspdf";
import { captureElementWithHtml2Canvas } from "./html2canvasColorFix";

const CJK_FONT_STACK =
  '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", "Segoe UI", sans-serif';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function htmlBlockToCanvas(html: string): Promise<HTMLCanvasElement> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.padding = "40px 48px";
  container.style.background = "#ffffff";
  container.style.fontFamily = CJK_FONT_STACK;
  container.style.fontSize = "14px";
  container.style.lineHeight = "1.65";
  container.style.color = "#1e293b";
  container.style.boxSizing = "border-box";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    return await captureElementWithHtml2Canvas(container, {
      scale: 2,
      backgroundColor: "#ffffff",
    });
  } finally {
    document.body.removeChild(container);
  }
}

let pdfHasContent = false;

export type PdfCanvasExportOptions = {
  /** Snap page breaks to N canvas pixels (e.g. 56 = 28px layout × scale 2) */
  gridSnapPx?: number;
  /** Scale entire canvas to fit one A4 page (no pagination) */
  fitSinglePage?: boolean;
  /** With fitSinglePage: fill page width first; shrink only when height still overflows */
  preferFillWidth?: boolean;
  /** Diagonal + footer watermark text */
  watermark?: string;
};

export function applyPdfWatermark(canvas: HTMLCanvasElement, text: string): HTMLCanvasElement {
  const output = document.createElement("canvas");
  output.width = canvas.width;
  output.height = canvas.height;
  const ctx = output.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(canvas, 0, 0);
  const fontSize = Math.max(28, Math.round(canvas.width * 0.035));
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "#64748b";
  ctx.font = `700 ${fontSize}px "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.fillText(text, 0, 0);
  ctx.restore();
  ctx.globalAlpha = 0.5;
  ctx.font = `${Math.max(12, Math.round(canvas.width * 0.012))}px "Segoe UI", sans-serif`;
  ctx.textAlign = "right";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(text, canvas.width - 24, canvas.height - 20);
  return output;
}

function maybeWatermark(canvas: HTMLCanvasElement, options: PdfCanvasExportOptions): HTMLCanvasElement {
  if (!options.watermark?.trim()) return canvas;
  return applyPdfWatermark(canvas, options.watermark.trim());
}

function appendCanvasSinglePage(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  options: Pick<PdfCanvasExportOptions, "preferFillWidth"> = {}
): void {
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const scaleW = pdfWidth / canvas.width;
  const scaleH = pdfHeight / canvas.height;

  let scale: number;
  if (options.preferFillWidth !== false) {
    scale = scaleW;
    if (canvas.height * scale > pdfHeight) {
      scale = scaleH;
    }
  } else {
    scale = Math.min(scaleW, scaleH);
  }

  const renderWidth = canvas.width * scale;
  const renderHeight = canvas.height * scale;
  const offsetX = (pdfWidth - renderWidth) / 2;
  const offsetY = 0;

  pdf.setFillColor(250, 246, 235);
  pdf.rect(0, 0, pdfWidth, pdfHeight, "F");

  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", offsetX, offsetY, renderWidth, renderHeight);
  pdfHasContent = true;
}

function computeSliceHeight(
  offsetY: number,
  maxSlicePx: number,
  totalHeight: number,
  gridSnapPx?: number
): number {
  const remaining = totalHeight - offsetY;
  if (remaining <= maxSlicePx) return remaining;

  if (!gridSnapPx || gridSnapPx < 4) {
    return maxSlicePx;
  }

  const targetEnd = offsetY + maxSlicePx;
  let snappedEnd = Math.floor(targetEnd / gridSnapPx) * gridSnapPx;
  if (snappedEnd <= offsetY) {
    snappedEnd = offsetY + gridSnapPx;
  }

  let sliceH = snappedEnd - offsetY;
  if (sliceH < gridSnapPx * 3) {
    sliceH = Math.min(maxSlicePx, remaining);
  }

  return Math.min(sliceH, remaining);
}

function appendCanvasToPdf(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  forceNewPage: boolean,
  options: PdfCanvasExportOptions = {}
): void {
  if (options.fitSinglePage) {
    if (forceNewPage) {
      pdf.addPage();
    }
    appendCanvasSinglePage(pdf, canvas, options);
    return;
  }

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const scale = pdfWidth / canvas.width;
  const sliceHeightPx = pdfHeight / scale;

  let offsetY = 0;

  while (offsetY < canvas.height) {
    const sliceH = computeSliceHeight(
      offsetY,
      sliceHeightPx,
      canvas.height,
      options.gridSnapPx
    );
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceH;
    const ctx = sliceCanvas.getContext("2d");
    if (!ctx) break;
    ctx.drawImage(canvas, 0, offsetY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

    if (pdfHasContent || forceNewPage) {
      pdf.addPage();
    }
    pdfHasContent = true;

    const imgData = sliceCanvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, sliceH * scale);

    offsetY += sliceH;
  }
}

export async function renderHtmlSectionsToPdf(
  sections: string[],
  filename: string
): Promise<void> {
  pdfHasContent = false;
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  for (let i = 0; i < sections.length; i++) {
    const canvas = await htmlBlockToCanvas(sections[i]);
    appendCanvasToPdf(pdf, canvas, i > 0);
  }

  pdf.save(filename);
}

export function downloadPdfFromCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  options: PdfCanvasExportOptions = {}
): void {
  if (canvas.width < 2 || canvas.height < 2) {
    throw new Error("PDF export produced empty canvas");
  }

  pdfHasContent = false;
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  appendCanvasToPdf(pdf, maybeWatermark(canvas, options), false, options);
  pdf.save(filename);
}

export function downloadPdfFromCanvases(
  canvases: HTMLCanvasElement[],
  filename: string,
  options: PdfCanvasExportOptions = {},
): void {
  if (!canvases.length) {
    throw new Error("PDF export produced no pages");
  }

  pdfHasContent = false;
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  canvases.forEach((canvas, index) => {
    if (canvas.width < 2 || canvas.height < 2) {
      throw new Error(`PDF export produced empty canvas on page ${index + 1}`);
    }
    appendCanvasToPdf(pdf, maybeWatermark(canvas, options), index > 0, options);
  });

  pdf.save(filename);
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const parts: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      parts.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }
    if (line.startsWith("# ")) {
      closeList();
      parts.push(
        `<h1 style="font-size:22px;font-weight:700;margin:16px 0 8px;">${escapeHtml(line.slice(2))}</h1>`
      );
    } else if (line.startsWith("## ")) {
      closeList();
      parts.push(
        `<h2 style="font-size:17px;font-weight:700;margin:14px 0 6px;color:#334155;">${escapeHtml(line.slice(3))}</h2>`
      );
    } else if (line.startsWith("### ")) {
      closeList();
      parts.push(
        `<h3 style="font-size:14px;font-weight:700;margin:10px 0 4px;">${escapeHtml(line.slice(4))}</h3>`
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) {
        parts.push("<ul style='margin:4px 0 8px 18px;padding:0;'>");
        inList = true;
      }
      parts.push(`<li style="margin-bottom:4px;">${escapeHtml(line.slice(2))}</li>`);
    } else {
      closeList();
      parts.push(`<p style="margin:6px 0;">${escapeHtml(line)}</p>`);
    }
  }
  closeList();
  return parts.join("\n");
}
