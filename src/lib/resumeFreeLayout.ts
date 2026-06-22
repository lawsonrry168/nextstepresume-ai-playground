import { ResumeData } from "../types";
import { TemplateFamily } from "./resumeTemplateCatalog";
import { NSR_STORAGE_KEYS } from "./storageKeys";

export interface FreeLayoutPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Canvas multi-page: section belongs to this page */
  pageId?: string;
}

export interface FreeLayoutSectionMeta {
  id: string;
}

export const FREE_LAYOUT_BY_FAMILY_KEY = NSR_STORAGE_KEYS.freeLayoutByFamily;
export const FREE_LAYOUT_ENABLED_KEY = NSR_STORAGE_KEYS.freeLayoutEnabled;
export const FREE_LAYOUT_SNAP_KEY = NSR_STORAGE_KEYS.freeLayoutSnap;
export const FREE_LAYOUT_LIVE_PREVIEW_KEY = NSR_STORAGE_KEYS.freeLayoutLivePreview;

export const SNAP_GRID_SIZE = 24;
export const SNAP_THRESHOLD = 12;
export const FREE_LAYOUT_MIN_WIDTH = 180;
export const FREE_LAYOUT_MAX_WIDTH = 700;
export const FREE_LAYOUT_MIN_HEIGHT = 72;
export const FREE_LAYOUT_MAX_HEIGHT = 1027;

export const DEFAULT_SECTION_HEIGHT: Record<string, number> = {
  header: 150,
  summary: 120,
  experience: 260,
  education: 110,
  projects: 150,
  skills: 110,
  certifications: 100,
  volunteer: 100,
  languages: 80,
};

export function clampSectionHeight(height: number, maxHeight = FREE_LAYOUT_MAX_HEIGHT): number {
  return Math.min(maxHeight, Math.max(FREE_LAYOUT_MIN_HEIGHT, height));
}

export function snapToGrid(value: number, grid = SNAP_GRID_SIZE): number {
  return Math.round(value / grid) * grid;
}

export function clampSectionWidth(width: number, x: number, canvasWidth: number): number {
  const maxWidth = canvasWidth - x - 8;
  return Math.min(FREE_LAYOUT_MAX_WIDTH, Math.max(FREE_LAYOUT_MIN_WIDTH, Math.min(width, maxWidth)));
}

export function clampSectionPosition(
  pos: FreeLayoutPosition,
  canvasWidth: number = FREE_LAYOUT_CANVAS.width,
): FreeLayoutPosition {
  const width = clampSectionWidth(pos.width, pos.x, canvasWidth);
  return {
    x: Math.max(0, Math.min(pos.x, canvasWidth - width)),
    y: Math.max(0, pos.y),
    width,
    height: clampSectionHeight(pos.height),
  };
}

export function defaultSectionHeight(sectionId: string): number {
  return DEFAULT_SECTION_HEIGHT[sectionId] ?? 140;
}

export function normalizeFreeLayoutPosition(
  raw: Partial<FreeLayoutPosition> | undefined,
  sectionId: string,
): FreeLayoutPosition {
  const clamped = clampSectionPosition({
    x: raw?.x ?? 48,
    y: raw?.y ?? 48,
    width: raw?.width ?? 360,
    height: raw?.height ?? defaultSectionHeight(sectionId),
  });
  if (typeof raw?.pageId === "string" && raw.pageId.trim()) {
    return { ...clamped, pageId: raw.pageId };
  }
  return clamped;
}

export interface MagneticSnapOptions {
  pageHeight?: number;
  pageId?: string;
  margin?: number;
}

