/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, lazy, Suspense, useEffect } from "react";
import { TemplateStyle, TailorIntensity } from "../types";
import ResumeImportModal from "./ResumeImportModal";
import StatusToastStack from "./StatusToastStack";
import { calculateLiveAtsScore } from "../lib/atsKeywords";
import { calculateResumeStrength } from "../lib/resumeStrengthScore";
import { useStatusToast } from "../hooks/useStatusToast";
import { useMeasuredApi } from "../hooks/useMeasuredApi";
import { useResumeWorkspace } from "../hooks/useResumeWorkspace";
import type { PlaygroundTab } from "./playground/PlaygroundTabNav";
import PlaygroundSidebarNav from "./playground/PlaygroundSidebarNav";
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
import ResumeStrengthGaugePanel from "./playground/ResumeStrengthGaugePanel";
import { useStudioViewMode } from "../hooks/useStudioViewMode";
import ResizableSplitPane from "./layout/ResizableSplitPane";
import GrammarToneDrawer from "./playground/GrammarToneDrawer";
import { useResumeThemeCustomization, clearThemeCustomizationStorage } from "../hooks/useResumeThemeCustomization";
import ReadabilityDrawer from "./playground/ReadabilityDrawer";
import SkillConsistencyDrawer from "./playground/SkillConsistencyDrawer";
import ApplicationWizardModal from "./playground/ApplicationWizardModal";
const ApplicationTrackerPanel = lazy(() => import("./playground/ApplicationTrackerPanel"));
import { usePlaygroundApplicationFlow } from "../hooks/usePlaygroundApplicationFlow";
import { useFollowUpNotifications } from "../hooks/useFollowUpNotifications";
import { useResumeUndoHistory } from "../hooks/useResumeUndoHistory";
import { usePlaygroundContentEditor } from "../hooks/usePlaygroundContentEditor";
import { usePlaygroundPremiumMetrics } from "../hooks/usePlaygroundPremiumMetrics";
import { usePlaygroundKeyboardShortcuts } from "../hooks/usePlaygroundKeyboardShortcuts";
import { collectLivePreviewProps } from "../lib/playgroundLivePreviewProps";
import { usePlaygroundPdfExport } from "../hooks/usePlaygroundPdfExport";
import { DEFAULT_A4_TEMPLATE } from "../lib/resumeTemplateCatalog";
import { persistRecalculatedLayout, persistTemplateDemoLayout } from "../lib/templates/applyTemplateDemo";
import {
  demoLayoutCollapsedToSinglePage,
  demoLayoutHasPageOverflow,
  demoLayoutMissingSecondPage,
  demoLayoutPageAssignmentDrift,
} from "../lib/templates/templateDemoLayout";
import { buildFreeLayoutSections, readFamilyLayoutStorage, type FreeLayoutPosition } from "../lib/resumeFreeLayout";
import { freeLayoutHasSamePageOverlaps } from "../lib/layoutPresets";
import {
  isStaleTemplateDemoResume,
  isSyncableSeedDemoResume,
  isTemplateDemoResume,
  shouldSyncTemplateDemoToLocale,
} from "../lib/templates/templateDemoMatch";
import { getTemplateFamily } from "../lib/resumeTemplateCatalog";
import { NSR_STORAGE_KEYS } from "../lib/storageKeys";

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

  const { t, locale, localeReady } = useI18n();
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
    loadTemplateDemo,
  } = useResumeWorkspace({
    onAutoSaved: () => addSystemLog("info", t("playgroundUi.autoSaveSuccess")),
    onAutoSaveFailed: (message) => addSystemLog("error", t("playgroundUi.autoSaveFailed", { message })),
  });

  const {
    customization: themeCustomization,
    updateCustomization: updateThemeCustomization,
    resetCustomization: resetThemeCustomization,
    resolved: resolvedTheme,
  } = useResumeThemeCustomization(activeTemplate);

  const handleManualSave = () => {
    if (persistManualSave()) {
      addSystemLog("info", t("playgroundUi.manualSaveSuccess"));
    } else {
      addSystemLog("error", t("playgroundUi.manualSaveFailed"));
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

  const exportToDocxWithToast = useCallback(async () => {
    try {
      await exportToDocx();
      pushToast("success", t("toast.export.docxDownloaded"));
    } catch (err) {
      console.error("DOCX export error:", err);
      pushToast("error", err instanceof Error ? err.message : t("toast.export.docxExportFailed"));
      throw err;
    }
  }, [exportToDocx, pushToast, t]);

  const exportSystemLogsWithToast = () => {
    try {
      exportSystemLogs();
    } catch (err: unknown) {
      console.error(err);
      alert(t("playgroundUi.logExportFailed", { message: err instanceof Error ? err.message : String(err) }));
    }
  };

  const { history, future, handleUndo, handleRedo, saveImmediateSnapshot } = useResumeUndoHistory(resumeData, setResumeData);

  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const { studioViewMode, setStudioViewMode } = useStudioViewMode();

  const openCanvasPreviewStudio = React.useCallback(() => {
    setStudioViewMode("canvas");
    setIsPreviewMode(true);
  }, [setStudioViewMode]);
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [previewAutoFit, setPreviewAutoFit] = useState<boolean>(true);
  const [grayscaleMode, setGrayscaleMode] = useState<boolean>(false);

  const contentEditor = usePlaygroundContentEditor({
    resumeData,
    setResumeData,
    setJobDescription,
    saveImmediateSnapshot,
  });

  const premiumMetrics = usePlaygroundPremiumMetrics({
    resumeData,
    setResumeData,
    setPremiumGrammarText,
    setEditSection: contentEditor.setEditSection,
    saveImmediateSnapshot,
    t,
  });

  const { pdfExporting, exportToPDF } = usePlaygroundPdfExport({
    resumeData,
    activeTemplate,
    canUseFeature,
    pushToast,
    t,
  });

  usePlaygroundKeyboardShortcuts({
    handleManualSave,
    addSystemLog,
    setShortcutsModalOpen,
    setComparatorOpen,
    setSalaryInsightsOpen: premiumMetrics.setSalaryInsightsOpen,
    setChatOpen,
    activeTab,
    activeTemplate,
  });

  const [templateDemoReloadToken, setTemplateDemoReloadToken] = useState(0);

  useEffect(() => {
    if (!localeReady) return;
    try {
      if (!localStorage.getItem(NSR_STORAGE_KEYS.workspaceResume)) {
        persistTemplateDemoLayout(DEFAULT_A4_TEMPLATE, locale);
        setTemplateDemoReloadToken(1);
      }
    } catch {
      /* ignore */
    }
  }, [localeReady, locale]);

  useEffect(() => {
    if (!localeReady) return;
    try {

      const family = getTemplateFamily(activeTemplate);
      const stored = readFamilyLayoutStorage()[family] as Record<string, FreeLayoutPosition> | undefined;
      const seedDemo = isSyncableSeedDemoResume(resumeData, activeTemplate);

      const needsDemoTwoPageHeal =
        Boolean(stored) &&
        seedDemo &&
        (demoLayoutMissingSecondPage(stored!) || demoLayoutCollapsedToSinglePage(stored!));

      const sectionIds = buildFreeLayoutSections(resumeData).map((section) => section.id);
      const needsDemoPageDriftHeal =
        Boolean(stored) &&
        isTemplateDemoResume(resumeData, activeTemplate) &&
        demoLayoutPageAssignmentDrift(stored!, activeTemplate, sectionIds, resumeData);

      const contentNeedsUpgrade =
        shouldSyncTemplateDemoToLocale(resumeData, activeTemplate, locale) ||
        isStaleTemplateDemoResume(resumeData);

      const layoutCorrupt =
        Boolean(stored) &&
        (freeLayoutHasSamePageOverlaps(stored!) ||
          demoLayoutHasPageOverflow(stored!) ||
          needsDemoTwoPageHeal ||
          needsDemoPageDriftHeal);

      if (!layoutCorrupt && !contentNeedsUpgrade) return;

      const useFullDemoReload = needsDemoTwoPageHeal || contentNeedsUpgrade;


      if (useFullDemoReload) {
        loadTemplateDemo(activeTemplate);
      } else {
        persistRecalculatedLayout(activeTemplate, resumeData);
      }
      setTemplateDemoReloadToken((value) => value + 1);
    } catch {
      /* ignore */
    }
  }, [localeReady, activeTemplate, locale, resumeData, loadTemplateDemo]);

  useEffect(() => {
    if (!localeReady) return;
    if (!shouldSyncTemplateDemoToLocale(resumeData, activeTemplate, locale)) return;
    loadTemplateDemo(activeTemplate);
    setTemplateDemoReloadToken((value) => value + 1);
  }, [locale, localeReady, resumeData, activeTemplate, loadTemplateDemo]);

  const handleLoadTemplateDemo = useCallback(
    (style: TemplateStyle) => {
      if (!window.confirm(t("previewConfig.loadTemplateDemoConfirm"))) return;
      loadTemplateDemo(style);
      setTemplateDemoReloadToken((value) => value + 1);
      addSystemLog("info", t("previewConfig.loadTemplateDemoSuccess"));
    },
    [addSystemLog, loadTemplateDemo, t],
  );

  const resumeStrength = useMemo(
    () => calculateResumeStrength(resumeData, t),
    [resumeData, t],
  );

  const onResetWorkspace = () => {
    if (window.confirm(t("playgroundUi.confirmReset"))) {
      handleResetToDefault();
      setTemplateDemoReloadToken((value) => value + 1);
      clearThemeCustomizationStorage();
      resetThemeCustomization();
      addSystemLog("info", t("playgroundUi.workspaceReset"));
    }
  };

  const triggerAutoSaveRetry = () => {
    setAutoSaveShouldFail(false);
    handleManualSave();
  };

  const livePreviewProps = collectLivePreviewProps({
    isPreviewMode,
    setIsPreviewMode,
    liveAtsScore,
    previewZoom,
    setPreviewZoom,
    previewAutoFit,
    setPreviewAutoFit,
    grayscaleMode,
    setGrayscaleMode,
    studioViewMode,
    setStudioViewMode,
    activeTemplate,
    setActiveTemplate,
    history,
    future,
    handleUndo,
    handleRedo,
    chatOpen,
    setChatOpen,
    pdfExporting,
    exportToPDF,
    exportToJson,
    exportToDocx: exportToDocxWithToast,
    resumeData,
    highlightChanges,
    setHighlightChanges,
    analysisResult,
    detectedKeywords,
    activeKeywordsList,
    matcherHighlightActive,
    setMatcherHighlightActive,
    atsScoreExpanded,
    setAtsScoreExpanded,
    themeCustomization,
    onThemeCustomizationChange: updateThemeCustomization,
    onThemeCustomizationReset: resetThemeCustomization,
    resolvedTheme,
    templateDemoReloadToken,
  });

  return (
    <div
      className={
        isPreviewMode
          ? "flex flex-col flex-1 min-h-0 h-full"
          : "flex flex-1 min-h-0 h-full overflow-hidden"
      }
      id="playground-core"
    >
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
            activeInputId={contentEditor.activeInputId}
            handleElementSelectOrFocus={contentEditor.handleElementSelectOrFocus}
            applyFormatToActiveField={contentEditor.applyFormatToActiveField}
            dropdownOpen={contentEditor.dropdownOpen}
            setDropdownOpen={contentEditor.setDropdownOpen}
            editSection={contentEditor.editSection}
            setEditSection={contentEditor.setEditSection}
            setImportModalOpen={setImportModalOpen}
            verbsPanelOpen={contentEditor.verbsPanelOpen}
            setVerbsPanelOpen={contentEditor.setVerbsPanelOpen}
            selectedVerbCategory={contentEditor.selectedVerbCategory}
            setSelectedVerbCategory={contentEditor.setSelectedVerbCategory}
            grammarChecking={grammarChecking}
            runGrammarToneCheck={runGrammarToneCheck}
            readabilityChecking={readabilityChecking}
            runReadabilityComplexityCheck={runReadabilityComplexityCheck}
            skillConsistencyChecking={skillConsistencyChecking}
            runSkillConsistencyCheck={runSkillConsistencyCheck}
            saveImmediateSnapshot={saveImmediateSnapshot}
            isDragOverSkillsDropzone={contentEditor.isDragOverSkillsDropzone}
            handleDragStart={contentEditor.handleDragStart}
            handleDragEnter={contentEditor.handleDragEnter}
            handleDragLeave={contentEditor.handleDragLeave}
            handleDragOver={contentEditor.handleDragOver}
            handleDrop={contentEditor.handleDrop}
            updatePersonalInfo={contentEditor.updatePersonalInfo}
            updateSummary={contentEditor.updateSummary}
            updateExperienceBullet={contentEditor.updateExperienceBullet}
            addExperienceBullet={contentEditor.addExperienceBullet}
            removeExperienceBullet={contentEditor.removeExperienceBullet}
            addSkill={contentEditor.addSkill}
            removeSkill={contentEditor.removeSkill}
            insertPreformattedSection={contentEditor.insertPreformattedSection}
            addCertification={contentEditor.addCertification}
            removeCertification={contentEditor.removeCertification}
            addVolunteerWork={contentEditor.addVolunteerWork}
            removeVolunteerWork={contentEditor.removeVolunteerWork}
            addLanguage={contentEditor.addLanguage}
            removeLanguage={contentEditor.removeLanguage}
            getRecommendedVerbCategory={contentEditor.getRecommendedVerbCategory}
            insertActionVerb={contentEditor.insertActionVerb}
            actionVerbsCategories={contentEditor.actionVerbsCategories}
            activeVerbCategoryKey={contentEditor.activeVerbCategoryKey}
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
            salaryRole={premiumMetrics.salaryRole}
            setSalaryRole={premiumMetrics.setSalaryRole}
            salaryExp={premiumMetrics.salaryExp}
            setSalaryExp={premiumMetrics.setSalaryExp}
            salaryInsightsOpen={premiumMetrics.salaryInsightsOpen}
            setSalaryInsightsOpen={premiumMetrics.setSalaryInsightsOpen}
            resumeData={resumeData}
            setResumeData={setResumeData}
            jobDescription={jobDescription}
            heatmapMetric={premiumMetrics.heatmapMetric}
            setHeatmapMetric={premiumMetrics.setHeatmapMetric}
            skillsDemand={premiumMetrics.skillsDemand}
            setSkillsDemand={premiumMetrics.setSkillsDemand}
            skillsProficiency={premiumMetrics.skillsProficiency}
            setSkillsProficiency={premiumMetrics.setSkillsProficiency}
            skillsRelevance={premiumMetrics.skillsRelevance}
            setSkillsRelevance={premiumMetrics.setSkillsRelevance}
            smartSuggestionsCategory={premiumMetrics.smartSuggestionsCategory}
            setSmartSuggestionsCategory={premiumMetrics.setSmartSuggestionsCategory}
            analysisResult={analysisResult}
            applySmartSuggestion={premiumMetrics.applySmartSuggestion}
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
            salaryEstimate={premiumMetrics.salaryEstimate}
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
              onLoadTemplateDemo={handleLoadTemplateDemo}
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

            <ResumeStrengthGaugePanel resumeStrength={resumeStrength} />
          </>
        )}

            </div>
          }
          right={<ResumeLivePreviewPanel {...livePreviewProps} />}
        />
      ) : (
        <ResumeLivePreviewPanel {...livePreviewProps} />
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
        addSystemLog("info", t("playgroundUi.resumeImported"));
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
