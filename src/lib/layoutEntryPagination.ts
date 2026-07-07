import type { ResumeData } from "../types";
import type { FreeLayoutPosition } from "./resumeFreeLayout";
import {
  clampSectionHeight,
  snapToGrid,
  SNAP_GRID_SIZE,
} from "./resumeFreeLayout";
import {
  estimateBlockLines,
  estimateCharsPerLine,
  SECTION_CONTENT_PADDING,
} from "./canvasSectionContentSizing";
import { CANVAS_PAGE_HEIGHT } from "./canvasStudioTypes";
import { CANVAS_PAGE_MARGIN } from "./canvasAlignTools";
import { sectionOverflowsPrintPage } from "./layoutExportSurface";

const EXPORT_PAGE_PREFIX = "export-page-";

function createContinuationPageId(existingPageIds: string[]): string {
  let index = existingPageIds.length;
  let candidate = `${EXPORT_PAGE_PREFIX}${index + 1}`;
  while (existingPageIds.includes(candidate)) {
    index += 1;
    candidate = `${EXPORT_PAGE_PREFIX}${index + 1}`;
  }
  return candidate;
}

export const SECTION_FRAGMENT_SEP = "@f";

const LINE_HEIGHT = 22;
const SECTION_HEADING_LINES = 2;

export type SplittableSectionId = "experience" | "education" | "projects";

export const SPLITTABLE_SECTION_IDS: readonly SplittableSectionId[] = [
  "experience",
  "education",
  "projects",
];

export interface ExperienceEntrySlice {
  entryId: string;
  bulletStart: number;
  bulletEnd: number;
  showEntryHeader: boolean;
}

export interface EducationEntrySlice {
  entryId: string;
}

export interface ProjectEntrySlice {
  entryId: string;
  showEntryHeader: boolean;
}

/** Describes a subset of section content rendered in one print fragment. */
export interface SectionContentSlice {
  baseSectionId: string;
  fragmentIndex: number;
  showHeading: boolean;
  continued?: boolean;
  experience?: ExperienceEntrySlice[];
  education?: EducationEntrySlice[];
  projects?: ProjectEntrySlice[];
}

export interface EntryFragmentPosition {
  fragmentId: string;
  position: FreeLayoutPosition;
  slice: SectionContentSlice;
}

export function isSectionFragmentId(sectionId: string): boolean {
  return sectionId.includes(SECTION_FRAGMENT_SEP);
}

export function baseSectionIdFromFragment(fragmentId: string): string {
  return fragmentId.split(SECTION_FRAGMENT_SEP)[0] ?? fragmentId;
}

export function makeFragmentId(baseSectionId: string, fragmentIndex: number): string {
  return `${baseSectionId}${SECTION_FRAGMENT_SEP}${fragmentIndex}`;
}

function contentWidth(width: number): number {
  return Math.max(120, width - SECTION_CONTENT_PADDING * 2);
}

function linesToHeight(lines: number): number {
  return snapToGrid(SECTION_CONTENT_PADDING + lines * LINE_HEIGHT, SNAP_GRID_SIZE);
}

function estimateExperienceEntryLines(
  exp: ResumeData["experience"][number],
  bulletStart: number,
  bulletEnd: number,
  showHeader: boolean,
  width: number,
  themeFontScale: number,
): number {
  const charsPerLine = estimateCharsPerLine(width);
  const w = contentWidth(width);
  const bullets = exp.bullets.slice(bulletStart, bulletEnd);
  let lines = showHeader
    ? estimateBlockLines(
        [
          `${exp.role} at ${exp.company}`,
          `${exp.startDate} – ${exp.endDate}${exp.location ? ` · ${exp.location}` : ""}`,
        ],
        charsPerLine,
        0,
        w,
      )
    : 0;
  if (bullets.length > 0) {
    lines += estimateBlockLines(bullets, charsPerLine, 1, w);
  }
  if (themeFontScale !== 1) {
    lines = Math.ceil(lines * themeFontScale);
  }
  return Math.max(lines, 1);
}

function estimateEducationEntryLines(
  edu: ResumeData["education"][number],
  width: number,
  themeFontScale: number,
): number {
  const charsPerLine = estimateCharsPerLine(width);
  const w = contentWidth(width);
  let lines = estimateBlockLines(
    [edu.degree, `${edu.institution} · ${edu.gradDate}${edu.field ? ` · ${edu.field}` : ""}`],
    charsPerLine,
    0,
    w,
  );
  if (themeFontScale !== 1) {
    lines = Math.ceil(lines * themeFontScale);
  }
  return Math.max(lines, 1);
}

