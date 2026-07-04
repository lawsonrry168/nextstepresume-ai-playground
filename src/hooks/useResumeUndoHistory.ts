import { useCallback, useEffect, useRef, useState } from "react";
import type { ResumeData } from "../types";
import {
  applyLayoutUndoPositions,
  subscribeLayoutPositions,
  type LayoutPositionsSnapshot,
} from "../lib/undoRegistry";

interface UndoEntry {
  resumeData: ResumeData;
  /** Layout snapshot at the time of the edit (null when free layout not mounted) */
  layout: LayoutPositionsSnapshot | null;
}

function cloneResumeData(data: ResumeData): ResumeData {
  return JSON.parse(JSON.stringify(data)) as ResumeData;
}

function cloneLayout(snapshot: LayoutPositionsSnapshot | null): LayoutPositionsSnapshot | null {
  return snapshot ? (JSON.parse(JSON.stringify(snapshot)) as LayoutPositionsSnapshot) : null;
}

const HISTORY_LIMIT = 50;

/**
 * Unified undo/redo — content edits AND free-layout changes share one history.
 * Ctrl+Z undoes, Ctrl+Shift+Z / Ctrl+Y redoes.
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
  /** Latest layout emitted by the free-layout hook */
  const latestLayoutRef = useRef<LayoutPositionsSnapshot | null>(null);
  /** Layout state before the current burst of drags */
  const preDragLayoutRef = useRef<LayoutPositionsSnapshot | null>(null);
  const layoutBurstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
            layout: cloneLayout(latestLayoutRef.current),
          });
        }
      }
      isInTypingSessionRef.current = false;
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resumeData, pushEntry]);

  useEffect(() => {
    return subscribeLayoutPositions((snapshot) => {
      const previous = latestLayoutRef.current;
      latestLayoutRef.current = cloneLayout(snapshot);

      if (Date.now() < suppressLayoutCaptureRef.current) return;
      if (!previous || previous.family !== snapshot.family) return;
      if (JSON.stringify(previous.positions) === JSON.stringify(snapshot.positions)) return;

      if (!preDragLayoutRef.current) {
        preDragLayoutRef.current = previous;
      }
      if (layoutBurstTimerRef.current) clearTimeout(layoutBurstTimerRef.current);
      layoutBurstTimerRef.current = setTimeout(() => {
        const before = preDragLayoutRef.current;
        preDragLayoutRef.current = null;
        if (!before) return;
        pushEntry({
          resumeData: cloneResumeData(resumeDataRef.current),
          layout: before,
        });
      }, 700);
    });
  }, [pushEntry]);

  useEffect(
    () => () => {
      if (layoutBurstTimerRef.current) clearTimeout(layoutBurstTimerRef.current);
    },
    [],
  );

  const saveImmediateSnapshot = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    pushEntry({
      resumeData: cloneResumeData(resumeDataRef.current),
      layout: cloneLayout(latestLayoutRef.current),
    });
    isInTypingSessionRef.current = false;
  }, [pushEntry]);

  const currentEntry = useCallback(
    (): UndoEntry => ({
      resumeData: cloneResumeData(resumeDataRef.current),
      layout: cloneLayout(latestLayoutRef.current),
    }),
    [],
  );

  const applyEntry = useCallback(
    (entry: UndoEntry) => {
      isInTypingSessionRef.current = true;
      setResumeData(cloneResumeData(entry.resumeData));
      if (entry.layout) {
        suppressLayoutCaptureRef.current = Date.now() + 1200;
        const applied = applyLayoutUndoPositions(entry.layout);
        if (applied) {
          latestLayoutRef.current = cloneLayout(entry.layout);
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
