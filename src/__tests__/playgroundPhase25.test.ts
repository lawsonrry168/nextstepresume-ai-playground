import { describe, expect, it } from "vitest";
import {
  LEGAL_PATHS,
  resolveLegalPageFromPath,
  legalPageTitleKey,
  legalSectionTitleKey,
} from "../lib/legal/pages";

describe("phase 25 legal pages", () => {
  it("resolves privacy and terms paths", () => {
    expect(resolveLegalPageFromPath("/privacy")).toBe("privacy");
    expect(resolveLegalPageFromPath("/privacy/")).toBe("privacy");
    expect(resolveLegalPageFromPath("/terms")).toBe("terms");
    expect(resolveLegalPageFromPath("/")).toBeNull();
    expect(resolveLegalPageFromPath("/simulator")).toBeNull();
  });

  it("exposes stable route constants", () => {
    expect(LEGAL_PATHS.privacy).toBe("/privacy");
    expect(LEGAL_PATHS.terms).toBe("/terms");
  });

  it("builds i18n keys for page content", () => {
    expect(legalPageTitleKey("privacy")).toBe("legal.privacy.title");
    expect(legalSectionTitleKey("terms", "billing")).toBe("legal.terms.sections.billing.title");
  });
});
