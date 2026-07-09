import React from "react";
import { motion } from "motion/react";
import { Download, Sparkles } from "lucide-react";
import { AnalysisResult, TemplateStyle } from "../../types";
import TemplatePicker from "./TemplatePicker";
import { useI18n } from "../../i18n";

export interface PreviewConfigPanelProps {
  activeTemplate: TemplateStyle;
  setActiveTemplate: (style: TemplateStyle) => void;
  analysisResult: AnalysisResult | null;
  highlightChanges: boolean;
  setHighlightChanges: (value: boolean | ((prev: boolean) => boolean)) => void;
  onLoadTemplateDemo?: (style: TemplateStyle) => void;
}

export default function PreviewConfigPanel({
  activeTemplate,
  setActiveTemplate,
  analysisResult,
  highlightChanges,
  setHighlightChanges,
  onLoadTemplateDemo,
}: PreviewConfigPanelProps) {
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
      id="preview-tab-view"
    >
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm" id="template-config-panel">
        <TemplatePicker
          activeTemplate={activeTemplate}
          onSelect={setActiveTemplate}
          id="preview-tab-template-picker"
        />

        {onLoadTemplateDemo ? (
          <button
            type="button"
            id="btn-load-template-demo"
            onClick={() => onLoadTemplateDemo(activeTemplate)}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t("previewConfig.loadTemplateDemo")}
          </button>
        ) : null}

        {analysisResult && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 font-sans" id="highlight-toggle-box">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800">{t("previewConfig.highlightTitle")}</span>
              <p className="text-[10px] text-slate-400 font-medium font-sans">{t("previewConfig.highlightHint")}</p>
            </div>
            <button
              id="btn-toggle-highlight"
              type="button"
              onClick={() => setHighlightChanges(!highlightChanges)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                highlightChanges ? "bg-emerald-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                  highlightChanges ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}

        <div className="notebook-callout space-y-2 text-xs text-slate-600 leading-normal font-medium" id="export-guide">
          <Download className="w-4 h-4 text-emerald-600" />
          <span className="font-serif-heading font-bold text-slate-800 block">{t("previewConfig.exportTitle")}</span>
          <p>
            {t("previewConfig.exportHint")}<strong>{t("previewConfig.exportVisual")}</strong>{t("previewConfig.exportVisualDesc")} <strong>{t("previewConfig.exportAts")}</strong>{t("previewConfig.exportAtsDesc")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
