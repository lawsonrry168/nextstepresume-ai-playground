import React, { useState } from "react";
import { Palette, RotateCcw, Type, SlidersHorizontal, LayoutTemplate } from "lucide-react";
import {
  ResumeThemeCustomization,
  RESUME_FONT_OPTIONS,
  ResumeFontSizeId,
  ResumeLineHeightId,
  ResumeNameSizeId,
  ResumeRadiusId,
  ResumeSectionGapId,
  ResumeSpacingId,
  THEME_COLOR_FIELDS,
  countThemeOverrides,
  getColorFieldPreview,
} from "../../lib/resumeThemeCustomization";
import {
  getAccentBarGradientHint,
  getAccentBarGradientLabel,
  getResumeFontLabel,
  getThemeColorFieldHint,
  getThemeColorFieldLabel,
} from "../../lib/themeCustomizerI18n";
import { TemplateStyle, getResumeTemplateTheme } from "../../lib/resumeTemplateCatalog";
import {
  STUDIO_BTN,
  STUDIO_BTN_ACTIVE,
  STUDIO_BTN_IDLE,
} from "./studioToolbarStyles";
import {
  fieldSurface,
  segmentActiveClass,
  segmentIdleClass,
  selectFieldClass,
} from "../../lib/marginaliaUi";
import { useI18n } from "../../i18n";

export type ThemeCustomizerLayout = "accordion" | "studio" | "compact";
export type ThemeCustomizerDensity = "default" | "compact";

export interface ResumeThemeCustomizerProps {
  customization: ResumeThemeCustomization;
  onChange: (patch: Partial<ResumeThemeCustomization>) => void;
  onReset: () => void;
  variant?: "light" | "dark";
  layout?: ThemeCustomizerLayout;
  density?: ThemeCustomizerDensity;
  templateStyle?: TemplateStyle;
}

type ThemeTab = "colors" | "fonts" | "spacing" | "display";

const THEME_TAB_IDS: ThemeTab[] = ["colors", "fonts", "spacing", "display"];
const THEME_TAB_ICONS: Record<ThemeTab, React.ReactNode> = {
  colors: <Palette className="w-3.5 h-3.5" />,
  fonts: <Type className="w-3.5 h-3.5" />,
  spacing: <SlidersHorizontal className="w-3.5 h-3.5" />,
  display: <LayoutTemplate className="w-3.5 h-3.5" />,
};

