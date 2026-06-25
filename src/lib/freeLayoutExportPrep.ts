import { CANVAS_PAGE_HEIGHT } from "./canvasStudioTypes";

function parseTranslatePx(transform: string): { x: number; y: number } | null {
  if (!transform || transform === "none") return null;

  const matrix = transform.match(/^matrix\(([^)]+)\)$/);
  if (matrix) {
    const parts = matrix[1].split(",").map((part) => parseFloat(part.trim()));
    if (parts.length >= 6 && parts.every((n) => Number.isFinite(n))) {
      return { x: parts[4], y: parts[5] };
    }
  }

  let x = 0;
  let y = 0;
  const pair = transform.match(/translate\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*\)/);
  if (pair) {
    x = parseFloat(pair[1]);
    y = parseFloat(pair[2]);
    return { x, y };
  }

  const tx = transform.match(/translateX\(\s*([-\d.]+)px\s*\)/);
  const ty = transform.match(/translateY\(\s*([-\d.]+)px\s*\)/);
  if (tx) x = parseFloat(tx[1]);
  if (ty) y = parseFloat(ty[1]);
  if (tx || ty) return { x, y };

  return null;
}

function readPx(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readPageScale(pageRoot: HTMLElement): number {
  let node: HTMLElement | null = pageRoot;
  while (node) {
    const transform = getComputedStyle(node).transform;
    if (transform && transform !== "none") {
      const matrix = transform.match(/^matrix\(([^)]+)\)$/);
      if (matrix) {
        const parts = matrix[1].split(",").map((part) => parseFloat(part.trim()));
        if (parts.length >= 4 && parts[0] > 0) return parts[0];
      }
    }
    node = node.parentElement;
  }
  return 1;
}

function measureSectionBox(live: HTMLElement): { width: number; height: number } {
  const content = live.querySelector<HTMLElement>('[class*="flex-1"]');
  const pageRoot =
    live.closest<HTMLElement>("[data-page-drop-surface]") ??
    live.closest<HTMLElement>("[data-resume-export-page]") ??
    live.closest<HTMLElement>("#resume-printable-sheet") ??
    live.offsetParent;

  let scale = 1;
  if (pageRoot instanceof HTMLElement) {
    scale = readPageScale(pageRoot);
  }

  const rect = live.getBoundingClientRect();
  const scaledWidth = scale > 0 ? Math.round(rect.width / scale) : live.offsetWidth;
  const scaledHeight = scale > 0 ? Math.round(rect.height / scale) : live.offsetHeight;

  const width = Math.max(scaledWidth, live.offsetWidth, live.scrollWidth, readPx(live.style.width) ?? 0);
  let height = Math.max(
    scaledHeight,
    live.offsetHeight,
    live.scrollHeight,
    readPx(live.style.minHeight) ?? 0,
  );
  if (content) {
    height = Math.max(height, content.scrollHeight + 16, content.offsetHeight + 16);
  }
  return {
    width: Math.max(Math.round(width), 1),
    height: Math.max(Math.round(height), 1),
  };
}

function readSectionPlacement(live: HTMLElement): { x: number; y: number; width: number; height: number } {
  const { width, height } = measureSectionBox(live);
  const transform = live.style.transform || getComputedStyle(live).transform;
  const translated = parseTranslatePx(transform);
  if (translated) {
    return { x: Math.round(translated.x), y: Math.round(translated.y), width, height };
  }

  const pageRoot =
    live.closest<HTMLElement>("[data-page-drop-surface]") ??
    live.closest<HTMLElement>("[data-resume-export-page]") ??
    live.offsetParent;

  if (pageRoot instanceof HTMLElement) {
    const sectionRect = live.getBoundingClientRect();
    const pageRect = pageRoot.getBoundingClientRect();
    const scale = pageRoot.offsetWidth > 0 ? pageRect.width / pageRoot.offsetWidth : 1;
    const safeScale = scale > 0 ? scale : 1;
    return {
      x: Math.round((sectionRect.left - pageRect.left) / safeScale),
      y: Math.round((sectionRect.top - pageRect.top) / safeScale),
      width,
      height,
    };
  }

  return { x: live.offsetLeft, y: live.offsetTop, width, height };
}

