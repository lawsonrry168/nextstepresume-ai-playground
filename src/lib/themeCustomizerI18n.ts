import { getActiveLocale, t } from "../i18n/translate";
import type { AppLocale } from "../i18n/types";
import type { ResumeFontId } from "./resumeThemeCustomization";

export type ThemeColorFieldId =
  | "accentColor"
  | "bodyColor"
  | "headingColor"
  | "mutedColor"
  | "backgroundColor"
  | "cardBackgroundColor"
  | "borderColor";

export function getThemeColorFieldLabel(field: ThemeColorFieldId, locale?: AppLocale): string {
  return t(`themeCustomizer.colorFields.${field}.label`, undefined, locale ?? getActiveLocale());
}

export function getThemeColorFieldHint(field: ThemeColorFieldId, locale?: AppLocale): string {
  return t(`themeCustomizer.colorFields.${field}.hint`, undefined, locale ?? getActiveLocale());
}

export function getAccentBarGradientLabel(locale?: AppLocale): string {
  return t("themeCustomizer.accentBarGradient.label", undefined, locale ?? getActiveLocale());
}

export function getAccentBarGradientHint(locale?: AppLocale): string {
  return t("themeCustomizer.accentBarGradient.hint", undefined, locale ?? getActiveLocale());
}

export function getResumeFontLabel(fontId: ResumeFontId, locale?: AppLocale): string {
  return t(`themeCustomizer.fonts.${fontId}`, undefined, locale ?? getActiveLocale());
}
