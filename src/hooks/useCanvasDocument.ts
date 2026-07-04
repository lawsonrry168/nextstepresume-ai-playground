import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TemplateFamily } from "../lib/resumeTemplateCatalog";
import {
  CANVAS_PAGE_HEIGHT,
  CanvasLayerDocument,
  CanvasPage,
  CanvasPagesDocument,
  CANVAS_GRID_STRENGTH_DEFAULT,
  CanvasStudioUiState,
  clampGridStrength,
  createDefaultCanvasPage,
  createDefaultPagesDocument,
  layerZIndex,
  normalizeLayerDocument,
  normalizeNavSectionOrder,
  normalizePagesDocument,
  reorderLayerInPanel,
  type CanvasNavSectionId,
} from "../lib/canvasStudioTypes";
import { formatCanvasPageLabel } from "../lib/sectionLabels";
import { clampPositionToA4Page } from "../lib/canvasPageSnap";
import { FreeLayoutPosition, FreeLayoutSectionMeta } from "../lib/resumeFreeLayout";
import { NSR_STORAGE_KEYS } from "../lib/storageKeys";

type FamilyPagesStore = Partial<Record<TemplateFamily, CanvasPagesDocument>>;
type FamilyLayersStore = Partial<Record<TemplateFamily, CanvasLayerDocument>>;

function readPagesStore(): FamilyPagesStore {
  try {
    const raw = localStorage.getItem(NSR_STORAGE_KEYS.canvasPages);
    return raw ? (JSON.parse(raw) as FamilyPagesStore) : {};
  } catch {
    return {};
  }
}

function writePagesStore(store: FamilyPagesStore): void {
  try {
    localStorage.setItem(NSR_STORAGE_KEYS.canvasPages, JSON.stringify(store));
  } catch {
    // ignore
  }
}

function readLayersStore(): FamilyLayersStore {
  try {
    const raw = localStorage.getItem(NSR_STORAGE_KEYS.canvasLayers);
    return raw ? (JSON.parse(raw) as FamilyLayersStore) : {};
  } catch {
    return {};
  }
}

function writeLayersStore(store: FamilyLayersStore): void {
  try {
    localStorage.setItem(NSR_STORAGE_KEYS.canvasLayers, JSON.stringify(store));
  } catch {
    // ignore
  }
}

