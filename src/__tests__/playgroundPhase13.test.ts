import { describe, expect, it } from "vitest";
import { htmlLangForLocale } from "../i18n/htmlLang";

describe("locale html lang mapping", () => {
  it("maps market locales to document lang attributes", () => {
    expect(htmlLangForLocale("en")).toBe("en-HK");
    expect(htmlLangForLocale("zh-HK")).toBe("zh-HK");
    expect(htmlLangForLocale("zh-TW")).toBe("zh-Hant");
  });
});
