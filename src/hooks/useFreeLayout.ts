import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ResumeData } from "../types";
import { TemplateFamily } from "../lib/resumeTemplateCatalog";
import {
  FREE_LAYOUT_ENABLED_KEY,
  FREE_LAYOUT_SNAP_KEY,
  FREE_LAYOUT_LIVE_PREVIEW_KEY,
  FreeLayoutPosition,
  FreeLayoutSectionMeta,
  applyMagneticSnap,
  buildFreeLayoutSections,
  FREE_LAYOUT_CANVAS,
  FreeLayoutPresetId,
  readFamilyLayoutStorage,
  writeFamilyLayoutStorage,
} from "../lib/resumeFreeLayout";
import {
  mergeFreeLayoutPositions,
  createFamilyDefaultPositions,
  createFreeLayoutPresetPositions,
} from "../lib/layoutPresets";
import { CANVAS_PAGE_HEIGHT } from "../lib/canvasStudioTypes";
import { clampPositionToA4Page } from "../lib/canvasPageSnap";
import { CANVAS_PAGE_MARGIN } from "../lib/canvasAlignTools";
import { emitLayoutPositions, registerLayoutUndoBridge } from "../lib/undoRegistry";

function readBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === "true";
  } catch {
    return fallback;
  }
}

function loadPositionsForFamily(
  family: TemplateFamily,
  sectionIds: string[],
  resumeData: ResumeData,
): Record<string, FreeLayoutPosition> {
  const storage = readFamilyLayoutStorage();
  return mergeFreeLayoutPositions(storage[family] ?? null, sectionIds, family, resumeData);
}

export function useFreeLayout(
  resumeData: ResumeData,
  templateFamily: TemplateFamily,
  extraSections?: FreeLayoutSectionMeta[],
) {
  const sections = useMemo(
    () => [...buildFreeLayoutSections(resumeData), ...(extraSections ?? [])],
    [resumeData, extraSections],
  );
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);
  const familyRef = useRef(templateFamily);

  const [enabled, setEnabledState] = useState(() => readBool(FREE_LAYOUT_ENABLED_KEY, false));
  const [snapEnabled, setSnapEnabledState] = useState(() => readBool(FREE_LAYOUT_SNAP_KEY, true));
  const [livePreview, setLivePreviewState] = useState(() => readBool(FREE_LAYOUT_LIVE_PREVIEW_KEY, true));
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const skipNextPersistFlash = useRef(true);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markSaved = useCallback(() => {
    setLastSavedAt(Date.now());
  }, []);

  const [positions, setPositions] = useState<Record<string, FreeLayoutPosition>>(() =>
    loadPositionsForFamily(templateFamily, sectionIds, resumeData),
  );

  useEffect(() => {
    if (familyRef.current === templateFamily) return;
    familyRef.current = templateFamily;
    skipNextPersistFlash.current = true;
    setPositions(loadPositionsForFamily(templateFamily, sectionIds, resumeData));
  }, [templateFamily, sectionIds, resumeData]);

  useEffect(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      const storage = readFamilyLayoutStorage();
      storage[templateFamily] = positions;
      writeFamilyLayoutStorage(storage);
      if (skipNextPersistFlash.current) {
        skipNextPersistFlash.current = false;
        return;
      }
      markSaved();
      emitLayoutPositions({ family: templateFamily, positions });
    }, 320);
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [positions, templateFamily, markSaved]);

  useEffect(() => {
    return registerLayoutUndoBridge({
      family: templateFamily,
      applyPositions: (restored) => {
        setPositions((prev) => {
          const next = { ...prev };
          for (const [id, pos] of Object.entries(restored)) {
            next[id] = { ...prev[id], ...pos };
          }
          return next;
        });
      },
    });
  }, [templateFamily]);

  useEffect(() => {
    setPositions((prev) => mergeFreeLayoutPositions(prev, sectionIds, templateFamily, resumeData));
  }, [sectionIds, templateFamily, resumeData]);

  useEffect(() => {
    try {
      localStorage.setItem(FREE_LAYOUT_ENABLED_KEY, String(enabled));
    } catch {
      /* ignore */
    }
  }, [enabled]);

  useEffect(() => {
    try {
      localStorage.setItem(FREE_LAYOUT_SNAP_KEY, String(snapEnabled));
    } catch {
      /* ignore */
    }
  }, [snapEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(FREE_LAYOUT_LIVE_PREVIEW_KEY, String(livePreview));
    } catch {
      /* ignore */
    }
  }, [livePreview]);

  const setEnabled = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setEnabledState(value);
  }, []);

  const setSnapEnabled = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setSnapEnabledState(value);
  }, []);

  const setLivePreview = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setLivePreviewState(value);
  }, []);

  const updatePosition = useCallback(
    (id: string, next: FreeLayoutPosition, options?: { skipSnap?: boolean; constrainA4?: boolean }) => {
      setPositions((prev) => {
        const pageHeight = options?.constrainA4 ? CANVAS_PAGE_HEIGHT : undefined;
        const merged = { ...prev[id], ...next };
        const candidate = options?.skipSnap
          ? merged
          : snapEnabled
            ? applyMagneticSnap(id, merged, prev, FREE_LAYOUT_CANVAS.width, {
                pageHeight,
                pageId: merged.pageId ?? prev[id]?.pageId,
                margin: options?.constrainA4 ? CANVAS_PAGE_MARGIN : 0,
              })
            : merged;
        const final = options?.constrainA4 ? clampPositionToA4Page(candidate) : candidate;
        return { ...prev, [id]: final };
      });
    },
    [snapEnabled],
  );

  const applyPositionsBatch = useCallback(
    (updates: Record<string, FreeLayoutPosition>, options?: { constrainA4?: boolean }) => {
      setPositions((prev) => {
        const next = { ...prev };
        for (const [id, pos] of Object.entries(updates)) {
          const merged = { ...prev[id], ...pos };
          next[id] = options?.constrainA4 ? clampPositionToA4Page(merged) : merged;
        }
        return next;
      });
    },
    [],
  );

  const resetLayout = useCallback(() => {
    setPositions(createFamilyDefaultPositions(templateFamily, sectionIds, resumeData));
  }, [sectionIds, templateFamily, resumeData]);

  const applyPreset = useCallback(
    (presetId: FreeLayoutPresetId) => {
      setPositions(createFreeLayoutPresetPositions(presetId, sectionIds, resumeData));
    },
    [sectionIds, resumeData],
  );

  const applyFamilyLayout = useCallback(() => {
    setPositions(createFamilyDefaultPositions(templateFamily, sectionIds, resumeData));
  }, [sectionIds, templateFamily, resumeData]);

  /** Re-read positions from localStorage (used after cloud hydrate). */
  const reloadFromStorage = useCallback(() => {
    skipNextPersistFlash.current = true;
    setPositions(loadPositionsForFamily(templateFamily, sectionIds, resumeData));
  }, [templateFamily, sectionIds, resumeData]);

  return {
    sections,
    positions,
    enabled,
    setEnabled,
    snapEnabled,
    setSnapEnabled,
    livePreview,
    setLivePreview,
    updatePosition,
    applyPositionsBatch,
    resetLayout,
    applyPreset,
    applyFamilyLayout,
    reloadFromStorage,
    templateFamily,
    lastSavedAt,
  };
}
