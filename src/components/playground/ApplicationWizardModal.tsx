import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  Mail,
  Sparkles,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import type { ResumeData, WizardPipelineStep } from "../../types";
import type { WizardFormState, WizardResultState, WizardUiStep } from "../../hooks/useApplicationWizard";
import type { WizardProgressState } from "../../types";
import {
  copyCoverLetterToClipboard,
  downloadCoverLetterText,
} from "./CoverLetterEditor";
import JobImportPanel, { type ImportedJobData } from "./JobImportPanel";
import { useI18n } from "../../i18n";

function getActivePipelineSteps(form: WizardFormState): WizardPipelineStep[] {
  return [
    "tailor",
    "match",
    "cover-letter",
    ...(form.generateInterviewPrep ? (["interview-prep"] as const) : []),
    ...(form.generateCompanyResearch ? (["company-research"] as const) : []),
    "save",
  ];
}

const PIPELINE_KEY: Record<WizardPipelineStep, string> = {
  tailor: "applications.wizard.pipeline.tailor",
  match: "applications.wizard.pipeline.match",
  "cover-letter": "applications.wizard.pipeline.coverLetter",
  "interview-prep": "applications.wizard.pipeline.interviewPrep",
  "company-research": "applications.wizard.pipeline.companyResearch",
  save: "applications.wizard.pipeline.save",
};

interface ApplicationWizardModalProps {
  open: boolean;
  onClose: () => void;
  uiStep: WizardUiStep;
  setUiStep: (step: WizardUiStep) => void;
  form: WizardFormState;
  updateForm: (patch: Partial<WizardFormState>) => void;
  progress: WizardProgressState;
  running: boolean;
  result: WizardResultState;
  resumeData: ResumeData;
  onRunPipeline: () => void;
  onFinish: () => void;
  measuredFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  pushToast: (type: "success" | "error" | "warning" | "info", message: string) => void;
}