function stripSectionEditingClasses(node: HTMLElement): void {
  node.className = node.className
    .split(/\s+/)
    .filter(
      (token) =>
        token &&
        !token.startsWith("ring-") &&
        token !== "border-dashed" &&
        !token.startsWith("border-emerald-"),
    )
    .join(" ");
}

function applySectionExportLayout(cloneSection: HTMLElement, placement: { x: number; y: number; width: number; height: number }): void {
  cloneSection.style.setProperty("position", "absolute", "important");
  cloneSection.style.setProperty("left", `${placement.x}px`, "important");
  cloneSection.style.setProperty("top", `${placement.y}px`, "important");
  cloneSection.style.setProperty("width", `${placement.width}px`, "important");
  cloneSection.style.setProperty("min-height", `${placement.height}px`, "important");
  cloneSection.style.setProperty("height", "auto", "important");
  cloneSection.style.removeProperty("max-height");
  cloneSection.style.setProperty("transform", "none", "important");
  cloneSection.style.setProperty("overflow", "visible", "important");
  cloneSection.style.setProperty("margin", "0", "important");
  cloneSection.style.setProperty("z-index", "auto", "important");
  stripSectionEditingClasses(cloneSection);

  cloneSection.querySelectorAll<HTMLElement>("[class*='ring-'], [class*='border-dashed']").forEach((node) => {
    stripSectionEditingClasses(node);
    node.style.setProperty("overflow", "visible", "important");
    node.style.removeProperty("height");
    node.style.removeProperty("min-height");
  });

  cloneSection.querySelectorAll<HTMLElement>('[class*="flex-1"]').forEach((node) => {
    node.style.setProperty("overflow", "visible", "important");
    node.style.removeProperty("min-height");
  });
}

/** Flatten free-layout motion sections for html2canvas — explicit box geometry, no edit chrome. */
export function flattenFreeLayoutForExport(clone: HTMLElement, source?: HTMLElement): boolean {
  if (
    clone.id === "resume-export-surface" ||
    clone.hasAttribute("data-export-static") ||
    clone.closest("#resume-export-surface-host")
  ) {
    return false;
  }

  const cloneSections = Array.from(clone.querySelectorAll<HTMLElement>('[id^="free-layout-section-"]'));
  if (!cloneSections.length) return false;

  clone.querySelectorAll(".canvas-page-grid").forEach((node) => node.remove());
  clone.querySelectorAll(".canvas-page-sheet-label, .canvas-page-snap-guide").forEach((node) => node.remove());

  clone.querySelectorAll<HTMLElement>(".canvas-page-sheet--editing, .canvas-page-sheet-paper--editing").forEach((node) => {
    node.classList.remove("canvas-page-sheet--editing", "canvas-page-sheet-paper--editing");
    node.style.setProperty("overflow", "hidden", "important");
  });

  clone.querySelectorAll<HTMLElement>("[data-page-drop-surface], [data-resume-export-page]").forEach((node) => {
    node.style.setProperty("overflow", "hidden", "important");
    if (node.hasAttribute("data-resume-export-page")) {
      node.style.setProperty("height", `${CANVAS_PAGE_HEIGHT}px`, "important");
      node.style.setProperty("max-height", `${CANVAS_PAGE_HEIGHT}px`, "important");
    }
  });

  for (const cloneSection of cloneSections) {
    const live =
      source?.querySelector<HTMLElement>(`#${CSS.escape(cloneSection.id)}`) ??
      source?.querySelector<HTMLElement>(`[id="${cloneSection.id}"]`);
    const placement = live ? readSectionPlacement(live) : readSectionPlacement(cloneSection);
    applySectionExportLayout(cloneSection, placement);
  }

  return true;
}