export function applyMagneticSnap(
  sectionId: string,
  pos: FreeLayoutPosition,
  allPositions: Record<string, FreeLayoutPosition>,
  canvasWidth: number,
  options?: MagneticSnapOptions,
): FreeLayoutPosition {
  const pageHeight = options?.pageHeight;
  const pageId = options?.pageId ?? pos.pageId;
  const margin = options?.margin ?? 0;
  let { x, y, width, height } = pos;

  x = snapToGrid(x);
  y = snapToGrid(y);

  if (x < SNAP_THRESHOLD) x = 0;
  if (y < SNAP_THRESHOLD) y = 0;

  const right = x + width;
  if (canvasWidth - right < SNAP_THRESHOLD) {
    x = Math.max(0, canvasWidth - width);
  }

  if (margin > 0) {
    if (Math.abs(x - margin) <= SNAP_THRESHOLD) x = margin;
    if (Math.abs(y - margin) <= SNAP_THRESHOLD) y = margin;
    const innerRight = canvasWidth - margin;
    if (Math.abs(x + width - innerRight) <= SNAP_THRESHOLD) x = innerRight - width;
    if (typeof pageHeight === "number") {
      const innerBottom = pageHeight - margin;
      if (Math.abs(y + height - innerBottom) <= SNAP_THRESHOLD) y = innerBottom - height;
    }
  }

  for (const [otherId, other] of Object.entries(allPositions)) {
    if (otherId === sectionId) continue;
    if (pageId && other.pageId && other.pageId !== pageId) continue;

    const otherRight = other.x + other.width;
    const myRight = x + width;
    const myBottom = y + height;
    const otherBottom = other.y + other.height;

    if (Math.abs(x - otherRight) <= SNAP_THRESHOLD) x = otherRight;
    if (Math.abs(myRight - other.x) <= SNAP_THRESHOLD) x = other.x - width;
    if (Math.abs(x - other.x) <= SNAP_THRESHOLD) x = other.x;
    if (Math.abs(myRight - otherRight) <= SNAP_THRESHOLD) x = otherRight - width;
    if (Math.abs(y - other.y) <= SNAP_THRESHOLD) y = other.y;
    if (Math.abs(myBottom - other.y) <= SNAP_THRESHOLD) y = other.y - height;
    if (Math.abs(y - otherBottom) <= SNAP_THRESHOLD) y = otherBottom;
    if (Math.abs(myBottom - otherBottom) <= SNAP_THRESHOLD) y = otherBottom - height;
  }

  x = Math.max(0, Math.min(x, canvasWidth - width));
  y = Math.max(0, y);
  if (typeof pageHeight === "number") {
    y = Math.min(y, Math.max(0, pageHeight - height));
  }
  width = clampSectionWidth(width, x, canvasWidth);
  height = clampSectionHeight(height);
  if (typeof pageHeight === "number") {
    height = Math.min(height, Math.max(FREE_LAYOUT_MIN_HEIGHT, pageHeight - y));
  }

  if (margin > 0) {
    if (Math.abs(x - margin) <= SNAP_THRESHOLD) x = margin;
    if (Math.abs(y - margin) <= SNAP_THRESHOLD) y = margin;
    const innerRight = canvasWidth - margin;
    if (Math.abs(x + width - innerRight) <= SNAP_THRESHOLD) x = innerRight - width;
    if (typeof pageHeight === "number") {
      const innerBottom = pageHeight - margin;
      if (Math.abs(y + height - innerBottom) <= SNAP_THRESHOLD) y = innerBottom - height;
    }
  }

  return { ...pos, x, y, width, height };
}

export function buildFreeLayoutSections(data: ResumeData): FreeLayoutSectionMeta[] {
  const sections: FreeLayoutSectionMeta[] = [{ id: "header" }];

  if (data.summary?.trim()) {
    sections.push({ id: "summary" });
  }
  if (data.experience?.length) {
    sections.push({ id: "experience" });
  }
  if (data.education?.length) {
    sections.push({ id: "education" });
  }
  if (data.projects?.length) {
    sections.push({ id: "projects" });
  }
  if (data.skills?.length) {
    sections.push({ id: "skills" });
  }
  if (data.certifications?.length) {
    sections.push({ id: "certifications" });
  }
  if (data.volunteerWork?.length) {
    sections.push({ id: "volunteer" });
  }
  if (data.languages?.length) {
    sections.push({ id: "languages" });
  }

  return sections;
}

