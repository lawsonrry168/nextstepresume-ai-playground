import { useState, type ReactNode } from "react";
import {
  LayoutTemplate,
  Rows3,
  Columns2,
  Columns3,
  PanelLeft,
  AlignVerticalSpaceBetween,
  Ruler,
  Minimize2,
  AlignCenter,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyEnd,
  FlipHorizontal2,
  Grid3x3,
  AlignVerticalSpaceAround,
  StretchVertical,
  RotateCcw,
  ArrowDownToLine,
} from "lucide-react";
import { FREE_LAYOUT_PRESETS, type FreeLayoutPresetId } from "../../../lib/resumeFreeLayout";
import type { CanvasPageLayoutAction } from "../../../lib/canvasLayoutTools";
import { useI18n } from "../../../i18n";
import { getPresetLabel } from "../../../lib/sectionLabels";
import {
  TEMPLATE_FAMILIES,
  getFamilyLabel,
  getTemplateThemeLabel,
  getTemplatesByFamily,
  type TemplateStyle,
} from "../../../lib/resumeTemplateCatalog";

export interface CanvasLayoutPanelProps {
  sectionCountOnPage: number;
  hasSelection: boolean;
  onApplyPreset: (presetId: FreeLayoutPresetId) => void;
  onApplyPageLayout: (action: CanvasPageLayoutAction) => void;
  /** All 31 resume templates — selectable directly inside the studio */
  activeTemplate?: TemplateStyle;
  onSelectTemplate?: (style: TemplateStyle) => void;
  /** Clear local canvas layout and push an empty snapshot when cloud sync is active */
  onResetCloudLayout?: () => void | Promise<void>;
  resetCloudLayoutBusy?: boolean;
}

function LayoutBtn({
  title,
  label,
  disabled,
  onClick,
  children,
}: {
  title: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="canvas-nav-tool-btn"
      disabled={disabled}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      title={title}
      aria-label={title}
    >
      {children}
      <span className="canvas-nav-tool-label">{label}</span>
    </button>
  );
}