export default function ApplicationWizardModal({
  open,
  onClose,
  uiStep,
  setUiStep,
  form,
  updateForm,
  progress,
  running,
  result,
  resumeData,
  onRunPipeline,
  onFinish,
  measuredFetch,
  pushToast,
}: ApplicationWizardModalProps) {
  const { t } = useI18n();

  if (!open) return null;

  const steps: WizardUiStep[] = ["resume", "job", "options", "running", "results"];
  const stepIndex = steps.indexOf(uiStep);

  const goNext = () => {
    if (uiStep === "resume") setUiStep("job");
    else if (uiStep === "job") {
      if (!form.jobDescription.trim()) return;
      setUiStep("options");
    } else if (uiStep === "options") {
      onRunPipeline();
    }
  };

  const goBack = () => {
    if (uiStep === "job") setUiStep("resume");
    else if (uiStep === "options") setUiStep("job");
  };

  const canNext =
    uiStep === "resume" ||
    (uiStep === "job" && form.jobDescription.trim().length > 20) ||
    uiStep === "options";

  const applyImportedJob = (data: ImportedJobData) => {
    updateForm({
      jobDescription: data.jobDescription,
      companyName: data.companyName,
      jobTitle: data.jobTitle,
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
      >
        <header className="flex items-center justify-between px-5 py-4 modal-header-notebook shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--m-red,#c0392b)]">
              {t("applications.wizard.agentLabel")}
            </p>
            <h2 id="wizard-title" className="text-lg font-bold text-slate-900">
              {t("applications.wizard.title")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label={t("applications.wizard.close")}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {uiStep !== "running" && uiStep !== "results" && (
          <div className="px-5 pt-3 flex gap-2 shrink-0">
            {(["resume", "job", "options"] as const).map((s, i) => {
              const active = uiStep === s;
              const done = stepIndex > i;
              return (
                <div key={s} className="flex-1 flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      done || active ? "wizard-step-done" : "wizard-step-idle"
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase hidden sm:inline ${
                      active ? "text-[var(--m-red,#c0392b)]" : "text-slate-400"
                    }`}
                  >
                    {s === "resume" ? t("applications.wizard.stepLabels.resume") : s === "job" ? t("applications.wizard.stepLabels.job") : t("applications.wizard.stepLabels.options")}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4">
          {uiStep === "resume" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {resumeData.personalInfo.name || t("applications.wizard.unnamedCandidate")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {resumeData.personalInfo.title || t("applications.wizard.titleNotSet")}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {t("applications.wizard.resumeIntro")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                  <Badge>{t("applications.wizard.experienceCount", { count: resumeData.experience.length })}</Badge>
                  <Badge>{t("applications.wizard.skillsCount", { count: resumeData.skills.length })}</Badge>
                  <Badge icon={<FileText className="w-3 h-3" />}>{t("applications.wizard.liveSnapshot")}</Badge>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                {t("applications.wizard.editResumeHint")}
              </p>
            </div>
          )}

          {uiStep === "job" && (
            <div className="space-y-3">
              <JobImportPanel
                compact
                measuredFetch={measuredFetch}
                pushToast={pushToast}
                onImported={applyImportedJob}
              />
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("applications.wizard.companyOptional")}>
                  <input
                    className={inputClass}
                    placeholder={t("applications.wizard.companyPlaceholder")}
                    value={form.companyName}
                    onChange={(e) => updateForm({ companyName: e.target.value })}
                  />
                </Field>
                <Field label={t("applications.wizard.jobTitleOptional")}>
                  <input
                    className={inputClass}
                    placeholder={t("applications.wizard.jobTitlePlaceholder")}
                    value={form.jobTitle}
                    onChange={(e) => updateForm({ jobTitle: e.target.value })}
                  />
                </Field>
              </div>
              <Field label={t("applications.wizard.jdRequired")}>
                <textarea
                  className={`${inputClass} min-h-[220px] resize-y font-mono text-xs leading-relaxed`}
                  placeholder={t("applications.wizard.jdPlaceholder")}
                  value={form.jobDescription}
                  onChange={(e) => updateForm({ jobDescription: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {t("applications.wizard.charCount", { count: form.jobDescription.trim().length })}
                  {form.jobDescription.trim().length < 20 ? t("applications.wizard.charMin") : ""}
                </p>
              </Field>
            </div>
          )}

          {uiStep === "options" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-700">{t("applications.wizard.intensity")}</p>
                <div className="flex gap-2">
                  {(["balanced", "aggressive"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => updateForm({ intensity: mode })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border cursor-pointer transition ${
                        form.intensity === mode
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {mode === "balanced" ? t("applications.wizard.intensityBalanced") : t("applications.wizard.intensityAggressive")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-700">{t("applications.wizard.toneTitle")}</p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: "professional", labelKey: "applications.wizard.tone.professional" },
                      { id: "enthusiastic", labelKey: "applications.wizard.tone.enthusiastic" },
                      { id: "concise", labelKey: "applications.wizard.tone.concise" },
                    ] as const
                  ).map((toneOpt) => (
                    <button
                      key={toneOpt.id}
                      type="button"
                      onClick={() => updateForm({ tone: toneOpt.id })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                        form.tone === toneOpt.id
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {t(toneOpt.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.applyTailor}
                  onChange={(e) => updateForm({ applyTailor: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="text-xs font-bold text-emerald-900">{t("applications.wizard.applyTailorTitle")}</p>
                  <p className="text-[11px] text-emerald-700/80 mt-0.5">
                    {t("applications.wizard.applyTailorHint")}
                  </p>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.generateInterviewPrep}
                    onChange={(e) => updateForm({ generateInterviewPrep: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{t("applications.wizard.interviewPrepTitle")}</p>
                    <p className="text-[10px] text-slate-500">{t("applications.wizard.interviewPrepHint")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.generateCompanyResearch}
                    onChange={(e) => updateForm({ generateCompanyResearch: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{t("applications.wizard.companyResearchTitle")}</p>
                    <p className="text-[10px] text-slate-500">{t("applications.wizard.companyResearchHint")}</p>
                  </div>
                </label>
              </div>

              {progress.error && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  {progress.error}
                </p>
              )}
            </div>
          )}

          {uiStep === "running" && (
            <div className="py-6 space-y-4">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-900">{t("applications.wizard.runningTitle")}</p>
                <p className="text-xs text-slate-500 mt-1">{t("applications.wizard.runningHint")}</p>
              </div>
              <div className="space-y-2">
                {getActivePipelineSteps(form).map((step) => {
                  const done = progress.completedSteps.includes(step);
                  const current = progress.currentStep === step;
                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                        done
                          ? "border-emerald-200 bg-emerald-50/50"
                          : current
                          ? "border-emerald-200 bg-emerald-50/50"
                          : "border-slate-100 bg-slate-50/50"
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : current ? (
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
                      )}
                      <span className="text-xs font-medium text-slate-700">
                        {t(PIPELINE_KEY[step])}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {uiStep === "results" && result.package && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="text-sm font-bold">{t("applications.wizard.packageReady")}</p>
                </div>
                <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {result.package.companyName} · {result.package.jobTitle}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ScorePill
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="ATS"
                  value={result.tailor?.atsScore}
                  color="emerald"
                />
                <ScorePill
                  icon={<Sparkles className="w-4 h-4" />}
                  label={t("applications.tracker.matchScoreLabel")}
                  value={result.match?.overallScore}
                  color="violet"
                />
              </div>

              {result.match?.summary && (
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">{t("applications.wizard.matchSummary")}</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{result.match.summary}</p>
                </div>
              )}

              {result.coverLetter && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {t("applications.wizard.coverLetterPreview")}
                    </p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => copyCoverLetterToClipboard(result.coverLetter!)}
                        className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        {t("applications.wizard.copy")}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadCoverLetterText(
                            result.coverLetter!,
                            result.package!.companyName
                          )
                        }
                        className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        {t("applications.wizard.download")}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3 max-h-48 overflow-y-auto scrollbar-thin">
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {result.coverLetter.fullText}
                    </pre>
                  </div>
                </div>
              )}

              {(result.interviewPrep || result.companyResearch) && (
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {result.interviewPrep ? (
                    <div className="rounded-lg bg-violet-50 border border-violet-100 p-2 text-violet-800 font-bold">
                      {t("applications.wizard.interviewPrepDone", { count: result.interviewPrep.categories.length })}
                    </div>
                  ) : null}
                  {result.companyResearch ? (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-emerald-800 font-bold">
                      {t("applications.wizard.companyResearchDone", { count: result.companyResearch.talkingPoints.length })}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50">
          {uiStep === "results" ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {t("applications.wizard.close")}
              </button>
              <button
                type="button"
                onClick={onFinish}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg btn-accent text-xs cursor-pointer"
              >
                {t("applications.wizard.goToTracker")}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : uiStep === "running" ? (
            <p className="text-xs text-slate-400 w-full text-center">{t("applications.wizard.waitHint")}</p>
          ) : (
            <>
              <button
                type="button"
                onClick={uiStep === "resume" ? onClose : goBack}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {uiStep === "resume" ? (
                  t("applications.wizard.cancel")
                ) : (
                  <>
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {t("applications.wizard.back")}
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={!canNext || running}
                onClick={goNext}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg btn-accent text-xs disabled:opacity-40 cursor-pointer"
              >
                {uiStep === "options" ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    {t("applications.wizard.generate")}
                  </>
                ) : (
                  <>
                    {t("applications.wizard.next")}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function Badge({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 font-bold">
      {icon}
      {children}
    </span>
  );
}

function ScorePill({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value?: number;
  color: "emerald" | "violet";
}) {
  const cls =
    color === "emerald"
      ? "notebook-callout"
      : "border-violet-200 bg-violet-50 text-violet-800";
  return (
    <div className={`rounded-xl border p-3 flex items-center gap-3 ${cls}`}>
      {icon}
      <div>
        <p className="text-[10px] font-bold uppercase opacity-70">{label}</p>
        <p className="text-xl font-black">{value ?? "—"}%</p>
      </div>
    </div>
  );
}
