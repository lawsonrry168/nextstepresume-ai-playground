import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ResumeData } from "../types";

function cloneResumeData(data: ResumeData): ResumeData {
  return JSON.parse(JSON.stringify(data)) as ResumeData;
}

export function useResumeUndoHistory(
  resumeData: ResumeData,
  setResumeData: (data: ResumeData) => void,
) {
  const [history, setHistory] = useState<ResumeData[]>([]);
  const preEditStateRef = useRef<ResumeData | null>(null);
  const isInTypingSessionRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          setHistory((prev) => [...prev, preEditStateRef.current!].slice(-50));
        }
      }
      isInTypingSessionRef.current = false;
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resumeData]);

  const saveImmediateSnapshot = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHistory((prev) => [...prev, cloneResumeData(resumeData)].slice(-50));
    isInTypingSessionRef.current = false;
  }, [resumeData]);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const lastState = prev[prev.length - 1];
      isInTypingSessionRef.current = true;
      setResumeData(cloneResumeData(lastState));
      setTimeout(() => {
        isInTypingSessionRef.current = false;
      }, 100);
      return prev.slice(0, -1);
    });
  }, [setResumeData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo]);

  return { history, handleUndo, saveImmediateSnapshot };
}
