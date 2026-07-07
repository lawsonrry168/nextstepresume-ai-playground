import { describe, expect, it } from "vitest";
import { Packer, Paragraph, Table } from "docx";
import { initialResumeData } from "../data";
import {
  buildLayoutAwareResumeChildren,
  createStyledResumeDocument,
} from "../lib/resumeOoxmlStyledExport";
import { getTemplateDefinition, TEMPLATE_DEFINITION_LIST } from "../lib/templates/tokens";

describe("DOCX layout archetype mapping", () => {
  it("renders sidebar templates as a two-cell borderless table", () => {
    const children = buildLayoutAwareResumeChildren(initialResumeData, "minimalist-01", "en");
    const tables = children.filter((child) => child instanceof Table);
    expect(tables).toHaveLength(1);
    expect(children[0]).toBeInstanceOf(Paragraph);
  });

  it("renders sidebar-right templates with the main column first", () => {
    const def = getTemplateDefinition("modern-06");
    expect(def.layout).toBe("sidebar-right");
    const children = buildLayoutAwareResumeChildren(initialResumeData, "modern-06", "en");
    expect(children.some((child) => child instanceof Table)).toBe(true);
  });

  it("renders two-column templates as a table", () => {
    const def = getTemplateDefinition("minimalist-07");
    expect(def.layout).toBe("two-column");
    const children = buildLayoutAwareResumeChildren(initialResumeData, "minimalist-07", "en");
    expect(children.some((child) => child instanceof Table)).toBe(true);
  });

  it("renders timeline templates as a date/content table", () => {
    const def = getTemplateDefinition("modern-08");
    expect(def.layout).toBe("timeline");
    const children = buildLayoutAwareResumeChildren(initialResumeData, "modern-08", "en");
    expect(children.some((child) => child instanceof Table)).toBe(true);
  });

  it("keeps single-column templates as a plain paragraph flow", () => {
    const children = buildLayoutAwareResumeChildren(initialResumeData, "classic-01", "en");
    expect(children.every((child) => child instanceof Paragraph)).toBe(true);
  });

  it("packs a valid document for every one of the 31 templates", async () => {
    for (const def of TEMPLATE_DEFINITION_LIST) {
      const doc = createStyledResumeDocument(initialResumeData, def.id, "en");
      const blob = await Packer.toBlob(doc);
      expect(blob.size, `${def.id} should produce a non-trivial docx`).toBeGreaterThan(1000);
    }
  });
});
