import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Download, FileText, ScanText, Lock } from "lucide-react";
import type { PdfExportMode } from "../../lib/resumePdfTypes";
import { useI18n } from "../../i18n";
import { useSubscription } from "../../context/SubscriptionProvider";
import type { FeatureId } from "../../lib/subscription/types";

export interface ExportMenuButtonProps {
  exportToJson: () => void;
  exportToDocx: () => Promise<void> | void;
  exportToPDF: (mode: PdfExportMode) => Promise<void> | void;
  pdfExporting?: boolean;
  id?: string;
  variant?: "toolbar" | "studio";
}

type ExportRunKind = PdfExportMode | "docx" | "json";

interface MenuPosition {
  top: number;
  left: number;
  minWidth: number;
}

export default function ExportMenuButton({
  exportToJson,
  exportToDocx,
  exportToPDF,
  pdfExporting = false,
  id = "header-btn-export-menu",
  variant = "toolbar",
}: ExportMenuButtonProps) {
  const { t } = useI18n();
  const { canUseFeature, canConsume, consumeUsage, openUpgrade, plan } = useSubscription();
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const exportOptions: Array<{
    id: string;
    label: string;
    hint: string;
    icon: typeof FileText;
    run: ExportRunKind;
  }> = [
    {
      id: "export-pdf-visual",
      label: t("export.pdfVisual"),
      hint: t("export.pdfVisualHint"),
      icon: FileText,
      run: "visual",
    },
    {
      id: "export-pdf-ats",
      label: t("export.pdfAts"),
      hint: t("export.pdfAtsHint"),
      icon: ScanText,
      run: "ats",
    },
    {
      id: "export-docx",
      label: t("export.docx"),
      hint: t("export.docxHint"),
      icon: FileText,
      run: "docx",
    },
    {
      id: "export-json",
      label: t("export.json"),
      hint: t("export.jsonHint"),
      icon: Download,
      run: "json",
    },
  ];

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const minWidth = 208;
    const left = Math.max(8, Math.min(rect.right - minWidth, window.innerWidth - minWidth - 8));
    setMenuPosition({
      top: rect.bottom + 6,
      left,
      minWidth,
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const exportGate: Record<ExportRunKind, FeatureId | null> = {
    visual: "export.pdfVisual",
    ats: "export.pdfAts",
    docx: "export.docx",
    json: "export.json",
  };

  const isExportLocked = (kind: ExportRunKind): boolean => {
    const feature = exportGate[kind];
    if (!feature) return false;
    return !canUseFeature(feature);
  };

  const runExport = async (kind: ExportRunKind) => {
    setOpen(false);
    const feature = exportGate[kind];
    if (feature && !canUseFeature(feature)) {
      openUpgrade(feature);
      return;
    }
    if (kind === "visual") {
      if (!canConsume("pdfVisualExport", 1)) {
        openUpgrade("pdfVisualExport");
        return;
      }
      await exportToPDF("visual");
      consumeUsage("pdfVisualExport", 1);
      return;
    }
    if (kind === "ats") {
      if (!canConsume("pdfAtsExport", 1)) {
        openUpgrade("export.pdfAts");
        return;
      }
      await exportToPDF("ats");
      consumeUsage("pdfAtsExport", 1);
      return;
    }
    if (kind === "docx") {
      if (!canConsume("docxExport", 1)) {
        openUpgrade("export.docx");
        return;
      }
      await exportToDocx();
      consumeUsage("docxExport", 1);
      return;
    }
    exportToJson();
  };

  const triggerClass =
    variant === "studio"
      ? `inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-md ${
          pdfExporting
            ? "bg-slate-100 text-slate-400 border-slate-200 animate-pulse cursor-not-allowed"
            : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-500"
        }`
      : `inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed`;

  const menuClass =
    variant === "studio"
      ? "fixed z-[200] min-w-[13rem] rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
      : "fixed z-[200] min-w-[13rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg";

  const itemClass =
    "w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50";

  const menu =
    open && menuPosition ? (
      <div
        ref={menuRef}
        className={menuClass}
        role="menu"
        aria-labelledby={id}
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
          minWidth: menuPosition.minWidth,
        }}
      >
        {exportOptions.map((option) => {
          const Icon = option.icon;
          const isPdf = option.run === "visual" || option.run === "ats";
          const disabled = isPdf && pdfExporting;
          const locked = isExportLocked(option.run);
          const hint =
            option.run === "visual" && plan === "starter"
              ? `${option.hint} · ${t("billing.watermarkNotice")}`
              : option.hint;
          return (
            <button
              key={option.id}
              id={option.id}
              type="button"
              role="menuitem"
              disabled={disabled}
              onClick={() => void runExport(option.run)}
              className={itemClass}
            >
              {locked ? (
                <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
              ) : (
                <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" />
              )}
              <span className="min-w-0">
                <span className="block text-xs font-bold text-slate-800">{option.label}</span>
                <span className="block text-[10px] text-slate-400">{hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    ) : null;

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={pdfExporting}
        className={triggerClass}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t("export.menuTitle")}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{pdfExporting ? t("common.exporting") : t("common.export")}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