function readUiState(): CanvasStudioUiState {
  try {
    const raw = localStorage.getItem(NSR_STORAGE_KEYS.canvasStudioUi);
    if (!raw) {
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
}

function writeUiState(state: CanvasStudioUiState): void {
  try {
    localStorage.setItem(NSR_STORAGE_KEYS.canvasStudioUi, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function buildPagesFromReferencedIds(pageIds: string[]): CanvasPagesDocument {
  const pages = pageIds.map((id, index) => ({
    id,
    label: formatCanvasPageLabel(index + 1),
  }));
  return {
    pages,
    activePageId: pages[0]?.id ?? createDefaultPagesDocument().activePageId,
  };
}

export function syncPagesDocumentToPositions(
  current: CanvasPagesDocument,
  sectionIds: string[],
  positions: Record<string, FreeLayoutPosition>,
): CanvasPagesDocument {
  const referencedPageIds: string[] = [];
  for (const id of sectionIds) {
    const pageId = positions[id]?.pageId;
    if (pageId && !referencedPageIds.includes(pageId)) {
      referencedPageIds.push(pageId);
    }
  }

  if (!referencedPageIds.length) return current;

  const currentReferencedCount = current.pages.filter((page) => referencedPageIds.includes(page.id)).length;
  if (currentReferencedCount === 0) {
    return buildPagesFromReferencedIds(referencedPageIds);
  }

  let changed = false;
  const nextPages = [...current.pages];
  for (const pageId of referencedPageIds) {
    if (nextPages.some((page) => page.id === pageId)) continue;
    changed = true;
    nextPages.push({
      id: pageId,
      label: formatCanvasPageLabel(nextPages.length + 1),
    });
  }

  if (!changed) return current;
  const activePageId = nextPages.some((page) => page.id === current.activePageId)
    ? current.activePageId
    : nextPages[0]!.id;
  return {
    pages: nextPages,
    activePageId,
  };
}

export interface UseCanvasDocumentOptions {
  templateFamily: TemplateFamily;
  sections: FreeLayoutSectionMeta[];
  positions: Record<string, FreeLayoutPosition>;
  updatePosition: (id: string, pos: FreeLayoutPosition, options?: { skipSnap?: boolean; constrainA4?: boolean }) => void;
}

export function useCanvasDocument({
  templateFamily,
  sections,
  positions,
  updatePosition,
}: UseCanvasDocumentOptions) {
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  const [pagesDoc, setPagesDoc] = useState<CanvasPagesDocument>(() => {
    const store = readPagesStore();
    return normalizePagesDocument(store[templateFamily]);
  });

  const [layersDoc, setLayersDoc] = useState<CanvasLayerDocument>(() => {
    const store = readLayersStore();
    return normalizeLayerDocument(store[templateFamily], sectionIds);
  });

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [uiState, setUiState] = useState<CanvasStudioUiState>(readUiState);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedulePersist = useCallback((write: () => void) => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(write, 280);
  }, []);

  useEffect(
    () => () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    const store = readPagesStore();
    setPagesDoc(normalizePagesDocument(store[templateFamily]));
    const layerStore = readLayersStore();
    setLayersDoc(normalizeLayerDocument(layerStore[templateFamily], sectionIds));
    setSelectedSectionId(null);
  }, [templateFamily, sectionIds]);

  useEffect(() => {
    setLayersDoc((prev) => normalizeLayerDocument(prev, sectionIds));
  }, [sectionIds]);

  useEffect(() => {
    setPagesDoc((prev) => syncPagesDocumentToPositions(prev, sectionIds, positions));
  }, [positions, sectionIds]);

  useEffect(() => {
    schedulePersist(() => {
      const store = readPagesStore();
      store[templateFamily] = pagesDoc;
      writePagesStore(store);
    });
  }, [pagesDoc, templateFamily, schedulePersist]);

  useEffect(() => {
    schedulePersist(() => {
      const store = readLayersStore();
      store[templateFamily] = layersDoc;
      writeLayersStore(store);
    });
  }, [layersDoc, templateFamily, schedulePersist]);

  useEffect(() => {
    schedulePersist(() => writeUiState(uiState));
  }, [uiState, schedulePersist]);

  const getSectionPageId = useCallback(
    (sectionId: string): string => {
      const pos = positions[sectionId];
      if (pos?.pageId && pagesDoc.pages.some((p) => p.id === pos.pageId)) {
        return pos.pageId;
      }
      return pagesDoc.activePageId;
    },
    [pagesDoc.activePageId, pagesDoc.pages, positions],
  );

  const assignSectionToPage = useCallback(
    (sectionId: string, pageId: string) => {
      const pos = positions[sectionId];
      if (!pos) return;
      updatePosition(sectionId, clampPositionToA4Page({ ...pos, pageId }), { skipSnap: true, constrainA4: true });
    },
    [positions, updatePosition],
  );

  const setActivePageId = useCallback((pageId: string) => {
    setPagesDoc((prev) => (prev.pages.some((p) => p.id === pageId) ? { ...prev, activePageId: pageId } : prev));
  }, []);

  const addPage = useCallback(() => {
    setPagesDoc((prev) => {
      const nextPage = createDefaultCanvasPage(prev.pages.length + 1);
      return { pages: [...prev.pages, nextPage], activePageId: nextPage.id };
    });
  }, []);

  const removePage = useCallback(
    (pageId: string) => {
      setPagesDoc((prev) => {
        if (prev.pages.length <= 1) return prev;
        const fallback = prev.pages.find((p) => p.id !== pageId) ?? prev.pages[0];
        const nextPages = prev.pages.filter((p) => p.id !== pageId);
        for (const id of sectionIds) {
          const pos = positions[id];
          if (!pos) continue;
          const currentPage = pos.pageId ?? prev.activePageId;
          if (currentPage === pageId) {
            updatePosition(id, { ...pos, pageId: fallback.id });
          }
        }
        return {
          pages: nextPages,
          activePageId: prev.activePageId === pageId ? fallback.id : prev.activePageId,
        };
      });
    },
    [positions, sectionIds, updatePosition],
  );

  const renamePage = useCallback((pageId: string, label: string) => {
    setPagesDoc((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => (p.id === pageId ? { ...p, label: label.trim() || p.label } : p)),
    }));
  }, []);

  const goToNextPage = useCallback(() => {
    setPagesDoc((prev) => {
      const idx = prev.pages.findIndex((p) => p.id === prev.activePageId);
      const next = prev.pages[(idx + 1) % prev.pages.length];
      return next ? { ...prev, activePageId: next.id } : prev;
    });
  }, []);

  const goToPrevPage = useCallback(() => {
    setPagesDoc((prev) => {
      const idx = prev.pages.findIndex((p) => p.id === prev.activePageId);
      const nextIdx = (idx - 1 + prev.pages.length) % prev.pages.length;
      const next = prev.pages[nextIdx];
      return next ? { ...prev, activePageId: next.id } : prev;
    });
  }, []);

  const reorderLayer = useCallback((sectionId: string, direction: "up" | "down" | "front" | "back") => {
    setLayersDoc((prev) => {
      const order = [...prev.order];
      const idx = order.indexOf(sectionId);
      if (idx < 0) return prev;

      if (direction === "front") {
        order.splice(idx, 1);
        order.push(sectionId);
      } else if (direction === "back") {
        order.splice(idx, 1);
        order.unshift(sectionId);
      } else if (direction === "up" && idx < order.length - 1) {
        [order[idx], order[idx + 1]] = [order[idx + 1], order[idx]];
      } else if (direction === "down" && idx > 0) {
        [order[idx], order[idx - 1]] = [order[idx - 1], order[idx]];
      } else {
        return prev;
      }
      return { ...prev, order };
    });
  }, []);

  const reorderLayerRelative = useCallback(
    (draggedId: string, targetId: string, place: "before" | "after") => {
      setLayersDoc((prev) => ({
        ...prev,
        order: reorderLayerInPanel(prev.order, draggedId, targetId, place),
      }));
    },
    [],
  );

  const toggleHidden = useCallback((sectionId: string) => {
    setLayersDoc((prev) => ({
      ...prev,
      hidden: { ...prev.hidden, [sectionId]: !prev.hidden[sectionId] },
    }));
  }, []);

  const toggleLocked = useCallback((sectionId: string) => {
    setLayersDoc((prev) => ({
      ...prev,
      locked: { ...prev.locked, [sectionId]: !prev.locked[sectionId] },
    }));
  }, []);

  const selectAdjacentLayer = useCallback(
    (direction: "up" | "down") => {
      const visibleOrder = layersDoc.order.filter((id) => !layersDoc.hidden[id]);
      if (!visibleOrder.length) return;
      const currentIdx = selectedSectionId ? visibleOrder.indexOf(selectedSectionId) : -1;
      let nextIdx: number;
      if (direction === "up") {
        nextIdx = currentIdx < 0 ? visibleOrder.length - 1 : Math.max(0, currentIdx - 1);
      } else {
        nextIdx = currentIdx < 0 ? 0 : Math.min(visibleOrder.length - 1, currentIdx + 1);
      }
      setSelectedSectionId(visibleOrder[nextIdx] ?? null);
    },
    [layersDoc.hidden, layersDoc.order, selectedSectionId],
  );

  const getZIndex = useCallback(
    (sectionId: string) => layerZIndex(sectionId, layersDoc.order),
    [layersDoc.order],
  );

  const toggleLayerPanel = useCallback(() => {
    setUiState((prev) => ({ ...prev, layerPanelOpen: !prev.layerPanelOpen }));
  }, []);

  const toggleRightNav = useCallback(() => {
    setUiState((prev) => ({ ...prev, rightNavOpen: !prev.rightNavOpen }));
  }, []);

  const dismissShortcutsHint = useCallback(() => {
    setUiState((prev) => ({ ...prev, shortcutsDismissed: true }));
  }, []);

  const toggleShowGrid = useCallback(() => {
    setUiState((prev) => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);

  const toggleShowMargins = useCallback(() => {
    setUiState((prev) => ({ ...prev, showMargins: !prev.showMargins }));
  }, []);

  const setGridStrength = useCallback((strength: number) => {
    setUiState((prev) => ({ ...prev, gridStrength: clampGridStrength(strength) }));
  }, []);

  const setNavSectionOrder = useCallback((order: CanvasNavSectionId[]) => {
    setUiState((prev) => ({ ...prev, navSectionOrder: normalizeNavSectionOrder(order) }));
  }, []);

  const showAllLayers = useCallback(() => {
    setLayersDoc((prev) => ({ ...prev, hidden: {} }));
  }, []);

  const unlockAllLayers = useCallback(() => {
    setLayersDoc((prev) => ({ ...prev, locked: {} }));
  }, []);

  const removeActivePage = useCallback(() => {
    removePage(pagesDoc.activePageId);
  }, [pagesDoc.activePageId, removePage]);

  const duplicateActivePage = useCallback(() => {
    setPagesDoc((prev) => {
      const active = prev.pages.find((p) => p.id === prev.activePageId);
      const newPage = createDefaultCanvasPage(prev.pages.length + 1);
      newPage.label = `${active?.label ?? "第 1 頁"} 副本`;
      return { pages: [...prev.pages, newPage], activePageId: newPage.id };
    });
  }, []);

  const sectionPageMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const id of sectionIds) {
      map[id] = getSectionPageId(id);
    }
    return map;
  }, [getSectionPageId, sectionIds]);

  const layersForPanel = useMemo(() => {
    return [...layersDoc.order]
      .reverse()
      .map((id) => sections.find((s) => s.id === id))
      .filter((s): s is FreeLayoutSectionMeta => Boolean(s));
  }, [layersDoc.order, sections]);

  return {
    pages: pagesDoc.pages,
    activePageId: pagesDoc.activePageId,
    setActivePageId,
    addPage,
    removePage,
    renamePage,
    goToNextPage,
    goToPrevPage,
    layers: layersDoc,
    layersForPanel,
    selectedSectionId,
    setSelectedSectionId,
    getSectionPageId,
    sectionPageMap,
    assignSectionToPage,
    reorderLayer,
    reorderLayerRelative,
    toggleHidden,
    toggleLocked,
    selectAdjacentLayer,
    getZIndex,
    layerPanelOpen: uiState.layerPanelOpen,
    toggleLayerPanel,
    rightNavOpen: uiState.rightNavOpen,
    toggleRightNav,
    shortcutsOpen,
    setShortcutsOpen,
    shortcutsDismissed: uiState.shortcutsDismissed,
    dismissShortcutsHint,
    showGrid: uiState.showGrid,
    toggleShowGrid,
    gridStrength: uiState.gridStrength,
    setGridStrength,
    navSectionOrder: uiState.navSectionOrder,
    setNavSectionOrder,
    showMargins: uiState.showMargins,
    toggleShowMargins,
    showAllLayers,
    unlockAllLayers,
    removeActivePage,
    duplicateActivePage,
  };
}
