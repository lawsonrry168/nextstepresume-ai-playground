import { useCallback, useEffect } from "react";
import type { ImportedJobData } from "../components/playground/JobImportPanel";
import { useSubscription } from "../context/SubscriptionProvider";
import { t } from "../i18n/translate";
import { useApplicationAgentApi } from "./useApplicationAgentApi";
import { useApplicationExport } from "./useApplicationExport";
import { useApplicationTracker } from "./useApplicationTracker";
import { useApplicationWizard } from "./useApplicationWizard";
import type { ApplicationPackage, ResumeData, TemplateStyle } from "../types";

type ToastFn = (type: "success" | "error" | "warning" | "info", message: string) => void;
type MeasuredFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface UsePlaygroundApplicationFlowOptions {
  resumeData: ResumeData;
  setResumeData: (data: ResumeData) => void;
  activeTemplate: TemplateStyle;
  measuredFetch: MeasuredFetch;
  pushToast: ToastFn;
  aiAvailable: boolean;
  onNotifyServerStatus: (reachable: boolean) => void;
  setJobDescription: (jd: string) => void;
  setActiveTab: (tab: string) => void;
  setActiveTemplate: (template: TemplateStyle) => void;
  setAnalysisResult: (result: ApplicationPackage["tailorAnalysis"]) => void;
  setMatchAnalysisResult: (result: ApplicationPackage["matchAnalysis"]) => void;
  setHighlightChanges: (value: boolean) => void;
}

