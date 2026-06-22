import { useCallback, useState } from "react";
import { parseApiJson } from "../lib/apiResponse";
import { applyTailorAnalysis } from "../lib/applyTailorAnalysis";
import { extractJobMeta } from "../lib/extractJobMeta";
import { useSubscription } from "../context/SubscriptionProvider";
import { AI_CREDIT_COSTS } from "../lib/subscription/creditCosts";
import type {
  AnalysisResult,
  AIMatchAnalysisResult,
  ApplicationPackage,
  CompanyResearchResult,
  CoverLetterResult,
  CoverLetterTone,
  InterviewPrepResult,
  ResumeData,
  TailorIntensity,
  TemplateStyle,
  WizardPipelineStep,
  WizardProgressState,
} from "../types";
import { createApplicationEvent } from "../lib/applicationTimeline";
import { t } from "../i18n/translate";

type MeasuredFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type ToastFn = (type: "success" | "error" | "warning" | "info", message: string) => void;

export type WizardFormState = {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  tone: CoverLetterTone;
  applyTailor: boolean;
  intensity: TailorIntensity;
  generateInterviewPrep: boolean;
  generateCompanyResearch: boolean;
};

export type WizardResultState = {
  tailor: AnalysisResult | null;
  match: AIMatchAnalysisResult | null;
  coverLetter: CoverLetterResult | null;
  interviewPrep: InterviewPrepResult | null;
  companyResearch: CompanyResearchResult | null;
  package: ApplicationPackage | null;
};

export type WizardUiStep = "resume" | "job" | "options" | "running" | "results";

const INITIAL_FORM: WizardFormState = {
  companyName: "",
  jobTitle: "",
  jobDescription: "",
  tone: "professional",
  applyTailor: true,
  intensity: "balanced",
  generateInterviewPrep: true,
  generateCompanyResearch: true,
};

const INITIAL_PROGRESS: WizardProgressState = {
  currentStep: null,
  completedSteps: [],
  error: null,
};

export interface UseApplicationWizardOptions {
  resumeData: ResumeData;
  setResumeData: (data: ResumeData) => void;
  activeTemplate: TemplateStyle;
  measuredFetch: MeasuredFetch;
  onNotifyServerStatus: (reachable: boolean) => void;
  pushToast: ToastFn;
  aiAvailable: boolean;
  onPackageCreated?: (pkg: ApplicationPackage) => void;
}

