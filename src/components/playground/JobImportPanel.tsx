import { useState } from "react";
import { motion } from "motion/react";
import { Link2, FileText, Loader2, Sparkles, Search, Lock } from "lucide-react";
import { fetchJdFromUrl, importJdFromPaste, type JdFetchResult } from "../../lib/jdUrlFetch";
import { searchJobsdb } from "../../lib/jobsdbSearch";
import {
  jobsdbListingToImportedJob,
  type JobsdbCountry,
  type JobsdbListing,
  type JobsdbPostedDate,
} from "../../lib/jobsdbApifyScraper";
import { extractJobMeta } from "../../lib/extractJobMeta";
import { mergeImportedJobMeta } from "../../lib/createDraftApplicationPackage";
import { useI18n } from "../../i18n";
import { getActiveMarket } from "../../lib/market/config";
import { useSubscription } from "../../context/SubscriptionProvider";

export type ImportedJobData = {
  jobDescription: string;
  jobTitle: string;
  companyName: string;
  sourceUrl?: string;
};

type MeasuredFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type ToastFn = (type: "success" | "error" | "warning" | "info", message: string) => void;

interface JobImportPanelProps {
  measuredFetch: MeasuredFetch;
  pushToast: ToastFn;
  onImported: (data: ImportedJobData) => void;
  onCreateDraft?: (data: ImportedJobData) => void;
  onOpenWizard?: (data: ImportedJobData) => void;
  compact?: boolean;
}

const inputClass = "input-field";

function JobsdbSkeleton() {
  return (
    <ul className="max-h-48 overflow-hidden space-y-2 rounded-lg border border-slate-100 bg-white p-2">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="rounded-lg px-2 py-2 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="h-3 w-3/4 bg-slate-200 rounded mb-1.5" />
          <div className="h-2.5 w-1/2 bg-slate-100 rounded" />
        </li>
      ))}
    </ul>
  );
}

function normalizeImport(data: JdFetchResult | ImportedJobData, headline?: string): ImportedJobData {
  const meta = extractJobMeta(data.jobDescription);
  const merged = mergeImportedJobMeta(headline ?? "", {
    jobTitle: data.jobTitle || meta.jobTitle,
    companyName: data.companyName || meta.companyName,
  });
  return {
    jobDescription: data.jobDescription,
    jobTitle: merged.jobTitle,
    companyName: merged.companyName,
    sourceUrl: "sourceUrl" in data ? data.sourceUrl : undefined,
  };
}

