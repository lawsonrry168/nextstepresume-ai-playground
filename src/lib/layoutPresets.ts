import type { ResumeData } from "../types";
import type { TemplateFamily } from "./resumeTemplateCatalog";
import { CANVAS_PAGE_MARGIN } from "./canvasAlignTools";
import { CANVAS_PAGE_HEIGHT, CANVAS_PAGE_WIDTH } from "./canvasStudioTypes";
import { clampPositionToA4Page } from "./canvasPageSnap";
import {
  defaultSectionHeight,
  normalizeFreeLayoutPosition,
  snapToGrid,
  SNAP_GRID_SIZE,
  type FreeLayoutPosition,
  type FreeLayoutPresetId,
} from "./resumeFreeLayout";

/* ── A4 safe-zone constants ─────────────────────────────────────────── */
const M = CANVAS_PAGE_MARGIN;                       // 48
const USABLE_W = CANVAS_PAGE_WIDTH - M * 2;         // 698
const USABLE_H = CANVAS_PAGE_HEIGHT - M * 2;        // 1027
const MAX_BOTTOM = CANVAS_PAGE_HEIGHT - M;           // 1075
const GAP = snapToGrid(8, SNAP_GRID_SIZE);
const COL_GAP = snapToGrid(16, SNAP_GRID_SIZE);

/* ── Resume section canonical order ─────────────────────────────────── */
const SECTION_ORDER = [
  "header", "summary", "experience", "projects",
  "education", "skills", "languages", "certifications", "volunteer",
];

function sortSections(sectionIds: string[]): string[] {
  const rank = new Map(SECTION_ORDER.map((id, i) => [id, i]));
  return [...sectionIds].sort((a, b) => (rank.get(a) ?? 99) - (rank.get(b) ?? 99));
}

/* ── Height helpers ─────────────────────────────────────────────────── */

function sectionH(id: string): number {
  return defaultSectionHeight(id);
}

function computeGap(sections: string[], availableH: number): number {
  if (sections.length <= 1) return 0;
  const totalH = sections.reduce((sum, id) => sum + sectionH(id), 0);
  const slack = availableH - totalH;
  if (slack <= 0) return GAP;
  const fillGap = Math.floor(slack / (sections.length - 1));
  return Math.max(GAP, Math.min(48, fillGap));
}

/* ── Build positioned record ────────────────────────────────────────── */

function buildPositions(
  placements: Array<{ id: string; x: number; y: number; w: number; h: number }>,
): Record<string, FreeLayoutPosition> {
  const result: Record<string, FreeLayoutPosition> = {};
  for (const p of placements) {
    result[p.id] = normalizeFreeLayoutPosition(
      { x: p.x, y: p.y, width: p.w, height: p.h },
      p.id,
    );
  }
  return result;
}

/* ── Stack layout: single column, full width ────────────────────────── */

function layoutStack(sectionIds: string[]): Record<string, FreeLayoutPosition> {
  const sorted = sortSections(sectionIds);
  const gap = computeGap(sorted, USABLE_H);
  const placements: Array<{ id: string; x: number; y: number; w: number; h: number }> = [];
  let y = M;
  for (const id of sorted) {
    const h = sectionH(id);
    placements.push({ id, x: M, y, w: USABLE_W, h });
    y += h + gap;
  }
  return buildPositions(placements);
}

/* ── Stack-center: narrower centered column ─────────────────────────── */

function layoutStackCenter(sectionIds: string[]): Record<string, FreeLayoutPosition> {
  const sorted = sortSections(sectionIds);
  const colW = snapToGrid(Math.min(600, USABLE_W), SNAP_GRID_SIZE);
  const x = snapToGrid(Math.round((CANVAS_PAGE_WIDTH - colW) / 2), SNAP_GRID_SIZE);
  const gap = computeGap(sorted, USABLE_H);
  const placements: Array<{ id: string; x: number; y: number; w: number; h: number }> = [];
  let y = M;
  for (const id of sorted) {
    const h = sectionH(id);
    placements.push({ id, x, y, w: colW, h });
    y += h + gap;
  }
  return buildPositions(placements);
}

/* ── Stack-compact: tight gaps ──────────────────────────────────────── */

function layoutStackCompact(sectionIds: string[]): Record<string, FreeLayoutPosition> {
  const sorted = sortSections(sectionIds);
  const placements: Array<{ id: string; x: number; y: number; w: number; h: number }> = [];
  let y = M;
  for (const id of sorted) {
    const h = sectionH(id);
    placements.push({ id, x: M, y, w: USABLE_W, h });
    y += h + GAP;
  }
  return buildPositions(placements);
}

/* ── Two-column: header full-width, rest in 2 balanced columns ──────── */

function layoutTwoColumn(sectionIds: string[]): Record<string, FreeLayoutPosition> {
  const sorted = sortSections(sectionIds);
  const colW = snapToGrid(Math.floor((USABLE_W - COL_GAP) / 2), SNAP_GRID_SIZE);
  const leftX = M;
  const rightX = M + colW + COL_GAP;

  // Balance sections into two columns by total height
  const leftIds: string[] = [];
  const rightIds: string[] = [];
  let leftH = 0;
  let rightH = 0;

  for (const id of sorted) {
    const h = sectionH(id);
    if (leftH <= rightH) {
      leftIds.push(id);
      leftH += h;
    } else {
      rightIds.push(id);
      rightH += h;
    }
  }

  const placements: Array<{ id: string; x: number; y: number; w: number; h: number }> = [];

  const leftGap = computeGap(leftIds, USABLE_H);
  let ly = M;
  for (const id of leftIds) {
    const h = sectionH(id);
    placements.push({ id, x: leftX, y: ly, w: colW, h });
    ly += h + leftGap;
  }

  const rightGap = computeGap(rightIds, USABLE_H);
  let ry = M;
  for (const id of rightIds) {
    const h = sectionH(id);
    placements.push({ id, x: rightX, y: ry, w: colW, h });
    ry += h + rightGap;
  }

  return buildPositions(placements);
}