function estimateProjectEntryLines(
  project: ResumeData["projects"][number],
  width: number,
  themeFontScale: number,
): number {
  const charsPerLine = estimateCharsPerLine(width);
  const w = contentWidth(width);
  let lines = estimateBlockLines(
    [project.name, project.description, project.techStack ? `Tech: ${project.techStack}` : ""].filter(Boolean),
    charsPerLine,
    1,
    w,
  );
  if (themeFontScale !== 1) {
    lines = Math.ceil(lines * themeFontScale);
  }
  return Math.max(lines, 1);
}

interface FragmentBuilder {
  slices: ExperienceEntrySlice[];
  lines: number;
  showHeading: boolean;
  pageIndex: number;
  y: number;
}

function splitExperienceSection(
  baseSectionId: string,
  pos: FreeLayoutPosition,
  data: ResumeData,
  themeFontScale: number,
  continuationPageIds: string[],
): EntryFragmentPosition[] {
  const maxBottom = CANVAS_PAGE_HEIGHT - CANVAS_PAGE_MARGIN;
  const fragments: EntryFragmentPosition[] = [];
  let fragmentIndex = 0;
  let pageIndex = 0;
  let y = pos.y;

  const pageIdFor = (index: number) =>
    index === 0 ? pos.pageId ?? continuationPageIds[0]! : continuationPageIds[index] ?? continuationPageIds[continuationPageIds.length - 1]!;

  const available = () => maxBottom - y;
  const availableLines = () => Math.max(1, Math.floor(available() / LINE_HEIGHT));

  let builder: FragmentBuilder = {
    slices: [],
    lines: SECTION_HEADING_LINES,
    showHeading: true,
    pageIndex,
    y,
  };

  const flush = () => {
    if (!builder.slices.length) return;
    const fragmentId = makeFragmentId(baseSectionId, fragmentIndex++);
    fragments.push({
      fragmentId,
      position: {
        ...pos,
        pageId: pageIdFor(builder.pageIndex),
        y: builder.y,
        height: clampSectionHeight(linesToHeight(builder.lines)),
      },
      slice: {
        baseSectionId,
        fragmentIndex: fragmentIndex - 1,
        showHeading: builder.showHeading,
        continued: !builder.showHeading,
        experience: [...builder.slices],
      },
    });
    pageIndex += 1;
    y = CANVAS_PAGE_MARGIN;
    builder = {
      slices: [],
      lines: 0,
      showHeading: false,
      pageIndex,
      y,
    };
  };

  for (const exp of data.experience) {
    let bulletStart = 0;
    while (bulletStart <= exp.bullets.length) {
      const showEntryHeader = bulletStart === 0;
      let bulletEnd = bulletStart === exp.bullets.length ? bulletStart : bulletStart + 1;
      let chunkLines = estimateExperienceEntryLines(
        exp,
        bulletStart,
        bulletEnd,
        showEntryHeader,
        pos.width,
        themeFontScale,
      );

      while (bulletEnd < exp.bullets.length) {
        const tryLines = estimateExperienceEntryLines(
          exp,
          bulletStart,
          bulletEnd + 1,
          showEntryHeader,
          pos.width,
          themeFontScale,
        );
        if (builder.lines + tryLines > availableLines()) break;
        bulletEnd += 1;
        chunkLines = tryLines;
      }

      if (builder.lines + chunkLines > availableLines() && builder.slices.length > 0) {
        flush();
      }

      if (bulletStart >= exp.bullets.length) {
        if (showEntryHeader) {
          const headerOnlyLines = estimateExperienceEntryLines(exp, 0, 0, true, pos.width, themeFontScale);
          if (builder.lines + headerOnlyLines > availableLines() && builder.slices.length > 0) {
            flush();
          }
          builder.slices.push({
            entryId: exp.id,
            bulletStart: 0,
            bulletEnd: 0,
            showEntryHeader: true,
          });
          builder.lines += headerOnlyLines;
        }
        break;
      }

      builder.slices.push({
        entryId: exp.id,
        bulletStart,
        bulletEnd,
        showEntryHeader,
      });
      builder.lines += chunkLines;
      bulletStart = bulletEnd;
    }
  }

  if (builder.slices.length) {
    flush();
  }

  return fragments.length > 1 ? fragments : [];
}

