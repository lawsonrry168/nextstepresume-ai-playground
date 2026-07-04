import { describe, expect, it } from "vitest";
import {
  getTemplateDefinition,
  STATIONERY,
  TEMPLATE_DEFINITION_LIST,
  TEMPLATE_FONTS,
  templateCssVariables,
} from "../lib/templates/tokens";
import { RESUME_TEMPLATE_CATALOG, getTemplateFamily } from "../lib/resumeTemplateCatalog";
import { paletteForTemplate } from "../lib/resumeOoxmlStyledExport";

const STATIONERY_HEXES = new Set(Object.values(STATIONERY).map((hex) => hex.toLowerCase()));

describe("retro stationery template tokens", () => {
  it("defines exactly 31 templates matching the catalog ids", () => {
    expect(TEMPLATE_DEFINITION_LIST).toHaveLength(31);
    const tokenIds = TEMPLATE_DEFINITION_LIST.map((def) => def.id).sort();
    const catalogIds = RESUME_TEMPLATE_CATALOG.map((theme) => theme.id).sort();
    expect(tokenIds).toEqual(catalogIds);
  });

  it("uses unique design ids across the notebook/bureau/studio families", () => {
    const designIds = TEMPLATE_DEFINITION_LIST.map((def) => def.designId);
    expect(new Set(designIds).size).toBe(31);
    expect(designIds.filter((id) => id.startsWith("notebook-"))).toHaveLength(11);
    expect(designIds.filter((id) => id.startsWith("bureau-"))).toHaveLength(10);
    expect(designIds.filter((id) => id.startsWith("studio-"))).toHaveLength(10);
  });

  it("resolves definitions by legacy id and by design id", () => {
    expect(getTemplateDefinition("modern-02").designId).toBe("notebook-02");
    expect(getTemplateDefinition("notebook-02").id).toBe("modern-02");
    expect(getTemplateDefinition("bureau-06").id).toBe("classic-06");
    expect(getTemplateDefinition("studio-09").id).toBe("minimalist-09");
  });

  it("keeps every color inside the fixed stationery palette", () => {
    for (const def of TEMPLATE_DEFINITION_LIST) {
      for (const color of Object.values(def.colors)) {
        if (!color) continue;
        expect(STATIONERY_HEXES.has(color.toLowerCase()), `${def.id} color ${color}`).toBe(true);
      }
      expect(def.family).toBe(getTemplateFamily(def.id));
    }
  });

  it("derives the DOCX/ATS palette from the same tokens (31 distinct palettes, not 3)", () => {
    for (const def of TEMPLATE_DEFINITION_LIST) {
      const palette = paletteForTemplate(def.id);
      expect(palette.accent).toBe(def.colors.accent.replace("#", "").toUpperCase());
      expect(palette.ink).toBe(def.colors.ink.replace("#", "").toUpperCase());
      expect(palette.mint).toBe(def.colors.accentSoft.replace("#", "").toUpperCase());
      expect(palette.marker).toBe(def.colors.highlight.replace("#", "").toUpperCase());
      expect(palette.nameFont).toBe(TEMPLATE_FONTS[def.typography.display].docx);
      expect(palette.bodyFont).toBe(TEMPLATE_FONTS[def.typography.body].docx);
    }
    const accents = new Set(
      TEMPLATE_DEFINITION_LIST.map((def) => `${paletteForTemplate(def.id).accent}-${paletteForTemplate(def.id).nameFont}`),
    );
    expect(accents.size).toBeGreaterThan(3);
  });

  it("keeps the preview catalog accent classes in sync with the tokens (anti-drift)", () => {
    for (const theme of RESUME_TEMPLATE_CATALOG) {
      const def = getTemplateDefinition(theme.id);
      expect(
        theme.accentText.toLowerCase(),
        `${theme.id} preview accentText should contain token accent ${def.colors.accent}`,
      ).toContain(def.colors.accent.toLowerCase());
    }
  });

  it("emits CSS variables for every design token", () => {
    const vars = templateCssVariables(getTemplateDefinition("modern-01"));
    expect(vars["--tpl-accent"]).toBe(STATIONERY.red);
    expect(vars["--tpl-paper"]).toBe(STATIONERY.paper);
    expect(vars["--tpl-font-display"]).toContain("Playfair");
  });
});
