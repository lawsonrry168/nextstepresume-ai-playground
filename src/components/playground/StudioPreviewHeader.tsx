import React, { useState } from "react";
import {
  Layers, Minimize2, Eye, Move, RotateCcw, Magnet, Undo, Redo, Sparkles, Check, Palette, ChevronDown, ChevronUp, PenTool,
} from "lucide-react";
import { ResumeData, TemplateStyle } from "../../types";
import { ResumeThemeCustomization } from "../../lib/resumeThemeCustomization";
import { FREE_LAYOUT_PRESETS, FreeLayoutPresetId } from "../../lib/resumeFreeLayout";
import { type StudioViewMode } from "../../lib/canvasStudioTypes";
import { formatAutoSaveTime, getPresetLabel } from "../../lib/sectionLabels";
import { useI18n } from "../../i18n";
import LayoutSnapshotMenu from "./LayoutSnapshotMenu";
import { getTemplateFamily } from "../../lib/resumeTemplateCatalog";
import TemplatePicker from "./TemplatePicker";
import type { PdfExportMode } from "../../lib/resumePdfTypes";
import ExportMenuButton from "./ExportMenuButton";
import ResumeThemeCustomizer from "./ResumeThemeCustomizer";
import {
  STUDIO_BTN,
  STUDIO_BTN_ACTIVE,
  STUDIO_BTN_ACTIVE_CYAN,
  STUDIO_BTN_ACTIVE_EMERALD,
  STUDIO_BTN_IDLE,
  STUDIO_DIVIDER,
} from "./studioToolbarStyles";

export interface StudioPreviewHeaderProps {
  liveAtsScore: number;
  onExit: () => void;
  studioViewMode: StudioViewMode;
  setStudioViewMode: (mode: StudioViewMode) => void;
  activeTemplate: TemplateStyle;
  setActiveTemplate: (style: TemplateStyle) => void;
  freeLayoutEnabled: boolean;
  setFreeLayoutEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  freeLayoutLivePreview: boolean;
  setFreeLayoutLivePreview: (value: boolean | ((prev: boolean) => boolean)) => void;
  freeLayoutSnapEnabled: boolean;
  setFreeLayoutSnapEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  onResetLayout: () => void;
  onApplyLayoutPreset: (id: FreeLayoutPresetId) => void;
  freeLayoutLastSavedAt: number | null;
  grayscaleMode: boolean;
  setGrayscaleMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  highlightChanges: boolean;
  setHighlightChanges: (value: boolean | ((prev: boolean) => boolean)) => void;
  previewZoom: number;
  setPreviewZoom: (value: number) => void;
  previewAutoFit: boolean;
  setPreviewAutoFit: (value: boolean | ((prev: boolean) => boolean)) => void;
  history: unknown[];
  future?: unknown[];
  handleUndo: () => void;
  handleRedo?: () => void;
  chatOpen: boolean;
  setChatOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  exportToJson: () => void;
  exportToDocx: () => void;
  exportToPDF: (mode: PdfExportMode) => void;
  pdfExporting: boolean;
  themeCustomization: ResumeThemeCustomization;
  onThemeCustomizationChange: (patch: Partial<ResumeThemeCustomization>) => void;
  onThemeCustomizationReset: () => void;
}