export function useApplicationWizard({
  resumeData,
  setResumeData,
  activeTemplate,
  measuredFetch,
  onNotifyServerStatus,
  pushToast,
  aiAvailable,
  onPackageCreated,
}: UseApplicationWizardOptions) {
  const subscription = useSubscription();
  const [open, setOpen] = useState(false);
  const [uiStep, setUiStep] = useState<WizardUiStep>("resume");
  const [form, setForm] = useState<WizardFormState>(INITIAL_FORM);
  const [progress, setProgress] = useState<WizardProgressState>(INITIAL_PROGRESS);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<WizardResultState>({
    tailor: null,
    match: null,
    coverLetter: null,
    interviewPrep: null,
    companyResearch: null,
    package: null,
  });

  const resetWizard = useCallback(() => {
    setUiStep("resume");
    setForm(INITIAL_FORM);
    setProgress(INITIAL_PROGRESS);
    setRunning(false);
    setResult({
      tailor: null,
      match: null,
      coverLetter: null,
      interviewPrep: null,
      companyResearch: null,
      package: null,
    });
  }, []);

  const openWizard = useCallback(
    (
      prefill?:
        | string
        | {
            jobDescription: string;
            companyName?: string;
            jobTitle?: string;
          }
    ) => {
      resetWizard();
      if (typeof prefill === "string" && prefill.trim()) {
        const meta = extractJobMeta(prefill);
        setForm((prev) => ({
          ...prev,
          jobDescription: prefill,
          companyName: meta.companyName,
          jobTitle: meta.jobTitle,
        }));
        setUiStep("job");
      } else if (prefill && typeof prefill === "object" && prefill.jobDescription.trim()) {
        const meta = extractJobMeta(prefill.jobDescription);
        setForm((prev) => ({
          ...prev,
          jobDescription: prefill.jobDescription,
          companyName: prefill.companyName?.trim() || meta.companyName,
          jobTitle: prefill.jobTitle?.trim() || meta.jobTitle,
        }));
        setUiStep("job");
      }
      setOpen(true);
    },
    [resetWizard]
  );

  const closeWizard = useCallback(() => {
    setOpen(false);
  }, []);

  const updateForm = useCallback((patch: Partial<WizardFormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.jobDescription && !patch.companyName && !patch.jobTitle) {
        const meta = extractJobMeta(patch.jobDescription);
        if (!prev.companyName && meta.companyName) next.companyName = meta.companyName;
        if (!prev.jobTitle && meta.jobTitle) next.jobTitle = meta.jobTitle;
      }
      return next;
    });
  }, []);

  const markStep = useCallback((step: WizardPipelineStep, done: boolean) => {
    setProgress((prev) => ({
      ...prev,
      currentStep: done ? null : step,
      completedSteps: done
        ? [...new Set([...prev.completedSteps, step])]
        : prev.completedSteps,
    }));
  }, []);

  const runPipeline = useCallback(async () => {
    if (!form.jobDescription.trim()) {
      pushToast("error", t("toast.wizard.pasteJdRequired"));
      setUiStep("job");
      return;
    }

    if (!subscription.canUseFeature("ai.wizard")) {
      subscription.openUpgrade("ai.wizard");
      return;
    }
    if (!subscription.canConsume("wizardRuns", 1)) {
      subscription.openUpgrade("wizardRuns");
      return;
    }
    const estimatedCredits =
      AI_CREDIT_COSTS.tailor +
      AI_CREDIT_COSTS.match +
      AI_CREDIT_COSTS.coverLetter +
      (form.generateInterviewPrep ? AI_CREDIT_COSTS.interviewPrep : 0) +
      (form.generateCompanyResearch ? AI_CREDIT_COSTS.companyResearch : 0);
    if (!subscription.canConsume("aiCredits", estimatedCredits)) {
      subscription.openUpgrade("aiCredits");
      return;
    }
    if (!subscription.canConsume("applicationPackages", 1)) {
      subscription.openUpgrade("applicationPackages");
      return;
    }

    setRunning(true);
    setUiStep("running");
    setProgress({ currentStep: "tailor", completedSteps: [], error: null });

    let tailorResult: AnalysisResult | null = null;
    let matchResult: AIMatchAnalysisResult | null = null;
    let coverResult: CoverLetterResult | null = null;
    let interviewResult: InterviewPrepResult | null = null;
    let companyResult: CompanyResearchResult | null = null;
    let usedSimulation = false;

    const companyName =
      form.companyName.trim() ||
      extractJobMeta(form.jobDescription).companyName ||
      "Target Company";
    const jobTitle =
      form.jobTitle.trim() ||
      extractJobMeta(form.jobDescription).jobTitle ||
      resumeData.personalInfo.title ||
      "Target Role";

    try {
      markStep("tailor", false);
      const tailorRes = await measuredFetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData,
          jobDescription: form.jobDescription,
          intensity: form.intensity,
        }),
      });
      const { data: tailorData, usedFallback: tailorFallback } =
        await parseApiJson<AnalysisResult>(tailorRes);
      tailorResult = tailorData;
      usedSimulation = usedSimulation || tailorFallback || !aiAvailable;
      markStep("tailor", true);

      markStep("match", false);
      const matchRes = await measuredFetch("/api/match-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData,
          jobDescription: form.jobDescription,
        }),
      });
      const { data: matchData, usedFallback: matchFallback } =
        await parseApiJson<AIMatchAnalysisResult>(matchRes);
      matchResult = matchData;
      usedSimulation = usedSimulation || matchFallback;
      markStep("match", true);

      markStep("cover-letter", false);
      const coverRes = await measuredFetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData,
          jobDescription: form.jobDescription,
          companyName,
          jobTitle,
          tone: form.tone,
        }),
      });
      const { data: coverData, usedFallback: coverFallback } =
        await parseApiJson<CoverLetterResult>(coverRes);
      coverResult = coverData;
      usedSimulation = usedSimulation || coverFallback;
      markStep("cover-letter", true);

      if (form.generateInterviewPrep) {
        markStep("interview-prep", false);
        const interviewRes = await measuredFetch("/api/interview-prep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeData,
            jobDescription: form.jobDescription,
            companyName,
            jobTitle,
            matchAnalysis: matchResult,
          }),
        });
        const { data: interviewData, usedFallback: interviewFallback } =
          await parseApiJson<InterviewPrepResult>(interviewRes);
        interviewResult = interviewData;
        usedSimulation = usedSimulation || interviewFallback;
        markStep("interview-prep", true);
      }

      if (form.generateCompanyResearch) {
        markStep("company-research", false);
        const companyRes = await measuredFetch("/api/company-research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobDescription: form.jobDescription,
            companyName,
            jobTitle,
          }),
        });
        const { data: companyData, usedFallback: companyFallback } =
          await parseApiJson<CompanyResearchResult>(companyRes);
        companyResult = companyData;
        usedSimulation = usedSimulation || companyFallback;
        markStep("company-research", true);
      }

      let resumeSnapshot = resumeData;
      if (form.applyTailor && tailorResult) {
        resumeSnapshot = applyTailorAnalysis(resumeData, tailorResult);
        setResumeData(resumeSnapshot);
      }

      markStep("save", false);
      const now = new Date().toISOString();
      let pkg: ApplicationPackage = {
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        status: "ready",
        companyName,
        jobTitle,
        jobDescription: form.jobDescription,
        resumeSnapshot,
        templateStyle: activeTemplate,
        tailorAnalysis: tailorResult,
        matchAnalysis: matchResult,
        coverLetter: coverResult,
        interviewPrep: interviewResult,
        companyResearch: companyResult,
        timeline: [
          createApplicationEvent("created", t("toast.wizard.packageCreated"), `${companyName} · ${jobTitle}`),
        ],
      };

      onPackageCreated?.(pkg);
      if (!usedSimulation) {
        subscription.consumeUsage("wizardRuns", 1);
      }
      markStep("save", true);

      setResult({
        tailor: tailorResult,
        match: matchResult,
        coverLetter: coverResult,
        interviewPrep: interviewResult,
        companyResearch: companyResult,
        package: pkg,
      });

      onNotifyServerStatus(true);
      setUiStep("results");
      if (usedSimulation) {
        pushToast("warning", t("toast.wizard.completedSimulation"));
      } else {
        pushToast("success", t("toast.wizard.completed"));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("toast.wizard.failed");
      setProgress((prev) => ({ ...prev, error: message, currentStep: null }));
      onNotifyServerStatus(false);
      pushToast("error", message);
      setUiStep("options");
    } finally {
      setRunning(false);
    }
  }, [
    activeTemplate,
    aiAvailable,
    form,
    markStep,
    measuredFetch,
    onNotifyServerStatus,
    onPackageCreated,
    pushToast,
    resumeData,
    setResumeData,
    subscription,
  ]);

  return {
    open,
    openWizard,
    closeWizard,
    resetWizard,
    uiStep,
    setUiStep,
    form,
    updateForm,
    progress,
    running,
    result,
    runPipeline,
  };
}
