import { useCallback, useState } from "react";
import {
  exportFullApplicationPackage,
  exportCoverLetterOnly,
  exportResumeOnly,
} from "../lib/applicationPackageExport";
import { downloadApplicationPackagePdf } from "../lib/applicationPackagePdfExport";
import {
  downloadApplicationPackageOoxml,
  downloadCoverLetterOoxml,
  downloadResumeOoxml,
} from "../lib/ooxmlApplicationExport";
import type { ApplicationPackage } from "../types";
import { t } from "../i18n/translate";
import { useSubscription } from "../context/SubscriptionProvider";

type ToastFn = (type: "success" | "error" | "warning" | "info", message: string) => void;

export function useApplicationExport(pushToast: ToastFn) {
  const subscription = useSubscription();
  const [exporting, setExporting] = useState(false);

  const exportFullPackage = useCallback(
    async (pkg: ApplicationPackage) => {
      if (!subscription.canUseFeature("export.packageFull")) {
        subscription.openUpgrade("export.packageFull");
        return;
      }
      setExporting(true);
      try {
        await exportFullApplicationPackage(pkg);
        pushToast("success", t("toast.export.packageStarted"));
      } catch (err) {
        console.error(err);
        pushToast("error", t("toast.export.exportFailed"));
      } finally {
        setExporting(false);
      }
    },
    [pushToast, subscription],
  );

  const exportMergedPdf = useCallback(
    async (pkg: ApplicationPackage) => {
      if (!subscription.canUseFeature("export.packageMerged")) {
        subscription.openUpgrade("export.packageMerged");
        return;
      }
      if (!subscription.canConsume("mergedExport", 1)) {
        subscription.openUpgrade("mergedExport");
        return;
      }
      setExporting(true);
      try {
        await downloadApplicationPackagePdf(pkg);
        subscription.consumeUsage("mergedExport", 1);
        pushToast("success", t("toast.export.mergedPdfDownloaded"));
      } catch (err) {
        console.error(err);
        pushToast("error", t("toast.export.pdfExportFailed"));
      } finally {
        setExporting(false);
      }
    },
    [pushToast, subscription],
  );

  const exportMergedOoxml = useCallback(
    async (pkg: ApplicationPackage) => {
      if (!subscription.canUseFeature("export.packageMerged")) {
        subscription.openUpgrade("export.packageMerged");
        return;
      }
      if (!subscription.canConsume("mergedExport", 1)) {
        subscription.openUpgrade("mergedExport");
        return;
      }
      setExporting(true);
      try {
        await downloadApplicationPackageOoxml(pkg);
        subscription.consumeUsage("mergedExport", 1);
        pushToast("success", t("toast.export.mergedDocxDownloaded"));
      } catch (err) {
        console.error(err);
        pushToast("error", t("toast.export.docxExportFailed"));
      } finally {
        setExporting(false);
      }
    },
    [pushToast, subscription],
  );

  const exportResume = useCallback(
    async (pkg: ApplicationPackage) => {
      if (!subscription.canUseFeature("export.docx")) {
        subscription.openUpgrade("export.docx");
        return;
      }
      if (!subscription.canConsume("docxExport", 1)) {
        subscription.openUpgrade("docxExport");
        return;
      }
      setExporting(true);
      try {
        await downloadResumeOoxml(pkg.resumeSnapshot, pkg.companyName);
        subscription.consumeUsage("docxExport", 1);
        pushToast("success", t("toast.export.resumeDocxDownloaded"));
      } catch (err) {
        console.error(err);
        pushToast("error", t("toast.export.resumeExportFailed"));
      } finally {
        setExporting(false);
      }
    },
    [pushToast, subscription],
  );

  const exportCoverLetter = useCallback(
    async (pkg: ApplicationPackage) => {
      if (!pkg.coverLetter) {
        pushToast("warning", t("toast.export.noCoverLetter"));
        return;
      }
      if (!subscription.canUseFeature("export.docx")) {
        subscription.openUpgrade("export.docx");
        return;
      }
      if (!subscription.canConsume("docxExport", 1)) {
        subscription.openUpgrade("docxExport");
        return;
      }
      setExporting(true);
      try {
        await downloadCoverLetterOoxml(
          pkg.coverLetter,
          `${pkg.companyName}_cover_letter`.replace(/\s+/g, "_"),
        );
        subscription.consumeUsage("docxExport", 1);
        pushToast("success", t("toast.export.coverLetterDocxDownloaded"));
      } catch (err) {
        console.error(err);
        pushToast("error", t("toast.export.coverLetterExportFailed"));
      } finally {
        setExporting(false);
      }
    },
    [pushToast, subscription],
  );

  /** Legacy HTML-based docx downloads */
  const exportResumeLegacy = useCallback(
    (pkg: ApplicationPackage) => {
      if (!subscription.canUseFeature("export.docx")) {
        subscription.openUpgrade("export.docx");
        return;
      }
      exportResumeOnly(pkg);
      pushToast("success", t("toast.export.resumeDocxLegacyDownloaded"));
    },
    [pushToast, subscription],
  );

  const exportCoverLetterLegacy = useCallback(
    (pkg: ApplicationPackage) => {
      if (!pkg.coverLetter) {
        pushToast("warning", t("toast.export.noCoverLetter"));
        return;
      }
      if (!subscription.canUseFeature("export.docx")) {
        subscription.openUpgrade("export.docx");
        return;
      }
      exportCoverLetterOnly(pkg);
      pushToast("success", t("toast.export.coverLetterDocxLegacyDownloaded"));
    },
    [pushToast, subscription],
  );

  return {
    exporting,
    exportFullPackage,
    exportMergedPdf,
    exportMergedOoxml,
    exportResume,
    exportCoverLetter,
    exportResumeLegacy,
    exportCoverLetterLegacy,
  };
}