export default function StudioPreviewHeader({
  liveAtsScore,
  onExit,
  studioViewMode,
  setStudioViewMode,
  activeTemplate,
  setActiveTemplate,
  freeLayoutEnabled,
  setFreeLayoutEnabled,
  freeLayoutLivePreview,
  setFreeLayoutLivePreview,
  freeLayoutSnapEnabled,
  setFreeLayoutSnapEnabled,
  onResetLayout,
  onApplyLayoutPreset,
  freeLayoutLastSavedAt,
  grayscaleMode,
  setGrayscaleMode,
  highlightChanges,
  setHighlightChanges,
  previewZoom,
  setPreviewZoom,
  previewAutoFit,
  setPreviewAutoFit,
  history,
  future = [],
  handleUndo,
  handleRedo,
  chatOpen,
  setChatOpen,
  exportToJson,
  exportToDocx,
  exportToPDF,
  pdfExporting,
  themeCustomization,
  onThemeCustomizationChange,
  onThemeCustomizationReset,
}: StudioPreviewHeaderProps) {
  const { t } = useI18n();
  const [themeExpanded, setThemeExpanded] = useState(themeCustomization.enabled);
  const isCanvasMode = studioViewMode === "canvas";

  const toggleTheme = () => {
    const next = !themeCustomization.enabled;
    onThemeCustomizationChange({ enabled: next });
    if (next) setThemeExpanded(true);
  };

  const previewControls = (
    <>
      <button
        id="studio-btn-grayscale"
        type="button"
        onClick={() => setGrayscaleMode((p) => !p)}
        className={grayscaleMode ? `${STUDIO_BTN} bg-amber-50 text-amber-800 border-amber-200` : STUDIO_BTN_IDLE}
        title={t("studio.bwPreview")}
      >
        B&W
      </button>
      <button
        id="studio-btn-highlight"
        type="button"
        onClick={() => setHighlightChanges((p) => !p)}
        className={highlightChanges ? `${STUDIO_BTN} bg-emerald-50 text-emerald-700 border-emerald-200` : STUDIO_BTN_IDLE}
        title={t("studio.aiHighlight")}
      >
        AI
      </button>
      <div className="flex items-center bg-white rounded-md p-0.5 border border-slate-200 text-[10px] font-mono font-bold shrink-0">
        <button
          type="button"
          onClick={() => setPreviewAutoFit(true)}
          className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
            previewAutoFit ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Auto
        </button>
        {([90, 100, 115] as const).map((z) => (
          <button
            key={z}
            type="button"
            onClick={() => {
              setPreviewAutoFit(false);
              setPreviewZoom(z);
            }}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
              !previewAutoFit && previewZoom === z
                ? "bg-emerald-600 text-white"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {z}%
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div
      className="shrink-0 flex flex-col bg-white text-slate-800 rounded-t-2xl no-print shadow-sm border border-b-0 border-slate-200"
      id="preview-studio-header"
    >
      {/* 單列緊湊工具列 */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5 shrink-0">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span className="text-[11px] font-black text-slate-900 hidden md:inline uppercase tracking-wide">{t("studio.title")}</span>
        </div>

        <span className={STUDIO_DIVIDER} aria-hidden />

        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1 flex-nowrap pr-1">
            <button
              id="studio-btn-single"
              type="button"
              onClick={() => {
                setFreeLayoutEnabled(true);
                setStudioViewMode("single");
              }}
              className={studioViewMode === "single" ? STUDIO_BTN_ACTIVE : STUDIO_BTN_IDLE}
              title={isCanvasMode ? t("studio.returnSinglePage") : t("studio.singlePageTitle")}
            >
              <Eye className="w-3 h-3" />
              <span>{t("studio.singlePage")}</span>
            </button>
            <button
              id="studio-btn-canvas"
              type="button"
              onClick={() => {
                setFreeLayoutEnabled(true);
                setFreeLayoutLivePreview(false);
                setStudioViewMode("canvas");
              }}
              className={
                studioViewMode === "canvas"
                  ? `${STUDIO_BTN} bg-indigo-50 text-indigo-700 border-indigo-200`
                  : STUDIO_BTN_IDLE
              }
              title={t("studio.canvasImmersive")}
            >
              <PenTool className="w-3 h-3" />
              <span>{t("studio.canvas")}</span>
            </button>

            {!isCanvasMode ? (
              <>
                    <span className={STUDIO_DIVIDER} />
                    <div className="min-w-[12rem] max-w-[18rem] shrink-0">
                      <TemplatePicker
                        activeTemplate={activeTemplate}
                        onSelect={setActiveTemplate}
                        compact
                        variant="light"
                        id="studio-template-picker"
                        freeLayoutEnabled={freeLayoutEnabled}
                        onFreeLayoutChange={(enabled) => {
                          setFreeLayoutEnabled(enabled);
                          if (enabled) setStudioViewMode("single");
                        }}
                      />
                    </div>
                    <span className={STUDIO_DIVIDER} />
                    <button
                      id="studio-btn-theme-toggle"
                      type="button"
                      onClick={toggleTheme}
                      className={themeCustomization.enabled ? STUDIO_BTN_ACTIVE : STUDIO_BTN_IDLE}
                    >
                      <Palette className="w-3 h-3" />
                      <span>{t("studio.custom")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setThemeExpanded((v) => !v)}
                      className={`${STUDIO_BTN} ${themeExpanded ? "bg-emerald-50 text-emerald-700 border-emerald-200" : STUDIO_BTN_IDLE}`}
                      aria-expanded={themeExpanded}
                      title={t("studio.theme")}
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform ${themeExpanded ? "rotate-180" : ""}`} />
                    </button>
                    <span className={STUDIO_DIVIDER} />
                    <button
                      id="studio-btn-free-layout"
                      type="button"
                      onClick={() => {
                        setFreeLayoutEnabled((prev) => {
                          const next = !prev;
                          if (next) setStudioViewMode("single");
                          return next;
                        });
                      }}
                      className={freeLayoutEnabled ? STUDIO_BTN_ACTIVE : STUDIO_BTN_IDLE}
                      title={t("studio.freeLayout")}
                    >
                      <Move className="w-3 h-3" />
                      <span className="hidden lg:inline">{t("studio.freeLayout")}</span>
                    </button>
                    {freeLayoutEnabled ? (
                      <>
                        <button
                          id="studio-btn-live-preview"
                          type="button"
                          onClick={() => setFreeLayoutLivePreview((p) => !p)}
                          className={freeLayoutLivePreview ? STUDIO_BTN_ACTIVE_EMERALD : STUDIO_BTN_IDLE}
                          title={t("studio.livePreview")}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          id="studio-btn-snap"
                          type="button"
                          onClick={() => setFreeLayoutSnapEnabled((p) => !p)}
                          className={freeLayoutSnapEnabled ? STUDIO_BTN_ACTIVE_CYAN : STUDIO_BTN_IDLE}
                          title={t("studio.snap")}
                        >
                          <Magnet className="w-3 h-3" />
                        </button>
                        <button id="studio-btn-reset-layout" type="button" onClick={onResetLayout} className={STUDIO_BTN_IDLE} title={t("studio.resetLayout")}>
                          <RotateCcw className="w-3 h-3" />
                        </button>
                        <select
                          id="studio-layout-preset"
                          defaultValue=""
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!value) return;
                            onApplyLayoutPreset(value as FreeLayoutPresetId);
                            e.target.value = "";
                          }}
                          className={`${STUDIO_BTN} bg-white text-emerald-700 border-emerald-200 cursor-pointer appearance-none max-w-[5.5rem]`}
                          title={t("studio.layoutPreset")}
                        >
                          <option value="">{t("common.preset")}</option>
                          {FREE_LAYOUT_PRESETS.map((preset) => (
                            <option key={preset.id} value={preset.id}>
                              {getPresetLabel(preset.id)}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : null}
                    <span className={STUDIO_DIVIDER} />
                    {previewControls}
                  </>
                ) : (
                  <>
                    <span className={STUDIO_DIVIDER} />
                    <button
                      id="studio-btn-theme-toggle-canvas"
                      type="button"
                      onClick={toggleTheme}
                      className={themeCustomization.enabled ? STUDIO_BTN_ACTIVE : STUDIO_BTN_IDLE}
                      title={t("studio.theme")}
                    >
                      <Palette className="w-3 h-3" />
                      <span>{t("studio.custom")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setThemeExpanded((v) => !v)}
                      className={`${STUDIO_BTN} ${themeExpanded ? "bg-emerald-50 text-emerald-700 border-emerald-200" : STUDIO_BTN_IDLE}`}
                      aria-expanded={themeExpanded}
                      title={themeExpanded ? t("common.collapse") : t("common.expand")}
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform ${themeExpanded ? "rotate-180" : ""}`} />
                    </button>
                    <span className="hidden md:inline text-[10px] font-semibold text-indigo-600/90 px-1 whitespace-nowrap">
                      {t("studio.layerHint")}
                    </span>
              </>
            )}
          </div>
        </div>

        <span className={STUDIO_DIVIDER} />

        <div className="flex items-center gap-1 shrink-0">
          {(freeLayoutEnabled || isCanvasMode) ? (
            <span
              id="studio-auto-save-status"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 whitespace-nowrap shrink-0 max-w-[11rem] truncate"
              title={formatAutoSaveTime(freeLayoutLastSavedAt)}
            >
              <Check className="w-3 h-3 shrink-0 text-emerald-600" />
              <span className="truncate">{formatAutoSaveTime(freeLayoutLastSavedAt)}</span>
            </span>
          ) : null}
          <button
            id="studio-btn-undo"
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`${STUDIO_BTN} ${
              history.length > 0
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
            }`}
            title={`${t("common.undo")} (Ctrl+Z)`}
          >
            <Undo className="w-3 h-3" />
          </button>
          <button
            id="studio-btn-redo"
            type="button"
            onClick={handleRedo}
            disabled={!handleRedo || future.length === 0}
            className={`${STUDIO_BTN} ${
              handleRedo && future.length > 0
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
            }`}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="w-3 h-3" />
          </button>
          <LayoutSnapshotMenu templateFamily={getTemplateFamily(activeTemplate)} />
          <button
            id="studio-btn-chat"
            type="button"
            onClick={() => setChatOpen((p) => !p)}
            className={chatOpen ? `${STUDIO_BTN} bg-emerald-600 text-white border-emerald-500` : STUDIO_BTN_IDLE}
            title={t("geminiChatSidebar.openChat")}
          >
            <Sparkles className="w-3 h-3" />
          </button>
          <ExportMenuButton
            id="studio-btn-export-menu"
            variant="studio"
            exportToJson={exportToJson}
            exportToDocx={exportToDocx}
            exportToPDF={exportToPDF}
            pdfExporting={pdfExporting}
          />
          <span className={STUDIO_DIVIDER} />
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono text-slate-600 border border-slate-200 bg-slate-50">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            {liveAtsScore}%
          </span>
          <button
            id="studio-btn-close"
            type="button"
            onClick={onExit}
            className={`${STUDIO_BTN} bg-white text-slate-700 border-slate-200 hover:bg-slate-50`}
            title={t("studio.leaveStudio")}
          >
            <Minimize2 className="w-3 h-3 text-emerald-600" />
            <span className="hidden sm:inline">{t("studio.leaveStudio")}</span>
          </button>
        </div>
      </div>

      {/* 主題面板：限高捲動，預設收合 */}
      {themeExpanded ? (
        <div className="border-b border-slate-100 bg-slate-50/80">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-1.5 border-b border-slate-100 bg-slate-100/90 backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              {t("studio.theme")}
            </span>
            <button
              type="button"
              className="inline-flex items-center justify-center w-6 h-6 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              onClick={() => setThemeExpanded(false)}
              title={t("common.collapse")}
              aria-label={t("common.collapse")}
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="max-h-[min(38vh,360px)] overflow-y-auto px-3 py-2 scrollbar-thin">
            <ResumeThemeCustomizer
              customization={themeCustomization}
              onChange={onThemeCustomizationChange}
              onReset={onThemeCustomizationReset}
              variant="light"
              layout="studio"
              density="compact"
              templateStyle={activeTemplate}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