function splitEducationSection(
  baseSectionId: string,
  pos: FreeLayoutPosition,
  data: ResumeData,
  themeFontScale: number,
  continuationPageIds: string[],
): EntryFragmentPosition[] {
  const maxBottom = CANVAS_PAGE_HEIGHT - CANVAS_PAGE_MARGIN;
  const fragments: EntryFragmentPosition[] = [];
  let fragmentIndex = 0;
  let pageIndex = 0;
  let y = pos.y;
  let showHeading = true;
  let currentEntries: EducationEntrySlice[] = [];
  let currentLines = SECTION_HEADING_LINES;

  const pageIdFor = (index: number) =>
    index === 0 ? pos.pageId ?? continuationPageIds[0]! : continuationPageIds[index] ?? continuationPageIds[continuationPageIds.length - 1]!;

  const available = () => maxBottom - y;
  const availableLines = () => Math.max(1, Math.floor(available() / LINE_HEIGHT));

  const flush = () => {
    if (!currentEntries.length) return;
    const fragmentId = makeFragmentId(baseSectionId, fragmentIndex++);
    fragments.push({
      fragmentId,
      position: {
        ...pos,
        pageId: pageIdFor(pageIndex),
        y,
        height: clampSectionHeight(linesToHeight(currentLines)),
      },
      slice: {
        baseSectionId,
        fragmentIndex: fragmentIndex - 1,
        showHeading,
        continued: !showHeading,
        education: [...currentEntries],
      },
    });
    showHeading = false;
    pageIndex += 1;
    y = CANVAS_PAGE_MARGIN;
    currentEntries = [];
    currentLines = 0;
  };

  for (const edu of data.education) {
    const entryLines = estimateEducationEntryLines(edu, pos.width, themeFontScale);
    if (currentLines + entryLines > availableLines() && currentEntries.length > 0) {
      flush();
    }
    currentEntries.push({ entryId: edu.id });
    currentLines += entryLines;
  }

  if (currentEntries.length) {
    flush();
  }

  return fragments.length > 1 ? fragments : [];
}

function splitProjectsSection(
  baseSectionId: string,
  pos: FreeLayoutPosition,
  data: ResumeData,
  themeFontScale: number,
  continuationPageIds: string[],
): EntryFragmentPosition[] {
  const maxBottom = CANVAS_PAGE_HEIGHT - CANVAS_PAGE_MARGIN;
  const fragments: EntryFragmentPosition[] = [];
  let fragmentIndex = 0;
  let pageIndex = 0;
  let y = pos.y;
  let showHeading = true;
  let currentEntries: ProjectEntrySlice[] = [];
  let currentLines = SECTION_HEADING_LINES;

  const pageIdFor = (index: number) =>
    index === 0 ? pos.pageId ?? continuationPageIds[0]! : continuationPageIds[index] ?? continuationPageIds[continuationPageIds.length - 1]!;

  const available = () => maxBottom - y;
  const availableLines = () => Math.max(1, Math.floor(available() / LINE_HEIGHT));

  const flush = () => {
    if (!currentEntries.length) return;
    const fragmentId = makeFragmentId(baseSectionId, fragmentIndex++);
    fragments.push({
      fragmentId,
      position: {
        ...pos,
        pageId: pageIdFor(pageIndex),
        y,
        height: clampSectionHeight(linesToHeight(currentLines)),
      },
      slice: {
        baseSectionId,
        fragmentIndex: fragmentIndex - 1,
        showHeading,
        continued: !showHeading,
        projects: [...currentEntries],
      },
    });
    showHeading = false;
    pageIndex += 1;
    y = CANVAS_PAGE_MARGIN;
    currentEntries = [];
    currentLines = 0;
  };

  for (const project of data.projects) {
    const entryLines = estimateProjectEntryLines(project, pos.width, themeFontScale);
    if (currentLines + entryLines > availableLines() && currentEntries.length > 0) {
      flush();
    }
    currentEntries.push({ entryId: project.id, showEntryHeader: true });
    currentLines += entryLines;
  }

  if (currentEntries.length) {
    flush();
  }

  return fragments.length > 1 ? fragments : [];
}

export function shouldSplitSectionAtEntryLevel(
  sectionId: string,
  pos: FreeLayoutPosition,
  resumeData: ResumeData,
): boolean {
  if (!SPLITTABLE_SECTION_IDS.includes(sectionId as SplittableSectionId)) return false;
  if (!sectionOverflowsPrintPage(pos)) return false;
  if (sectionId === "experience") return resumeData.experience.length > 0;
  if (sectionId === "education") return resumeData.education.length > 0;
  if (sectionId === "projects") return resumeData.projects.length > 0;
  return false;
}

