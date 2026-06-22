import { describe, expect, it, beforeEach } from "vitest";
import {
  RESUME_TEMPLATE_CATALOG,
  getTemplateThemeLabel,
} from "../lib/resumeTemplateCatalog";
import templateThemesEn from "../i18n/locales/data/templateThemes.en";
import templateThemesZhTW from "../i18n/locales/data/templateThemes.zh-TW";
import { ensureLocaleLoaded, setActiveLocale } from "../i18n/translate";

describe("template theme locale catalog", () => {
  beforeEach(async () => {
    setActiveLocale("en");
    await ensureLocaleLoaded("en");
    setActiveLocale("zh-TW");
    await ensureLocaleLoaded("zh-TW");
  });

  it("covers every catalog template id in en and zh-TW data files", () => {
    for (const theme of RESUME_TEMPLATE_CATALOG) {
      expect(templateThemesEn[theme.id as keyof typeof templateThemesEn]).toBe(theme.label);
      expect(templateThemesZhTW[theme.id as keyof typeof templateThemesZhTW]).toBe(theme.labelZh);
    }
    expect(RESUME_TEMPLATE_CATALOG.length).toBe(31);
  });

  it("resolves labels from locale keys before catalog fallbacks", () => {
    const theme = RESUME_TEMPLATE_CATALOG[0];
    expect(getTemplateThemeLabel(theme, "en")).toBe(templateThemesEn["modern-01"]);
    expect(getTemplateThemeLabel(theme, "zh-TW")).toBe(templateThemesZhTW["modern-01"]);
  });
});
