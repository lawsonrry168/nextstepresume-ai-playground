import React, { useEffect, useId, useState } from "react";
import { ChevronDown, Layout, Move } from "lucide-react";
import {
  TemplateFamily,
  TemplateStyle,
  getResumeTemplateTheme,
  getTemplateFamily,
  getTemplatesByFamily,
  getTemplateThemeLabel,
  TEMPLATE_FAMILIES,
} from "../../lib/resumeTemplateCatalog";
import { useI18n } from "../../i18n";
import { useSubscription } from "../../context/SubscriptionProvider";
import { STARTER_TEMPLATE_IDS } from "../../lib/subscription/entitlements";

export type LayoutPickerMode = TemplateFamily | "custom";

export interface TemplatePickerProps {
  activeTemplate: TemplateStyle;
  onSelect: (style: TemplateStyle) => void;
  compact?: boolean;
  toolbar?: boolean;
  variant?: "light" | "dark";
  id?: string;
  freeLayoutEnabled?: boolean;
  onFreeLayoutChange?: (enabled: boolean) => void;
}

export default function TemplatePicker({
  activeTemplate,
  onSelect,
  compact = false,
  toolbar = false,
  variant = "light",
  id = "template-picker",
  freeLayoutEnabled = false,
  onFreeLayoutChange,
}: TemplatePickerProps) {
  const { t, locale } = useI18n();
  const { canUseTemplate, canUseTab, canUseFeature, openUpgrade, openPricing, plan } = useSubscription();
  const familyId = useId();
  const variantId = useId();
  const activeFamily = getTemplateFamily(activeTemplate);
  const [family, setFamily] = useState<LayoutPickerMode>(
    freeLayoutEnabled ? "custom" : activeFamily,
  );
  const activeTheme = getResumeTemplateTheme(activeTemplate);
  const variants = getTemplatesByFamily(
    family === "custom" ? activeFamily : family,
  ).filter((item) => plan === "starter" ? STARTER_TEMPLATE_IDS.includes(item.id) : canUseTemplate(item.id));
  const isCustom = family === "custom";

  const themeLabel = getTemplateThemeLabel(activeTheme, locale);
  const variantLabel = (item: { label: string; labelZh: string }) =>
    getTemplateThemeLabel(item, locale);

  useEffect(() => {
    setFamily(freeLayoutEnabled ? "custom" : getTemplateFamily(activeTemplate));
  }, [activeTemplate, freeLayoutEnabled]);

  const selectFamily = (next: LayoutPickerMode) => {
    if (next === "custom" && !canUseFeature("layout.free")) {
      openUpgrade("layout.free");
      return;
    }
    setFamily(next);
    if (next === "custom") {
      onFreeLayoutChange?.(true);
      return;
    }
    onFreeLayoutChange?.(false);
    if (getTemplateFamily(activeTemplate) !== next) {
      onSelect(getTemplatesByFamily(next)[0].id);
    }
  };

  const isDark = variant === "dark";
  const isToolbar = toolbar;
  const isCompact = compact || isToolbar;
  const selectClass = isDark
    ? `appearance-none bg-slate-800 border border-slate-600 text-slate-100 font-semibold rounded-md min-w-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${isToolbar ? "text-[11px] pl-2 pr-7 py-1" : "text-xs pl-2.5 pr-8 py-1.5 rounded-lg"}`
    : `appearance-none select-field font-semibold rounded-md min-w-0 cursor-pointer focus:outline-none ${isToolbar ? "text-[11px] pl-2 pr-7 py-1" : "text-xs pl-2.5 pr-8 py-1.5 rounded-lg"}`;
  const labelClass = isDark ? "text-slate-300" : "text-slate-700";
  const hintClass = isDark ? "text-slate-500" : "text-slate-400";
  const chevronClass = isDark ? "text-slate-400" : "text-slate-400";

  return (
    <div
      className={
        isToolbar
          ? "flex items-center gap-1.5 shrink-0 flex-nowrap"
          : isCompact
            ? "flex flex-wrap items-center gap-2 min-w-0"
            : "space-y-3"
      }
      id={id}
    >
      {!isCompact ? (
        <div className="flex items-center gap-2">
          <Layout className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-emerald-600"}`} />
          <div>
            <h4 className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{t("templatePicker.title")}</h4>
            <p className={`text-[10px] ${hintClass}`}>{t("templatePicker.hint")}</p>
          </div>
        </div>
      ) : !isToolbar ? (
        <div className={`flex items-center gap-1.5 shrink-0 ${labelClass}`}>
          <Layout className={`w-3.5 h-3.5 ${isDark ? "text-blue-400" : "text-emerald-600"}`} />
          <span className="text-xs font-bold whitespace-nowrap">{t("templatePicker.label")}</span>
        </div>
      ) : null}

      <div className={`flex items-center gap-1.5 ${isToolbar ? "shrink-0 flex-nowrap" : isCompact ? "min-w-0 flex-1 flex-wrap" : ""}`}>
        <div className={`relative ${isToolbar ? "w-[6.5rem]" : "min-w-[7rem]"}`}>
          <label htmlFor={familyId} className="sr-only">
            {t("templatePicker.familyLabel")}
          </label>
          <select
            id={familyId}
            value={family}
            onChange={(e) => selectFamily(e.target.value as LayoutPickerMode)}
            className={`${selectClass} w-full ${isCustom ? (isDark ? "border-violet-500/50" : "border-violet-300") : ""}`}
          >
            {TEMPLATE_FAMILIES.map((item) => (
              <option key={item} value={item}>
                {t(`templateFamilies.${item}`)}
              </option>
            ))}
            <option value="custom">{t("templatePicker.customLayout")}</option>
          </select>
          <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${chevronClass}`} />
        </div>

        <div className={`relative ${isToolbar ? "w-[7.5rem]" : isCompact ? "min-w-[7.5rem] flex-1 max-w-[11rem]" : "min-w-[10rem] flex-1"}`}>
          <label htmlFor={variantId} className="sr-only">
            {isCustom ? t("templatePicker.customVariantLabel") : t("templatePicker.variantLabel")}
          </label>
          <select
            id={variantId}
            value={activeTemplate}
            onChange={(e) => {
              const style = e.target.value as TemplateStyle;
              if (!canUseTemplate(style)) {
                openUpgrade("templates.all");
                return;
              }
              onSelect(style);
            }}
            className={`${selectClass} w-full`}
          >
            {variants.map((item) => (
              <option key={item.id} value={item.id}>
                {variantLabel(item)}
              </option>
            ))}
          </select>
          <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${chevronClass}`} />
        </div>

        {isCustom && !isToolbar ? (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${
              isDark
                ? "text-violet-300 bg-violet-500/10 border border-violet-500/30"
                : "text-violet-700 bg-violet-50 border border-violet-200"
            }`}
          >
            <Move className="w-3 h-3" />
            {t("templatePicker.customBadge")}
          </span>
        ) : null}

        {!compact && plan === "starter" ? (
          <p className={`text-[10px] ${hintClass} w-full`}>
            {t("billing.starterTemplateHint", { count: STARTER_TEMPLATE_IDS.length })}
            <button type="button" onClick={openPricing} className="ml-1 text-emerald-600 font-bold underline cursor-pointer">
              {t("billing.viewPlans")}
            </button>
          </p>
        ) : null}
        {!compact ? (
          <p className={`text-[10px] ${hintClass} w-full`}>
            {isCustom
              ? t("templatePicker.customHint", { theme: themeLabel })
              : t("templatePicker.currentTheme", { theme: themeLabel })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
