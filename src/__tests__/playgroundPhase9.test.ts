import { describe, expect, it, beforeEach } from "vitest";
import { RESUME_FONT_OPTIONS, THEME_COLOR_FIELDS } from "../lib/resumeThemeCustomization";
import {
  getAccentBarGradientHint,
  getAccentBarGradientLabel,
  getResumeFontLabel,
  getThemeColorFieldHint,
  getThemeColorFieldLabel,
} from "../lib/themeCustomizerI18n";
import { ensureLocaleLoaded, setActiveLocale } from "../i18n/translate";
import type { MessageTree } from "../i18n/types";
import zhTW from "../i18n/locales/zh-TW";

const zhMessages = zhTW as MessageTree;

describe("theme customizer i18n", () => {
  beforeEach(async () => {
    setActiveLocale("zh-TW");
    await ensureLocaleLoaded("zh-TW");
    setActiveLocale("en");
    await ensureLocaleLoaded("en");
  });

  it("keeps color field metadata without embedded label strings", () => {
    for (const meta of Object.values(THEME_COLOR_FIELDS)) {
      expect("labelZh" in meta).toBe(false);
      expect("hintZh" in meta).toBe(false);
    }
    for (const font of RESUME_FONT_OPTIONS) {
      expect("labelZh" in font).toBe(false);
      expect("labelEn" in font).toBe(false);
    }
  });

  it("resolves color field labels from locale keys", () => {
    const colorFields = zhMessages.themeCustomizer as MessageTree;
    const accent = colorFields.colorFields as MessageTree;
    expect(getThemeColorFieldLabel("accentColor", "zh-TW")).toBe(
      String((accent.accentColor as MessageTree).label),
    );
    expect(getThemeColorFieldHint("bodyColor", "zh-TW")).toBe(
      String((accent.bodyColor as MessageTree).hint),
    );
  });

  it("resolves accent bar gradient and font labels", () => {
    const themeCustomizer = zhMessages.themeCustomizer as MessageTree;
    const accentBarGradient = themeCustomizer.accentBarGradient as MessageTree;
    const fonts = themeCustomizer.fonts as MessageTree;

    expect(getAccentBarGradientLabel("zh-TW")).toBe(String(accentBarGradient.label));
    expect(getAccentBarGradientHint("en")).toContain("Modern top bar");
    expect(getResumeFontLabel("system-sans", "zh-TW")).toBe(String(fonts["system-sans"]));
    expect(getResumeFontLabel("inter", "en")).toBe("Inter");
  });
});
