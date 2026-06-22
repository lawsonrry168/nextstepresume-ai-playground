import { useCallback, useEffect, useRef, useState } from "react";
import {
  CANVAS_VIEWPORT_DEFAULTS,
  CANVAS_ZOOM_STEP,
  CanvasViewportState,
  clampCanvasZoom,
  normalizeCanvasViewport,
} from "../lib/canvasStudioTypes";
import { NSR_STORAGE_KEYS } from "../lib/storageKeys";

function readStoredViewport(): CanvasViewportState {
  try {
    const raw = localStorage.getItem(NSR_STORAGE_KEYS.canvasViewport);
    if (!raw) return CANVAS_VIEWPORT_DEFAULTS;
    return normalizeCanvasViewport(JSON.parse(raw) as Partial<CanvasViewportState>);
  } catch {
    return CANVAS_VIEWPORT_DEFAULTS;
  }
}

function writeStoredViewport(state: CanvasViewportState): void {
  try {
    localStorage.setItem(NSR_STORAGE_KEYS.canvasViewport, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function useCanvasViewport() {
  const [viewport, setViewport] = useState<CanvasViewportState>(readStoredViewport);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitViewport = useCallback((patch: Partial<CanvasViewportState>) => {
    setViewport((prev) => {
      const next = normalizeCanvasViewport({ ...prev, ...patch });
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      persistTimerRef.current = setTimeout(() => writeStoredViewport(next), 280);
      return next;
    });
  }, []);

  const setPan = useCallback(
    (panX: number, panY: number) => {
      commitViewport({ panX, panY });
    },
    [commitViewport],
  );

  const panBy = useCallback(
    (dx: number, dy: number) => {
      setViewport((prev) => {
        const next = { ...prev, panX: prev.panX + dx, panY: prev.panY + dy };
        if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
        persistTimerRef.current = setTimeout(() => writeStoredViewport(next), 280);
        return next;
      });
    },
    [],
  );

  const setZoom = useCallback(
    (zoom: number, anchor?: { x: number; y: number }) => {
      setViewport((prev) => {
        const nextZoom = clampCanvasZoom(zoom);
        if (!anchor) {
          const next = { ...prev, zoom: nextZoom };
          if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
          persistTimerRef.current = setTimeout(() => writeStoredViewport(next), 280);
          return next;
        }
        const scale = nextZoom / prev.zoom;
        const next = {
          zoom: nextZoom,
          panX: anchor.x - (anchor.x - prev.panX) * scale,
          panY: anchor.y - (anchor.y - prev.panY) * scale,
        };
        if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
        persistTimerRef.current = setTimeout(() => writeStoredViewport(next), 280);
        return next;
      });
    },
    [],
  );

  const zoomBy = useCallback(
    (delta: number, anchor?: { x: number; y: number }) => {
      setViewport((prev) => {
        const nextZoom = clampCanvasZoom(prev.zoom + delta);
        if (!anchor) {
          const next = { ...prev, zoom: nextZoom };
          if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
          persistTimerRef.current = setTimeout(() => writeStoredViewport(next), 280);
          return next;
        }
        const scale = nextZoom / prev.zoom;
        const next = {
          zoom: nextZoom,
          panX: anchor.x - (anchor.x - prev.panX) * scale,
          panY: anchor.y - (anchor.y - prev.panY) * scale,
        };
        if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
        persistTimerRef.current = setTimeout(() => writeStoredViewport(next), 280);
        return next;
      });
    },
    [],
  );

  const resetView = useCallback(() => {
    setViewport(CANVAS_VIEWPORT_DEFAULTS);
    writeStoredViewport(CANVAS_VIEWPORT_DEFAULTS);
  }, []);

  const fitToScreen = useCallback(
    (container: HTMLElement, contentWidth: number, contentHeight: number, padding = 48) => {
      const w = container.clientWidth - padding * 2;
      const h = container.clientHeight - padding * 2;
      if (w <= 0 || h <= 0) return;
      const zoom = clampCanvasZoom(Math.min(w / contentWidth, h / contentHeight));
      const panX = (container.clientWidth - contentWidth * zoom) / 2;
      const panY = (container.clientHeight - contentHeight * zoom) / 2;
      const next = { panX, panY, zoom };
      setViewport(next);
      writeStoredViewport(next);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, []);

  return {
    viewport,
    setPan,
    panBy,
    setZoom,
    zoomBy,
    zoomStep: CANVAS_ZOOM_STEP,
    resetView,
    fitToScreen,
  };
}