export function createDefaultFreeLayoutPositions(
  sectionIds: string[],
  family: TemplateFamily = "modern",
): Record<string, FreeLayoutPosition> {
  return createFamilyDefaultPositions(family, sectionIds);
}

function stackSections(
  positions: Record<string, FreeLayoutPosition>,
  sectionIds: string[],
  orderedIds: string[],
  x: number,
  y: number,
  width: number,
  gap = 16,
): number {
  let cursorY = y;
  for (const id of orderedIds) {
    if (!sectionIds.includes(id)) continue;
    const height = defaultSectionHeight(id);
    place(positions, sectionIds, id, x, cursorY, width, height);
    cursorY += height + gap;
  }
  return cursorY;
}

/** 對應固定版型族的預設段落排位 */
export function createFamilyDefaultPositions(
  family: TemplateFamily,
  sectionIds: string[],
): Record<string, FreeLayoutPosition> {
  const positions: Record<string, FreeLayoutPosition> = {};

  if (family === "modern") {
    place(positions, sectionIds, "header", 40, 32, 714, 140);
    place(positions, sectionIds, "summary", 40, 188, 714, 120);
    place(positions, sectionIds, "experience", 40, 324, 714, 280);
    place(positions, sectionIds, "education", 40, 620, 360, 120);
    place(positions, sectionIds, "projects", 416, 620, 338, 150);
    place(positions, sectionIds, "certifications", 40, 790, 714, 100);
    place(positions, sectionIds, "volunteer", 40, 906, 714, 100);
    place(positions, sectionIds, "languages", 40, 1022, 714, 80);
    place(positions, sectionIds, "skills", 40, 1122, 714, 110);
    return Object.fromEntries(sectionIds.map((id) => [id, positions[id]]));
  }

  if (family === "classic") {
    const centerX = 100;
    const width = 594;
    const order = [
      "header",
      "summary",
      "experience",
      "education",
      "projects",
      "skills",
      "certifications",
      "volunteer",
      "languages",
    ];
    let y = 40;
    const gap = 16;
    for (const id of order) {
      if (!sectionIds.includes(id)) continue;
      const height = defaultSectionHeight(id);
      place(positions, sectionIds, id, centerX, y, width, height);
      y += height + gap;
    }
    for (const id of sectionIds) {
      if (positions[id]) continue;
      const height = defaultSectionHeight(id);
      place(positions, sectionIds, id, centerX, y, width, height);
      y += height + gap;
    }
    return Object.fromEntries(sectionIds.map((id) => [id, positions[id]]));
  }

  // minimalist — 左側欄 4/12 + 右主欄 8/12
  const leftX = 40;
  const leftW = 248;
  const rightX = 304;
  const rightW = 450;
  stackSections(
    positions,
    sectionIds,
    ["header", "skills", "education", "certifications", "languages"],
    leftX,
    32,
    leftW,
  );
  stackSections(
    positions,
    sectionIds,
    ["summary", "experience", "projects", "volunteer"],
    rightX,
    32,
    rightW,
  );
  for (const id of sectionIds) {
    if (positions[id]) continue;
    place(positions, sectionIds, id, rightX, 32, rightW);
  }
  return Object.fromEntries(sectionIds.map((id) => [id, positions[id]]));
}

export type FamilyLayoutStorage = Partial<Record<TemplateFamily, Record<string, FreeLayoutPosition>>>;

export function readFamilyLayoutStorage(): FamilyLayoutStorage {
  try {
    const raw = localStorage.getItem(FREE_LAYOUT_BY_FAMILY_KEY);
    if (raw) return JSON.parse(raw) as FamilyLayoutStorage;
  } catch {
    /* ignore */
  }
  return {};
}

export function writeFamilyLayoutStorage(storage: FamilyLayoutStorage): void {
  try {
    localStorage.setItem(FREE_LAYOUT_BY_FAMILY_KEY, JSON.stringify(storage));
  } catch {
    /* ignore */
  }
}

export function getDefaultPresetForFamily(family: TemplateFamily): FreeLayoutPresetId {
  return family;
}