export default function JobImportPanel({
  measuredFetch,
  pushToast,
  onImported,
  onCreateDraft,
  onOpenWizard,
  compact = false,
}: JobImportPanelProps) {
  const { t } = useI18n();
  const subscription = useSubscription();
  const canImportUrl = subscription.canUseFeature("import.jdUrl");
  const canImportJobsdb = subscription.canUseFeature("import.jobsdb");
  const [url, setUrl] = useState("");
  const [paste, setPaste] = useState("");
  const [fetching, setFetching] = useState(false);
  const [mode, setMode] = useState<"url" | "paste" | "jobsdb">(
    () => getActiveMarket().jobs.defaultImportMode,
  );
  const [lastImported, setLastImported] = useState<ImportedJobData | null>(null);
  const [jobsdbKeyword, setJobsdbKeyword] = useState("");
  const [jobsdbStartUrl, setJobsdbStartUrl] = useState("");
  const [jobsdbKeywordError, setJobsdbKeywordError] = useState("");
  const [jobsdbLocation, setJobsdbLocation] = useState("");
  const [jobsdbCountry, setJobsdbCountry] = useState<JobsdbCountry>(
    () => getActiveMarket().jobs.defaultJobsdbCountry,
  );
  const [jobsdbPostedDate, setJobsdbPostedDate] = useState<JobsdbPostedDate>("7d");
  const [jobsdbLimit, setJobsdbLimit] = useState(10);
  const [jobsdbResults, setJobsdbResults] = useState<JobsdbListing[]>([]);

  const commitImport = (data: ImportedJobData) => {
    setLastImported(data);
    onImported(data);
  };

  const resolveImportData = (): ImportedJobData | null => {
    if (lastImported?.jobDescription.trim()) return lastImported;
    if (mode === "paste" && paste.trim().length >= 20) {
      return normalizeImport(importJdFromPaste(paste));
    }
    return null;
  };

  const handleFetchUrl = async () => {
    if (!canImportUrl) {
      subscription.openUpgrade("import.jdUrl");
      return;
    }
    if (!url.trim()) {
      pushToast("warning", t("toast.playground.jdUrlRequired"));
      return;
    }
    setFetching(true);
    try {
      const result = await fetchJdFromUrl(url, measuredFetch);
      const imported = normalizeImport(result, result.pageTitle);
      commitImport(imported);
      pushToast("success", t("toast.playground.jdImported", { chars: result.extractedChars ?? imported.jobDescription.length }));
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : t("toast.playground.importFailed"));
    } finally {
      setFetching(false);
    }
  };

  const handlePasteImport = () => {
    try {
      const imported = normalizeImport(importJdFromPaste(paste));
      commitImport(imported);
      pushToast("success", t("toast.playground.jdFromPaste"));
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : t("toast.playground.importFailed"));
    }
  };

  const handleJobsdbSearch = async () => {
    if (!canImportJobsdb) {
      subscription.openUpgrade("import.jobsdb");
      return;
    }
    if (!subscription.canConsume("jobsdbSearch", 1)) {
      subscription.openUpgrade("jobsdbSearch");
      return;
    }
    const trimmedStartUrl = jobsdbStartUrl.trim();
    const isJobsdbUrl = /jobsdb\.com/i.test(trimmedStartUrl);

    if (!jobsdbKeyword.trim() && !isJobsdbUrl) {
      setJobsdbKeywordError(t("editor.jobImport.keywordError"));
      pushToast("warning", t("toast.playground.jobsdbKeywordRequired"));
      return;
    }

    setJobsdbKeywordError("");

    setFetching(true);
    setJobsdbResults([]);
    try {
      const response = await searchJobsdb(
        {
          keyword: jobsdbKeyword.trim() || undefined,
          location: jobsdbLocation.trim() || undefined,
          startUrl: isJobsdbUrl ? trimmedStartUrl : undefined,
          country: jobsdbCountry,
          posted_date: jobsdbPostedDate,
          results_wanted: jobsdbLimit,
        },
        measuredFetch
      );
      setJobsdbResults(response.jobs);
      if (response.jobs.length === 0) {
        pushToast("info", t("toast.playground.jobsdbNoResults"));
      } else {
        pushToast("success", t("toast.playground.jobsdbFound", { count: response.jobs.length }));
      }
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : t("toast.playground.jobsdbSearchFailed"));
    } finally {
      setFetching(false);
    }
  };

  const handleSelectJobsdbJob = (job: JobsdbListing) => {
    const raw = jobsdbListingToImportedJob(job);
    const imported = normalizeImport(raw);
    commitImport(imported);
    pushToast("success", t("toast.playground.jobSelected", { jobTitle: imported.jobTitle || t("editor.jobImport.jobFallback") }));
  };

  return (
    <div
      className={`panel-muted border-emerald-100/60 ${
        compact ? "p-3 space-y-2" : "p-4 space-y-3"
      }`}
      id="job-import-panel"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 ui-label">
            {t("editor.jobImport.title")}
          </p>
          {!compact && (
            <p className="text-[10px] text-slate-500 mt-0.5">
              {t("editor.jobImport.hint")}
            </p>
          )}
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-1 text-[10px] font-bold cursor-pointer ${
              mode === "url" ? "bg-emerald-600 text-white" : "bg-white text-slate-600"
            }`}
          >
            {t("editor.jobImport.modes.url")}
          </button>
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={`px-2 py-1 text-[10px] font-bold cursor-pointer ${
              mode === "paste" ? "bg-emerald-600 text-white" : "bg-white text-slate-600"
            }`}
          >
            {t("editor.jobImport.modes.paste")}
          </button>
          <button
            type="button"
            id="job-import-mode-jobsdb"
            onClick={() => (canImportJobsdb ? setMode("jobsdb") : subscription.openUpgrade("import.jobsdb"))}
            className={`px-2 py-1 text-[10px] font-bold cursor-pointer flex items-center gap-0.5 ${
              mode === "jobsdb" ? "bg-emerald-600 text-white" : "bg-white text-slate-600"
            } ${!canImportJobsdb ? "opacity-70" : ""}`}
          >
            {!canImportJobsdb && <Lock className="w-2.5 h-2.5" />}
            {t("editor.jobImport.modes.jobsdb")}
          </button>
        </div>
      </div>

      {mode === "url" ? (
        <div className="flex gap-2">
          <input
            className={`${inputClass} flex-1`}
            placeholder={t("editor.jobImport.urlPlaceholder")}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={fetching}
          />
          <button
            type="button"
            onClick={handleFetchUrl}
            disabled={fetching}
            className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
          >
            {fetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
            {t("editor.jobImport.fetch")}
          </button>
        </div>
      ) : mode === "paste" ? (
        <div className="space-y-2">
          <textarea
            className={`${inputClass} min-h-[88px] resize-y font-mono text-[11px] leading-relaxed`}
            placeholder={t("editor.jobImport.pastePlaceholder")}
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
          />
          <button
            type="button"
            onClick={handlePasteImport}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            {t("editor.jobImport.parsePaste")}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="space-y-1">
              <input
                id="jobsdb-keyword-input"
                className={`${inputClass} ${jobsdbKeywordError ? "border-amber-400 ring-1 ring-amber-200" : ""}`}
                placeholder={t("editor.jobImport.keywordPlaceholder")}
                value={jobsdbKeyword}
                onChange={(e) => {
                  setJobsdbKeyword(e.target.value);
                  if (e.target.value.trim()) setJobsdbKeywordError("");
                }}
                disabled={fetching}
              />
              {jobsdbKeywordError && (
                <p className="text-[10px] text-amber-700">{jobsdbKeywordError}</p>
              )}
            </div>
            <input
              className={inputClass}
              placeholder={t("editor.jobImport.locationPlaceholder")}
              value={jobsdbLocation}
              onChange={(e) => setJobsdbLocation(e.target.value)}
              disabled={fetching}
            />
            <select
              className={inputClass}
              value={jobsdbCountry}
              onChange={(e) => setJobsdbCountry(e.target.value as JobsdbCountry)}
              disabled={fetching}
            >
              <option value="hk">{t("editor.jobImport.jobsdbCountries.hk")}</option>
              <option value="th">{t("editor.jobImport.jobsdbCountries.th")}</option>
            </select>
            <select
              className={inputClass}
              value={jobsdbPostedDate}
              onChange={(e) => setJobsdbPostedDate(e.target.value as JobsdbPostedDate)}
              disabled={fetching}
            >
              <option value="anytime">{t("editor.jobImport.jobsdbPosted.anytime")}</option>
              <option value="24h">{t("editor.jobImport.jobsdbPosted.24h")}</option>
              <option value="7d">{t("editor.jobImport.jobsdbPosted.7d")}</option>
              <option value="30d">{t("editor.jobImport.jobsdbPosted.30d")}</option>
            </select>
          </div>
          <input
            className={inputClass}
            placeholder={t("editor.jobImport.startUrlPlaceholder")}
            value={jobsdbStartUrl}
            onChange={(e) => {
              setJobsdbStartUrl(e.target.value);
              if (e.target.value.trim()) setJobsdbKeywordError("");
            }}
            disabled={fetching}
          />
          <div className="flex gap-2 items-center">
            <label className="text-[10px] text-slate-500 shrink-0">{t("editor.jobImport.resultCount")}</label>
            <select
              className={`${inputClass} w-20`}
              value={jobsdbLimit}
              onChange={(e) => setJobsdbLimit(Number(e.target.value))}
              disabled={fetching}
            >
              {[5, 10, 15, 20, 30].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              type="button"
              id="jobsdb-search-btn"
              onClick={handleJobsdbSearch}
              disabled={fetching}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
            >
              {fetching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              {t("editor.jobImport.searchJobsdb")}
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            {t("editor.jobImport.workflowHint")}
          </p>
          {fetching && mode === "jobsdb" && <JobsdbSkeleton />}
          {!fetching && jobsdbResults.length > 0 && (
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.06 } },
              }}
              className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-slate-100 bg-white p-2"
              id="jobsdb-results-list"
            >
              {jobsdbResults.map((job) => (
                <motion.li
                  key={job.id || job.url}
                  variants={{
                    hidden: { opacity: 0, y: 6 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectJobsdbJob(job)}
                    className="w-full text-left rounded-lg px-2 py-1.5 hover:bg-emerald-50/80 border border-transparent hover:border-emerald-100 cursor-pointer transition-colors active:scale-[0.99]"
                  >
                    <p className="text-[11px] font-semibold text-slate-800 truncate">
                      {job.title || t("editor.jobImport.noTitle")}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {job.company}
                      {job.location ? ` · ${job.location}` : ""}
                      {job.salary ? ` · ${job.salary}` : ""}
                      {job.postedAt_relative ? ` · ${job.postedAt_relative}` : ""}
                    </p>
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          )}
          {!fetching && jobsdbResults.length === 0 && jobsdbKeyword.trim() && (
            <p className="text-[10px] text-slate-400 py-2 text-center">{t("editor.jobImport.resultsPlaceholder")}</p>
          )}
        </div>
      )}

      {lastImported && (
        <p className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1">
          {t("editor.jobImport.importedBanner", {
            jobTitle: lastImported.jobTitle || t("editor.jobImport.jobFallback"),
            company: lastImported.companyName || t("editor.jobImport.companyFallback"),
            source: lastImported.sourceUrl ? t("editor.jobImport.sourceUrl") : "",
          })}
        </p>
      )}

      {(onCreateDraft || onOpenWizard) && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-emerald-100">
          {onCreateDraft && (
            <button
              type="button"
              onClick={() => {
                try {
                  const data = resolveImportData();
                  if (!data) {
                    pushToast("warning", t("toast.playground.importJdFirst"));
                    return;
                  }
                  onCreateDraft(data);
                } catch (err) {
                  pushToast("error", err instanceof Error ? err.message : t("toast.playground.createFailed"));
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <FileText className="w-3 h-3" />
              {t("editor.jobImport.createDraft")}
            </button>
          )}
          {onOpenWizard && (
            <button
              type="button"
              onClick={() => {
                try {
                  const data = resolveImportData();
                  if (!data) {
                    pushToast("warning", t("toast.playground.importJdFirst"));
                    return;
                  }
                  onOpenWizard(data);
                } catch (err) {
                  pushToast("error", err instanceof Error ? err.message : t("toast.playground.wizardOpenFailed"));
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              {t("editor.jobImport.importAndApply")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
