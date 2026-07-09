import { describe, expect, it } from "vitest";
import { normalizeStoredUiLocale } from "../i18n/types";

describe("normalizeStoredUiLocale", () => {
  it("maps zh-TW to zh-HK for HK market", () => {
    expect(normalizeStoredUiLocale("zh-TW")).toBe("zh-HK");
  });

  it("keeps en and zh-HK when allowed", () => {
    expect(normalizeStoredUiLocale("en")).toBe("en");
    expect(normalizeStoredUiLocale("zh-HK")).toBe("zh-HK");
  });

  it("falls back to market default for unknown values", () => {
    expect(normalizeStoredUiLocale("fr")).toBe("en");
    expect(normalizeStoredUiLocale(null)).toBe("en");
  });
});
