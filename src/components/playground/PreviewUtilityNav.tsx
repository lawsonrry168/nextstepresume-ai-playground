import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Layout,
  Palette,
  Move,
  Eye,
  Sparkles,
  Maximize2,
  Undo,
  Check,
  Download,
  X,
  GripHorizontal,
} from "lucide-react";
import { TemplateStyle } from "../../types";
import { ResumeThemeCustomization } from "../../lib/resumeThemeCustomization";
import TemplatePicker from "./TemplatePicker";
import ResumeThemeCustomizer from "./ResumeThemeCustomizer";
import type { PdfExportMode } from "../../lib/resumePdfTypes";
import ExportMenuButton from "./ExportMenuButton";
import {
  getScoreTone,
  scoreBadgeClass,
  toggleActiveClass,
  toggleInactiveClass,
} from "../../lib/marginaliaUi";
import { useI18n } from "../../i18n";

type UtilitySection = "layout" | "theme" | "view" | "export";

interface PreviewUtilityNavProps {
  liveAtsScore: number;
  activeTemplate: TemplateStyle;
  setActiveTemplate: (style: TemplateStyle) => void;
  freeLayoutEnabled: boolean;
  onFreeLayoutChange: (enabled: boolean) => void;
  freeLayoutLivePreview: boolean;
  onFreeLayoutLivePreviewChange: (value: boolean | ((prev: boolean) => boolean)) => void;
  freeLayoutLastSavedAt: string | null;
  matcherHighlightActive: boolean;
  onMatcherHighlightToggle: () => void;
  onOpenStudio: () => void;
  historyLength: number;
  onUndo: () => void;
  chatOpen: boolean;
  onChatToggle: () => void;
  exportToJson: () => void;
  exportToDocx: () => void;
  exportToPDF: (mode: PdfExportMode) => void;
  pdfExporting: boolean;
  themeCustomization: ResumeThemeCustomization;
  onThemeCustomizationChange: (patch: Partial<ResumeThemeCustomization>) => void;
  onThemeCustomizationReset: () => void;
}

function NavSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{title}</h4>
      {children}
    </section>
  );
}

