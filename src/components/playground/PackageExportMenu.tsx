import { useState, type ReactNode } from "react";
import { Download, FileText, FileType, Loader2, Mail, Package } from "lucide-react";
import type { ApplicationPackage } from "../../types";
import { useI18n } from "../../i18n";

interface PackageExportMenuProps {
  pkg: ApplicationPackage;
  exporting?: boolean;
  onExportMergedPdf: () => void;
  onExportMergedOoxml: () => void;
  onExportFull: () => void;
  onExportResume: () => void;
  onExportCoverLetter: () => void;
}

export default function PackageExportMenu({
  pkg,
  exporting = false,
  onExportMergedPdf,
  onExportMergedOoxml,
  onExportFull,
  onExportResume,
  onExportCoverLetter,
}: PackageExportMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={exporting}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
      >
        {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
        {t("packageExport.title")}
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label={t("packageExport.closeMenu")}
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-1">
            <ExportItem
              icon={<FileType className="w-3.5 h-3.5" />}
              label={t("packageExport.mergedPdf")}
              hint={t("packageExport.mergedPdfHint")}
              onClick={() => {
                onExportMergedPdf();
                setOpen(false);
              }}
            />
            <ExportItem
              icon={<FileText className="w-3.5 h-3.5" />}
              label={t("packageExport.mergedDocx")}
              hint={t("packageExport.mergedDocxHint")}
              onClick={() => {
                onExportMergedOoxml();
                setOpen(false);
              }}
            />
            <ExportItem
              icon={<Package className="w-3.5 h-3.5" />}
              label={t("packageExport.fullPackage")}
              hint={t("packageExport.fullPackageHint")}
              onClick={() => {
                onExportFull();
                setOpen(false);
              }}
            />
            <div className="my-1 border-t border-slate-100" />
            <ExportItem
              icon={<FileText className="w-3.5 h-3.5" />}
              label={t("packageExport.resumeDocx")}
              onClick={() => {
                onExportResume();
                setOpen(false);
              }}
            />
            <ExportItem
              icon={<Mail className="w-3.5 h-3.5" />}
              label={t("packageExport.coverLetterDocx")}
              disabled={!pkg.coverLetter}
              onClick={() => {
                onExportCoverLetter();
                setOpen(false);
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function ExportItem({
  icon,
  label,
  hint,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
    >
      <span className="text-slate-500 mt-0.5">{icon}</span>
      <span>
        <span className="block text-xs font-bold text-slate-800">{label}</span>
        {hint ? <span className="block text-[10px] text-slate-400">{hint}</span> : null}
      </span>
      <Download className="w-3 h-3 text-slate-300 ml-auto mt-1" />
    </button>
  );
}
