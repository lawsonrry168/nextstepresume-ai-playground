import { useCallback, useState } from "react";
import { StudioViewMode } from "../lib/canvasStudioTypes";
import { NSR_STORAGE_KEYS } from "../lib/storageKeys";

function readStudioViewMode(): StudioViewMode {
  try {
    const raw = localStorage.getItem(NSR_STORAGE_KEYS.studioViewMode);
    if (raw === "single" || raw === "canvas") return raw;
    if (raw === "compare") return "canvas";
  } catch {
    // ignore
  }
  return "canvas";
}

export function useStudioViewMode() {
  const [studioViewMode, setStudioViewModeState] = useState<StudioViewMode>(readStudioViewMode);

  const setStudioViewMode = useCallback((mode: StudioViewMode) => {
    setStudioViewModeState((prev) => {
      if (prev === "canvas" && mode === "compare") return prev;
      try {
        localStorage.setItem(NSR_STORAGE_KEYS.studioViewMode, mode);
      } catch {
        // ignore
      }
      return mode;
    });
  }, []);

  return { studioViewMode, setStudioViewMode };
}
