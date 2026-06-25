import {
  captureElementWithHtml2Canvas,
  preInlineExportClonePaint,
} from "./html2canvasColorFix";
import { flattenFreeLayoutForExport } from "./freeLayoutExportPrep";
import { EXPORT_SURFACE_HOST_ID, EXPORT_SURFACE_ROOT_ID } from "./layoutExportSurface";
import { pdfExportError } from "./pdfExportI18n";
import { downloadPdfFromCanvas, downloadPdfFromCanvases } from "./pdfHtmlRenderer";
import { sliceCanvasVertically } from "./canvasPdfPagination";
import { CANVAS_PAGE_HEIGHT, CANVAS_PAGE_WIDTH } from "./canvasStudioTypes";
import { A4_PAGE_CLASS, A4_PAGE_DATA_ATTR } from "./a4Page";

/** A4 width at 96dpi — matches jsPDF page width */
const PDF_CAPTURE_WIDTH_PX = CANVAS_PAGE_WIDTH;
const PDF_CAPTURE_SCALE = 2;
const MIN_CONTENT_HEIGHT_PX = 200;
const PDF_PAGE_SLICE_PX = CANVAS_PAGE_HEIGHT * PDF_CAPTURE_SCALE;

function syncCloneHeightsFromStudio(clone: HTMLElement): void {
  const liveSheet =
    findLiveFreeLayoutExportPages()[0] ??
    document.querySelector<HTMLElement>(
      "#resume-container-box-canvas #resume-printable-sheet, #resume-container-box #resume-printable-sheet",
    );
  if (!liveSheet) return;
  if (liveSheet.closest(".resume-pdf-export-host")) return;

  clone.querySelectorAll<HTMLElement>('[id^="free-layout-section-"]').forEach((cloneSection) => {
    const liveSection = liveSheet.querySelector<HTMLElement>(`#${CSS.escape(cloneSection.id)}`);
    if (!liveSection || liveSection.closest(".resume-pdf-export-host")) return;
    const measured = Math.max(liveSection.offsetHeight, liveSection.scrollHeight);
    if (measured > cloneSection.offsetHeight + 1) {
      cloneSection.style.setProperty("height", `${measured}px`, "important");
      cloneSection.style.setProperty("max-height", `${measured}px`, "important");
      cloneSection.style.setProperty("overflow", "visible", "important");
    }
  });
}

function expandExportSectionContentHeights(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[id^="free-layout-section-"]').forEach((section) => {
    const needed = Math.max(section.scrollHeight, section.offsetHeight);
    if (needed > section.offsetHeight + 1) {
      section.style.setProperty("height", "auto", "important");
      section.style.setProperty("min-height", `${needed}px`, "important");
      section.style.setProperty("max-height", "none", "important");
      section.style.setProperty("overflow", "visible", "important");
    }
  });
}

/** No-op on live source — height expansion only runs on the detached clone inside createExportHost. */
function syncExportSurfaceHeightsBeforeCapture(_source: HTMLElement): void {
  // Intentionally empty: expanding heights on the live source permanently mutates inline
  // styles (height:auto, overflow:visible) that are never cleaned up, breaking the preview.
}

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
  const MAX_EXPORT_PAGES = 5;
  const rawHeight = Math.max(source.scrollHeight, source.offsetHeight);
  const height = fixedA4 ? CANVAS_PAGE_HEIGHT : Math.min(rawHeight, CANVAS_PAGE_HEIGHT * MAX_EXPORT_PAGES);

  const clone = source.cloneNode(true) as HTMLElement;
  stripCanvasExportChrome(clone);
  const isStaticPrintSurface =
    source.id === EXPORT_SURFACE_ROOT_ID ||
    source.hasAttribute("data-export-static") ||
    Boolean(source.closest(`#${EXPORT_SURFACE_HOST_ID}`));
  if (!isStaticPrintSurface) {
    flattenFreeLayoutForExport(clone, source);
  }

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
  syncCloneHeightsFromStudio(clone);
  expandExportSectionContentHeights(clone);
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

function isExportHostElement(el: Element): boolean {
  return Boolean(
    el.closest(`#${EXPORT_SURFACE_HOST_ID}`) ||
    el.closest(".resume-export-surface-inner") ||
    el.closest(".resume-export-surface-host"),
  );
}

function hasFreeLayoutSections(root: Element): boolean {
  return root.querySelector('[id^="free-layout-section-"]') !== null;
}

function isLiveLayoutPage(el: HTMLElement): boolean {
  if (isExportHostElement(el)) return false;
  const logicalWidth = el.offsetWidth || el.scrollWidth;
  return logicalWidth >= 200 && hasFreeLayoutSections(el);
}

/** Live edit canvas — never the hidden print-surface mirror. */
export function findLiveFreeLayoutExportPages(): HTMLElement[] {
  const studioHost = document.getElementById("resume-container-box-canvas");
  if (studioHost && !isExportHostElement(studioHost)) {
    const multi = Array.from(
      studioHost.querySelectorAll<HTMLElement>(".canvas-page-sheet-paper"),
    ).filter(isLiveLayoutPage);
    if (multi.length > 0) return multi;
  }

  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      [
        "#resume-container-box-canvas #resume-printable-sheet",
        "#resume-container-box #resume-printable-sheet",
        "#resume-container-box-workspace #resume-printable-sheet",
      ].join(", "),
    ),
  ).filter(isLiveLayoutPage);

  if (candidates.length > 0) return [candidates[0]!];

  return [];
}

