/**
 * Layout Document Kernel
 * ─────────────────────
 * L0 geometry   → geometry.ts (794×1123, margins, spacing tokens)
 * L1 document   → buildLayoutDocument (draft + printPlan)
 * L2 engine     → canvasLayoutTools, layoutExportSurface (reflow / pagination)
 * L3 render     → ResumeSectionRenderer | ResumeA4FlowDocument | ResumeA4MinimalistDocument | ResumeMarginaliaDocument | ResumeEmbedded* | ResumeTemplateRenderer (router)
 * L4 export     → resumePdfExport (capture print surface only)
 *
 * Rules:
 * 1. Geometry constants live ONLY in geometry.ts (re-exported elsewhere).
 * 2. Print/export always uses printPlan from buildLayoutDocument.
 * 3. PDF capture prefers hidden export surface, not live studio transforms.
 * 4. Flow mode (template renderer) skips free-layout positions; print plan still applies when enabled.
 */

export * from "./geometry";
export * from "./types";
export { buildLayoutDocument, exportPositionsFromDocument, editorPositionsFromPrintPlan, editorPositionsFromDraftThroughPrintPlan } from "./buildLayoutDocument";
export { getLayoutGeometryCssVars, buildLayoutGeometryCssText, injectLayoutGeometryCss } from "./geometryCss";
export { RESUME_SECTION_IDS, isResumeSectionId, type ResumeSectionId } from "./sectionRegistry";
