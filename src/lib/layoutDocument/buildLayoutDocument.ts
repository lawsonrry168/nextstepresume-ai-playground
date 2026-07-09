import { buildPrintReadyExportLayout, type PrintExportPlan } from "../layoutExportSurface";
import { makeFragmentId } from "../layoutEntryPagination";
import type { FreeLayoutPosition } from "../resumeFreeLayout";
import type { BuildLayoutDocumentInput, LayoutDocument } from "./types";

/**
 * Build a Layout Document: draft positions + derived print plan.
 * Export surface, PDF capture, and print preview MUST use `printPlan`.
 */
export function buildLayoutDocument(input: BuildLayoutDocumentInput): LayoutDocument {
  const {
    sectionIds,
    draftPositions,
    resumeData,
    freeLayoutEnabled,
    manualSizedSections,
    layerOrder,
    themeFontScale,
    templateStyle,
    studioPages,
    studioSectionPageMap,
  } = input;

  const printPlan = buildPrintReadyExportLayout(sectionIds, draftPositions, resumeData, {
    manualSizedSections,
    layerOrder,
    themeFontScale,
    templateStyle,
    studioPages,
    studioSectionPageMap,
    preservePlacements: freeLayoutEnabled,
  });

  return {
    sectionIds,
    draftPositions,
    printPlan,
    editMode: freeLayoutEnabled ? "free" : "flow",
    resumeData,
  };
}

/** Positions for hidden print surface — always print plan, never live editor drift */
export function exportPositionsFromDocument(doc: LayoutDocument): Record<string, FreeLayoutPosition> {
  return doc.printPlan.positions;
}

/** Map print-plan positions to editor placements (preset apply, export → studio sync). */
export function editorPositionsFromPrintPlan(
  sectionIds: string[],
  printPlan: PrintExportPlan,
): Record<string, FreeLayoutPosition> {
  const patches: Record<string, FreeLayoutPosition> = {};
  const multiPage = printPlan.pageIds.length > 1;
  const primaryPageId = printPlan.pageIds[0];

  const resolvePlacement = (pos: FreeLayoutPosition): FreeLayoutPosition => {
    const { pageId, ...rest } = pos;
    return {
      ...rest,
      ...(multiPage && pageId ? { pageId } : primaryPageId ? { pageId: primaryPageId } : {}),
    };
  };

  for (const id of sectionIds) {
    let pos = printPlan.positions[id];
    if (!pos) {
      // The section may have been entry-split into fragments (base id removed
      // from the plan). Collapse the base editor placement onto its first
      // fragment so auto-tidy / smart layout still reposition the section.
      const firstFragment = printPlan.positions[makeFragmentId(id, 0)];
      if (!firstFragment) continue;
      pos = firstFragment;
    }
    patches[id] = resolvePlacement(pos);
  }

  return patches;
}

export interface EditorPositionsFromDraftOptions extends BuildLayoutDocumentInput {
  clampPosition?: (pos: FreeLayoutPosition) => FreeLayoutPosition;
}

/** Draft → print plan → editor positions (presets, family reset, WYSIWYG studio sync). */
export function editorPositionsFromDraftThroughPrintPlan(
  options: EditorPositionsFromDraftOptions,
): Record<string, FreeLayoutPosition> {
  const { clampPosition, ...buildInput } = options;
  const doc = buildLayoutDocument(buildInput);
  const patches = editorPositionsFromPrintPlan(buildInput.sectionIds, doc.printPlan);
  if (!clampPosition) return patches;
  return Object.fromEntries(
    Object.entries(patches).map(([id, pos]) => [id, clampPosition(pos)]),
  );
}