/** @deprecated Use findLiveFreeLayoutExportPages */
export function findVisibleStudioExportPages(): HTMLElement[] {
  return findLiveFreeLayoutExportPages();
}

function findHiddenExportSurfacePages(): HTMLElement[] {
  const exportHost = document.getElementById(EXPORT_SURFACE_HOST_ID);
  if (!exportHost) return [];

  const staticPages = Array.from(
    exportHost.querySelectorAll<HTMLElement>("[data-resume-export-page][data-export-static]"),
  );
  if (staticPages.length > 0) return staticPages;

  const single = exportHost.querySelector<HTMLElement>(`#${EXPORT_SURFACE_ROOT_ID}`);
  return single ? [single] : [];
}

function findLegacyPrintableSheet(): HTMLElement | null {
  const sheets = Array.from(
    document.querySelectorAll<HTMLElement>("#resume-printable-sheet"),
  ).filter((el) => !isExportHostElement(el));

  for (const sheet of sheets) {
    if (hasFreeLayoutSections(sheet)) return sheet;
  }

  const sheet = sheets[0];
  if (sheet && !sheet.closest("#resume-container-box-canvas")) {
    return sheet;
  }

  return sheet ?? null;
}

export function findCanvasExportPages(): HTMLElement[] {
  const hidden = findHiddenExportSurfacePages();
  if (hidden.length > 0) return hidden;

  const legacy = findLegacyPrintableSheet();
  if (legacy && !hasFreeLayoutSections(legacy)) return [legacy];

  const liveLayout = findLiveFreeLayoutExportPages();
  if (liveLayout.length > 0) return liveLayout;

  if (legacy) return [legacy];

  const pages = Array.from(document.querySelectorAll<HTMLElement>("[data-resume-export-page]")).filter(
    (el) => !isExportHostElement(el),
  );
  if (pages.length > 0) return pages;

  return [];
}

async function waitForPrintSurfacePages(timeoutMs = 12_000): Promise<HTMLElement[]> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const pages = findCanvasExportPages();
    if (pages.length > 0) return pages;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  }

  throw new Error(pdfExportError("previewNotFound"));
}

async function captureExportElement(source: HTMLElement, options?: { fixedA4?: boolean }): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  syncExportSurfaceHeightsBeforeCapture(source);

  const { host, clone, width, height } = createExportHost(source, options);
  const fixedA4 = options?.fixedA4 === true;

  try {
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

function sheetCaptureHeight(element: HTMLElement): number {
  return Math.max(element.scrollHeight, element.offsetHeight);
}

function shouldCaptureAsFixedA4(element: HTMLElement): boolean {
  if (element.hasAttribute("data-export-static")) return true;
  if (element.hasAttribute(A4_PAGE_DATA_ATTR)) return true;
  if (element.classList.contains(A4_PAGE_CLASS)) return true;
  if (element.classList.contains("canvas-page-sheet-paper")) return true;
  if (element.id === "resume-printable-sheet") return true;
  if (element.classList.contains("resume-a4-surface")) return true;
  return sheetCaptureHeight(element) <= CANVAS_PAGE_HEIGHT + 8;
}

function isStrictCanvasA4Page(element: HTMLElement): boolean {
  return shouldCaptureAsFixedA4(element);
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
  const pages = await waitForPrintSurfacePages();
  const source = pages[0] ?? findResumeExportRoot();
  if (!source) {
    throw new Error(pdfExportError("previewNotFound"));
  }
  const slices = await captureExportElementPaginated(source);
  return slices[0];
}

export async function captureResumeCanvasPages(): Promise<HTMLCanvasElement[]> {
  const pages = await waitForPrintSurfacePages();
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

/** WYSIWYG: prefer the live studio/preview canvas over the hidden print mirror */
export async function resolveVisualPdfExportPages(): Promise<HTMLElement[]> {
  const live = findLiveFreeLayoutExportPages();
  if (live.length > 0) return live;

  const hidden = findHiddenExportSurfacePages();
  if (hidden.length > 0) return hidden;

  const waited = await waitForPrintSurfacePages();
  if (waited.length > 0) return waited;

  const root = findResumeExportRoot();
  return root ? [root] : [];
}

export async function downloadResumeVisualPdf(
  filename: string,
  options?: { watermark?: string },
): Promise<void> {
  const exportPages = await resolveVisualPdfExportPages();
  if (!exportPages.length) {
    throw new Error(pdfExportError("previewNotFound"));
  }

  const pdfOptions = {
    fitSinglePage: true,
    preferFillWidth: true,
    watermark: options?.watermark,
  } as const;

  const allCanvases: HTMLCanvasElement[] = [];
  for (const page of exportPages) {
    if (shouldCaptureAsFixedA4(page)) {
      allCanvases.push(await captureCanvasA4Page(page));
    } else {
      const slices = await captureExportElementPaginated(page);
      allCanvases.push(...slices);
    }
  }

  if (exportPages.length === 1 && allCanvases.length > 1) {
    const tail = allCanvases[allCanvases.length - 1]!;
    if (tail.height < PDF_PAGE_SLICE_PX * 0.2) {
      allCanvases.pop();
    } else {
      const fitted = await captureExportElement(exportPages[0]!);
      downloadPdfFromCanvas(fitted, filename, pdfOptions);
      return;
    }
  }

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
