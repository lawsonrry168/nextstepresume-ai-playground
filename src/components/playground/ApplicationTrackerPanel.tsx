import { useMemo, useState, type ReactNode } from "react";
import {
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Mail,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import type {
  ApplicationPackage,
  ApplicationStatus,
  CoverLetterResult,
} from "../../types";
import CoverLetterEditor, {
  copyCoverLetterToClipboard,
  downloadCoverLetterText,
} from "./CoverLetterEditor";
import InterviewPrepPanel from "./InterviewPrepPanel";
import CompanyResearchPanel from "./CompanyResearchPanel";
import ApplicationNotesEditor from "./ApplicationNotesEditor";
import ApplicationTimeline from "./ApplicationTimeline";
import PackageExportMenu from "./PackageExportMenu";
import FollowUpNotificationBar from "./FollowUpNotificationBar";
import type { FollowUpReminder } from "../../lib/followUpReminderEngine";
import JobImportPanel, { type ImportedJobData } from "./JobImportPanel";
import { useI18n } from "../../i18n";

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  ready: "bg-emerald-50 text-emerald-700",
  applied: "bg-emerald-50 text-emerald-700",
  interviewing: "bg-amber-50 text-amber-800",
  offered: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  archived: "bg-slate-100 text-slate-500",
};