export function splitSectionIntoEntryFragments(
  sectionId: string,
  pos: FreeLayoutPosition,
  resumeData: ResumeData,
  themeFontScale = 1,
  continuationPageIds: string[] = [],
): EntryFragmentPosition[] {
  const pageIds = pos.pageId ? [pos.pageId, ...continuationPageIds] : continuationPageIds;
  if (sectionId === "experience") return splitExperienceSection(sectionId, pos, resumeData, themeFontScale, pageIds);
  if (sectionId === "education") return splitEducationSection(sectionId, pos, resumeData, themeFontScale, pageIds);
  if (sectionId === "projects") return splitProjectsSection(sectionId, pos, resumeData, themeFontScale, pageIds);
  return [];
}

export interface EntryPaginationResult {
  positions: Record<string, FreeLayoutPosition>;
  sectionSlices: Record<string, SectionContentSlice>;
  pageIds: string[];
}

/** Replace overflowing splittable sections with entry-level fragments in a print plan. */
export function applyEntryLevelPagination(
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  pageIds: string[],
  resumeData: ResumeData,
  options?: { themeFontScale?: number; enabled?: boolean },
): EntryPaginationResult {
  if (options?.enabled === false) {
    return { positions, sectionSlices: {}, pageIds };
  }

  const themeFontScale = options?.themeFontScale ?? 1;
  const next: Record<string, FreeLayoutPosition> = { ...positions };
  const sectionSlices: Record<string, SectionContentSlice> = {};
  let workingPageIds = [...pageIds];

  for (const sectionId of sectionIds) {
    const pos = next[sectionId];
    if (!pos || isSectionFragmentId(sectionId)) continue;
    if (!shouldSplitSectionAtEntryLevel(sectionId, pos, resumeData)) continue;

    const startPageIndex = Math.max(0, workingPageIds.indexOf(pos.pageId ?? workingPageIds[0]!));
    const continuationPageIds = workingPageIds.slice(startPageIndex + 1);
    let fragments = splitSectionIntoEntryFragments(sectionId, pos, resumeData, themeFontScale, continuationPageIds);
    if (fragments.length <= 1) continue;

    const extendedPageIds = [...workingPageIds];
    for (let i = 1; i < fragments.length; i++) {
      const targetIndex = startPageIndex + i;
      while (extendedPageIds.length <= targetIndex) {
        extendedPageIds.push(createContinuationPageId(extendedPageIds));
      }
    }

    fragments = fragments.map((frag, index) => {
      const pageId = extendedPageIds[startPageIndex + index]!;
      return {
        ...frag,
        position: {
          ...frag.position,
          pageId,
          y: index === 0 ? frag.position.y : CANVAS_PAGE_MARGIN,
        },
      };
    });

    delete next[sectionId];
    for (const frag of fragments) {
      next[frag.fragmentId] = frag.position;
      sectionSlices[frag.fragmentId] = frag.slice;
    }
    workingPageIds = extendedPageIds;
  }

  return { positions: next, sectionSlices, pageIds: workingPageIds };
}

/**
 * Ordered list of export section ids (base sections + entry-split fragments),
 * sorted by layer stacking order so paint order matches the studio. Fragments
 * inherit their base section's rank and are kept in ascending fragment index.
 */
export function exportSectionsFromPrintPlan(
  baseSectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
  layerOrder?: string[],
): string[] {
  const order = layerOrder && layerOrder.length ? layerOrder : baseSectionIds;
  const rank = new Map<string, number>();
  order.forEach((id, index) => rank.set(id, index));

  const rankOf = (id: string): number => {
    const r = rank.get(baseSectionIdFromFragment(id));
    return r === undefined ? Number.MAX_SAFE_INTEGER : r;
  };
  const fragmentIndexOf = (id: string): number => {
    const parts = id.split(SECTION_FRAGMENT_SEP);
    return parts.length > 1 ? Number(parts[1]) || 0 : -1;
  };

  return Object.keys(positions)
    .filter((id) => Boolean(positions[id]))
    .sort((a, b) => {
      const ra = rankOf(a);
      const rb = rankOf(b);
      if (ra !== rb) return ra - rb;
      return fragmentIndexOf(a) - fragmentIndexOf(b);
    });
}