export default function PreviewUtilityNav(props: PreviewUtilityNavProps) {
  const {
    liveAtsScore,
    activeTemplate,
    setActiveTemplate,
    freeLayoutEnabled,
    onFreeLayoutChange,
    freeLayoutLivePreview,
    onFreeLayoutLivePreviewChange,
    freeLayoutLastSavedAt,
    matcherHighlightActive,
    onMatcherHighlightToggle,
    onOpenStudio,
    historyLength,
    onUndo,
    chatOpen,
    onChatToggle,
    exportToJson,
    exportToDocx,
    exportToPDF,
    pdfExporting,
    themeCustomization,
    onThemeCustomizationChange,
    onThemeCustomizationReset,
  } = props;

  const { t } = useI18n();

  const sectionMeta: Record<UtilitySection, { label: string; subtitle: string }> = {
    layout: { label: t("preview.sections.layout"), subtitle: t("preview.sections.layoutSubtitle") },
    theme: { label: t("preview.sections.theme"), subtitle: t("preview.sections.themeSubtitle") },
    view: { label: t("preview.sections.view"), subtitle: t("preview.sections.viewSubtitle") },
    export: { label: t("preview.sections.export"), subtitle: t("preview.sections.exportSubtitle") },
  };

  const [openPanel, setOpenPanel] = useState<UtilitySection | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const scoreTone = getScoreTone(liveAtsScore);
  const scoreBadge = scoreBadgeClass[scoreTone];

  const togglePanel = (id: UtilitySection) => {
    setOpenPanel((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    if (!openPanel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPanel(null);
    };
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dockRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpenPanel(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [openPanel]);

  const actionBtn =
    "w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer";
  const actionSecondary = `${actionBtn} bg-white text-slate-700 border-slate-200 hover:bg-slate-50`;
  const actionPrimary = `${actionBtn} btn-accent border-transparent`;

  const sectionIcons: Array<{ id: UtilitySection; label: string; icon: ReactNode }> = [
    { id: "layout", label: t("preview.dock.layout"), icon: <Layout className="w-4 h-4" /> },
    { id: "theme", label: t("preview.dock.theme"), icon: <Palette className="w-4 h-4" /> },
    { id: "view", label: t("preview.dock.view"), icon: <Eye className="w-4 h-4" /> },
    { id: "export", label: t("preview.dock.export"), icon: <Download className="w-4 h-4" /> },
  ];

  const renderPanelBody = () => {
    if (!openPanel) return null;

    switch (openPanel) {
      case "layout":
        return (
          <NavSection title={t("preview.resumeTemplate")}>
            <TemplatePicker
              activeTemplate={activeTemplate}
              onSelect={setActiveTemplate}
              compact
              id="preview-template-picker"
              freeLayoutEnabled={freeLayoutEnabled}
              onFreeLayoutChange={onFreeLayoutChange}
            />
          </NavSection>
        );
      case "theme":
        return (
          <ResumeThemeCustomizer
            customization={themeCustomization}
            onChange={onThemeCustomizationChange}
            onReset={onThemeCustomizationReset}
            variant="light"
            layout="studio"
            density="compact"
            templateStyle={activeTemplate}
          />
        );
      case "view":
        return (
          <div className="space-y-4">
            <NavSection title={t("preview.layoutMode")}>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  id="preview-btn-free-layout"
                  type="button"
                  onClick={() => onFreeLayoutChange(!freeLayoutEnabled)}
                  className={`${actionBtn} ${
                    freeLayoutEnabled ? toggleActiveClass : toggleInactiveClass
                  }`}
                >
                  <Move className="w-3.5 h-3.5" />
                  {t("preview.freeLayout")}
                </button>
                {freeLayoutEnabled ? (
                  <button
                    id="preview-btn-live-layout"
                    type="button"
                    onClick={() => onFreeLayoutLivePreviewChange((v) => !v)}
                    className={`${actionBtn} ${
                      freeLayoutLivePreview ? toggleActiveClass : toggleInactiveClass
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t("preview.livePreview")}
                  </button>
                ) : (
                  <button
                    id="btn-trigger-matcher-highlights"
                    type="button"
                    onClick={onMatcherHighlightToggle}
                    className={`${actionBtn} ${
                      matcherHighlightActive ? toggleActiveClass : toggleInactiveClass
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {t("preview.jdHighlight")}
                  </button>
                )}
              </div>
              {freeLayoutEnabled && freeLayoutLastSavedAt ? (
                <p className="text-[9px] text-[var(--m-rule,#5b8fb9)] flex items-center gap-1">
                  <Check className="w-3 h-3" /> {t("preview.layoutSaved")}
                </p>
              ) : null}
              {freeLayoutEnabled ? (
                <button type="button" onClick={onMatcherHighlightToggle} className={`${actionSecondary} mt-1.5`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  {t("preview.jdKeywordHighlight")}
                </button>
              ) : null}
            </NavSection>
            <NavSection title={t("studio.title")}>
              <button id="btn-trigger-studio-mode" type="button" onClick={onOpenStudio} className={actionPrimary}>
                <Maximize2 className="w-3.5 h-3.5" />
                {t("preview.canvasStudio")}
              </button>
            </NavSection>
          </div>
        );
      case "export":
        return (
          <div className="space-y-4">
            <NavSection title={t("preview.export")}>
              <div className="w-full [&>div]:w-full [&_button]:w-full">
                <ExportMenuButton
                  id="header-btn-export-menu"
                  exportToJson={exportToJson}
                  exportToDocx={exportToDocx}
                  exportToPDF={exportToPDF}
                  pdfExporting={pdfExporting}
                  variant="toolbar"
                />
              </div>
            </NavSection>
            <NavSection title={t("preview.aiAndUndo")}>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  id="header-btn-undo"
                  type="button"
                  onClick={onUndo}
                  disabled={historyLength === 0}
                  className={`${actionBtn} ${
                    historyLength > 0
                      ? `${toggleActiveClass} hover:opacity-90`
                      : "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                  }`}
                >
                  <Undo className="w-3.5 h-3.5" />
                  {t("preview.undo")}
                </button>
                <button
                  id="header-btn-chat"
                  type="button"
                  onClick={onChatToggle}
                  className={`${actionBtn} ${
                    chatOpen ? actionPrimary : toggleActiveClass
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t("preview.gemini")}
                </button>
              </div>
            </NavSection>
          </div>
        );
      default:
        return null;
    }
  };

  const meta = openPanel ? sectionMeta[openPanel] : null;

  return (
    <div
      ref={dockRef}
      className="no-print absolute top-3 right-3 z-30 flex items-start gap-2 pointer-events-none"
      id="preview-util-header"
    >
      {openPanel && meta ? (
        <div
          ref={panelRef}
          className="pointer-events-auto w-[min(300px,calc(100vw-5rem))] max-h-[min(72vh,520px)] flex flex-col rounded-2xl utility-flyout backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-right-2 duration-200"
          role="dialog"
          aria-label={meta.label}
        >
          <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 bg-slate-50/80 cursor-default">
            <GripHorizontal className="w-4 h-4 text-slate-300 shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800">{meta.label}</p>
              <p className="text-[9px] text-slate-400 truncate">{meta.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpenPanel(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white cursor-pointer shrink-0"
              title={t("preview.closeEsc")}
              id="preview-utility-nav-toggle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 scrollbar-thin">{renderPanelBody()}</div>
          <div className="shrink-0 px-3 py-2 border-t border-slate-100 bg-slate-50/50">
            <div className={scoreBadge}>
              <span>{t("preview.atsMatch")}</span>
              <span className="font-mono tabular-nums">{liveAtsScore}%</span>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className="pointer-events-auto flex flex-col items-center gap-0.5 p-1.5 rounded-2xl utility-dock backdrop-blur-md shadow-lg shadow-slate-900/8"
        aria-label={t("preview.floatingTools")}
      >
        {sectionIcons.map((item) => {
          const active = openPanel === item.id;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => togglePanel(item.id)}
              className={`p-2 rounded-xl cursor-pointer transition-all ${
                active
                  ? "btn-dock-active scale-105"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              {item.icon}
            </button>
          );
        })}
        <div className="w-full h-px bg-slate-100 my-0.5" />
        <span
          className={`${scoreBadge} text-[9px] font-black font-mono px-1.5 py-0.5 leading-none`}
          title={`ATS ${liveAtsScore}%`}
        >
          {liveAtsScore}
        </span>
      </div>
    </div>
  );
}