export function usePlaygroundApplicationFlow({
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
}: UsePlaygroundApplicationFlowOptions) {
  const { canUseFeature, canConsume, consumeUsage, openUpgrade } = useSubscription();

  const {
    packages: applicationPackages,
    selectedId: selectedApplicationId,
    setSelectedId: setSelectedApplicationIdInternal,
    updateStatus: updateApplicationStatus,
    removePackage: removeApplicationPackage,
    saveCoverLetter: saveApplicationCoverLetter,
    upsertPackage,
    updateFields: updateApplicationFields,
    saveNotesAndDates: saveApplicationNotesAndDates,
    createDraftFromImport,
  } = useApplicationTracker();

  const {
    interviewLoading,
    companyLoading,
    fetchInterviewPrep,
    fetchCompanyResearch,
  } = useApplicationAgentApi(measuredFetch);

  const {
    exporting: applicationExporting,
    exportFullPackage,
    exportMergedPdf,
    exportMergedOoxml,
    exportResume: exportApplicationResume,
    exportCoverLetter: exportApplicationCoverLetter,
  } = useApplicationExport(pushToast);

  const handlePackageCreated = useCallback(
    (pkg: ApplicationPackage) => {
      if (!canConsume("applicationPackages", 1)) {
        openUpgrade("applicationPackages");
        return;
      }
      upsertPackage(pkg);
      consumeUsage("applicationPackages", 1);
    },
    [canConsume, consumeUsage, openUpgrade, upsertPackage],
  );

  const wizard = useApplicationWizard({
    resumeData,
    setResumeData,
    activeTemplate,
    measuredFetch,
    onNotifyServerStatus,
    pushToast,
    aiAvailable,
    onPackageCreated: handlePackageCreated,
  });

  const handleJobImported = useCallback(
    (data: ImportedJobData) => {
      setJobDescription(data.jobDescription);
    },
    [setJobDescription],
  );

  const handleCreateDraftFromImport = useCallback(
    (data: ImportedJobData) => {
      if (!canUseFeature("tracker")) {
        openUpgrade("tracker");
        return;
      }
      if (!canConsume("applicationPackages", 1)) {
        openUpgrade("applicationPackages");
        return;
      }
      const pkg = createDraftFromImport({
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        jobDescription: data.jobDescription,
        resumeSnapshot: resumeData,
        templateStyle: activeTemplate,
        sourceUrl: data.sourceUrl,
      });
      consumeUsage("applicationPackages", 1);
      setJobDescription(data.jobDescription);
      pushToast("success", t("toast.playground.draftCreated", { company: pkg.companyName, jobTitle: pkg.jobTitle }));
    },
    [
      activeTemplate,
      canConsume,
      canUseFeature,
      consumeUsage,
      createDraftFromImport,
      openUpgrade,
      pushToast,
      resumeData,
      setJobDescription,
    ],
  );

  const handleOpenWizardWithImport = useCallback(
    (data: ImportedJobData) => {
      setJobDescription(data.jobDescription);
      wizard.openWizard(data);
    },
    [setJobDescription, wizard],
  );

  const loadApplicationPackage = useCallback(
    (pkg: ApplicationPackage) => {
      setResumeData(pkg.resumeSnapshot);
      setJobDescription(pkg.jobDescription);
      setActiveTemplate(pkg.templateStyle);
      if (pkg.tailorAnalysis) setAnalysisResult(pkg.tailorAnalysis);
      if (pkg.matchAnalysis) setMatchAnalysisResult(pkg.matchAnalysis);
      setHighlightChanges(true);
      pushToast("success", t("toast.playground.packageLoaded", { company: pkg.companyName }));
    },
    [
      pushToast,
      setAnalysisResult,
      setHighlightChanges,
      setJobDescription,
      setMatchAnalysisResult,
      setResumeData,
      setActiveTemplate,
    ],
  );

  const handleGenerateInterview = useCallback(
    async (pkg: ApplicationPackage) => {
      try {
        const data = await fetchInterviewPrep(pkg);
        updateApplicationFields(pkg.id, { interviewPrep: data });
        onNotifyServerStatus(true);
        pushToast("success", t("toast.playground.interviewPrepGenerated"));
      } catch (err) {
        console.error(err);
        onNotifyServerStatus(false);
        pushToast("error", t("toast.playground.interviewPrepFailed"));
      }
    },
    [fetchInterviewPrep, onNotifyServerStatus, pushToast, updateApplicationFields],
  );

  const handleGenerateCompany = useCallback(
    async (pkg: ApplicationPackage) => {
      try {
        const data = await fetchCompanyResearch(pkg);
        updateApplicationFields(pkg.id, { companyResearch: data });
        onNotifyServerStatus(true);
        pushToast("success", t("toast.playground.companyResearchGenerated"));
      } catch (err) {
        console.error(err);
        onNotifyServerStatus(false);
        pushToast("error", t("toast.playground.companyResearchFailed"));
      }
    },
    [fetchCompanyResearch, onNotifyServerStatus, pushToast, updateApplicationFields],
  );

  const handleSaveApplicationNotes = useCallback(
    (
      id: string,
      data: {
        notes?: string | null;
        followUpDate?: string | null;
        interviewDate?: string | null;
        appliedAt?: string | null;
      },
    ) => {
      saveApplicationNotesAndDates(id, data);
    },
    [saveApplicationNotesAndDates],
  );

  const handleWizardFinish = useCallback(() => {
    wizard.closeWizard();
    setActiveTab("applications");
    const pkgId = wizard.result.package?.id;
    if (pkgId) setSelectedApplicationIdInternal(pkgId);
  }, [setActiveTab, setSelectedApplicationIdInternal, wizard]);

  useEffect(() => {
    if (wizard.uiStep !== "results" || !wizard.result.package) return;
    setJobDescription(wizard.form.jobDescription);
    if (wizard.result.tailor) setAnalysisResult(wizard.result.tailor);
    if (wizard.result.match) setMatchAnalysisResult(wizard.result.match);
  }, [
    setAnalysisResult,
    setJobDescription,
    setMatchAnalysisResult,
    wizard.form.jobDescription,
    wizard.result.match,
    wizard.result.package,
    wizard.result.tailor,
    wizard.uiStep,
  ]);

  return {
    applicationPackages,
    selectedApplicationId,
    setSelectedApplicationId: setSelectedApplicationIdInternal,
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
  };
}
