import { useCallback, useEffect, useRef, useState } from "react";
import type { ResumeData } from "../types";
import {
  applyCanvasUndoSnapshot,
  subscribeCanvasDocument,
  subscribeLayoutPositions,
  type CanvasUndoSnapshot,
} from "../lib/undoRegistry";

interface UndoEntry {
  resumeData: ResumeData;
  /** Layout + canvas snapshot at the time of the edit */
  canvas: CanvasUndoSnapshot | null;
}

function cloneResumeData(data: ResumeData): ResumeData {
  return JSON.parse(JSON.stringify(data)) as ResumeData;
}

function cloneCanvas(snapshot: CanvasUndoSnapshot | null): CanvasUndoSnapshot | null {
  return snapshot ? (JSON.parse(JSON.stringify(snapshot)) as CanvasUndoSnapshot) : null;
}

const HISTORY_LIMIT = 50;

/**
 * Unified undo/redo — content edits, layout drags, page/layer changes share one history.
 */
export function useResumeUndoHistory(
  resumeData: ResumeData,
  setResumeData: (data: ResumeData) => void,
) {
  const [history, setHistory] = useState<UndoEntry[]>([]);
  const [future, setFuture] = useState<UndoEntry[]>([]);
  const preEditStateRef = useRef<ResumeData | null>(null);
  const isInTypingSessionRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resumeDataRef = useRef(resumeData);
  resumeDataRef.current = resumeData;

  const latestCanvasRef = useRef<CanvasUndoSnapshot | null>(null);
  const preDragCanvasRef = useRef<CanvasUndoSnapshot | null>(null);
  const layoutBurstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasBurstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressLayoutCaptureRef = useRef(0);

  const pushEntry = useCallback((entry: UndoEntry) => {
    setHistory((prev) => [...prev, entry].slice(-HISTORY_LIMIT));
    setFuture([]);
  }, []);

  useEffect(() => {
    if (!resumeData) return;

    if (!isInTypingSessionRef.current) {
      preEditStateRef.current = cloneResumeData(resumeData);
      isInTypingSessionRef.current = true;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      if (preEditStateRef.current) {
        const isDifferent = JSON.stringify(preEditStateRef.current) !== JSON.stringify(resumeData);
        if (isDifferent) {
          pushEntry({
            resumeData: preEditStateRef.current,
            canvas: cloneCanvas(latestCanvasRef.current),
          });
        }
      }
      isInTypingSessionRef.current = false;
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resumeData, pushEntry]);

  const scheduleLayoutBurst = useCallback(() => {
    if (layoutBurstTimerRef.current) clearTimeout(layoutBurstTimerRef.current);
    layoutBurstTimerRef.current = setTimeout(() => {
      const before = preDragCanvasRef.current;
      preDragCanvasRef.current = null;
      if (!before) return;
      pushEntry({
        resumeData: cloneResumeData(resumeDataRef.current),
        canvas: before,
      });
    }, 700);
  }, [pushEntry]);

  useEffect(() => {
    return subscribeLayoutPositions((snapshot) => {
      const previous = latestCanvasRef.current;
      latestCanvasRef.current = {
        family: snapshot.family,
        positions: JSON.parse(JSON.stringify(snapshot.positions)) as CanvasUndoSnapshot["positions"],
        pages: previous?.pages,
        layers: previous?.layers,
      };

      if (Date.now() < suppressLayoutCaptureRef.current) return;
      if (!previous || previous.family !== snapshot.family) return;
      if (JSON.stringify(previous.positions) === JSON.stringify(snapshot.positions)) return;

      if (!preDragCanvasRef.current) {
        preDragCanvasRef.current = cloneCanvas(previous);
      }
      scheduleLayoutBurst();
    });
  }, [scheduleLayoutBurst]);

  useEffect(() => {
    return subscribeCanvasDocument((snapshot) => {
      const previous = latestCanvasRef.current;
      latestCanvasRef.current = {
        family: snapshot.family,
        positions: previous?.positions ?? {},
        pages: JSON.parse(JSON.stringify(snapshot.pages)) as CanvasUndoSnapshot["pages"],
        layers: JSON.parse(JSON.stringify(snapshot.layers)) as CanvasUndoSnapshot["layers"],
      };

      if (Date.now() < suppressLayoutCaptureRef.current) return;
      if (!previous || previous.family !== snapshot.family) return;
      const pagesSame = JSON.stringify(previous.pages) === JSON.stringify(snapshot.pages);
      const layersSame = JSON.stringify(previous.layers) === JSON.stringify(snapshot.layers);
      if (pagesSame && layersSame) return;

      if (!preDragCanvasRef.current) {
        preDragCanvasRef.current = cloneCanvas(previous);
      }
      if (canvasBurstTimerRef.current) clearTimeout(canvasBurstTimerRef.current);
      canvasBurstTimerRef.current = setTimeout(() => {
        const before = preDragCanvasRef.current;
        preDragCanvasRef.current = null;
        if (!before) return;
        pushEntry({
          resumeData: cloneResumeData(resumeDataRef.current),
          canvas: before,
        });
      }, 700);
    });
  }, [pushEntry]);

  useEffect(
    () => () => {
      if (layoutBurstTimerRef.current) clearTimeout(layoutBurstTimerRef.current);
      if (canvasBurstTimerRef.current) clearTimeout(canvasBurstTimerRef.current);
    },
    [],
  );

  const saveImmediateSnapshot = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    pushEntry({
      resumeData: cloneResumeData(resumeDataRef.current),
      canvas: cloneCanvas(latestCanvasRef.current),
    });
    isInTypingSessionRef.current = false;
  }, [pushEntry]);

  const currentEntry = useCallback(
    (): UndoEntry => ({
      resumeData: cloneResumeData(resumeDataRef.current),
      canvas: cloneCanvas(latestCanvasRef.current),
    }),
    [],
  );

  const applyEntry = useCallback(
    (entry: UndoEntry) => {
      isInTypingSessionRef.current = true;
      setResumeData(cloneResumeData(entry.resumeData));
      if (entry.canvas) {
        suppressLayoutCaptureRef.current = Date.now() + 1200;
        const applied = applyCanvasUndoSnapshot(entry.canvas);
        if (applied) {
          latestCanvasRef.current = cloneCanvas(entry.canvas);
        }
      }
      setTimeout(() => {
        isInTypingSessionRef.current = false;
      }, 100);
    },
    [setResumeData],
  );

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const entry = prev[prev.length - 1]!;
      const snapshotNow = currentEntry();
      setFuture((f) => [...f, snapshotNow].slice(-HISTORY_LIMIT));
      applyEntry(entry);
      return prev.slice(0, -1);
    });
  }, [applyEntry, currentEntry]);

  const handleRedo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const entry = prev[prev.length - 1]!;
      const snapshotNow = currentEntry();
      setHistory((h) => [...h, snapshotNow].slice(-HISTORY_LIMIT));
      applyEntry(entry);
      return prev.slice(0, -1);
    });
  }, [applyEntry, currentEntry]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else if (key === "z") {
        e.preventDefault();
        handleUndo();
      } else if (key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  return { history, future, handleUndo, handleRedo, saveImmediateSnapshot };
}
