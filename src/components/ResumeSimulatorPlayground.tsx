/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { motion } from "motion/react";
import { 
  FileText, Briefcase, GraduationCap, Code, Sparkles, Check, 
  RefreshCw, TrendingUp, AlertCircle, AlertTriangle, Layout, 
  Eye, Edit3, ArrowRight, User, Plus, Trash2, CheckCircle, Info,
  ChevronDown, Award, HeartHandshake, Languages, Maximize2, Minimize2, Grid, Layers, LayoutGrid,
  Bold, Italic, List, Cloud, Target, Undo, Volume2, Mic, MicOff, Wand2, Download, FileUp
} from "lucide-react";
import { ResumeData, TemplateStyle, TailorIntensity } from "../types";
import { getResumeTemplateTheme } from "../lib/resumeTemplateCatalog";
import { initialResumeData, initialJobDescription } from "../data";
import ResumeTemplateRenderer from "./ResumeTemplateRenderer";
import ResumeImportModal from "./ResumeImportModal";
import StatusToastStack from "./StatusToastStack";
import { calculateLiveAtsScore } from "../lib/atsKeywords";
import { downloadResumePdfByMode, buildResumePdfFilename } from "../lib/resumePdfExportRouter";
import type { PdfExportMode } from "../lib/resumePdfTypes";
import { estimateSalary, formatSalaryRange } from "../lib/salaryBenchmark";
import { useStatusToast } from "../hooks/useStatusToast";
import { useMeasuredApi } from "../hooks/useMeasuredApi";
import { useResumeWorkspace } from "../hooks/useResumeWorkspace";
import type { PlaygroundTab } from "./playground/PlaygroundTabNav";
import PlaygroundSidebarNav from "./playground/PlaygroundSidebarNav";
import MarketBanner from "./layout/MarketBanner";
import { useI18n } from "../i18n";
import { useSubscription } from "../context/SubscriptionProvider";
import { usePlaygroundAudits } from "../hooks/usePlaygroundAudits";
import { useGeminiChat } from "../hooks/useGeminiChat";
import { usePlaygroundTools } from "../hooks/usePlaygroundTools";
import GeminiChatSidebar from "./playground/GeminiChatSidebar";
import CollapsiblePanel from "./playground/CollapsiblePanel";
import SystemDiagnosticsPanel from "./playground/SystemDiagnosticsPanel";
import TailorTabPanel from "./playground/TailorTabPanel";
import ContentTabEditorPanel from "./playground/ContentTabEditorPanel";
import MatchTabPanel from "./playground/MatchTabPanel";
const ToolsTabPanel = lazy(() => import("./playground/ToolsTabPanel"));
import PreviewConfigPanel from "./playground/PreviewConfigPanel";
import ResumeLivePreviewPanel from "./playground/ResumeLivePreviewPanel";
import { useStudioViewMode } from "../hooks/useStudioViewMode";
import ResizableSplitPane from "./layout/ResizableSplitPane";
import GrammarToneDrawer from "./playground/GrammarToneDrawer";
import { useResumeThemeCustomization, clearThemeCustomizationStorage } from "../hooks/useResumeThemeCustomization";
import ReadabilityDrawer from "./playground/ReadabilityDrawer";
import SkillConsistencyDrawer from "./playground/SkillConsistencyDrawer";
import ApplicationWizardModal from "./playground/ApplicationWizardModal";
import type { ImportedJobData } from "./playground/JobImportPanel";
const ApplicationTrackerPanel = lazy(() => import("./playground/ApplicationTrackerPanel"));
import { useApplicationWizard } from "../hooks/useApplicationWizard";
import { usePlaygroundApplicationFlow } from "../hooks/usePlaygroundApplicationFlow";
import { useFollowUpNotifications } from "../hooks/useFollowUpNotifications";
import type { ApplicationPackage } from "../types";

interface ResumeSimulatorPlaygroundProps {
  onNotifyServerStatus: (reachable: boolean) => void;
  aiAvailable: boolean;
  onNavigateOverview?: () => void;
  theme?: "light" | "dark";
  onThemeToggle?: () => void;
  onTourOpen?: () => void;
}

function TabPanelSuspenseFallback() {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 items-center justify-center p-12 text-slate-400 text-sm font-medium">
      {t("common.loading")}
    </div>
  );
}