interface ApplicationTrackerPanelProps {
  packages: ApplicationPackage[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onDelete: (id: string) => void;
  onLoadPackage: (pkg: ApplicationPackage) => void;
  onOpenWizard: () => void;
  onSaveCoverLetter: (id: string, letter: CoverLetterResult) => void;
  onSaveNotes?: (
    id: string,
    data: {
      notes?: string | null;
      followUpDate?: string | null;
      interviewDate?: string | null;
      appliedAt?: string | null;
    }
  ) => void;
  onGenerateInterview?: (pkg: ApplicationPackage) => void;
  onGenerateCompany?: (pkg: ApplicationPackage) => void;
  interviewLoading?: boolean;
  companyLoading?: boolean;
  onExportFull?: (pkg: ApplicationPackage) => void;
  onExportMergedPdf?: (pkg: ApplicationPackage) => void;
  onExportMergedOoxml?: (pkg: ApplicationPackage) => void;
  onExportResume?: (pkg: ApplicationPackage) => void;
  onExportCoverLetter?: (pkg: ApplicationPackage) => void;
  exporting?: boolean;
  notificationSupported?: boolean;
  notificationsEnabled?: boolean;
  notificationsEnabling?: boolean;
  pendingReminders?: FollowUpReminder[];
  onEnableNotifications?: () => void;
  onDisableNotifications?: () => void;
  loading?: boolean;
  measuredFetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  pushToast?: (type: "success" | "error" | "warning" | "info", message: string) => void;
  onJobImported?: (data: ImportedJobData) => void;
  onCreateDraftFromImport?: (data: ImportedJobData) => void;
  onOpenWizardWithImport?: (data: ImportedJobData) => void;
}

export default function ApplicationTrackerPanel({
  packages,
  selectedId,
  onSelect,
  onStatusChange,
  onDelete,
  onLoadPackage,
  onOpenWizard,
  onSaveCoverLetter,
  onSaveNotes,
  onGenerateInterview,
  onGenerateCompany,
  interviewLoading = false,
  companyLoading = false,
  onExportFull,
  onExportMergedPdf,
  onExportMergedOoxml,
  onExportResume,
  onExportCoverLetter,
  exporting = false,
  notificationSupported = false,
  notificationsEnabled = false,
  notificationsEnabling = false,
  pendingReminders = [],
  onEnableNotifications,
  onDisableNotifications,
  loading = false,
  measuredFetch,
  pushToast,
  onJobImported,
  onCreateDraftFromImport,
  onOpenWizardWithImport,
}: ApplicationTrackerPanelProps) {
  const { t, locale } = useI18n();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const selected = useMemo(
    () => packages.find((p) => p.id === selectedId) ?? null,
    [packages, selectedId]
  );
  const [detailTab, setDetailTab] = useState<
    "overview" | "cover" | "match" | "interview" | "company" | "tracking"
  >("overview");

  const filteredPackages = useMemo(() => {
    if (statusFilter === "all") return packages;
    return packages.filter((p) => p.status === statusFilter);
  }, [packages, statusFilter]);

  const stats = useMemo(() => {
    const applied = packages.filter((p) => p.status === "applied").length;
    const interviewing = packages.filter((p) => p.status === "interviewing").length;
    const ready = packages.filter((p) => p.status === "ready").length;
    return { total: packages.length, applied, interviewing, ready };
  }, [packages]);

  const statusLabel = (s: ApplicationStatus) => t(`applications.status.${s}`);
  const dateLocale = locale.startsWith("zh") ? locale : "en-US";

  const detailTabs = [
    { id: "overview" as const, label: t("applications.tracker.tabs.overview") },
    { id: "cover" as const, label: t("applications.tracker.tabs.cover") },
    { id: "match" as const, label: t("applications.tracker.tabs.match") },
    { id: "interview" as const, label: t("applications.tracker.tabs.interview") },
    { id: "company" as const, label: t("applications.tracker.tabs.company") },
    { id: "tracking" as const, label: t("applications.tracker.tabs.tracking") },
  ];

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="panel-surface p-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {t("applications.tracker.eyebrow")}
            </p>
            <h2 className="text-lg font-display font-bold text-slate-900 tracking-tight">
              {t("applications.tracker.title")}
            </h2>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              {t("applications.tracker.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenWizard}
            className="btn-accent shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t("applications.tracker.oneClickApply")}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 pt-3 border-t border-slate-100">
          {[
            { label: t("applications.stats.total"), value: stats.total },
            { label: t("applications.stats.ready"), value: stats.ready },
            { label: t("applications.stats.applied"), value: stats.applied },
            { label: t("applications.stats.interviewing"), value: stats.interviewing },
          ].map((item) => (
            <div key={item.label} className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono tabular-nums text-slate-900">{item.value}</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {measuredFetch && pushToast && onJobImported ? (
        <JobImportPanel
          measuredFetch={measuredFetch}
          pushToast={pushToast}
          onImported={onJobImported}
          onCreateDraft={onCreateDraftFromImport}
          onOpenWizard={onOpenWizardWithImport}
        />
      ) : null}

      <FollowUpNotificationBar
        supported={notificationSupported}
        enabled={notificationsEnabled}
        enabling={notificationsEnabling}
        pendingCount={pendingReminders.length}
        pendingReminders={pendingReminders}
        onEnable={() => onEnableNotifications?.()}
        onDisable={() => onDisableNotifications?.()}
        onSelectPackage={(id) => onSelect(id)}
      />

      <div className="flex flex-1 min-h-0 gap-3">
        <div className="w-[42%] min-w-[200px] flex flex-col min-h-0 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/80 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t("applications.tracker.listTitle")}
            </p>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "all")}
              className="w-full text-[10px] border border-slate-200 rounded-lg px-2 py-1 bg-white cursor-pointer"
            >
              <option value="all">{t("applications.tracker.allStatuses")}</option>
              {(Object.keys(STATUS_COLORS) as ApplicationStatus[]).map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1.5">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("applications.tracker.loading")}
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="text-center py-8 px-3">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">{t("applications.tracker.emptyFiltered")}</p>
                <p className="text-xs text-slate-400 mt-1">{t("applications.tracker.emptyHint")}</p>
              </div>
            ) : (
              filteredPackages.map((pkg) => {
                const active = pkg.id === selectedId;
                const matchScore = pkg.matchAnalysis?.overallScore;
                const atsScore = pkg.tailorAnalysis?.atsScore;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => onSelect(pkg.id)}
                    className={`w-full text-left rounded-lg border px-2.5 py-2 transition cursor-pointer ${
                      active
                        ? "border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200"
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{pkg.jobTitle}</p>
                        <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 shrink-0" />
                          {pkg.companyName}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[pkg.status]}`}
                      >
                        {statusLabel(pkg.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                      {typeof matchScore === "number" ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Sparkles className="w-3 h-3 text-violet-500" />
                          {t("applications.tracker.matchScore", { score: matchScore })}
                        </span>
                      ) : null}
                      {typeof atsScore === "number" ? (
                        <span className="inline-flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          {t("applications.tracker.atsScore", { score: atsScore })}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-0.5 ml-auto">
                        <Calendar className="w-3 h-3" />
                        {new Date(pkg.updatedAt).toLocaleDateString(dateLocale)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-0 rounded-xl border border-slate-200 bg-white overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6">
              <ChevronRight className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">{t("applications.tracker.selectHint")}</p>
            </div>
          ) : (
            <>
              <div className="px-3 py-2.5 border-b border-slate-100 flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{selected.jobTitle}</h3>
                  <p className="text-xs text-slate-500">{selected.companyName}</p>
                </div>
                <select
                  value={selected.status}
                  onChange={(e) =>
                    onStatusChange(selected.id, e.target.value as ApplicationStatus)
                  }
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white cursor-pointer"
                >
                  {(Object.keys(STATUS_COLORS) as ApplicationStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onLoadPackage(selected)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t("applications.tracker.loadWorkspace")}
                </button>
                {onExportMergedPdf && onExportMergedOoxml && onExportFull && onExportResume && onExportCoverLetter ? (
                  <PackageExportMenu
                    pkg={selected}
                    exporting={exporting}
                    onExportMergedPdf={() => onExportMergedPdf(selected)}
                    onExportMergedOoxml={() => onExportMergedOoxml(selected)}
                    onExportFull={() => onExportFull(selected)}
                    onExportResume={() => onExportResume(selected)}
                    onExportCoverLetter={() => onExportCoverLetter(selected)}
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => onDelete(selected.id)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                  title={t("applications.tracker.delete")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="px-2 pt-2 flex gap-1 border-b border-slate-100 overflow-x-auto scrollbar-thin">
                {detailTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDetailTab(tab.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-t-lg cursor-pointer ${
                      detailTab === tab.id
                        ? "bg-emerald-50 text-emerald-700 border border-b-0 border-emerald-100"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
                {detailTab === "overview" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <ScoreCard
                        label={t("applications.tracker.atsScoreLabel")}
                        score={selected.tailorAnalysis?.atsScore}
                        tone="emerald"
                      />
                      <ScoreCard
                        label={t("applications.tracker.matchScoreLabel")}
                        score={selected.matchAnalysis?.overallScore}
                        tone="violet"
                      />
                    </div>
                    {selected.matchAnalysis?.summary ? (
                      <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                          {t("applications.tracker.matchSummary")}
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {selected.matchAnalysis.summary}
                        </p>
                      </div>
                    ) : null}
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 max-h-40 overflow-y-auto scrollbar-thin">
                      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                        {t("applications.tracker.jdExcerpt")}
                      </p>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap">
                        {selected.jobDescription.slice(0, 600)}
                        {selected.jobDescription.length > 600 ? "..." : ""}
                      </p>
                    </div>
                  </div>
                ) : null}

                {detailTab === "cover" ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!selected.coverLetter}
                        onClick={() =>
                          selected.coverLetter &&
                          copyCoverLetterToClipboard(selected.coverLetter)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {t("applications.tracker.copy")}
                      </button>
                      <button
                        type="button"
                        disabled={!selected.coverLetter}
                        onClick={() =>
                          selected.coverLetter &&
                          downloadCoverLetterText(
                            selected.coverLetter,
                            `${selected.companyName}_${selected.jobTitle}`.replace(/\s+/g, "_")
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {t("applications.tracker.downloadTxt")}
                      </button>
                      <button
                        type="button"
                        disabled={!selected.coverLetter || !onExportCoverLetter}
                        onClick={() =>
                          selected.coverLetter &&
                          onExportCoverLetter &&
                          onExportCoverLetter(selected)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {t("applications.tracker.downloadDocx")}
                      </button>
                    </div>
                    <CoverLetterEditor
                      value={selected.coverLetter}
                      onChange={(next) => onSaveCoverLetter(selected.id, next)}
                    />
                  </div>
                ) : null}

                {detailTab === "match" ? (
                  <div className="space-y-3">
                    {!selected.matchAnalysis ? (
                      <p className="text-sm text-slate-500">{t("applications.tracker.noMatchData")}</p>
                    ) : (
                      <>
                        {selected.matchAnalysis.matchedStrengths.length > 0 ? (
                          <Section title={t("applications.tracker.strengths")}>
                            <ul className="space-y-1">
                              {selected.matchAnalysis.matchedStrengths.map((strength, index) => (
                                <li
                                  key={index}
                                  className="text-xs text-emerald-800 bg-emerald-50 rounded px-2 py-1"
                                >
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </Section>
                        ) : null}
                        {selected.matchAnalysis.gaps.length > 0 ? (
                          <Section title={t("applications.tracker.gaps")}>
                            <div className="space-y-2">
                              {selected.matchAnalysis.gaps.map((gap, index) => (
                                <div
                                  key={index}
                                  className="rounded-lg border border-amber-100 bg-amber-50/50 p-2"
                                >
                                  <p className="text-xs font-bold text-amber-900">{gap.area}</p>
                                  <p className="text-[11px] text-slate-600 mt-0.5">
                                    {gap.description}
                                  </p>
                                  <p className="text-[11px] text-emerald-700 mt-1">
                                    - {gap.recommendation}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </Section>
                        ) : null}
                        {selected.matchAnalysis.actionPlan.length > 0 ? (
                          <Section title={t("applications.tracker.actionPlan")}>
                            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700">
                              {selected.matchAnalysis.actionPlan.map((step, index) => (
                                <li key={index}>{step}</li>
                              ))}
                            </ol>
                          </Section>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : null}

                {detailTab === "interview" ? (
                  <InterviewPrepPanel
                    data={selected.interviewPrep}
                    loading={interviewLoading}
                    onGenerate={
                      onGenerateInterview ? () => onGenerateInterview(selected) : undefined
                    }
                  />
                ) : null}

                {detailTab === "company" ? (
                  <CompanyResearchPanel
                    data={selected.companyResearch}
                    loading={companyLoading}
                    onGenerate={
                      onGenerateCompany ? () => onGenerateCompany(selected) : undefined
                    }
                  />
                ) : null}

                {detailTab === "tracking" ? (
                  <div className="space-y-4">
                    {onSaveNotes ? (
                      <div key={selected.id}>
                        <ApplicationNotesEditor
                          pkg={selected}
                          onSave={(data) => onSaveNotes(selected.id, data)}
                        />
                      </div>
                    ) : null}
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        {t("applications.tracker.timeline")}
                      </p>
                      <ApplicationTimeline events={selected.timeline ?? []} />
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  score,
  tone,
}: {
  label: string;
  score?: number;
  tone: "emerald" | "violet";
}) {
  const color =
    tone === "emerald"
      ? "text-emerald-700 bg-emerald-50 border-emerald-100"
      : "text-violet-700 bg-violet-50 border-violet-100";
  return (
    <div className={`rounded-lg border p-3 ${color}`}>
      <p className="text-[10px] font-bold uppercase opacity-70">{label}</p>
      <p className="text-2xl font-black mt-0.5">{score ?? "--"}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
        <Mail className="w-3 h-3" />
        {title}
      </p>
      {children}
    </div>
  );
}
