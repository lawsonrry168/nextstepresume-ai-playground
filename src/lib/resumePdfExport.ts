import {
  captureElementWithHtml2Canvas,
  preInlineExportClonePaint,
} from "./html2canvasColorFix";
import { pdfExportError } from "./pdfExportI18n";
import { downloadPdfFromCanvas, downloadPdfFromCanvases } from "./pdfHtmlRenderer";
import { sliceCanvasVertically } from "./canvasPdfPagination";
import { CANVAS_PAGE_HEIGHT, CANVAS_PAGE_WIDTH } from "./canvasStudioTypes";

/** A4 width at 96dpi — matches jsPDF page width */
const PDF_CAPTURE_WIDTH_PX = CANVAS_PAGE_WIDTH;
const PDF_CAPTURE_SCALE = 2;
const MIN_CONTENT_HEIGHT_PX = 200;
const PDF_PAGE_SLICE_PX = CANVAS_PAGE_HEIGHT * PDF_CAPTURE_SCALE;

function createExportHost(
  source: HTMLElement,
  options?: { fixedA4?: boolean },
): {
  host: HTMLElement;
  clone: HTMLElement;
  width: number;
  height: number;
} {
  const fixedA4 = options?.fixedA4 === true;
  const width = fixedA4
    ? PDF_CAPTURE_WIDTH_PX
    : Math.max(Math.round(source.getBoundingClientRect().width) || PDF_CAPTURE_WIDTH_PX, PDF_CAPTURE_WIDTH_PX);
  const height = fixedA4 ? CANVAS_PAGE_HEIGHT : Math.max(source.scrollHeight, source.offsetHeight);

  const clone = source.cloneNode(true) as HTMLElement;
  stripCanvasExportChrome(clone);

  const host = document.createElement("div");
  host.className = "resume-pdf-export-host";
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = [
    "position:fixed",
    "left:-12000px",
    "top:0",
    `width:${width}px`,
    fixedA4 ? `height:${height}px` : "",
    "background:#faf6eb",
    "pointer-events:none",
    fixedA4 ? "overflow:hidden" : "overflow:visible",
  ]
    .filter(Boolean)
    .join(";");

  clone.classList.remove("resume-pdf-capture-active");
  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";
  clone.style.width = `${width}px`;
  clone.style.maxWidth = `${width}px`;
  clone.style.minWidth = `${width}px`;
  if (fixedA4) {
    clone.style.height = `${height}px`;
    clone.style.maxHeight = `${height}px`;
    clone.style.minHeight = `${height}px`;
  }
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.border = "none";
  clone.style.boxSizing = "border-box";
  clone.style.overflow = fixedA4 ? "hidden" : "visible";

  host.appendChild(clone);
  document.body.appendChild(host);
  return { host, clone, width, height };
}

function stripCanvasExportChrome(clone: HTMLElement): void {
  clone.querySelectorAll("[data-canvas-chrome]").forEach((node) => node.remove());
  clone.querySelectorAll(".canvas-page-sheet-label, .canvas-page-snap-guide").forEach((node) => node.remove());
  clone.querySelectorAll(".canvas-page-sheet--active, .canvas-page-sheet--drop-target").forEach((node) => {
    node.classList.remove("canvas-page-sheet--active", "canvas-page-sheet--drop-target");
  });
  clone.querySelectorAll(".canvas-section-locked").forEach((node) => {
    node.classList.remove("canvas-section-locked");
  });
}

function assertCanvasHasInk(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(pdfExportError("snapshotReadFailed"));
  }

  const sampleHeight = Math.min(canvas.height, 400);
  const { data, width } = ctx.getImageData(0, 0, canvas.width, sampleHeight);
  let inkish = 0;

  for (let i = 0; i < data.length; i += 4 * 8) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 8) continue;
    if (r < 245 || g < 240 || b < 225) inkish++;
  }

  if (inkish < 12) {
    throw new Error(pdfExportError("snapshotNoInk"));
  }

  if (width < 16 || canvas.height < 16) {
    throw new Error(pdfExportError("snapshotEmpty"));
  }
}

export function findResumeExportRoot(): HTMLElement | null {
  const pages = findCanvasExportPages();
  if (pages.length === 1) return pages[0];
  if (pages.length > 1) return null;

  const sheet = document.getElementById("resume-printable-sheet");
  if (sheet) return sheet;

  return (
    document.querySelector<HTMLElement>(
      "#resume-container-box .resume-template-marginalia, #resume-container-box-workspace .resume-template-marginalia",
    ) ?? document.querySelector<HTMLElement>(".resume-template-marginalia")
  );
}

