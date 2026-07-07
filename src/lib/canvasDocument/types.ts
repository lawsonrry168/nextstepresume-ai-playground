import type {
  CanvasLayerDocument,
  CanvasPagesDocument,
  CanvasStudioUiState,
} from "../canvasStudioTypes";
import type { TemplateFamily } from "../resumeTemplateCatalog";

export const CANVAS_DOCUMENT_VERSION = 1 as const;

/** Aggregated canvas editing state — pages, layers, and studio UI per template family. */
export interface CanvasDocumentRecord {
  version: typeof CANVAS_DOCUMENT_VERSION;
  pages: CanvasPagesDocument;
  layers: CanvasLayerDocument;
  ui: CanvasStudioUiState;
}

export type CanvasDocumentStore = Partial<Record<TemplateFamily, CanvasDocumentRecord>>;