export default function ResumeSimulatorPlayground({
  onNotifyServerStatus,
  aiAvailable,
  onNavigateOverview,
  theme,
  onThemeToggle,
  onTourOpen,
}: ResumeSimulatorPlaygroundProps) {

  const { t } = useI18n();
  const { canUseFeature } = useSubscription();
  const { toasts, pushToast, dismissToast } = useStatusToast();
  const { addSystemLog, measuredFetch, apiLatency, apiLogs, systemLogs, exportSystemLogs } = useMeasuredApi();

  const {
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
    handleManualSave: persistManualSave,
    handleResetToDefault,
  } = useResumeWorkspace({
    onAutoSaved: () => addSystemLog("info", "系統成功背景執行自動存檔備份作業。"),
    onAutoSaveFailed: (message) => addSystemLog("error", `系統背景存檔備份作業失敗: ${message}`),
  });

  const {
    customization: themeCustomization,
    updateCustomization: updateThemeCustomization,
    resetCustomization: resetThemeCustomization,
    resolved: resolvedTheme,
  } = useResumeThemeCustomization(activeTemplate);

  const handleManualSave = () => {
    if (persistManualSave()) {
      addSystemLog("info", "使用者手動觸發儲存作業 (Ctrl+S) 成功且備份檔案已寫入。");
    } else {
      addSystemLog("error", "使用者儲存作業系統失敗");
    }
  };

  const [activeTab, setActiveTab] = useState<PlaygroundTab>("content");
  const [highlightChanges, setHighlightChanges] = useState<boolean>(true);
  const [tailorIntensity, setTailorIntensity] = useState<TailorIntensity>("balanced");
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [atsScoreExpanded, setAtsScoreExpanded] = useState<boolean>(false);
  const [matcherHighlightActive, setMatcherHighlightActive] = useState<boolean>(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);

  const atsLive = React.useMemo(
    () => calculateLiveAtsScore(resumeData, jobDescription),
    [resumeData, jobDescription]
  );
  const liveAtsScore = atsLive.score;
  const activeKeywordsList = atsLive.keywords;
  const detectedKeywords = atsLive.detected;

  const {
    loading,
    analysisResult,
    tailorError,
    lastAnalysisSimulated,
    triggerAITailor,
    matchAnalysisResult,
    matchLoading,
    matchError,
    triggerAIMatchAnalysis,
    grammarChecking,
    grammarResult,
    grammarDrawerOpen,
    setGrammarDrawerOpen,
    appliedSuggestions,
    runGrammarToneCheck,
    applySuggestedCorrection,
    readabilityChecking,
    readabilityResult,
    readabilityDrawerOpen,
    setReadabilityDrawerOpen,
    runReadabilityComplexityCheck,
    applyReadabilityCorrection,
    skillConsistencyChecking,
    skillConsistencyResult,
    skillConsistencyDrawerOpen,
    setSkillConsistencyDrawerOpen,
    runSkillConsistencyCheck,
    handleAddSuggestedSkill,
    handleRemoveFlaggedSkill,
    premiumGrammarText,
    setPremiumGrammarText,
    premiumGrammarChecking,
    premiumGrammarResult,
    runPremiumGrammarCheck,
    handleApplyTailoredItem,
    setAnalysisResult,
    setMatchAnalysisResult,
  } = usePlaygroundAudits({
    resumeData,
    setResumeData,
    jobDescription,
    measuredFetch,
    onNotifyServerStatus,
    pushToast,
    aiAvailable,
    tailorIntensity,
    setActiveTab,
    setHighlightChanges,
  });

  const {
    applicationPackages,
    selectedApplicationId,
    setSelectedApplicationId,
    updateApplicationStatus,
    removeApplicationPackage,
    saveApplicationCoverLetter,
    interviewLoading,
    companyLoading,
    applicationExporting,
    exportFullPackage,
    exportMergedPdf,
    exportMergedOoxml,
    exportApplicationResume,
    exportApplicationCoverLetter,
    wizard,
    handleJobImported,
    handleCreateDraftFromImport,
    handleOpenWizardWithImport,
    loadApplicationPackage,
    handleGenerateInterview,
    handleGenerateCompany,
    handleSaveApplicationNotes,
    handleWizardFinish,
  } = usePlaygroundApplicationFlow({
    resumeData,
    setResumeData,
    activeTemplate,
    measuredFetch,
    pushToast,
    aiAvailable,
    onNotifyServerStatus,
    setJobDescription,
    setActiveTab,
    setActiveTemplate,
    setAnalysisResult,
    setMatchAnalysisResult,
    setHighlightChanges,
  });

  const followUpNotifications = useFollowUpNotifications(applicationPackages);

  const {
    chatOpen,
    setChatOpen,
    thinkingMode,
    setThinkingMode,
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    executeSendChatMessage,
  } = useGeminiChat({
    resumeData,
    jobDescription,
    detectedKeywords,
    activeKeywordsList,
    measuredFetch,
    onNotifyServerStatus,
    pushToast,
  });

  const {
    voiceRecording,
    voiceTarget,
    setVoiceTarget,
    voiceStatus,
    toggleVoiceRecording,
    comparatorOpen,
    setComparatorOpen,
    isComparing,
    comparatorResult,
    runResumeComparison,
    atsLogs,
    isAtsCrawling,
    crawlerSource,
    setCrawlerSource,
    triggerAtsCrawlerSim,
    clearAtsLogs,
    exportToJson,
    exportToDocx,
  } = usePlaygroundTools({
    resumeData,
    setResumeData,
    jobDescription,
    setPremiumGrammarText,
    activeTemplate,
  });

  const exportSystemLogsWithToast = () => {
    try {
      exportSystemLogs();
    } catch (err: unknown) {
      console.error(err);
      alert(t("playgroundUi.logExportFailed", { message: err instanceof Error ? err.message : String(err) }));
    }
  };

  // Keyboard Shortcuts Event Listener Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable;
      
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShortcutsModalOpen(prev => !prev);
        addSystemLog('info', '觸發鍵盤快捷鍵說明面板切換。');
        return;
      }

      if (isInput) return; // ignore all other shortcuts if typing

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
        return;
      }

      if (e.key === 'Escape') {
        setComparatorOpen(false);
        setSalaryInsightsOpen(false);
        setChatOpen(false);
        setShortcutsModalOpen(false);
        addSystemLog('info', 'Esc 鍵關閉所有浮落控制區。');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resumeData, jobDescription, activeTemplate]);

  // Track activeTab switches to append to logs
  useEffect(() => {
    addSystemLog('info', `使用者切換功能分頁為: [${activeTab.toUpperCase()}]`);
  }, [activeTab]);

  // Track template selection changes and log them
  useEffect(() => {
    addSystemLog('info', `使用者更換履歷排版為: ${getResumeTemplateTheme(activeTemplate).labelZh} (${activeTemplate})`);
  }, [activeTemplate]);

  // Sync initial premium metrics for skills heatmap & salary role
  useEffect(() => {
    if (resumeData.personalInfo?.title && !salaryRole) {
      setSalaryRole(resumeData.personalInfo.title);
    }
    
    // Initialize skill scores if not set
    const prof: Record<string, number> = { ...skillsProficiency };
    const dem: Record<string, number> = { ...skillsDemand };
    const rel: Record<string, number> = { ...skillsRelevance };
    
    let updated = false;
    resumeData.skills.forEach((skill) => {
      // Create a deterministic value using the skill name length/chars
      if (prof[skill] === undefined) {
        const hash = skill.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        prof[skill] = (hash % 4) + 6; // 6 to 9
        dem[skill] = (hash % 5) + 5; // 5 to 9
        rel[skill] = (hash % 3) + 7; // 7 to 9
        updated = true;
      }
    });
    
    if (updated) {
      setSkillsProficiency(prof);
      setSkillsDemand(dem);
      setSkillsRelevance(rel);
    }
  }, [resumeData.skills, resumeData.personalInfo?.title]);

  const onResetWorkspace = () => {
    if (window.confirm(t("playgroundUi.confirmReset"))) {
      handleResetToDefault();
      clearThemeCustomizationStorage();
      resetThemeCustomization();
      addSystemLog("info", "工作區已重設為預設範例資料。");
    }
  };

  // Custom interactive visual preview & comparison states
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const { studioViewMode, setStudioViewMode } = useStudioViewMode();

  const openCanvasPreviewStudio = React.useCallback(() => {
    setStudioViewMode("canvas");
    setIsPreviewMode(true);
  }, [setStudioViewMode]);
  const [previewZoom, setPreviewZoom ] = useState<number>(100);
  const [grayscaleMode, setGrayscaleMode] = useState<boolean>(false);
  
  // Inside content tab sub-editors
  const [editSection, setEditSection] = useState<'personal' | 'summary' | 'experience' | 'skills' | 'certifications' | 'volunteerWork' | 'languages'>('personal');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  // =========================================================================
  // Task 4: State History Stack  // =========================================================================
  // Task 4: State History Stack (Undo Feature) - Standard CTR+Z / CMD+Z binding
  // =========================================================================
  const [history, setHistory] = useState<ResumeData[]>([]);
  const preEditStateRef = React.useRef<ResumeData | null>(null);
  const isInTypingSessionRef = React.useRef<boolean>(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Deep clone helper to prevent direct reference leaks
  const cloneResumeData = (data: ResumeData): ResumeData => {
    return JSON.parse(JSON.stringify(data));
  };

  // Automated contiguous keypress collapse & history tracker
  useEffect(() => {
    if (!resumeData) return;

    if (!isInTypingSessionRef.current) {
      preEditStateRef.current = cloneResumeData(resumeData);
      isInTypingSessionRef.current = true;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (preEditStateRef.current) {
        const isDifferent = JSON.stringify(preEditStateRef.current) !== JSON.stringify(resumeData);
        if (isDifferent) {
          setHistory(prev => [...prev, preEditStateRef.current!].slice(-50));
        }
      }
      isInTypingSessionRef.current = false;
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resumeData]);

  // Force capture an immediate stable snapshot (for button click actions, Drag/Drop additions, filters)
  const saveImmediateSnapshot = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHistory(prev => [...prev, cloneResumeData(resumeData)].slice(-50));
    isInTypingSessionRef.current = false;
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    isInTypingSessionRef.current = true;
    setResumeData(cloneResumeData(lastState));
    setTimeout(() => {
      isInTypingSessionRef.current = false;
    }, 100);
  };

  // Globally bind Ctrl+Z / Cmd+Z for seamless user interactions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history]);


  // =========================================================================
  // Task 1: Client-Side PDF Export (Using jsPDF and html2canvas internally)
  // =========================================================================
  const [pdfExporting, setPdfExporting] = useState<boolean>(false);

  const exportToPDF = async (mode: PdfExportMode = "visual") => {
    setPdfExporting(true);
    try {
      const filename = buildResumePdfFilename(resumeData);
      const watermark =
        mode === "visual" && !canUseFeature("export.pdfVisualClean")
          ? "NextStepResume.ai"
          : undefined;
      await downloadResumePdfByMode(mode, resumeData, filename, activeTemplate, { watermark });
      pushToast("success", mode === "ats" ? t("toast.export.atsPdfDownloaded") : t("toast.export.visualPdfDownloaded"));
    } catch (err) {
      console.error("PDF export error:", err);
      if (mode === "ats") {
        pushToast("error", err instanceof Error ? err.message : t("toast.export.atsPdfExportFailed"));
      } else {
        pushToast("error", err instanceof Error ? err.message : t("toast.export.pdfExportFailedGeneric"));
      }
    } finally {
      setPdfExporting(false);
    }
  };


  // =========================================================================
  // Task 2: Drag and Drop (DND) Skill Optimizer
  // =========================================================================
  const [isDragOverSkillsDropzone, setIsDragOverSkillsDropzone] = useState<boolean>(false);

  const handleDragStart = (e: React.DragEvent, skillName: string) => {
    e.dataTransfer.setData("text/plain", skillName);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverSkillsDropzone(true);
  };

  const handleDragLeave = () => {
    setIsDragOverSkillsDropzone(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverSkillsDropzone(false);
    const skillName = e.dataTransfer.getData("text/plain");
    
    if (skillName) {
      const trimmed = skillName.trim();
      const alreadyHas = resumeData.skills.some(s => s.toLowerCase() === trimmed.toLowerCase());
      if (alreadyHas) return;

      // Ensure stable snapshot is logged in historical stack before modifying state
      saveImmediateSnapshot();
      
      setResumeData(prev => ({
        ...prev,
        skills: [...prev.skills, trimmed]
      }));
    }
  };


  // =========================================================================
  // Premium Utilities States (Grammar, Salary, Voice, Exports, Heatmap)
  // =========================================================================
  const [salaryInsightsOpen, setSalaryInsightsOpen] = useState<boolean>(false);
  const [salaryRole, setSalaryRole] = useState<string>("");
  const [salaryExp, setSalaryExp] = useState<number>(4);

  const [heatmapMetric, setHeatmapMetric] = useState<"proficiency" | "demand" | "relevance">("proficiency");
  const [skillsProficiency, setSkillsProficiency] = useState<Record<string, number>>({});
  const [skillsDemand, setSkillsDemand] = useState<Record<string, number>>({});
  const [skillsRelevance, setSkillsRelevance] = useState<Record<string, number>>({});

  const [smartSuggestionsCategory, setSmartSuggestionsCategory] = useState<'verbs' | 'industry_terms' | 'ats_optimized'>('verbs');

  const triggerAutoSaveRetry = () => {
    setAutoSaveShouldFail(false);
    handleManualSave();
  };

  const applySmartSuggestion = (text: string, type: 'summary' | 'grammar' | 'skill') => {
    saveImmediateSnapshot();
    if (type === 'summary') {
      setResumeData(prev => {
        const currentSummary = prev.summary || "";
        const updated = currentSummary ? currentSummary + " " + text : text;
        return { ...prev, summary: updated };
      });
      alert(t("playgroundUi.appliedSummary"));
    } else if (type === 'grammar') {
      setPremiumGrammarText(text);
      setEditSection('summary');
      alert(t("playgroundUi.copiedGrammar"));
    } else if (type === 'skill') {
      const cleanSkill = text.replace(/^[•-\s]+/, "").trim();
      setResumeData(prev => {
        const hasSkill = prev.skills.some(s => s.toLowerCase() === cleanSkill.toLowerCase());
        if (hasSkill) return prev;
        return { ...prev, skills: [...prev.skills, cleanSkill] };
      });
      alert(t("playgroundUi.addedSkill", { skill: cleanSkill }));
    }
  };

  // WYSIWYG Editor State and formatting logic
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const [selectedVerbCategory, setSelectedVerbCategory] = useState<string | null>(null);
  const [verbsPanelOpen, setVerbsPanelOpen] = useState<boolean>(false);
  const [expandedStrengthSec, setExpandedStrengthSec] = useState<string | null>(null);

  // High-impact action verbiage mapped by domain categories
  const actionVerbsCategories = useMemo(() => [
    {
      key: "tech",
      name: "Technical & Engineering",
      icon: Code,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
      activeColor: "bg-emerald-600 text-white border-emerald-600",
      verbs: ["Architected", "Engineered", "Programmed", "Deployed", "Refactored", "Optimized", "Designed", "Formulated", "Automated", "Overhauled", "Debugging", "Interfaced", "Consolidated", "Streamlined", "Synthesized", "Configured"]
    },
    {
      key: "leadership",
      name: "Leadership & Management",
      icon: Award,
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
      activeColor: "bg-rose-600 text-white border-rose-600",
      verbs: ["Spearheaded", "Led", "Directed", "Orchestrated", "Guided", "Chaired", "Championed", "Executed", "Cultivated", "Delegated", "Supervised", "Coordinated", "Pioneered", "Forged", "Mentored", "Advocated"]
    },
    {
      key: "analysis",
      name: "Data & Analysis",
      icon: Layers,
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
      activeColor: "bg-amber-600 text-white border-amber-600",
      verbs: ["Analyzed", "Audited", "Deciphered", "Forecasted", "Evaluated", "Validated", "Interpreted", "Dissected", "Modelled", "Investigated", "Quantified", "Extracted", "Scrutinized", "Synthesized", "Diagnosed", "Mapped"]
    },
    {
      key: "growth",
      name: "Business & Growth",
      icon: TrendingUp,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
      activeColor: "bg-emerald-600 text-white border-emerald-600",
      verbs: ["Accelerated", "Maximized", "Generated", "Negotiated", "Secured", "Captured", "Amplified", "Monetized", "Expanded", "Boosted", "Calculated", "Acquired", "Substantiated", "Synergized", "Outpaced", "Propelled"]
    },
    {
      key: "innovation",
      name: "Product & Innovation",
      icon: Sparkles,
      badgeColor: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
      activeColor: "bg-violet-600 text-white border-violet-600",
      verbs: ["Pioneered", "Launched", "Conceptualized", "Implemented", "Devised", "Originated", "Initiated", "Revitalized", "Incubated", "Translated", "Redesigned", "Disrupted", "Modernized", "Transformed", "Pioneered"]
    }
  ], []);

  const getRecommendedVerbCategory = (): string => {
    const currentTitle = (resumeData.personalInfo.title || "").toLowerCase();
    if (!currentTitle) return "tech"; // default fallback
    
    if (currentTitle.match(/engineer|developer|programmer|architect|tech|web|frontend|backend|fullstack|devops|cloud|data/)) {
      return "tech";
    }
    if (currentTitle.match(/manager|director|lead|head|product|scrum|chief|executive|vp|ceo/)) {
      return "leadership";
    }
    if (currentTitle.match(/analyst|finance|consultant|accountant|audit|business/)) {
      return "analysis";
    }
    if (currentTitle.match(/sales|marketing|growth|seo|brand|account/)) {
      return "growth";
    }
    return "innovation";
  };

  const activeVerbCategoryKey = selectedVerbCategory || getRecommendedVerbCategory();

  const insertActionVerb = (verb: string) => {
    if (!activeInputId) return;
    const element = document.getElementById(activeInputId) as HTMLInputElement | HTMLTextAreaElement;
    if (!element) return;

    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    const value = element.value;

    const textToInsert = verb + " ";
    const updatedValue = value.substring(0, start) + textToInsert + value.substring(end);

    // Apply the update to the React state based on which field was active
    if (activeInputId === 'textarea-summary') {
      updateSummary(updatedValue);
    } else if (activeInputId.startsWith('input-bullet-')) {
      const parts = activeInputId.replace('input-bullet-', '').split('___');
      const expId = parts[0];
      const bIdx = parseInt(parts[1], 10);
      updateExperienceBullet(expId, bIdx, updatedValue);
    } else if (activeInputId === 'input-name') {
      updatePersonalInfo('name', updatedValue);
    } else if (activeInputId === 'input-job-title') {
      updatePersonalInfo('title', updatedValue);
    } else if (activeInputId === 'input-email') {
      updatePersonalInfo('email', updatedValue);
    } else if (activeInputId === 'input-phone') {
      updatePersonalInfo('phone', updatedValue);
    } else if (activeInputId === 'input-location') {
      updatePersonalInfo('location', updatedValue);
    } else if (activeInputId === 'input-website') {
      updatePersonalInfo('website', updatedValue);
    } else if (activeInputId === 'jd-textarea') {
      setJobDescription(updatedValue);
    }

    // Refocus and restore cursor location
    setTimeout(() => {
      element.focus();
      const newCursorPos = start + textToInsert.length;
      element.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleElementSelectOrFocus = (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setActiveInputId(e.currentTarget.id);
  };

  const applyFormatToActiveField = (formatType: 'bold' | 'italic' | 'bullet') => {
    if (!activeInputId) return;
    const element = document.getElementById(activeInputId) as HTMLInputElement | HTMLTextAreaElement;
    if (!element) return;

    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    const value = element.value;

    const selectedText = value.substring(start, end);
    let newText = "";

    if (formatType === 'bold') {
      if (selectedText.startsWith('**') && selectedText.endsWith('**')) {
        newText = selectedText.slice(2, -2);
      } else {
        newText = `**${selectedText}**`;
      }
    } else if (formatType === 'italic') {
      if (selectedText.startsWith('*') && selectedText.endsWith('*')) {
        newText = selectedText.slice(1, -1);
      } else {
        newText = `*${selectedText}*`;
      }
    } else if (formatType === 'bullet') {
      if (selectedText.startsWith('• ')) {
        newText = selectedText.replace(/^•\s*/, '');
      } else {
        newText = `• ${selectedText}`;
      }
    }

    const updatedValue = value.substring(0, start) + newText + value.substring(end);

    // Apply the update to the React state based on which field was active
    if (activeInputId === 'textarea-summary') {
      updateSummary(updatedValue);
    } else if (activeInputId.startsWith('input-bullet-')) {
      const parts = activeInputId.replace('input-bullet-', '').split('___');
      const expId = parts[0];
      const bIdx = parseInt(parts[1], 10);
      updateExperienceBullet(expId, bIdx, updatedValue);
    } else if (activeInputId === 'input-name') {
      updatePersonalInfo('name', updatedValue);
    } else if (activeInputId === 'input-job-title') {
      updatePersonalInfo('title', updatedValue);
    } else if (activeInputId === 'input-email') {
      updatePersonalInfo('email', updatedValue);
    } else if (activeInputId === 'input-phone') {
      updatePersonalInfo('phone', updatedValue);
    } else if (activeInputId === 'input-location') {
      updatePersonalInfo('location', updatedValue);
    } else if (activeInputId === 'input-website') {
      updatePersonalInfo('website', updatedValue);
    } else if (activeInputId === 'jd-textarea') {
      setJobDescription(updatedValue);
    }

    // Refocus element and restore selection
    setTimeout(() => {
      element.focus();
      const newCursorPos = start + newText.length;
      element.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const salaryEstimate = React.useMemo(
    () => estimateSalary(salaryRole || resumeData.personalInfo?.title || "Software Engineer", salaryExp),
    [salaryRole, salaryExp, resumeData.personalInfo?.title]
  );

  // React.useMemo to calculate dynamic overall resume strength / quality score
  const resumeStrength = React.useMemo(() => {
    let score = 0;
    const breakdown = [
      {
        id: "contact",
        label: t("strengthGauge.sections.contact"),
        weight: 20,
        completed: false,
        score: 0,
        details: [] as string[]
      },
      {
        id: "summary",
        label: t("strengthGauge.sections.summary"),
        weight: 15,
        completed: false,
        score: 0,
        details: [] as string[]
      },
      {
        id: "experience",
        label: t("strengthGauge.sections.experience"),
        weight: 30,
        completed: false,
        score: 0,
        details: [] as string[]
      },
      {
        id: "education",
        label: t("strengthGauge.sections.education"),
        weight: 20,
        completed: false,
        score: 0,
        details: [] as string[]
      },
      {
        id: "skills",
        label: t("strengthGauge.sections.skills"),
        weight: 15,
        completed: false,
        score: 0,
        details: [] as string[]
      }
    ];

    // 1. Contact (20%)
    const personal = resumeData.personalInfo || {};
    let contactCompletedCount = 0;
    if (personal.name && personal.name.trim().length > 1) contactCompletedCount++;
    else breakdown[0].details.push(t("strengthGauge.missing.name"));

    if (personal.title && personal.title.trim().length > 1) contactCompletedCount++;
    else breakdown[0].details.push(t("strengthGauge.missing.title"));

    if (personal.email && personal.email.trim().length > 3) contactCompletedCount++;
    else breakdown[0].details.push(t("strengthGauge.missing.email"));

    if (personal.phone && personal.phone.trim().length > 3) contactCompletedCount++;
    else breakdown[0].details.push(t("strengthGauge.missing.phone"));

    if (personal.location && personal.location.trim().length > 2) contactCompletedCount++;
    else breakdown[0].details.push(t("strengthGauge.missing.location"));

    breakdown[0].score = Math.round((contactCompletedCount / 5) * 20);
    breakdown[0].completed = contactCompletedCount === 5;

    // 2. Summary (15%)
    const sumVal = resumeData.summary || "";
    if (sumVal.trim().length >= 100) {
      breakdown[1].score = 15;
      breakdown[1].completed = true;
    } else if (sumVal.trim().length > 0) {
      breakdown[1].score = 8;
      breakdown[1].details.push(t("strengthGauge.details.summaryBrief"));
    } else {
      breakdown[1].score = 0;
      breakdown[1].details.push(t("strengthGauge.details.summaryMissing"));
    }

    // 3. Work Experience (30%)
    const expList = resumeData.experience || [];
    if (expList.length === 0) {
      breakdown[2].score = 0;
      breakdown[2].details.push(t("strengthGauge.details.experienceEmpty"));
    } else {
      let experienceItemTotal = 0;
      const experienceItemWeight = 30 / Math.max(1, expList.length);
      expList.forEach((exp, idx) => {
        let itemScore = 0;
        if (exp.company && exp.company.trim().length > 0) itemScore += 2;
        if (exp.role && exp.role.trim().length > 0) itemScore += 2;
        if (exp.startDate && exp.startDate.trim().length > 0) itemScore += 1;
        
        const bulletsCount = exp.bullets ? exp.bullets.filter(b => b && b.trim().length > 10).length : 0;
        if (bulletsCount >= 3) {
          itemScore += 5;
        } else if (bulletsCount > 0) {
          itemScore += bulletsCount * 1.5;
          breakdown[2].details.push(t("strengthGauge.details.experienceBullets", { role: exp.role || t("editor.fields.role"), company: exp.company || t("editor.fields.company") }));
        } else {
          breakdown[2].details.push(t("strengthGauge.details.experienceBulletsMissing", { role: exp.role || t("editor.fields.role"), company: exp.company || t("editor.fields.company") }));
        }
        experienceItemTotal += (itemScore / 10) * experienceItemWeight;
      });
      breakdown[2].score = Math.round(Math.min(30, experienceItemTotal));
      breakdown[2].completed = breakdown[2].score >= 26;
    }

    // 4. Education (20%)
    const eduList = resumeData.education || [];
    if (eduList.length === 0) {
      breakdown[3].score = 0;
      breakdown[3].details.push(t("strengthGauge.details.educationEmpty"));
    } else {
      let educationTotal = 0;
      const educationWeight = 20 / Math.max(1, eduList.length);
      eduList.forEach((edu) => {
        let itemScore = 0;
        if (edu.institution && edu.institution.trim().length > 0) itemScore += 4;
        if (edu.degree && edu.degree.trim().length > 0) itemScore += 3;
        if (edu.field && edu.field.trim().length > 0) itemScore += 3;
        educationTotal += (itemScore / 10) * educationWeight;
      });
      breakdown[3].score = Math.round(educationTotal);
      breakdown[3].completed = breakdown[3].score >= 16;
    }

    // 5. Skills (15%)
    const skillsList = resumeData.skills || [];
    if (skillsList.length >= 6) {
      breakdown[4].score = 15;
      breakdown[4].completed = true;
    } else if (skillsList.length >= 3) {
      breakdown[4].score = 10;
      breakdown[4].details.push(t("strengthGauge.details.skillsTarget"));
    } else if (skillsList.length > 0) {
      breakdown[4].score = 5;
      breakdown[4].details.push(t("strengthGauge.details.skillsNarrow"));
    } else {
      breakdown[4].score = 0;
      breakdown[4].details.push(t("strengthGauge.details.skillsEmpty"));
    }

    // Sum overall score
    score = breakdown.reduce((sum, item) => sum + item.score, 0);
    score = Math.min(100, Math.max(0, score));

    return { score, breakdown };
  }, [resumeData, t]);

  // Experience and skills manual modification helpers
  const updatePersonalInfo = (field: string, value: string) => {
    setResumeData({
      ...resumeData,
      personalInfo: {
        ...resumeData.personalInfo,
        [field]: value
      }
    });
  };

  const updateSummary = (value: string) => {
    setResumeData({
      ...resumeData,
      summary: value
    });
  };

  const updateExperienceBullet = (expId: string, bulletIdx: number, value: string) => {
    const updatedExp = resumeData.experience.map(exp => {
      if (exp.id === expId) {
        const newBullets = [...exp.bullets];
        newBullets[bulletIdx] = value;
        return { ...exp, bullets: newBullets };
      }
      return exp;
    });
    setResumeData({ ...resumeData, experience: updatedExp });
  };

  const addExperienceBullet = (expId: string) => {
    const updatedExp = resumeData.experience.map(exp => {
      if (exp.id === expId) {
        return { ...exp, bullets: [...exp.bullets, "New achievement statement..."] };
      }
      return exp;
    });
    setResumeData({ ...resumeData, experience: updatedExp });
  };

  const removeExperienceBullet = (expId: string, bulletIdx: number) => {
    const updatedExp = resumeData.experience.map(exp => {
      if (exp.id === expId) {
        const newBullets = exp.bullets.filter((_, idx) => idx !== bulletIdx);
        return { ...exp, bullets: newBullets };
      }
      return exp;
    });
    setResumeData({ ...resumeData, experience: updatedExp });
  };

  const addSkill = (skillName: string) => {
    if (!skillName.trim() || resumeData.skills.includes(skillName.trim())) return;
    setResumeData({
      ...resumeData,
      skills: [...resumeData.skills, skillName.trim()]
    });
  };

  const removeSkill = (skillIndex: number) => {
    const filteredSkills = resumeData.skills.filter((_, idx) => idx !== skillIndex);
    setResumeData({
      ...resumeData,
      skills: filteredSkills
    });
  };

  const insertPreformattedSection = (type: 'certifications' | 'volunteerWork' | 'languages') => {
    let defaultValues: string[] = [];
    if (type === 'certifications') {
      defaultValues = [
        "AWS Certified Solutions Architect – Associate",
        "Meta Front-End Developer Professional Certification (Coursera)"
      ];
    } else if (type === 'volunteerWork') {
      defaultValues = [
        "Volunteer Technical Mentor – Austin Youth Coding Initiative (taught HTML5/CSS3 basics to high schoolers)",
        "Open Source Contributor – Assisted with documentation & bug-fixes on modern React router layouts"
      ];
    } else if (type === 'languages') {
      defaultValues = [
        "English (Native)",
        "Spanish (Professional / Technical)",
        "German (Conversational)"
      ];
    }

    setResumeData(prev => ({
      ...prev,
      [type]: defaultValues
    }));
    setEditSection(type);
    setDropdownOpen(false);
  };

  const addLanguage = (name: string) => {
    if (!name.trim()) return;
    const current = resumeData.languages || [];
    if (current.includes(name.trim())) return;
    setResumeData({
      ...resumeData,
      languages: [...current, name.trim()]
    });
  };

  const removeLanguage = (idx: number) => {
    const current = resumeData.languages || [];
    setResumeData({
      ...resumeData,
      languages: current.filter((_, i) => i !== idx)
    });
  };

  const addCertification = (name: string) => {
    if (!name.trim()) return;
    const current = resumeData.certifications || [];
    if (current.includes(name.trim())) return;
    setResumeData({
      ...resumeData,
      certifications: [...current, name.trim()]
    });
  };

  const removeCertification = (idx: number) => {
    const current = resumeData.certifications || [];
    setResumeData({
      ...resumeData,
      certifications: current.filter((_, i) => i !== idx)
    });
  };

  const addVolunteerWork = (name: string) => {
    if (!name.trim()) return;
    const current = resumeData.volunteerWork || [];
    if (current.includes(name.trim())) return;
    setResumeData({
      ...resumeData,
      volunteerWork: [...current, name.trim()]
    });
  };

  const removeVolunteerWork = (idx: number) => {
    const current = resumeData.volunteerWork || [];
    setResumeData({
      ...resumeData,
      volunteerWork: current.filter((_, i) => i !== idx)
    });
  };

  return (
    <div
      className={
        isPreviewMode
          ? "flex flex-col flex-1 min-h-0 h-full"
          : "flex flex-1 min-h-0 h-full overflow-hidden"
      }
      id="playground-core"
    >
      <MarketBanner />
      {!isPreviewMode ? (
        <PlaygroundSidebarNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          saveStatus={saveStatus}
          lastSavedTime={lastSavedTime}
          liveAtsScore={liveAtsScore}
          detectedKeywords={detectedKeywords}
          activeKeywordsList={activeKeywordsList}
          loading={loading}
          aiAvailable={aiAvailable}
          tailorIntensity={tailorIntensity}
          tailorError={tailorError}
          onReset={onResetWorkspace}
          onOpenPreviewStudio={openCanvasPreviewStudio}
          onTriggerAnalyze={triggerAITailor}
          onRetrySave={triggerAutoSaveRetry}
          onIntensityChange={setTailorIntensity}
          onNavigateOverview={onNavigateOverview}
          theme={theme}
          onThemeToggle={onThemeToggle}
          onTourOpen={onTourOpen}
          onOpenApplicationWizard={() => wizard.openWizard(jobDescription)}
        />
      ) : null}

      {/* Center + Right: 可拖曳分隔的編輯 / 預覽區 */}
      {!isPreviewMode ? (
        <ResizableSplitPane
          defaultRatio={0.48}
          minLeftPx={260}
          minRightPx={240}
          left={
            <div
              className="flex flex-col gap-2 no-print px-3 py-2 h-full min-h-0 overflow-y-auto scrollbar-thin"
              id="config-col"
            >
        {/* Subtab View 1: Manual Resume & Job Description Editor */}
        {activeTab === 'content' && (
          <ContentTabEditorPanel
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            resumeData={resumeData}
            setResumeData={setResumeData}
            activeInputId={activeInputId}
            handleElementSelectOrFocus={handleElementSelectOrFocus}
            applyFormatToActiveField={applyFormatToActiveField}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            editSection={editSection}
            setEditSection={setEditSection}
            setImportModalOpen={setImportModalOpen}
            verbsPanelOpen={verbsPanelOpen}
            setVerbsPanelOpen={setVerbsPanelOpen}
            selectedVerbCategory={selectedVerbCategory}
            setSelectedVerbCategory={setSelectedVerbCategory}
            grammarChecking={grammarChecking}
            runGrammarToneCheck={runGrammarToneCheck}
            readabilityChecking={readabilityChecking}
            runReadabilityComplexityCheck={runReadabilityComplexityCheck}
            skillConsistencyChecking={skillConsistencyChecking}
            runSkillConsistencyCheck={runSkillConsistencyCheck}
            saveImmediateSnapshot={saveImmediateSnapshot}
            isDragOverSkillsDropzone={isDragOverSkillsDropzone}
            handleDragStart={handleDragStart}
            handleDragEnter={handleDragEnter}
            handleDragLeave={handleDragLeave}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            updatePersonalInfo={updatePersonalInfo}
            updateSummary={updateSummary}
            updateExperienceBullet={updateExperienceBullet}
            addExperienceBullet={addExperienceBullet}
            removeExperienceBullet={removeExperienceBullet}
            addSkill={addSkill}
            removeSkill={removeSkill}
            insertPreformattedSection={insertPreformattedSection}
            addCertification={addCertification}
            removeCertification={removeCertification}
            addVolunteerWork={addVolunteerWork}
            removeVolunteerWork={removeVolunteerWork}
            addLanguage={addLanguage}
            removeLanguage={removeLanguage}
            getRecommendedVerbCategory={getRecommendedVerbCategory}
            insertActionVerb={insertActionVerb}
            actionVerbsCategories={actionVerbsCategories}
            activeVerbCategoryKey={activeVerbCategoryKey}
            detectedKeywords={detectedKeywords}
          />
        )}

        {activeTab === 'match' && (
          <MatchTabPanel
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            liveAtsScore={liveAtsScore}
            detectedKeywords={detectedKeywords}
            activeKeywordsList={activeKeywordsList}
            matcherHighlightActive={matcherHighlightActive}
            setMatcherHighlightActive={setMatcherHighlightActive}
            matchLoading={matchLoading}
            matchError={matchError}
            matchAnalysisResult={matchAnalysisResult}
            triggerAIMatchAnalysis={triggerAIMatchAnalysis}
          />
        )}

        {activeTab === 'tailor' && (
        <TailorTabPanel
          analysisResult={analysisResult}
          setActiveTab={setActiveTab}
          triggerAITailor={triggerAITailor}
          lastAnalysisSimulated={lastAnalysisSimulated}
          liveAtsScore={liveAtsScore}
          activeKeywordsList={activeKeywordsList}
          detectedKeywords={detectedKeywords}
          grammarResult={grammarResult}
          grammarChecking={grammarChecking}
          runGrammarToneCheck={runGrammarToneCheck}
          readabilityResult={readabilityResult}
          readabilityChecking={readabilityChecking}
          runReadabilityComplexityCheck={runReadabilityComplexityCheck}
          setReadabilityDrawerOpen={setReadabilityDrawerOpen}
          skillConsistencyResult={skillConsistencyResult}
          skillConsistencyChecking={skillConsistencyChecking}
          runSkillConsistencyCheck={runSkillConsistencyCheck}
          setSkillConsistencyDrawerOpen={setSkillConsistencyDrawerOpen}
          resumeData={resumeData}
          handleApplyTailoredItem={handleApplyTailoredItem}
        />
        )}

        {activeTab === 'tools' && (
          <Suspense fallback={<TabPanelSuspenseFallback />}>
          <ToolsTabPanel
            voiceRecording={voiceRecording}
            voiceStatus={voiceStatus}
            voiceTarget={voiceTarget}
            setVoiceTarget={setVoiceTarget}
            toggleVoiceRecording={toggleVoiceRecording}
            premiumGrammarText={premiumGrammarText}
            setPremiumGrammarText={setPremiumGrammarText}
            premiumGrammarChecking={premiumGrammarChecking}
            runPremiumGrammarCheck={runPremiumGrammarCheck}
            premiumGrammarResult={premiumGrammarResult}
            salaryRole={salaryRole}
            setSalaryRole={setSalaryRole}
            salaryExp={salaryExp}
            setSalaryExp={setSalaryExp}
            salaryInsightsOpen={salaryInsightsOpen}
            setSalaryInsightsOpen={setSalaryInsightsOpen}
            resumeData={resumeData}
            setResumeData={setResumeData}
            jobDescription={jobDescription}
            heatmapMetric={heatmapMetric}
            setHeatmapMetric={setHeatmapMetric}
            skillsDemand={skillsDemand}
            setSkillsDemand={setSkillsDemand}
            skillsProficiency={skillsProficiency}
            setSkillsProficiency={setSkillsProficiency}
            skillsRelevance={skillsRelevance}
            setSkillsRelevance={setSkillsRelevance}
            smartSuggestionsCategory={smartSuggestionsCategory}
            setSmartSuggestionsCategory={setSmartSuggestionsCategory}
            analysisResult={analysisResult}
            applySmartSuggestion={applySmartSuggestion}
            isAtsCrawling={isAtsCrawling}
            triggerAtsCrawlerSim={triggerAtsCrawlerSim}
            atsLogs={atsLogs}
            clearAtsLogs={clearAtsLogs}
            crawlerSource={crawlerSource}
            setCrawlerSource={setCrawlerSource}
            isComparing={isComparing}
            runResumeComparison={runResumeComparison}
            comparatorResult={comparatorResult}
            comparatorOpen={comparatorOpen}
            setComparatorOpen={setComparatorOpen}
            handleManualSave={handleManualSave}
            shortcutsModalOpen={shortcutsModalOpen}
            setShortcutsModalOpen={setShortcutsModalOpen}
            activeTemplate={activeTemplate}
            setActiveTemplate={setActiveTemplate}
            autoSaveShouldFail={autoSaveShouldFail}
            setAutoSaveShouldFail={setAutoSaveShouldFail}
            addSystemLog={addSystemLog}
            highlightChanges={highlightChanges}
            detectedKeywords={detectedKeywords}
            activeKeywordsList={activeKeywordsList}
            salaryEstimate={salaryEstimate}
            saveImmediateSnapshot={saveImmediateSnapshot}
            matcherHighlightActive={matcherHighlightActive}
          />
          </Suspense>
        )}

        {activeTab === "applications" && (
          <Suspense fallback={<TabPanelSuspenseFallback />}>
          <ApplicationTrackerPanel
            packages={applicationPackages}
            selectedId={selectedApplicationId}
            onSelect={setSelectedApplicationId}
            onStatusChange={updateApplicationStatus}
            onDelete={removeApplicationPackage}
            onLoadPackage={loadApplicationPackage}
            onOpenWizard={() => wizard.openWizard(jobDescription)}
            onSaveCoverLetter={saveApplicationCoverLetter}
            onSaveNotes={handleSaveApplicationNotes}
            onGenerateInterview={handleGenerateInterview}
            onGenerateCompany={handleGenerateCompany}
            interviewLoading={interviewLoading}
            companyLoading={companyLoading}
            onExportFull={exportFullPackage}
            onExportMergedPdf={exportMergedPdf}
            onExportMergedOoxml={exportMergedOoxml}
            onExportResume={exportApplicationResume}
            onExportCoverLetter={exportApplicationCoverLetter}
            exporting={applicationExporting}
            notificationSupported={followUpNotifications.supported}
            notificationsEnabled={followUpNotifications.prefs.enabled}
            notificationsEnabling={followUpNotifications.enabling}
            pendingReminders={followUpNotifications.pendingReminders}
            onEnableNotifications={async () => {
              const result = await followUpNotifications.enableNotifications();
              if (result.ok) {
                pushToast("success", t("toast.playground.followUpEnabled"));
              } else if (result.reason === "denied") {
                pushToast("error", t("toast.playground.notificationDenied"));
              } else if (result.reason === "unsupported") {
                pushToast("warning", t("toast.playground.pushNotSupported"));
              } else {
                pushToast("info", t("toast.playground.notificationNotGranted"));
              }
            }}
            onDisableNotifications={() => {
              followUpNotifications.disableNotifications();
              pushToast("info", t("toast.playground.followUpDisabled"));
            }}
            measuredFetch={measuredFetch}
            pushToast={pushToast}
            onJobImported={handleJobImported}
            onCreateDraftFromImport={handleCreateDraftFromImport}
            onOpenWizardWithImport={handleOpenWizardWithImport}
          />
          </Suspense>
        )}

        {activeTab === "preview" && (
          <>
            <PreviewConfigPanel
              activeTemplate={activeTemplate}
              setActiveTemplate={setActiveTemplate}
              analysisResult={analysisResult}
              highlightChanges={highlightChanges}
              setHighlightChanges={setHighlightChanges}
            />

            <CollapsiblePanel
              id="system-diagnostic-panel-wrap"
              title={t("strengthGauge.diagnosticsTitle")}
              subtitle={t("strengthGauge.diagnosticsSubtitle")}
              defaultOpen={false}
            >
              <SystemDiagnosticsPanel
                apiLatency={apiLatency}
                apiLogs={apiLogs}
                onExportLogs={exportSystemLogsWithToast}
                onOpenShortcutsGuide={() => setShortcutsModalOpen(true)}
                embedded
              />
            </CollapsiblePanel>

            <CollapsiblePanel
              id="strength-gauge-card-panel-wrap"
              title={t("strengthGauge.title")}
              subtitle={t("strengthGauge.subtitle", { score: resumeStrength.score })}
              defaultOpen={false}
              badge={
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {resumeStrength.score >= 85 ? t("strengthGauge.excellent") : resumeStrength.score >= 65 ? t("strengthGauge.good") : t("strengthGauge.needsWork")}
                </span>
              }
            >
              <div className="space-y-3" id="strength-gauge-card-panel">
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <div className="relative shrink-0 flex items-center justify-center w-20 h-20">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="32" className="stroke-slate-200/80 fill-none" strokeWidth="5.5" />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      className={`fill-none transition-all duration-550 ease-out ${
                        resumeStrength.score >= 85
                          ? "stroke-emerald-500"
                          : resumeStrength.score >= 65
                          ? "stroke-blue-500"
                          : resumeStrength.score >= 40
                          ? "stroke-amber-500"
                          : "stroke-rose-500"
                      }`}
                      strokeWidth="5.5"
                      strokeDasharray={2 * Math.PI * 32}
                      strokeDashoffset={2 * Math.PI * 32 - (resumeStrength.score / 100) * (2 * Math.PI * 32)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-base font-black text-slate-800 font-mono tracking-tight leading-none">{resumeStrength.score}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">%</span>
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="text-xs font-bold text-slate-700 font-sans">
                    {resumeStrength.score === 100
                      ? t("strengthGauge.perfect")
                      : resumeStrength.score >= 85
                      ? t("strengthGauge.strong")
                      : resumeStrength.score >= 65
                      ? t("strengthGauge.moderate")
                      : t("strengthGauge.weak")}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed font-sans">
                    {t("strengthGauge.progress", { score: resumeStrength.score, remaining: 100 - resumeStrength.score })}
                  </p>
                </div>
                </div>
              </div>

              <div className="space-y-1.5 font-sans">
                <span className="text-[9px] font-black font-mono uppercase tracking-widest text-slate-400 block mb-1">{t("strengthGauge.checklist")}</span>
                {resumeStrength.breakdown.map((item) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 transition select-none">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedStrengthSec(expandedStrengthSec === item.id ? null : item.id)}
                    >
                      <div className="flex items-center gap-2">
                        {item.completed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                        ) : (
                          <AlertCircle className={`w-4 h-4 ${item.score > 0 ? "text-amber-500 fill-amber-50" : "text-slate-300"}`} />
                        )}
                        <span className="text-xs font-bold text-slate-700">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200/50 px-1.5 py-0.5 rounded">
                          {item.score}/{item.weight}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedStrengthSec === item.id ? "rotate-180" : ""}`} />
                      </div>
                    </div>

                    {expandedStrengthSec === item.id && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 pl-6 space-y-1.5 animate-fade-in text-xs">
                        {item.details.length === 0 ? (
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>{t("strengthGauge.sectionComplete")}</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wide text-amber-600 block">{t("strengthGauge.todo")}</span>
                            {item.details.map((detail, idx) => (
                              <div key={idx} className="flex gap-1.5 text-[10px] text-slate-500 leading-relaxed">
                                <span className="text-amber-500 select-none shrink-0">•</span>
                                <span className="font-semibold text-slate-600">{detail}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CollapsiblePanel>
          </>
        )}

            </div>
          }
          right={
            <ResumeLivePreviewPanel
              isPreviewMode={isPreviewMode}
              setIsPreviewMode={setIsPreviewMode}
              liveAtsScore={liveAtsScore}
              previewZoom={previewZoom}
              setPreviewZoom={setPreviewZoom}
              grayscaleMode={grayscaleMode}
              setGrayscaleMode={setGrayscaleMode}
              studioViewMode={studioViewMode}
              setStudioViewMode={setStudioViewMode}
              activeTemplate={activeTemplate}
              setActiveTemplate={setActiveTemplate}
              history={history}
              handleUndo={handleUndo}
              chatOpen={chatOpen}
              setChatOpen={setChatOpen}
              pdfExporting={pdfExporting}
              exportToPDF={exportToPDF}
              exportToJson={exportToJson}
              exportToDocx={exportToDocx}
              resumeData={resumeData}
              highlightChanges={highlightChanges}
              setHighlightChanges={setHighlightChanges}
              analysisResult={analysisResult}
              detectedKeywords={detectedKeywords}
              activeKeywordsList={activeKeywordsList}
              matcherHighlightActive={matcherHighlightActive}
              setMatcherHighlightActive={setMatcherHighlightActive}
              atsScoreExpanded={atsScoreExpanded}
              setAtsScoreExpanded={setAtsScoreExpanded}
              themeCustomization={themeCustomization}
              onThemeCustomizationChange={updateThemeCustomization}
              onThemeCustomizationReset={resetThemeCustomization}
              resolvedTheme={resolvedTheme}
            />
          }
        />
      ) : (
        <ResumeLivePreviewPanel
          isPreviewMode={isPreviewMode}
          setIsPreviewMode={setIsPreviewMode}
          liveAtsScore={liveAtsScore}
          previewZoom={previewZoom}
          setPreviewZoom={setPreviewZoom}
          grayscaleMode={grayscaleMode}
          setGrayscaleMode={setGrayscaleMode}
          studioViewMode={studioViewMode}
          setStudioViewMode={setStudioViewMode}
          activeTemplate={activeTemplate}
          setActiveTemplate={setActiveTemplate}
          history={history}
          handleUndo={handleUndo}
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          pdfExporting={pdfExporting}
          exportToPDF={exportToPDF}
          exportToJson={exportToJson}
          exportToDocx={exportToDocx}
          resumeData={resumeData}
          highlightChanges={highlightChanges}
          setHighlightChanges={setHighlightChanges}
          analysisResult={analysisResult}
          detectedKeywords={detectedKeywords}
          activeKeywordsList={activeKeywordsList}
          matcherHighlightActive={matcherHighlightActive}
          setMatcherHighlightActive={setMatcherHighlightActive}
          atsScoreExpanded={atsScoreExpanded}
          setAtsScoreExpanded={setAtsScoreExpanded}
          themeCustomization={themeCustomization}
          onThemeCustomizationChange={updateThemeCustomization}
          onThemeCustomizationReset={resetThemeCustomization}
          resolvedTheme={resolvedTheme}
        />
      )}

      <GrammarToneDrawer
        open={grammarDrawerOpen}
        onClose={() => setGrammarDrawerOpen(false)}
        grammarResult={grammarResult}
        appliedSuggestions={appliedSuggestions}
        onApplySuggestion={applySuggestedCorrection}
      />

      <ReadabilityDrawer
        open={readabilityDrawerOpen}
        onClose={() => setReadabilityDrawerOpen(false)}
        readabilityResult={readabilityResult}
        appliedSuggestions={appliedSuggestions}
        onApplyCorrection={applyReadabilityCorrection}
      />

      <SkillConsistencyDrawer
        open={skillConsistencyDrawerOpen}
        onClose={() => setSkillConsistencyDrawerOpen(false)}
        skillConsistencyResult={skillConsistencyResult}
        resumeData={resumeData}
        onAddSuggestedSkill={handleAddSuggestedSkill}
        onRemoveFlaggedSkill={handleRemoveFlaggedSkill}
      />

    <GeminiChatSidebar
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        thinkingMode={thinkingMode}
        onThinkingModeChange={setThinkingMode}
        chatMessages={chatMessages}
        chatInput={chatInput}
        onChatInputChange={setChatInput}
        chatLoading={chatLoading}
        onSendMessage={executeSendChatMessage}
        resumeData={resumeData}
      />

    <ResumeImportModal
      open={importModalOpen}
      onClose={() => setImportModalOpen(false)}
      measuredFetch={measuredFetch}
      onImported={(data) => {
        setResumeData(data);
        pushToast("success", t("toast.playground.resumeParsed"));
        addSystemLog("info", "使用者透過文字解析匯入履歷資料。");
      }}
    />

    <ApplicationWizardModal
      open={wizard.open}
      onClose={wizard.closeWizard}
      uiStep={wizard.uiStep}
      setUiStep={wizard.setUiStep}
      form={wizard.form}
      updateForm={wizard.updateForm}
      progress={wizard.progress}
      running={wizard.running}
      result={wizard.result}
      resumeData={resumeData}
      onRunPipeline={wizard.runPipeline}
      onFinish={handleWizardFinish}
      measuredFetch={measuredFetch}
      pushToast={pushToast}
    />

    <StatusToastStack toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}
