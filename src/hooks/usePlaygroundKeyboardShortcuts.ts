import { useEffect, type Dispatch, type SetStateAction } from "react";
import { getResumeTemplateTheme } from "../lib/resumeTemplateCatalog";
import type { TemplateStyle } from "../types";
import type { SystemLogType } from "./useMeasuredApi";

export interface UsePlaygroundKeyboardShortcutsOptions {
  handleManualSave: () => void;
  addSystemLog: (type: SystemLogType, message: string) => void;
  setShortcutsModalOpen: Dispatch<SetStateAction<boolean>>;
  setComparatorOpen: (open: boolean) => void;
  setSalaryInsightsOpen: (open: boolean) => void;
  setChatOpen: (open: boolean) => void;
  activeTab: string;
  activeTemplate: TemplateStyle;
}

export function usePlaygroundKeyboardShortcuts({
  handleManualSave,
  addSystemLog,
  setShortcutsModalOpen,
  setComparatorOpen,
  setSalaryInsightsOpen,
  setChatOpen,
  activeTab,
  activeTemplate,
}: UsePlaygroundKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable;

      if (e.key === "?" && !isInput) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        addSystemLog("info", "觸發鍵盤快捷鍵說明面板切換。");
        return;
      }

      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleManualSave();
        return;
      }

      if (e.key === "Escape") {
        setComparatorOpen(false);
        setSalaryInsightsOpen(false);
        setChatOpen(false);
        setShortcutsModalOpen(false);
        addSystemLog("info", "Esc 鍵關閉所有浮落控制區。");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    addSystemLog,
    handleManualSave,
    setChatOpen,
    setComparatorOpen,
    setSalaryInsightsOpen,
    setShortcutsModalOpen,
  ]);

  useEffect(() => {
    addSystemLog("info", `使用者切換功能分頁為: [${activeTab.toUpperCase()}]`);
  }, [activeTab, addSystemLog]);

  useEffect(() => {
    addSystemLog(
      "info",
      `使用者更換履歷排版為: ${getResumeTemplateTheme(activeTemplate).labelZh} (${activeTemplate})`,
    );
  }, [activeTemplate, addSystemLog]);
}