export default function CanvasLayoutPanel({
  sectionCountOnPage,
  hasSelection,
  onApplyPreset,
  onApplyPageLayout,
  activeTemplate,
  onSelectTemplate,
  onResetCloudLayout,
  resetCloudLayoutBusy = false,
}: CanvasLayoutPanelProps) {
  const { t } = useI18n();
  const pageDisabled = sectionCountOnPage === 0;
  const [presetSelectValue, setPresetSelectValue] = useState("");

  const handlePresetChange = (value: string) => {
    if (!value) return;
    onApplyPreset(value as FreeLayoutPresetId);
    setPresetSelectValue("");
  };

  return (
    <div id="canvas-layout-panel" className="canvas-layout-panel">
      {activeTemplate && onSelectTemplate ? (
        <select
          id="canvas-template-select"
          className="canvas-layout-preset-select w-full text-[10px] font-semibold rounded-md border px-2 py-1.5 mb-1.5 cursor-pointer"
          value={activeTemplate}
          onChange={(e) => onSelectTemplate(e.target.value as TemplateStyle)}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          aria-label={t("preview.resumeTemplate")}
        >
          {TEMPLATE_FAMILIES.map((family) => (
            <optgroup key={family} label={getFamilyLabel(family)}>
              {getTemplatesByFamily(family).map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {getTemplateThemeLabel(theme)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      ) : null}
      <select
        className="canvas-layout-preset-select w-full text-[10px] font-semibold rounded-md border px-2 py-1.5 mb-2 cursor-pointer"
        value={presetSelectValue}
        onChange={(e) => handlePresetChange(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        aria-label={t("canvas.layout.applyGlobalPreset")}
      >
        <option value="">{t("canvas.layout.globalPreset")}</option>
        {FREE_LAYOUT_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {getPresetLabel(preset.id)}
          </option>
        ))}
      </select>

      <div className="canvas-nav-tool-grid">
        <LayoutBtn
          disabled={pageDisabled}
          title={t("canvas.layout.titles.singleColumn")}
          label={t("canvas.layout.singleColumn")}
          onClick={() => onApplyPageLayout("stack")}
        >
          <Rows3 className="w-4 h-4" />
        </LayoutBtn>
        <LayoutBtn
          disabled={pageDisabled}
          title={t("canvas.layout.titles.centered")}
          label={t("canvas.layout.centered")}
          onClick={() => onApplyPageLayout("stack-center")}
        >
          <AlignCenter className="w-4 h-4" />
        </LayoutBtn>
        <LayoutBtn
          disabled={pageDisabled}
          title={t("canvas.layout.titles.compact")}
          label={t("canvas.layout.compact")}
          onClick={() => onApplyPageLayout("stack-compact")}
        >
          <Minimize2 className="w-4 h-4" />
        </LayoutBtn>
        <LayoutBtn
          disabled={pageDisabled}
          title={t("canvas.layout.titles.twoColumn")}
          label={t("canvas.layout.twoColumn")}
          onClick={() => onApplyPageLayout("two-column")}
        >
          <Columns2 className="w-4 h-4" />
        </LayoutBtn>
        <LayoutBtn
          disabled={pageDisabled}
          title={t("canvas.layout.titles.threeColumn")}
          label={t("canvas.layout.threeColumn")}
          onClick={() => onApplyPageLayout("three-column")}
        >
          <Columns3 className="w-4 h-4" />
        </LayoutBtn>
        <LayoutBtn
          disabled={pageDisabled}
          title={t("canvas.layout.titles.sidebar")}
          label={t("canvas.layout.sidebar")}
          onClick={() => onApplyPageLayout("sidebar")}
        >
          <PanelLeft className="w-4 h-4" />
        </LayoutBtn>
        <LayoutBtn
          disabled={pageDisabled || sectionCountOnPage < 2}
          title={t("canvas.layout.titles.distribute")}
          label={t("canvas.layout.distribute")}
          onClick={() => onApplyPageLayout("distribute")}
        >
          <AlignVerticalSpaceBetween className="w-4 h-4" />
        </LayoutBtn>
        <LayoutBtn
          disabled={pageDisabled || sectionCountOnPage < 2}
          title={t("canvas.layout.titles.fillHeight")}
          label={t("canvas.layout.fillHeight")}
          onClick={() => onApplyPageLayout("fill-page-height")}
        >
          <StretchVertical className="w-4 h-4" />
        </LayoutBtn>
        <LayoutBtn
          disabled={pageDisabled || sectionCountOnPage < 1}
          title={t("canvas.layout.titles.alignBottom")}
          label={t("canvas.layout.alignBottom")}
          onClick={() => onApplyPageLayout("align-page-bottom")}
        >
          <ArrowDownToLine className="w-4 h-4" />
        </LayoutBtn>
        <LayoutBtn
          disabled={pageDisabled}
          title={hasSelection ? t("canvas.layout.titles.equalWidth") : t("canvas.layout.titles.equalWidthNoSelection")}
          label={t("canvas.layout.equalWidth")}
          onClick={() => onApplyPageLayout("equalize-width")}
        >
          <Ruler className="w-4 h-4" />
        </LayoutBtn>
        <LayoutBtn
          disabled={pageDisabled || sectionCountOnPage < 2}
          title={t("canvas.layout.titles.equalHeight")}
          label={t("canvas.layout.equalHeight")}
          onClick={() => onApplyPageLayout("equalize-height")}
        >
          <AlignVerticalSpaceAround className="w-4 h-4" />
        </LayoutBtn>
        <LayoutBtn
          disabled={pageDisabled}
          title={t("canvas.layout.titles.alignLeft")}
          label={t("canvas.layout.alignLeft")}
          onClick={() => onApplyPageLayout("page-align-left")}
        >
          <AlignHorizontalJustifyStart className="w-4 h-4" />
        </LayoutBtn>
        <LayoutBtn
          disabled={pageDisabled}
          title={t("canvas.layout.titles.alignCenter")}
          label={t("canvas.layout.alignCenter")}
          onClick={() => onApplyPageLayout("page-align-center")}
        >
          <AlignCenter className="w-4 h-4" />
        </LayoutBtn>
        <LayoutBtn
          disabled={pageDisabled}
          title={t("canvas.layout.titles.alignRight")}
          label={t("canvas.layout.alignRight")}
          onClick={() => onApplyPageLayout("page-align-right")}
        >
          <AlignHorizontalJustifyEnd className="w-4 h-4" />
        </LayoutBtn>
        <LayoutBtn
          disabled={pageDisabled || sectionCountOnPage < 2}
          title={t("canvas.layout.titles.mirror")}
          label={t("canvas.layout.mirror")}
          onClick={() => onApplyPageLayout("mirror-columns")}
        >
          <FlipHorizontal2 className="w-4 h-4" />
        </LayoutBtn>
        <LayoutBtn
          disabled={pageDisabled}
          title={t("canvas.layout.titles.snapGrid")}
          label={t("canvas.layout.snapGrid")}
          onClick={() => onApplyPageLayout("snap-grid")}
        >
          <Grid3x3 className="w-4 h-4" />
        </LayoutBtn>
        <LayoutBtn
          disabled={pageDisabled}
          title={t("canvas.layout.titles.safeZone")}
          label={t("canvas.layout.safeZone")}
          onClick={() => onApplyPageLayout("safe-zone")}
        >
          <LayoutTemplate className="w-4 h-4" />
        </LayoutBtn>
      </div>

      {onResetCloudLayout ? (
        <button
          type="button"
          className="canvas-layout-reset-btn mt-2 w-full text-[10px] font-semibold rounded-md border px-2 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={resetCloudLayoutBusy}
          onClick={() => void onResetCloudLayout()}
          onPointerDown={(e) => e.stopPropagation()}
          title={t("canvas.layout.resetCloudLayoutTitle")}
          aria-label={t("canvas.layout.resetCloudLayout")}
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" aria-hidden />
            {resetCloudLayoutBusy ? t("canvas.layout.resetCloudLayoutBusy") : t("canvas.layout.resetCloudLayout")}
          </span>
        </button>
      ) : null}
    </div>
  );
}