export type FreeLayoutPresetId =
  | "modern"
  | "classic"
  | "minimalist"
  | "two-column"
  | "magazine"
  | "compact";

export interface FreeLayoutPreset {
  id: FreeLayoutPresetId;
}

export const FREE_LAYOUT_PRESETS: FreeLayoutPreset[] = [
  { id: "modern" },
  { id: "classic" },
  { id: "minimalist" },
  { id: "two-column" },
  { id: "magazine" },
  { id: "compact" },
];

function place(
  positions: Record<string, FreeLayoutPosition>,
  sectionIds: string[],
  id: string,
  x: number,
  y: number,
  width: number,
  height?: number,
) {
  if (!sectionIds.includes(id)) return;
  positions[id] = normalizeFreeLayoutPosition(
    { x, y, width, height: height ?? defaultSectionHeight(id) },
    id,
  );
}

export function createFreeLayoutPresetPositions(
  presetId: FreeLayoutPresetId,
  sectionIds: string[],
): Record<string, FreeLayoutPosition> {
  if (presetId === "modern" || presetId === "classic" || presetId === "minimalist") {
    return createFamilyDefaultPositions(presetId, sectionIds);
  }

  const base = createFamilyDefaultPositions("modern", sectionIds);
  const positions: Record<string, FreeLayoutPosition> = { ...base };

  if (presetId === "two-column") {
    place(positions, sectionIds, "header", 40, 32, 714, 140);
    place(positions, sectionIds, "summary", 40, 188, 350, 120);
    place(positions, sectionIds, "experience", 410, 188, 344, 280);
    place(positions, sectionIds, "education", 40, 324, 350, 110);
    place(positions, sectionIds, "projects", 410, 484, 344, 150);
    place(positions, sectionIds, "skills", 40, 454, 350, 110);
    place(positions, sectionIds, "certifications", 410, 650, 344, 100);
    place(positions, sectionIds, "volunteer", 40, 580, 350, 100);
    place(positions, sectionIds, "languages", 410, 762, 344, 80);
    return Object.fromEntries(sectionIds.map((id) => [id, positions[id]]));
  }

  if (presetId === "magazine") {
    place(positions, sectionIds, "header", 32, 28, 730, 130);
    place(positions, sectionIds, "summary", 32, 172, 730, 110);
    place(positions, sectionIds, "experience", 400, 300, 362, 300);
    place(positions, sectionIds, "education", 32, 300, 350, 110);
    place(positions, sectionIds, "projects", 32, 430, 350, 150);
    place(positions, sectionIds, "skills", 32, 596, 350, 110);
    place(positions, sectionIds, "certifications", 400, 620, 362, 100);
    place(positions, sectionIds, "volunteer", 32, 726, 350, 100);
    place(positions, sectionIds, "languages", 400, 736, 362, 80);
    return Object.fromEntries(sectionIds.map((id) => [id, positions[id]]));
  }

  // compact — centered single column
  const centerX = 100;
  const width = 594;
  let y = 36;
  const gap = 14;
  for (const id of sectionIds) {
    const height = defaultSectionHeight(id);
    place(positions, sectionIds, id, centerX, y, width, height);
    y += height + gap;
  }

  return Object.fromEntries(sectionIds.map((id) => [id, positions[id]]));
}

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
  return merged;
}

export function estimateFreeLayoutCanvasHeight(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageCount = 1,
): number {
  if (pageCount > 1) {
    return computeMultiPageDeskHeight(pageCount);
  }
  let maxBottom: number = FREE_LAYOUT_CANVAS.minHeight;
  for (const id of sectionIds) {
    const pos = positions[id];
    if (!pos) continue;
    maxBottom = Math.max(maxBottom, pos.y + pos.height);
  }
  return maxBottom + 64;
}

function computeMultiPageDeskHeight(pageCount: number): number {
  const gap = 48;
  return pageCount * FREE_LAYOUT_CANVAS.minHeight + Math.max(0, pageCount - 1) * gap;
}

export const FREE_LAYOUT_CANVAS = {
  width: 794,
  minHeight: 1123,
} as const;