function ColorField({
  label,
  hint,
  value,
  previewHex,
  onChange,
  variant,
  disabled: fieldDisabled,
  compact = false,
  t,
}: {
  label: string;
  hint?: string;
  value: string | null;
  previewHex: string;
  onChange: (value: string | null) => void;
  variant: "light" | "dark";
  disabled?: boolean;
  compact?: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const resetClass =
    variant === "dark"
      ? "bg-slate-800 border-slate-600 text-slate-300 hover:text-white"
      : "notebook-chip hover:opacity-90";
  const displayHex = value ?? previewHex;

  return (
    <div
      className={`rounded-lg border flex flex-col min-w-0 ${
        compact ? "p-1.5 gap-1" : "p-2.5 gap-2"
      } ${fieldSurface(variant)} ${
        fieldDisabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div>
        <p className={`font-bold ${compact ? "text-[10px]" : "text-[11px]"} ${variant === "dark" ? "text-slate-200" : "text-slate-800"}`}>{label}</p>
        {hint && !compact ? (
          <p className={`text-[10px] mt-0.5 leading-snug ${variant === "dark" ? "text-slate-500" : "text-slate-500"}`}>{hint}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <input
          type="color"
          value={displayHex}
          onChange={(e) => onChange(e.target.value)}
          className={`rounded-md border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0 ${compact ? "w-6 h-6" : "w-8 h-8"}`}
          aria-label={label}
          title={hint ?? label}
        />
        {!compact ? (
          <span className={`text-[10px] font-mono uppercase tracking-wide ${variant === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            {displayHex}
            {value ? "" : t("themeCustomizer.defaultSuffix")}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold border ${resetClass}`}
        >
          {compact ? t("themeCustomizer.resetShort") : t("themeCustomizer.resetDefault")}
        </button>
      </div>
    </div>
  );
}

function LinkedColorPreview({
  label,
  hint,
  hex,
  variant,
}: {
  label: string;
  hint?: string;
  hex: string;
  variant: "light" | "dark";
}) {
  return (
    <div
      className={`rounded-lg border p-2.5 flex flex-col gap-2 min-w-0 ${
        variant === "dark" ? "border-slate-700 bg-slate-900/30" : fieldSurface(variant)
      }`}
    >
      <div>
        <p className={`text-[11px] font-bold ${variant === "dark" ? "text-slate-300" : "text-slate-700"}`}>{label}</p>
        {hint ? <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{hint}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-md border border-slate-300 shrink-0" style={{ backgroundColor: hex }} />
        <span className="text-[10px] font-mono text-slate-500 uppercase">{hex}</span>
      </div>
    </div>
  );
}

function ThemeSection({
  title,
  children,
  variant,
}: {
  title: string;
  children: React.ReactNode;
  variant: "light" | "dark";
}) {
  return (
    <section>
      <h4
        className={`text-[10px] font-black uppercase tracking-widest mb-2 ${
          variant === "dark" ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {title}
      </h4>
      {children}
    </section>
  );
}

function SelectField<T extends string | number>({
  label,
  hint,
  value,
  options,
  onChange,
  variant,
  t,
}: {
  label: string;
  hint?: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T | null) => void;
  variant: "light" | "dark";
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const selectClass =
    variant === "dark"
      ? "bg-slate-800 border-slate-600 text-slate-200 text-[11px]"
      : `${selectFieldClass} text-[11px]`;

  return (
    <label className={`rounded-lg border p-2.5 flex flex-col gap-2 min-w-0 ${fieldSurface(variant)}`}>
      <div>
        <span className={`text-[11px] font-bold block ${variant === "dark" ? "text-slate-200" : "text-slate-800"}`}>
          {label}
        </span>
        {hint ? (
          <span className={`text-[10px] mt-0.5 leading-snug block ${variant === "dark" ? "text-slate-500" : "text-slate-500"}`}>
            {hint}
          </span>
        ) : null}
      </div>
      <select
        value={value ?? ""}
        onChange={(e) =>
          onChange(
            e.target.value
              ? ((Number.isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)) as T)
              : null,
          )
        }
        className={`rounded-lg border px-2 py-1.5 font-semibold cursor-pointer w-full ${selectClass}`}
      >
        <option value="">{t("themeCustomizer.followTemplate")}</option>
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({
  label,
  hint,
  value,
  onChange,
  variant,
  t,
}: {
  label: string;
  hint?: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  variant: "light" | "dark";
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const triState = value === null ? "auto" : value ? "on" : "off";
  const btnClass = (active: boolean) =>
    variant === "dark"
      ? active
        ? "bg-emerald-600 text-white"
        : "bg-slate-800 text-slate-400 hover:text-white"
      : active
        ? segmentActiveClass
        : segmentIdleClass;

  return (
    <div className={`rounded-lg border p-2.5 flex flex-col gap-2 min-w-0 ${fieldSurface(variant)}`}>
      <div>
        <p className={`text-[11px] font-bold ${variant === "dark" ? "text-slate-200" : "text-slate-800"}`}>{label}</p>
        {hint ? (
          <p className={`text-[10px] mt-0.5 leading-snug ${variant === "dark" ? "text-slate-500" : "text-slate-500"}`}>
            {hint}
          </p>
        ) : null}
      </div>
      <div
        className={`flex rounded-lg border overflow-hidden text-[10px] font-bold w-fit ${
          variant === "dark" ? "border-slate-600" : "border-slate-200"
        }`}
      >
        <button type="button" onClick={() => onChange(null)} className={`px-2.5 py-1 border-r border-inherit ${btnClass(triState === "auto")}`} title={t("themeCustomizer.followTemplateDefault")}>
          {t("themeCustomizer.auto")}
        </button>
        <button type="button" onClick={() => onChange(true)} className={`px-2.5 py-1 border-r border-inherit ${btnClass(triState === "on")}`}>
          {t("themeCustomizer.on")}
        </button>
        <button type="button" onClick={() => onChange(false)} className={`px-2.5 py-1 ${btnClass(triState === "off")}`}>
          {t("themeCustomizer.off")}
        </button>
      </div>
    </div>
  );
}

function ThemeTabBar({
  t,

  activeTab,
  onTabChange,
  variant,
  layout,
}: {
  activeTab: ThemeTab;
  onTabChange: (tab: ThemeTab) => void;
  variant: "light" | "dark";
  layout: ThemeCustomizerLayout;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const isStudio = layout === "studio";

  return (
    <div className={`flex flex-wrap gap-1 ${isStudio ? "" : "flex-col"}`} role="tablist">
      {THEME_TAB_IDS.map((id) => {
        const active = activeTab === id;
        const base = isStudio
          ? `${STUDIO_BTN} ${active ? STUDIO_BTN_ACTIVE : STUDIO_BTN_IDLE}`
          : `w-full flex items-center px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
              variant === "dark" ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"
            } ${active && !isStudio ? (variant === "dark" ? "bg-slate-800 text-emerald-200" : "btn-toggle-active") : ""}`;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(id)}
            className={base}
          >
            <span className="flex items-center gap-1.5">
              {THEME_TAB_ICONS[id]}
              {t(`themeCustomizer.tabs.${id}`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ThemePanelContent({
  t,

  tab,
  customization,
  onChange,
  variant,
  disabled,
  templateStyle,
  compact = false,
}: {
  tab: ThemeTab;
  customization: ResumeThemeCustomization;
  onChange: (patch: Partial<ResumeThemeCustomization>) => void;
  variant: "light" | "dark";
  disabled: boolean;
  templateStyle: TemplateStyle;
  compact?: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const wrap = `transition-opacity ${disabled ? "opacity-40 pointer-events-none" : ""}`;
  const theme = getResumeTemplateTheme(templateStyle);
  const colorKeys = Object.keys(THEME_COLOR_FIELDS) as (keyof typeof THEME_COLOR_FIELDS)[];
  const accentStart = getColorFieldPreview("accentColor", customization, theme);
  const accentEnd = customization.accentGradientEnd ?? accentStart;

  if (tab === "colors") {
    const generalKeys = colorKeys.filter((k) => k !== "accentColor");
    const gridGap = compact ? "gap-2" : "gap-3";
    return (
      <div className={`space-y-3 ${wrap}`}>
        <ThemeSection title={t("themeCustomizer.accentColor")} variant={variant}>
          <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${gridGap}`}>
            <ColorField
              label={getThemeColorFieldLabel("accentColor")}
              hint={getThemeColorFieldHint("accentColor")}
              value={customization.accentColor}
              previewHex={accentStart}
              onChange={(v) => onChange({ accentColor: v })}
              variant={variant}
              compact={compact}
              t={t}
            />
          </div>
        </ThemeSection>

        <ThemeSection title={t("themeCustomizer.textBgBorder")} variant={variant}>
          <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${gridGap}`}>
            {generalKeys.map((field) => (
                <div key={field}>
                  <ColorField
                    label={getThemeColorFieldLabel(field)}
                    hint={getThemeColorFieldHint(field)}
                    value={customization[field]}
                    previewHex={getColorFieldPreview(field, customization, theme)}
                    onChange={(v) => onChange({ [field]: v })}
                    variant={variant}
                    compact={compact}
                    t={t}
                  />
                </div>
            ))}
          </div>
        </ThemeSection>

        <section
          className={`rounded-lg space-y-2 ${compact ? "p-2" : "p-3"} ${
            variant === "dark" ? "border border-emerald-900/50 bg-emerald-950/20" : "notebook-callout"
          }`}
        >
          <div>
            <h4 className={`font-black ${compact ? "text-[10px]" : "text-[11px]"} ${variant === "dark" ? "text-emerald-300" : "text-[var(--m-ink,#1a2438)]"}`}>
              {t("themeCustomizer.modernTopBar")}
            </h4>
            {!compact ? (
              <p className={`text-[10px] mt-0.5 ${variant === "dark" ? "text-slate-500" : "text-slate-600"}`}>
                {t("themeCustomizer.topBarHint")}
              </p>
            ) : null}
          </div>
          <div className={`grid grid-cols-2 ${gridGap}`}>
            <LinkedColorPreview label={t("themeCustomizer.barLeft")} hint={compact ? undefined : t("themeCustomizer.syncAccent")} hex={accentStart} variant={variant} />
            <ColorField
              label={getAccentBarGradientLabel()}
              hint={getAccentBarGradientHint()}
              value={customization.accentGradientEnd}
              previewHex={accentEnd}
              onChange={(v) => onChange({ accentGradientEnd: v })}
              variant={variant}
              compact={compact}
              t={t}
            />
          </div>
          <div className="h-2 rounded border border-slate-200/80" style={{ background: `linear-gradient(to right, ${accentStart}, ${accentEnd})` }} aria-hidden />
        </section>
      </div>
    );
  }

  if (tab === "fonts") {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 ${wrap}`}>
        <SelectField t={t}
          label={t("themeCustomizer.bodyFont")}
          hint={t("themeCustomizer.bodyFontHint")}
          value={customization.bodyFont}
          options={RESUME_FONT_OPTIONS.filter((f) => f.id !== "inherit").map((f) => ({
            value: f.id,
            label: getResumeFontLabel(f.id),
          }))}
          onChange={(v) => onChange({ bodyFont: v })}
          variant={variant}
        />
        <SelectField t={t}
          label={t("themeCustomizer.headingFont")}
          hint={t("themeCustomizer.headingFontHint")}
          value={customization.headingFont}
          options={RESUME_FONT_OPTIONS.filter((f) => f.id !== "inherit").map((f) => ({
            value: f.id,
            label: getResumeFontLabel(f.id),
          }))}
          onChange={(v) => onChange({ headingFont: v })}
          variant={variant}
        />
        <SelectField<ResumeFontSizeId> t={t}
          label={t("themeCustomizer.baseSize")}
          hint={t("themeCustomizer.baseSizeHint")}
          value={customization.baseFontSize}
          options={[12, 13, 14, 15, 16].map((v) => ({ value: v as ResumeFontSizeId, label: `${v}px` }))}
          onChange={(v) => onChange({ baseFontSize: v })}
          variant={variant}
        />
        <SelectField<ResumeLineHeightId> t={t}
          label={t("themeCustomizer.lineHeight")}
          hint={t("themeCustomizer.lineHeightHint")}
          value={customization.lineHeight}
          options={[
            { value: 1.4, label: t("themeCustomizer.lineHeightCompact") },
            { value: 1.5, label: t("themeCustomizer.lineHeightStandard") },
            { value: 1.6, label: t("themeCustomizer.lineHeightLoose") },
            { value: 1.75, label: "1.75" },
          ]}
          onChange={(v) => onChange({ lineHeight: v })}
          variant={variant}
        />
        <SelectField<ResumeNameSizeId> t={t}
          label={t("themeCustomizer.nameSize")}
          hint={t("themeCustomizer.nameSizeHint")}
          value={customization.nameFontSize}
          options={[
            { value: "xl", label: t("themeCustomizer.nameSmaller") },
            { value: "2xl", label: t("themeCustomizer.nameStandard") },
            { value: "3xl", label: t("themeCustomizer.nameLarger") },
            { value: "4xl", label: t("themeCustomizer.nameXl") },
          ]}
          onChange={(v) => onChange({ nameFontSize: v })}
          variant={variant}
        />
      </div>
    );
  }

  if (tab === "spacing") {
    return (
      <div className={`space-y-4 max-w-3xl ${wrap}`}>
        <ThemeSection title={t("themeCustomizer.pageSpacing")} variant={variant}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField<ResumeSpacingId> t={t}
              label={t("themeCustomizer.pageMargin")}
              hint={t("themeCustomizer.pageMarginHint")}
              value={customization.pagePadding}
              options={[
                { value: 24, label: t("themeCustomizer.marginCompact") },
                { value: 32, label: "32px" },
                { value: 40, label: t("themeCustomizer.marginStandard") },
                { value: 48, label: t("themeCustomizer.marginLoose") },
              ]}
              onChange={(v) => onChange({ pagePadding: v })}
              variant={variant}
            />
            <SelectField<ResumeSectionGapId> t={t}
              label={t("themeCustomizer.sectionGap")}
              hint={t("themeCustomizer.sectionGapHint")}
              value={customization.sectionGap}
              options={[
                { value: 16, label: "16px" },
                { value: 24, label: "24px" },
                { value: 32, label: "32px" },
              ]}
              onChange={(v) => onChange({ sectionGap: v })}
              variant={variant}
            />
          </div>
        </ThemeSection>
        <ThemeSection title={t("themeCustomizer.radiusSplit")} variant={variant}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField<ResumeRadiusId> t={t}
              label={t("themeCustomizer.sheetRadius")}
              hint={t("themeCustomizer.sheetRadiusHint")}
              value={customization.borderRadius}
              options={[
                { value: 0, label: t("themeCustomizer.square") },
                { value: 4, label: "4px" },
                { value: 8, label: "8px" },
                { value: 12, label: "12px" },
                { value: 16, label: "16px" },
              ]}
              onChange={(v) => onChange({ borderRadius: v })}
              variant={variant}
            />
            <SelectField<ResumeRadiusId> t={t}
              label={t("themeCustomizer.cardRadius")}
              hint={t("themeCustomizer.cardRadiusHint")}
              value={customization.cardBorderRadius}
              options={[
                { value: 0, label: t("themeCustomizer.square") },
                { value: 4, label: "4px" },
                { value: 8, label: "8px" },
                { value: 12, label: "12px" },
                { value: 16, label: "16px" },
              ]}
              onChange={(v) => onChange({ cardBorderRadius: v })}
              variant={variant}
            />
          </div>
        </ThemeSection>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl ${wrap}`}>
      <ToggleField t={t} label={t("themeCustomizer.accentBar")} hint={t("themeCustomizer.accentBarHint")} value={customization.showAccentBar} onChange={(v) => onChange({ showAccentBar: v })} variant={variant} />
      <ToggleField t={t} label={t("themeCustomizer.uppercaseTitles")} hint={t("themeCustomizer.uppercaseTitlesHint")} value={customization.uppercaseSectionTitles} onChange={(v) => onChange({ uppercaseSectionTitles: v })} variant={variant} />
      <ToggleField t={t} label={t("themeCustomizer.sectionBorders")} hint={t("themeCustomizer.sectionBordersHint")} value={customization.showSectionBorders} onChange={(v) => onChange({ showSectionBorders: v })} variant={variant} />
    </div>
  );
}

export default function ResumeThemeCustomizer({
  customization,
  onChange,
  onReset,
  variant = "dark",
  layout = "accordion",
  density = "default",
  templateStyle = "modern-01",
}: ResumeThemeCustomizerProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ThemeTab>("colors");
  const isDark = variant === "dark";
  const isStudio = layout === "studio";
  const compact = density === "compact";
  const disabled = !customization.enabled;
  const overrideCount = countThemeOverrides(customization);

  if (isStudio) {
    return (
      <div id="resume-theme-customizer" className={compact ? "space-y-1.5" : "space-y-3"}>
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <ThemeTabBar t={t} activeTab={activeTab} onTabChange={setActiveTab} variant={variant} layout={layout} />
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onChange({ enabled: !customization.enabled })}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                customization.enabled
                  ? `${segmentActiveClass} border-transparent`
                  : `${segmentIdleClass} border-slate-200`
              }`}
            >
              {customization.enabled ? t("themeCustomizer.on") : t("themeCustomizer.off")}
            </button>
            {customization.enabled ? (
              <span className="notebook-chip text-[9px] px-1.5 py-0.5">
                {overrideCount > 0 ? t("themeCustomizer.customCount", { count: overrideCount }) : t("themeCustomizer.custom")}
              </span>
            ) : null}
            <button type="button" onClick={onReset} className={`${STUDIO_BTN} ${STUDIO_BTN_IDLE}`} title={t("themeCustomizer.reset")}>
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className={compact ? "" : `rounded-xl border p-3 ${fieldSurface(variant)}`}>
          <ThemePanelContent
            t={t}
            tab={activeTab}
            customization={customization}
            onChange={onChange}
            variant={variant}
            disabled={disabled}
            templateStyle={templateStyle}
            compact={compact}
          />
        </div>
      </div>
    );
  }

  const panelClass = isDark
    ? "bg-slate-900/80 border-slate-700 text-slate-100"
    : "panel-surface text-slate-800";

  return (
    <div className={`rounded-xl border ${panelClass}`} id="resume-theme-customizer">
      <div className={`flex items-center justify-between gap-2 px-3 py-2 border-b ${isDark ? "border-slate-700" : "border-slate-100"}`}>
        <div className="flex items-center gap-2">
          <Palette className={`w-4 h-4 ${isDark ? "text-emerald-400" : "text-[var(--m-margin,#c0392b)]"}`} />
          <div>
            <p className="text-xs font-black uppercase tracking-wide">{t("themeCustomizer.title")}</p>
            <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t("themeCustomizer.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ enabled: !customization.enabled })}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
              customization.enabled
                ? "btn-accent border-transparent"
                : isDark
                  ? "bg-slate-800 text-slate-400 border-slate-600"
                  : `${segmentIdleClass} border-slate-200`
            }`}
          >
            {customization.enabled ? t("themeCustomizer.enabled") : t("themeCustomizer.enable")}
          </button>
          <button
            type="button"
            onClick={onReset}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark ? "border-slate-600 text-slate-400 hover:text-white" : "border-slate-200 text-slate-500 hover:text-slate-800"
            }`}
            title={t("themeCustomizer.resetAll")}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-2 space-y-2">
        <ThemeTabBar t={t} activeTab={activeTab} onTabChange={setActiveTab} variant={variant} layout="accordion" />
        <div className="px-1 pb-1">
          <ThemePanelContent t={t} tab={activeTab} customization={customization} onChange={onChange} variant={variant} disabled={disabled} templateStyle={templateStyle} compact={compact} />
        </div>
      </div>
    </div>
  );
}
