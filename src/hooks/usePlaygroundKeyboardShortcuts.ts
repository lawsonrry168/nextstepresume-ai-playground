import { useEffect, type Dispatch, type SetStateAction } from "react";
import { t } from "../i18n/translate";
import { getResumeTemplateTheme, getTemplateThemeLabel } from "../lib/resumeTemplateCatalog";
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
        addSystemLog("info", t("systemLog.shortcutsToggle"));
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
        addSystemLog("info", t("systemLog.escapeClose"));
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
    addSystemLog("info", t("systemLog.tabSwitch", { tab: activeTab.toUpperCase() }));
  }, [activeTab, addSystemLog]);

  useEffect(() => {
    const theme = getResumeTemplateTheme(activeTemplate);
    addSystemLog(
      "info",
      t("systemLog.templateSwitch", {
        label: getTemplateThemeLabel(theme),
        id: activeTemplate,
      }),
    );
  }, [activeTemplate, addSystemLog]);
}