/* ── Sidebar: narrow left rail + wide main column ───────────────────── */

const SIDEBAR_W = snapToGrid(224, SNAP_GRID_SIZE);

const SIDEBAR_SECTIONS = new Set(["skills", "languages", "education", "certifications"]);
const MAIN_SECTIONS = new Set(["header", "summary", "experience", "projects", "volunteer"]);

function layoutSidebar(sectionIds: string[]): Record<string, FreeLayoutPosition> {
  const sorted = sortSections(sectionIds);
  const mainW = snapToGrid(USABLE_W - SIDEBAR_W - COL_GAP, SNAP_GRID_SIZE);
  const sideX = M;
  const mainX = M + SIDEBAR_W + COL_GAP;

  const sideIds = sorted.filter((id) => SIDEBAR_SECTIONS.has(id));
  const mainIds = sorted.filter((id) => !SIDEBAR_SECTIONS.has(id));

  // If no sidebar content, put everything in main
  if (!sideIds.length) {
    return layoutStack(sectionIds);
  }

  const placements: Array<{ id: string; x: number; y: number; w: number; h: number }> = [];

  const sideGap = computeGap(sideIds, USABLE_H);
  let sy = M;
  for (const id of sideIds) {
    const h = sectionH(id);
    placements.push({ id, x: sideX, y: sy, w: SIDEBAR_W, h });
    sy += h + sideGap;
  }

  const mainGap = computeGap(mainIds, USABLE_H);
  let my = M;
  for (const id of mainIds) {
    const h = sectionH(id);
    placements.push({ id, x: mainX, y: my, w: mainW, h });
    my += h + mainGap;
  }

  return buildPositions(placements);
}

/* ── Preset dispatch ────────────────────────────────────────────────── */

type PresetLayoutFn = (sectionIds: string[]) => Record<string, FreeLayoutPosition>;

const PRESET_FN: Record<FreeLayoutPresetId, PresetLayoutFn> = {
  modern: layoutTwoColumn,
  classic: layoutStackCenter,
  minimalist: layoutSidebar,
  "two-column": layoutTwoColumn,
  magazine: layoutSidebar,
  compact: layoutStackCompact,
};

const FAMILY_FN: Record<TemplateFamily, PresetLayoutFn> = {
  modern: layoutTwoColumn,
  classic: layoutStackCenter,
  minimalist: layoutSidebar,
};

/* ── Pagination safety net ──────────────────────────────────────────── */

function paginateOverflow(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
): Record<string, FreeLayoutPosition> {
  const sorted = sortSections(sectionIds);
  const overflowing = sorted.filter((id) => {
    const pos = positions[id];
    return pos && pos.y + pos.height > MAX_BOTTOM;
  });
  if (!overflowing.length) return positions;

  const current = { ...positions };
  let cursorY = M;
  for (const id of overflowing) {
    const pos = current[id]!;
    current[id] = clampPositionToA4Page({
      ...pos,
      pageId: "page-overflow",
      x: M,
      y: cursorY,
      width: USABLE_W,
    });
    cursorY += pos.height + GAP;
  }
  return current;
}

/* ── Public API ─────────────────────────────────────────────────────── */

/** Generate preset positions for a specific preset ID */
export function createFreeLayoutPresetPositions(
  presetId: FreeLayoutPresetId,
  sectionIds: string[],
  _resumeData?: ResumeData,
): Record<string, FreeLayoutPosition> {
  const fn = PRESET_FN[presetId] ?? layoutStack;
  return paginateOverflow(sectionIds, fn(sectionIds));
}

/** Generate default positions for a template family */
export function createFamilyDefaultPositions(
  family: TemplateFamily,
  sectionIds: string[],
  _resumeData?: ResumeData,
): Record<string, FreeLayoutPosition> {
  const fn = FAMILY_FN[family] ?? layoutStack;
  return paginateOverflow(sectionIds, fn(sectionIds));
}

/** @deprecated Use createFamilyDefaultPositions */
export function createDefaultFreeLayoutPositions(
  sectionIds: string[],
  family: TemplateFamily = "modern",
): Record<string, FreeLayoutPosition> {
  return createFamilyDefaultPositions(family, sectionIds);
}

/** Merge stored positions with family defaults; auto-paginate overflow */
export function mergeFreeLayoutPositions(
  stored: Record<string, Partial<FreeLayoutPosition>> | null,
  sectionIds: string[],
  family: TemplateFamily = "modern",
): Record<string, FreeLayoutPosition> {
  const defaults = createFamilyDefaultPositions(family, sectionIds);
  if (!stored) return defaults;

  const merged: Record<string, FreeLayoutPosition> = {};
  for (const id of sectionIds) {
    merged[id] = normalizeFreeLayoutPosition(
      { ...defaults[id], ...stored[id] },
      id,
    );
  }
  return paginateMergedOverflow(sectionIds, merged);
}

function paginateMergedOverflow(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
): Record<string, FreeLayoutPosition> {
  const hasOverflow = sectionIds.some((id) => {
    const pos = positions[id];
    return pos && pos.y + pos.height > MAX_BOTTOM;
  });
  if (!hasOverflow) return positions;

  return paginateOverflow(sectionIds, positions);
}
