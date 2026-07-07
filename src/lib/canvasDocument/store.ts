import {
  CANVAS_GRID_STRENGTH_DEFAULT,
  CanvasLayerDocument,
  CanvasPagesDocument,
  CanvasStudioUiState,
  clampGridStrength,
  createDefaultPagesDocument,
  normalizeLayerDocument,
  normalizeNavSectionOrder,
  normalizePagesDocument,
} from "../canvasStudioTypes";
import { NSR_STORAGE_KEYS } from "../storageKeys";
import type { TemplateFamily } from "../resumeTemplateCatalog";
import {
  CANVAS_DOCUMENT_VERSION,
  type CanvasDocumentRecord,
  type CanvasDocumentStore,
} from "./types";

const STORAGE_KEY = "nsr_canvas_document_v1";

function defaultUiState(): CanvasStudioUiState {
  return {
    layerPanelOpen: false,
    rightNavOpen: true,
    shortcutsDismissed: false,
    showGrid: true,
    showMargins: false,
    gridStrength: CANVAS_GRID_STRENGTH_DEFAULT,
    navSectionOrder: normalizeNavSectionOrder(undefined),
  };
}

function readLegacyPages(): Partial<Record<TemplateFamily, CanvasPagesDocument>> {
  try {
    const raw = localStorage.getItem(NSR_STORAGE_KEYS.canvasPages);
    return raw ? (JSON.parse(raw) as Partial<Record<TemplateFamily, CanvasPagesDocument>>) : {};
  } catch {
    return {};
  }
}

function readLegacyLayers(): Partial<Record<TemplateFamily, CanvasLayerDocument>> {
  try {
    const raw = localStorage.getItem(NSR_STORAGE_KEYS.canvasLayers);
    return raw ? (JSON.parse(raw) as Partial<Record<TemplateFamily, CanvasLayerDocument>>) : {};
  } catch {
    return {};
  }
}

function readLegacyUi(): CanvasStudioUiState {
  try {
    const raw = localStorage.getItem(NSR_STORAGE_KEYS.canvasStudioUi);
    if (!raw) return defaultUiState();
    const parsed = JSON.parse(raw) as Partial<CanvasStudioUiState>;
    return {
      layerPanelOpen: parsed.layerPanelOpen ?? false,
      rightNavOpen: parsed.rightNavOpen ?? true,
      shortcutsDismissed: parsed.shortcutsDismissed ?? false,
      showGrid: parsed.showGrid ?? true,
      showMargins: parsed.showMargins ?? false,
      gridStrength: clampGridStrength(parsed.gridStrength),
      navSectionOrder: normalizeNavSectionOrder(parsed.navSectionOrder),
    };
  } catch {
    return defaultUiState();
  }
}

function migrateFromLegacyStore(): CanvasDocumentStore {
  const pages = readLegacyPages();
  const layers = readLegacyLayers();
  const ui = readLegacyUi();
  const families = new Set<TemplateFamily>([
    ...(Object.keys(pages) as TemplateFamily[]),
    ...(Object.keys(layers) as TemplateFamily[]),
  ]);
  const store: CanvasDocumentStore = {};
  for (const family of families) {
    store[family] = {
      version: CANVAS_DOCUMENT_VERSION,
      pages: normalizePagesDocument(pages[family]),
      layers: normalizeLayerDocument(layers[family], []),
      ui,
    };
  }
  return store;
}

function readStore(): CanvasDocumentStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as CanvasDocumentStore;
    }
  } catch {
    // fall through to migration
  }
  const migrated = migrateFromLegacyStore();
  if (Object.keys(migrated).length > 0) {
    writeStore(migrated);
  }
  return migrated;
}

function writeStore(store: CanvasDocumentStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

export function loadCanvasDocument(
  family: TemplateFamily,
  sectionIds: string[],
): CanvasDocumentRecord {
  const store = readStore();
  const existing = store[family];
  if (existing) {
    return {
      version: CANVAS_DOCUMENT_VERSION,
      pages: normalizePagesDocument(existing.pages),
      layers: normalizeLayerDocument(existing.layers, sectionIds),
      ui: existing.ui ?? defaultUiState(),
    };
  }
  return {
    version: CANVAS_DOCUMENT_VERSION,
    pages: createDefaultPagesDocument(),
    layers: normalizeLayerDocument(undefined, sectionIds),
    ui: defaultUiState(),
  };
}

export function saveCanvasDocument(
  family: TemplateFamily,
  patch: Partial<Pick<CanvasDocumentRecord, "pages" | "layers" | "ui">>,
): void {
  const store = readStore();
  const current = store[family] ?? {
    version: CANVAS_DOCUMENT_VERSION,
    pages: createDefaultPagesDocument(),
    layers: normalizeLayerDocument(undefined, []),
    ui: defaultUiState(),
  };
  store[family] = {
    ...current,
    ...patch,
    version: CANVAS_DOCUMENT_VERSION,
  };
  writeStore(store);
}

/** Test hook — reset unified store */
export function __resetCanvasDocumentStoreForTests(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
