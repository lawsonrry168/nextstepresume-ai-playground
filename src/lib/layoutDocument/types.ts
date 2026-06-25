import type { ResumeData } from "../../types";
import type { FreeLayoutPosition } from "../resumeFreeLayout";
import type { PrintExportPlan } from "../layoutExportSurface";

/** How the user edits the resume in the playground */
export type LayoutEditMode = "flow" | "free";

/**
 * Layout Document — single logical model for one resume + template family.
 * Draft placements (editor) and print plan (export) are derived from the same pipeline.
 */
export interface LayoutDocument {
  sectionIds: string[];
  /** Live editor placements (studio drag positions) */
  draftPositions: Record<string, FreeLayoutPosition>;
  /** Print-ready placements after content-fit + pagination */
  printPlan: PrintExportPlan;
  editMode: LayoutEditMode;
  resumeData: ResumeData;
}

export interface BuildLayoutDocumentInput {
  sectionIds: string[];
  draftPositions: Record<string, FreeLayoutPosition>;
  resumeData: ResumeData;
  freeLayoutEnabled: boolean;
  manualSizedSections?: ReadonlySet<string>;
  layerOrder?: string[];
  themeFontScale?: number;
  studioPages?: Array<{ id: string }>;
  studioSectionPageMap?: Record<string, string>;
}
