import { useCallback, useEffect, useRef, useState } from "react";
import { ResumeData } from "../types";
import { initialJobDescription } from "../data";
import {
  DEFAULT_A4_TEMPLATE,
  normalizeTemplateStyle,
  type TemplateStyle,
} from "../lib/resumeTemplateCatalog";
import { buildTemplateDemoBundle, persistTemplateDemoLayout } from "../lib/templates/applyTemplateDemo";
import { getDefaultTemplateDemoResume, getTemplateDemoResume } from "../lib/templates/templateDemoContent";
import { readStoredUiLocale } from "../lib/templates/templateDemoLocale";

import { NSR_STORAGE_KEYS } from "../lib/storageKeys";
import {
  buildWorkspaceSnapshot,
  registerWorkspaceHydrateHandler,
  scheduleWorkspaceCloudPush,
} from "../lib/sync/cloudSyncCoordinator";

const STORAGE_KEYS = {
  resume: NSR_STORAGE_KEYS.workspaceResume,
  jd: NSR_STORAGE_KEYS.workspaceJd,
  template: NSR_STORAGE_KEYS.workspaceTemplate,
} as const;

export type SaveStatus = "saved" | "saving" | "idle" | "error";

export function useResumeWorkspace(options?: {
  onAutoSaved?: () => void;
  onAutoSaveFailed?: (message: string) => void;
}) {
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.resume);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return getDefaultTemplateDemoResume(readStoredUiLocale());
  });

  const [jobDescription, setJobDescription] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.jd);
      if (saved) return saved;
    } catch {
      /* ignore */
    }
    return initialJobDescription;
  });

  const [activeTemplate, setActiveTemplate] = useState<TemplateStyle>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.template);
      return normalizeTemplateStyle(saved);
    } catch {
      /* ignore */
    }
    return DEFAULT_A4_TEMPLATE;
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => {
    try {
      if (localStorage.getItem(STORAGE_KEYS.resume)) {
        return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      }
    } catch {
      /* ignore */
    }
    return "";
  });

  const [autoSaveShouldFail, setAutoSaveShouldFail] = useState(false);
  const skipInitialAutoSaveRef = useRef(true);
  const onAutoSavedRef = useRef(options?.onAutoSaved);
  const onAutoSaveFailedRef = useRef(options?.onAutoSaveFailed);

  useEffect(() => {
    onAutoSavedRef.current = options?.onAutoSaved;
    onAutoSaveFailedRef.current = options?.onAutoSaveFailed;
  }, [options?.onAutoSaved, options?.onAutoSaveFailed]);

  useEffect(() => {
    return registerWorkspaceHydrateHandler((snapshot) => {
      setResumeData(snapshot.resumeData);
      setJobDescription(snapshot.jobDescription);
      setActiveTemplate(snapshot.activeTemplate);
      localStorage.setItem(STORAGE_KEYS.resume, JSON.stringify(snapshot.resumeData));
      localStorage.setItem(STORAGE_KEYS.jd, snapshot.jobDescription);
      localStorage.setItem(STORAGE_KEYS.template, snapshot.activeTemplate);
      skipInitialAutoSaveRef.current = true;
      setSaveStatus("saved");
    });
  }, []);

  const persistWorkspace = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.resume, JSON.stringify(resumeData));
    localStorage.setItem(STORAGE_KEYS.jd, jobDescription);
    localStorage.setItem(STORAGE_KEYS.template, activeTemplate);
    const formattedTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLastSavedTime(formattedTime);
    setSaveStatus("saved");
    scheduleWorkspaceCloudPush(buildWorkspaceSnapshot(resumeData, jobDescription, activeTemplate));
  }, [resumeData, jobDescription, activeTemplate]);

  const handleManualSave = useCallback(() => {
    try {
      persistWorkspace();
      return true;
    } catch {
      setSaveStatus("error");
      return false;
    }
  }, [persistWorkspace]);

  const handleResetToDefault = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.resume);
    localStorage.removeItem(STORAGE_KEYS.jd);
    localStorage.removeItem(STORAGE_KEYS.template);
    const style = DEFAULT_A4_TEMPLATE;
    const locale = readStoredUiLocale();
    persistTemplateDemoLayout(style, locale);
    setResumeData(getTemplateDemoResume(style, locale));
    setJobDescription(initialJobDescription);
    setActiveTemplate(style);
    setSaveStatus("saved");
    setLastSavedTime("");
  }, []);

  const loadTemplateDemo = useCallback((style?: TemplateStyle) => {
    const target = style ?? activeTemplate;
    const locale = readStoredUiLocale();
    persistTemplateDemoLayout(target, locale);
    setResumeData(getTemplateDemoResume(target, locale));
    setActiveTemplate(target);
    setSaveStatus("saved");
    return buildTemplateDemoBundle(target, locale);
  }, [activeTemplate]);

  useEffect(() => {
    if (saveStatus === "idle") {
      setSaveStatus("saved");
    }
  }, [saveStatus]);

  useEffect(() => {
    if (skipInitialAutoSaveRef.current) {
      skipInitialAutoSaveRef.current = false;
      return;
    }

    setSaveStatus("saving");
    const timer = setTimeout(() => {
      if (autoSaveShouldFail) {
        setSaveStatus("error");
        onAutoSaveFailedRef.current?.("自動存檔失敗：偵測到啟用攔截模擬。");
        return;
      }
      try {
        persistWorkspace();
        onAutoSavedRef.current?.();
      } catch (err: unknown) {
        setSaveStatus("error");
        onAutoSaveFailedRef.current?.(err instanceof Error ? err.message : String(err));
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [resumeData, jobDescription, activeTemplate, autoSaveShouldFail, persistWorkspace]);

  return {
    resumeData,
    setResumeData,
    jobDescription,
    setJobDescription,
    activeTemplate,
    setActiveTemplate,
    saveStatus,
    setSaveStatus,
    lastSavedTime,
    autoSaveShouldFail,
    setAutoSaveShouldFail,
    handleManualSave,
    handleResetToDefault,
    loadTemplateDemo,
    persistWorkspace,
  };
}
