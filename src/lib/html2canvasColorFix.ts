import html2canvas, { type Options } from "html2canvas";
import { pdfExportError } from "./pdfExportI18n";

const UNSUPPORTED_COLOR_FUNCTIONS =
  /oklch|oklab|color-mix|lab\(|lch\(|hwb\(|\bcolor\(|device-cmb\(|device-cmyk\(/i;

const STRIP_COLOR_FUNCTIONS = [
  "oklch",
  "oklab",
  "color-mix",
  "lab",
  "lch",
  "hwb",
  "color",
] as const;

const INLINE_PAINT_PROPS = [
  "color",
  "background-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
  "-webkit-text-stroke-color",
  "-webkit-text-fill-color",
  "fill",
  "stroke",
  "caret-color",
  "accent-color",
] as const;

const STRIP_IF_UNSAFE_PROPS = [
  "background-image",
  "box-shadow",
  "text-shadow",
  "list-style-image",
] as const;

const HTML2CANVAS_SAFE_FUNCTIONS = new Set([
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "linear-gradient",
  "radial-gradient",
  "conic-gradient",
  "repeating-linear-gradient",
  "repeating-radial-gradient",
  "calc",
  "var",
]);

const CSS_COLOR_REPLACEMENTS: Array<[RegExp, string]> = [
  [/oklch\((?:[^()"']|"[^"]*"|'[^']*'|\([^()]*\))*\)/gi, "rgb(51, 51, 51)"],
  [/oklab\((?:[^()"']|"[^"]*"|'[^']*'|\([^()]*\))*\)/gi, "rgb(51, 51, 51)"],
  [/hwb\((?:[^()"']|"[^"]*"|'[^']*'|\([^()]*\))*\)/gi, "rgb(128, 128, 128)"],
  [/lch\((?:[^()"']|"[^"]*"|'[^']*'|\([^()]*\))*\)/gi, "rgb(51, 51, 51)"],
  [/lab\((?:[^()"']|"[^"]*"|'[^']*'|\([^()]*\))*\)/gi, "rgb(51, 51, 51)"],
];

const COLOR_EXPRESSION_PATTERN =
  /(?:oklch|oklab|color-mix|lab|lch|hwb|\bcolor)\((?:[^()"']|"[^"]*"|'[^']*'|\([^()]*\))*\)/gi;

export function containsUnsupportedColor(value: string): boolean {
  return UNSUPPORTED_COLOR_FUNCTIONS.test(value);
}

let canvasColorProbe: HTMLCanvasElement | null = null;
let canvasColorCtx: CanvasRenderingContext2D | null = null;

function getCanvasColorContext(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!canvasColorProbe) {
    canvasColorProbe = document.createElement("canvas");
    canvasColorProbe.width = 1;
    canvasColorProbe.height = 1;
    canvasColorCtx = canvasColorProbe.getContext("2d", { willReadFrequently: true });
  }
  return canvasColorCtx;
}

/** Convert any browser color (oklch, color(srgb), etc.) to html2canvas-safe rgb/rgba. */
export function toCanvasSafeRgb(color: string, fallback = "rgb(51, 51, 51)"): string {
  const trimmed = color.trim();
  if (!trimmed) return trimmed;
  if (isHtml2CanvasSafeCssValue(trimmed)) return trimmed;

  const ctx = getCanvasColorContext();
  if (!ctx) return fallback;

  try {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000000";
    ctx.fillStyle = trimmed;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a === 0) return "transparent";
    const alpha = a / 255;
    if (alpha < 1) {
      const rounded = Math.round(alpha * 1000) / 1000;
      return `rgba(${r}, ${g}, ${b}, ${rounded})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return fallback;
  }
}

function getComputedStyleForElement(el: Element): CSSStyleDeclaration {
  const view = el.ownerDocument.defaultView;
  return view ? view.getComputedStyle(el) : window.getComputedStyle(el);
}

function isColorLikeProperty(property: string): boolean {
  return (
    property.includes("color") ||
    property === "fill" ||
    property === "stroke" ||
    property === "background"
  );
}

function* walkElementPairs(source: Element, clone: Element): Generator<[Element, Element]> {
  yield [source, clone];
  const sourceChildren = Array.from(source.children);
  const cloneChildren = Array.from(clone.children);
  const childCount = Math.min(sourceChildren.length, cloneChildren.length);
  for (let i = 0; i < childCount; i++) {
    yield* walkElementPairs(sourceChildren[i], cloneChildren[i]);
  }
}

export function isHtml2CanvasSafeCssValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;

  const lower = trimmed.toLowerCase();
  if (
    lower === "none" ||
    lower === "transparent" ||
    lower === "inherit" ||
    lower === "initial" ||
    lower === "unset" ||
    lower === "auto" ||
    lower === "currentcolor"
  ) {
    return true;
  }

  if (containsUnsupportedColor(trimmed)) {
    return false;
  }

  const functions = trimmed.match(/([a-z-]+)\(/gi) ?? [];
  for (const fn of functions) {
    const name = fn.slice(0, -1).toLowerCase();
    if (!HTML2CANVAS_SAFE_FUNCTIONS.has(name)) {
      return false;
    }
  }

  return true;
}

export function resolveColorExpression(colorExpr: string): string {
  const trimmed = colorExpr.trim();
  if (!trimmed || isHtml2CanvasSafeCssValue(trimmed)) {
    return trimmed;
  }

  if (typeof document === "undefined") {
    if (/color-mix/i.test(trimmed) && /#d4edda|mint/i.test(trimmed)) {
      return "rgb(236, 245, 238)";
    }
    if (/color-mix/i.test(trimmed) && /#f5d76e|marker/i.test(trimmed)) {
      return "rgb(250, 240, 212)";
    }
    if (/color-mix/i.test(trimmed) && /#c5d9e8|paper|rule/i.test(trimmed)) {
      return "rgb(197, 217, 232)";
    }
    if (/color-mix/i.test(trimmed)) {
      return "rgb(250, 246, 235)";
    }
    return "rgb(51, 51, 51)";
  }

  return toCanvasSafeRgb(trimmed, "#faf6eb");
}

function replaceUnsupportedColorExpressions(css: string): string {
  return css.replace(COLOR_EXPRESSION_PATTERN, (match) => resolveColorExpression(match));
}

function stripColorFunctionBalanced(
  css: string,
  fnName: string,
  replacement: string
): string {
  const needle = fnName.toLowerCase();
  let result = css;
  let searchFrom = 0;

  while (searchFrom < result.length) {
    const relIdx = result.slice(searchFrom).toLowerCase().indexOf(`${needle}(`);
    if (relIdx === -1) break;

    const start = searchFrom + relIdx;
    let depth = 0;
    let end = -1;

    for (let i = start + needle.length; i < result.length; i++) {
      const ch = result[i];
      if (ch === "(") depth++;
      else if (ch === ")") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }

    if (end === -1) break;

    result = result.slice(0, start) + replacement + result.slice(end + 1);
    searchFrom = start + replacement.length;
  }

  return result;
}

export function sanitizeStylesheetCss(css: string): string {
  if (!css || !containsUnsupportedColor(css)) {
    return css;
  }

  let result = replaceUnsupportedColorExpressions(css);

  for (let pass = 0; pass < 5; pass++) {
    let changed = false;
    for (const [pattern, replacement] of CSS_COLOR_REPLACEMENTS) {
      const next = result.replace(pattern, replacement);
      if (next !== result) changed = true;
      result = next;
    }
    for (const fn of STRIP_COLOR_FUNCTIONS) {
      const next = stripColorFunctionBalanced(result, fn, "rgb(51, 51, 51)");
      if (next !== result) changed = true;
      result = next;
    }
    if (!containsUnsupportedColor(result) || !changed) {
      break;
    }
  }

  while (containsUnsupportedColor(result)) {
    const next = result.replace(UNSUPPORTED_COLOR_FUNCTIONS, "rgb(51, 51, 51)");
    if (next === result) break;
    result = next;
  }

  return result;
}

export function sanitizeStylesheetsInClone(doc: Document): void {
  const sanitizedChunks: string[] = [];

  doc.querySelectorAll("style").forEach((styleEl) => {
    if (!styleEl.textContent) return;
    if (styleEl.hasAttribute("data-pdf-export-baseline")) {
      sanitizedChunks.push(styleEl.textContent);
      return;
    }
    sanitizedChunks.push(sanitizeStylesheetCss(styleEl.textContent));
  });

  doc.querySelectorAll('link[rel="stylesheet"]').forEach((node) => node.remove());
  doc.querySelectorAll("style").forEach((node) => node.remove());

  try {
    (doc as Document & { adoptedStyleSheets?: CSSStyleSheet[] }).adoptedStyleSheets =
      [];
  } catch {
    // adoptedStyleSheets may be read-only in some environments
  }

  const merged = doc.createElement("style");
  merged.setAttribute("data-pdf-export-sanitized", "true");
  merged.textContent = sanitizedChunks.join("\n");
  doc.head.appendChild(merged);
}

function fallbackForProperty(property: string): string {
  if (property === "background-image" || property === "list-style-image") {
    return "none";
  }
  if (property.includes("shadow")) {
    return "none";
  }
  if (property === "background-color" || property === "background") {
    return "transparent";
  }
  if (property.includes("border") && property.includes("color")) {
    return "rgb(197, 217, 232)";
  }
  if (property === "color" || property === "fill" || property === "stroke" || property === "caret-color") {
    return "rgb(26, 36, 56)";
  }
  return "";
}

function resolveViaBrowser(property: string, value: string): string {
  if (!value || isHtml2CanvasSafeCssValue(value)) {
    return value;
  }

  if (property.includes("shadow") || property.includes("image")) {
    return "none";
  }

  if (isColorLikeProperty(property)) {
    const rgb = toCanvasSafeRgb(value, fallbackForProperty(property) || "rgb(51, 51, 51)");
    if (rgb && isHtml2CanvasSafeCssValue(rgb)) {
      return rgb;
    }
  }

  const probe = document.createElement("div");
  probe.style.setProperty("position", "fixed", "important");
  probe.style.setProperty("left", "-100000px", "important");
  probe.style.setProperty("visibility", "hidden", "important");
  probe.style.setProperty("width", "200px", "important");
  probe.style.setProperty("height", "200px", "important");
  probe.style.setProperty(property, value);
  document.body.appendChild(probe);

  try {
    const resolved = window.getComputedStyle(probe).getPropertyValue(property);
    if (resolved && isHtml2CanvasSafeCssValue(resolved)) {
      return resolved;
    }
    if (resolved && isColorLikeProperty(property)) {
      const rgb = toCanvasSafeRgb(resolved, fallbackForProperty(property));
      if (isHtml2CanvasSafeCssValue(rgb)) return rgb;
    }

    return fallbackForProperty(property) || resolved || value;
  } finally {
    probe.remove();
  }
}

export function resolveCssValue(_doc: Document, property: string, value: string): string {
  if (!value || isHtml2CanvasSafeCssValue(value)) {
    return value;
  }

  const resolved = resolveViaBrowser(property, value);
  if (isHtml2CanvasSafeCssValue(resolved)) {
    return resolved;
  }

  return fallbackForProperty(property);
}

export function sanitizeClonedDocumentRoots(clonedDoc: Document): void {
  const html = clonedDoc.documentElement;
  const body = clonedDoc.body;

  if (html) {
    html.style.setProperty("background-color", "#faf6eb", "important");
    html.style.setProperty("color", "#1a2438", "important");
  }

  if (body) {
    body.style.setProperty("background-color", "#faf6eb", "important");
    body.style.setProperty("color", "#1a2438", "important");
    body.style.setProperty("margin", "0", "important");
    body.style.setProperty("visibility", "visible", "important");
  }
}

export function injectPdfExportBaselineStyles(doc: Document): void {
  const style = doc.createElement("style");
  style.setAttribute("data-pdf-export-baseline", "true");
  style.textContent = `
    html, body {
      background: #faf6eb !important;
      color: #1a2438 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .resume-template-marginalia,
    .resume-template-marginalia *:not([class*="c0392b"]) {
      color: #1a2438 !important;
      -webkit-text-fill-color: #1a2438 !important;
    }
    .no-print {
      display: none !important;
    }

    /* flex gap emulation is handled by patchFlexGapForHtml2Canvas() with actual computed values */

    /* Marginalia: opaque card fills — html2canvas mishandles transparent color-mix */
    .resume-template-marginalia .resume-marginalia-h2 {
      background-color: #faf6eb !important;
      position: relative;
      z-index: 1;
    }
    .resume-template-marginalia .resume-marginalia-card--mint,
    .resume-template-marginalia .resume-marginalia-card--marker,
    .resume-template-marginalia .resume-marginalia-skills-panel {
      color: #1a2438 !important;
      background-image: none !important;
      box-shadow: none !important;
      isolation: isolate !important;
    }
    .resume-template-marginalia .resume-marginalia-card--mint,
    .resume-template-marginalia .resume-marginalia-skills-panel {
      background-color: #ecf5ee !important;
    }
    .resume-template-marginalia .resume-marginalia-card--marker {
      background-color: #faf0d4 !important;
    }
    .resume-template-marginalia .resume-marginalia-card-ruled,
    .resume-template-marginalia .resume-marginalia-card-ruled * {
      color: #1a2438 !important;
      -webkit-text-fill-color: #1a2438 !important;
    }
    .resume-template-marginalia .resume-marginalia-card-ruled [class*="c0392b"] {
      color: #c0392b !important;
    }
    .resume-template-marginalia .resume-marginalia-card {
      border-color: rgba(197, 217, 232, 0.85) !important;
      border-left-color: #c0392b !important;
    }
    .resume-template-marginalia .resume-marginalia-chip--mint {
      background: #d4edda !important;
      background-image: none !important;
    }
    .resume-template-marginalia .resume-marginalia-chip--marker {
      background: #f5d76e !important;
      background-image: none !important;
    }
    .resume-template-marginalia .resume-marginalia-chip-row {
      line-height: 28px !important;
      font-size: 0 !important;
    }
    .resume-template-marginalia .resume-marginalia-chip {
      display: inline-flex !important;
      vertical-align: bottom !important;
      font-size: 11px !important;
    }

    .resume-template-marginalia {
      box-shadow: none !important;
    }
    .resume-marginalia-accent-bar-fill,
    .resume-theme-accent-bar,
    .resume-marginalia-accent-bar,
    .resume-template-marginalia.resume-custom-active .resume-theme-accent-bar {
      background: #c0392b !important;
      background-color: #c0392b !important;
      background-image: none !important;
      box-shadow: none !important;
    }
    .resume-marginalia-header,
    .resume-marginalia-header-row,
    .resume-marginalia-header-identity,
    .resume-marginalia-header-contact {
      background: transparent !important;
      background-color: transparent !important;
      background-image: none !important;
      box-shadow: none !important;
    }
    .resume-marginalia-dual-col-body .resume-marginalia-card-ruled {
      flex: 0 0 auto !important;
    }
    .resume-marginalia-skills-panel {
      overflow: hidden !important;
      box-sizing: border-box !important;
    }
    .resume-marginalia-skills-panel .resume-marginalia-chip {
      align-items: center !important;
      vertical-align: top !important;
      margin-bottom: 0 !important;
    }
  `;
  doc.head.appendChild(style);
}

function setImportant(el: HTMLElement, prop: string, value: string): void {
  el.style.setProperty(prop, value, "important");
}

/** html2canvas-safe colour overrides only — layout comes from live preview CSS. */
export function applyMarginaliaPdfInlineFixes(cloneRoot: HTMLElement): void {
  const sheets = cloneRoot.classList.contains("resume-template-marginalia")
    ? [cloneRoot]
    : Array.from(cloneRoot.querySelectorAll(".resume-template-marginalia"));

  for (const sheet of sheets) {
    if (!(sheet instanceof HTMLElement)) continue;
    setImportant(sheet, "box-shadow", "none");
    setImportant(sheet, "background-attachment", "scroll");
  }

  cloneRoot.querySelectorAll(".resume-marginalia-accent-bar-fill, .resume-theme-accent-bar, .resume-marginalia-accent-bar").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    setImportant(node, "background", "#c0392b");
    setImportant(node, "background-color", "#c0392b");
    setImportant(node, "background-image", "none");
  });

  cloneRoot.querySelectorAll(".resume-marginalia-card--mint, .resume-marginalia-skills-panel").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    setImportant(node, "background-color", "#ecf5ee");
    setImportant(node, "background", "#ecf5ee");
    setImportant(node, "background-image", "none");
    setImportant(node, "color", "#1a2438");
  });

  cloneRoot.querySelectorAll(".resume-marginalia-card--marker").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    setImportant(node, "background-color", "#faf0d4");
    setImportant(node, "background", "#faf0d4");
    setImportant(node, "background-image", "none");
    setImportant(node, "color", "#1a2438");
  });

  cloneRoot.querySelectorAll(".resume-marginalia-h2").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    setImportant(node, "background-color", "#faf6eb");
  });

  cloneRoot.querySelectorAll(".resume-marginalia-chip--mint").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    setImportant(node, "background", "#d4edda");
    setImportant(node, "background-image", "none");
    setImportant(node, "color", "#1a2438");
    setImportant(node, "align-items", "center");
    setImportant(node, "vertical-align", "top");
    setImportant(node, "margin-bottom", "0");
  });

  cloneRoot.querySelectorAll(".resume-marginalia-chip--marker").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    setImportant(node, "background", "#f5d76e");
    setImportant(node, "background-image", "none");
    setImportant(node, "color", "#1a2438");
  });

  cloneRoot.querySelectorAll(".resume-marginalia-card-ruled, .resume-marginalia-card-ruled *").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.className.includes("c0392b")) return;
    setImportant(node, "color", "#1a2438");
    setImportant(node, "-webkit-text-fill-color", "#1a2438");
  });

  cloneRoot.querySelectorAll("svg").forEach((node) => {
    if (!(node instanceof SVGElement)) return;
    node.setAttribute("fill", "currentColor");
    node.setAttribute("stroke", "currentColor");
  });
}

function sanitizeInlineStyleAttribute(el: HTMLElement, clonedDoc: Document): void {
  const inlineStyle = el.getAttribute("style");
  if (!inlineStyle || !containsUnsupportedColor(inlineStyle)) {
    return;
  }

  const declarations = inlineStyle.split(";").filter(Boolean);
  const sanitized = declarations
    .map((decl) => {
      const colon = decl.indexOf(":");
      if (colon === -1) return decl.trim();
      const prop = decl.slice(0, colon).trim();
      const value = decl.slice(colon + 1).trim();
      if (!prop || !value) return "";
      return `${prop}: ${resolveCssValue(clonedDoc, prop, value)}`;
    })
    .filter(Boolean)
    .join("; ");

  if (sanitized) {
    el.setAttribute("style", sanitized);
  }
}

function toSafePaintValue(property: string, value: string, clonedDoc: Document): string {
  if (!value) return value;
  if (property.includes("shadow") || property.includes("image")) {
    return isHtml2CanvasSafeCssValue(value) ? value : "none";
  }
  if (isHtml2CanvasSafeCssValue(value)) {
    return value;
  }
  if (isColorLikeProperty(property)) {
    const rgb = toCanvasSafeRgb(value, fallbackForProperty(property) || "rgb(51, 51, 51)");
    if (rgb && isHtml2CanvasSafeCssValue(rgb)) return rgb;
  }
  return resolveCssValue(clonedDoc, property, value);
}

/** Inline browser-resolved rgb paints so html2canvas never re-parses oklch from stylesheets. */
export function inlineSafePaintFromSource(
  sourceRoot: Element,
  cloneRoot: Element,
  clonedDoc: Document
): void {
  for (const [source, clone] of walkElementPairs(sourceRoot, cloneRoot)) {
    if (!(source instanceof Element) || !(clone instanceof Element)) {
      continue;
    }

    if (clone instanceof HTMLElement) {
      sanitizeInlineStyleAttribute(clone, clonedDoc);
    }

    const computed = getComputedStyleForElement(source);

    if (clone instanceof HTMLElement || clone instanceof SVGElement) {
      for (const prop of INLINE_PAINT_PROPS) {
        const value = computed.getPropertyValue(prop);
        if (!value) continue;

        const safe = toSafePaintValue(prop, value, clonedDoc);
        if (safe && isHtml2CanvasSafeCssValue(safe)) {
          clone.style.setProperty(prop, safe, "important");
        }
      }

      for (const prop of STRIP_IF_UNSAFE_PROPS) {
        const value = computed.getPropertyValue(prop);
        if (!value || value === "none") continue;
        if (!isHtml2CanvasSafeCssValue(value)) {
          clone.style.setProperty(prop, "none", "important");
        }
      }
    }
  }
}

/** Pre-inline paints on the offscreen export clone before html2canvas runs. */
export function preInlineExportClonePaint(
  sourceRoot: HTMLElement,
  cloneRoot: HTMLElement
): void {
  inlineSafePaintFromSource(sourceRoot, cloneRoot, document);
  resetLetterSpacingForHtml2Canvas(cloneRoot);
}

/** @deprecated Use inlineSafePaintFromSource */
export function sanitizeUnsafeComputedColors(
  sourceRoot: Element,
  cloneRoot: Element,
  clonedDoc: Document
): void {
  inlineSafePaintFromSource(sourceRoot, cloneRoot, clonedDoc);
}

function patchFlexGapForHtml2Canvas(sourceRoot: Element, cloneRoot: Element): void {
  for (const [source, clone] of walkElementPairs(sourceRoot, cloneRoot)) {
    if (!(source instanceof HTMLElement) || !(clone instanceof HTMLElement)) continue;
    const computed = getComputedStyleForElement(source);
    if (!computed.display.includes("flex")) continue;

    const rowGap = parseFloat(computed.rowGap) || parseFloat(computed.gap) || 0;
    const columnGap = parseFloat(computed.columnGap) || parseFloat(computed.gap) || 0;
    if (rowGap <= 0 && columnGap <= 0) continue;

    const children = Array.from(clone.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
    const isColumn = computed.flexDirection.startsWith("column");
    const isWrap = computed.flexWrap !== "nowrap";

    children.forEach((child, index) => {
      if (isColumn) {
        if (index > 0 && rowGap > 0) {
          child.style.setProperty("margin-top", `${rowGap}px`, "important");
        }
      } else if (isWrap) {
        if (index > 0 && columnGap > 0) {
          child.style.setProperty("margin-left", `${columnGap / 2}px`, "important");
        }
        if (index < children.length - 1 && columnGap > 0) {
          child.style.setProperty("margin-right", `${columnGap / 2}px`, "important");
        }
        if (rowGap > 0) child.style.setProperty("margin-bottom", `${rowGap}px`, "important");
      } else if (index > 0 && columnGap > 0) {
        child.style.setProperty("margin-left", `${columnGap}px`, "important");
      }
    });
  }
}

const TRACKING_LETTER_SPACING_CLASS_MARKERS = [
  "ui-label",
  "sticker-pill",
  "resume-theme-section-heading",
  "resume-a4-section-title",
  "tracking-wide",
  "tracking-wider",
  "tracking-widest",
] as const;

function keepsIntentionalLetterSpacing(el: HTMLElement, computed: CSSStyleDeclaration): boolean {
  const transform = computed.textTransform;
  if (transform === "uppercase" || transform === "small-caps") return true;
  return TRACKING_LETTER_SPACING_CLASS_MARKERS.some((marker) => el.classList.contains(marker));
}

/**
 * html2canvas collapses inter-word spaces when letter-spacing is inherited from parents.
 * Reset tracking on prose nodes; preserve uppercase / label styles.
 */
export function resetLetterSpacingForHtml2Canvas(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const computed = getComputedStyleForElement(el);
    const spacing = computed.letterSpacing;
    if (!spacing || spacing === "normal" || spacing === "0px") return;
    if (keepsIntentionalLetterSpacing(el, computed)) return;
    el.style.setProperty("letter-spacing", "normal", "important");
  });
}

function ensureCloneVisibility(cloneRoot: HTMLElement): void {
  cloneRoot.style.setProperty("visibility", "visible", "important");
  cloneRoot.style.setProperty("opacity", "1", "important");
  cloneRoot.querySelectorAll<HTMLElement>("*").forEach((node) => {
    node.style.setProperty("visibility", "visible", "important");
    node.style.setProperty("opacity", "1", "important");
  });
}

export function prepareHtml2CanvasClone(
  sourceRoot: Element,
  cloneRoot: Element,
  clonedDoc: Document
): void {
  sanitizeStylesheetsInClone(clonedDoc);
  sanitizeClonedDocumentRoots(clonedDoc);
  injectPdfExportBaselineStyles(clonedDoc);
  inlineSafePaintFromSource(sourceRoot, cloneRoot, clonedDoc);
  inlineSafePaintFromSource(cloneRoot, cloneRoot, clonedDoc);
  patchFlexGapForHtml2Canvas(sourceRoot, cloneRoot);

  if (cloneRoot instanceof HTMLElement) {
    ensureCloneVisibility(cloneRoot);
    resetLetterSpacingForHtml2Canvas(cloneRoot);
    if (cloneRoot.classList.contains("resume-template-marginalia")) {
      applyMarginaliaPdfInlineFixes(cloneRoot);
    }
  }
}

export type Html2CanvasCaptureOptions = Partial<Options> & {
  /** Live DOM used for getComputedStyle — defaults to sourceElement */
  styleSource?: HTMLElement;
};

export async function captureElementWithHtml2Canvas(
  sourceElement: HTMLElement,
  options: Html2CanvasCaptureOptions = {}
): Promise<HTMLCanvasElement> {
  const { onclone: userOnClone, styleSource, ...restOptions } = options;
  const paintSource = styleSource ?? sourceElement;

  try {
    return await html2canvas(sourceElement, {
      useCORS: true,
      logging: false,
      ...restOptions,
      onclone: (clonedDoc, clonedElement) => {
        prepareHtml2CanvasClone(paintSource, clonedElement, clonedDoc);
        userOnClone?.(clonedDoc, clonedElement);
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/unsupported color function/i.test(message)) {
      throw new Error(pdfExportError("colorFormatUnsupported"));
    }
    throw err;
  }
}
