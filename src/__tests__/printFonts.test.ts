import { describe, expect, it } from "vitest";
import { GOOGLE_PRINT_FONTS_URL } from "../lib/printFonts";

describe("printFonts", () => {
  it("includes marginalia, token, and CJK families", () => {
    expect(GOOGLE_PRINT_FONTS_URL).toContain("Caveat");
    expect(GOOGLE_PRINT_FONTS_URL).toContain("Fraunces");
    expect(GOOGLE_PRINT_FONTS_URL).toContain("Noto+Sans+TC");
    expect(GOOGLE_PRINT_FONTS_URL).toContain("Noto+Serif+TC");
    expect(GOOGLE_PRINT_FONTS_URL).toContain("Playfair+Display");
    expect(GOOGLE_PRINT_FONTS_URL).toContain("IBM+Plex+Mono");
  });
});