export function findCanvasExportPages(): HTMLElement[] {
  const pages = Array.from(document.querySelectorAll<HTMLElement>("[data-resume-export-page]"));
  if (pages.length > 0) return pages;

  const studioDesk = document.querySelector<HTMLElement>("#resume-container-box-canvas .canvas-multi-page-desk");
  if (studioDesk) {
    const deskPages = Array.from(
      studioDesk.querySelectorAll<HTMLElement>(".canvas-page-sheet-paper[data-resume-export-page], [data-resume-export-page]"),
    );
    if (deskPages.length > 0) return deskPages;
  }

  const single = document.getElementById("resume-printable-sheet");
  return single ? [single] : [];
}

async function captureExportElement(source: HTMLElement, options?: { fixedA4?: boolean }): Promise<HTMLCanvasElement> {
  const { host, clone, width, height } = createExportHost(source, options);
  const fixedA4 = options?.fixedA4 === true;

  try {
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const contentHeight = fixedA4 ? CANVAS_PAGE_HEIGHT : Math.max(clone.scrollHeight, clone.offsetHeight);
    if (contentHeight < MIN_CONTENT_HEIGHT_PX) {
      throw new Error(pdfExportError("contentTooShort"));
    }

    preInlineExportClonePaint(source, clone);

    const canvas = await captureElementWithHtml2Canvas(clone, {
      styleSource: source,
      scale: PDF_CAPTURE_SCALE,
      backgroundColor: "#faf6eb",
      width,
      height: fixedA4 ? CANVAS_PAGE_HEIGHT : undefined,
      windowWidth: width,
      windowHeight: contentHeight,
    });

    assertCanvasHasInk(canvas);
    return canvas;
  } finally {
    host.remove();
  }
}

function isStrictCanvasA4Page(element: HTMLElement): boolean {
  return element.hasAttribute("data-resume-export-page");
}

/** Capture exactly one A4 page — no vertical slicing */
async function captureCanvasA4Page(source: HTMLElement): Promise<HTMLCanvasElement> {
  return captureExportElement(source, { fixedA4: true });
}

/** Capture full content then slice into A4 pages (handles overflow) */
async function captureExportElementPaginated(source: HTMLElement): Promise<HTMLCanvasElement[]> {
  const canvas = await captureExportElement(source);
  return sliceCanvasVertically(canvas, PDF_PAGE_SLICE_PX);
}

/**
 * Clone preview sheet offscreen and capture — avoids UI chrome (split divider, zoom transforms).
 */
export async function captureResumeCanvas(): Promise<HTMLCanvasElement> {
  const source = findResumeExportRoot();
  if (!source) {
    throw new Error(pdfExportError("previewNotFound"));
  }
  const slices = await captureExportElementPaginated(source);
  return slices[0];
}

export async function captureResumeCanvasPages(): Promise<HTMLCanvasElement[]> {
  const pages = findCanvasExportPages();
  if (!pages.length) {
    throw new Error(pdfExportError("previewNotFound"));
  }

  const canvases: HTMLCanvasElement[] = [];
  for (const page of pages) {
    if (isStrictCanvasA4Page(page)) {
      canvases.push(await captureCanvasA4Page(page));
    } else {
      const slices = await captureExportElementPaginated(page);
      canvases.push(...slices);
    }
  }
  return canvases;
}

export async function downloadResumeVisualPdf(
  filename: string,
  options?: { watermark?: string },
): Promise<void> {
  let exportPages = findCanvasExportPages();
  if (!exportPages.length) {
    const root = findResumeExportRoot();
    if (root) exportPages = [root];
  }
  if (!exportPages.length) {
    throw new Error(pdfExportError("previewNotFound"));
  }

  const allCanvases: HTMLCanvasElement[] = [];
  for (const page of exportPages) {
    if (isStrictCanvasA4Page(page)) {
      allCanvases.push(await captureCanvasA4Page(page));
    } else {
      const slices = await captureExportElementPaginated(page);
      allCanvases.push(...slices);
    }
  }

  const pdfOptions = {
    fitSinglePage: true,
    preferFillWidth: true,
    watermark: options?.watermark,
  } as const;

  if (allCanvases.length === 1) {
    downloadPdfFromCanvas(allCanvases[0], filename, pdfOptions);
    return;
  }

  downloadPdfFromCanvases(allCanvases, filename, pdfOptions);
}

/** @deprecated Use downloadResumeVisualPdf */
export async function downloadResumePdf(filename: string): Promise<void> {
  return downloadResumeVisualPdf(filename);
}
