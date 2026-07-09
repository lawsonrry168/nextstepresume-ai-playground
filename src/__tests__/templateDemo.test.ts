import { describe, expect, it } from "vitest";
import { RESUME_TEMPLATE_CATALOG } from "../lib/resumeTemplateCatalog";
import { buildTemplateDemoBundle, resolveTemplateDemoEditorPositions } from "../lib/templates/applyTemplateDemo";
import {
  getTemplateDemoResume,
  TEMPLATE_DEMO_RESUMES_EN,
  TEMPLATE_DEMO_RESUMES_ZH,
} from "../lib/templates/templateDemoContent";
import { getTemplateDemoProfile, getTemplateDemoProfilesForLocale } from "../lib/templates/templateDemoProfiles";
import { resolveTemplateDemoLocale } from "../lib/templates/templateDemoLocale";
import { compactResumeFixture } from "../data";
import {
  isLegacyDefaultResume,
  isStaleTemplateDemoResume,
  isTemplateDemoResume,
  shouldSyncTemplateDemoToLocale,
  templateDemoResumeForLocale,
} from "../lib/templates/templateDemoMatch";
import {
  createTemplateDemoLayoutPositions,
  demoLayoutHasOverlaps,
  demoLayoutHasPageOverflow,
  demoLayoutMissingSecondPage,
  isDemoPageLayout,
  layoutUsesTwoDemoPages,
  TEMPLATE_DEMO_PAGE_IDS,
  buildTemplateDemoPagesDocument,
} from "../lib/templates/templateDemoLayout";
import { buildLayoutDocument } from "../lib/layoutDocument";
import { sectionOverflowsPrintPage } from "../lib/layoutExportSurface";
import { buildFreeLayoutSections } from "../lib/resumeFreeLayout";
import { TEMPLATE_DEFINITION_LIST } from "../lib/templates/tokens";

function assertTwoPageDemoRegistry(
  registry: typeof TEMPLATE_DEMO_RESUMES_EN,
  locale: "en" | "zh",
): void {
  for (const def of TEMPLATE_DEFINITION_LIST) {
    const demo = registry[def.id];
    expect(demo, `${locale}/${def.id}`).toBeDefined();
    expect(demo.experience.length, `${locale}/${def.id}`).toBeGreaterThanOrEqual(2);
    expect(demo.projects.length, `${locale}/${def.id}`).toBeGreaterThanOrEqual(2);
    expect(demo.certifications?.length, `${locale}/${def.id}`).toBeGreaterThanOrEqual(2);
    expect(demo.personalInfo.title, `${locale}/${def.id}`).toBe(
      getTemplateDemoProfile(def.id, locale).title,
    );
  }
}

describe("template demo content", () => {
  it("defines two-page demo resumes for all 31 templates in English and Chinese", () => {
    expect(TEMPLATE_DEFINITION_LIST).toHaveLength(31);
    assertTwoPageDemoRegistry(TEMPLATE_DEMO_RESUMES_EN, "en");
    assertTwoPageDemoRegistry(TEMPLATE_DEMO_RESUMES_ZH, "zh");
    expect(Object.keys(TEMPLATE_DEMO_RESUMES_EN)).toHaveLength(31);
    expect(Object.keys(TEMPLATE_DEMO_RESUMES_ZH)).toHaveLength(31);
  });

  it("maps UI locales zh-HK and zh-TW to Chinese demo content", () => {
    const zhResume = getTemplateDemoResume("modern-01", "zh-HK");
    expect(zhResume.personalInfo.name).toBe("陳俊樂");
    expect(getTemplateDemoResume("modern-01", "zh-TW").summary).toBe(zhResume.summary);
    expect(getTemplateDemoResume("modern-01", "en").personalInfo.name).toBe("Alex Chan");
  });

  it("resolveTemplateDemoLocale normalizes app locales", () => {
    expect(resolveTemplateDemoLocale("en")).toBe("en");
    expect(resolveTemplateDemoLocale("zh-HK")).toBe("zh");
    expect(resolveTemplateDemoLocale("zh-TW")).toBe("zh");
  });

  it("returns cloned resume data per request", () => {
    const a = getTemplateDemoResume("modern-01", "en");
    const b = getTemplateDemoResume("modern-01", "en");
    expect(a).not.toBe(b);
    expect(a.summary).toBe(b.summary);
    a.summary = "mutated";
    expect(getTemplateDemoResume("modern-01", "en").summary).not.toBe("mutated");
  });

  it("uses distinct titles across catalog entries per language", () => {
    for (const locale of ["en", "zh"] as const) {
      const profiles = getTemplateDemoProfilesForLocale(locale);
      const titles = new Set(Object.values(profiles).map((profile) => profile.title));
      expect(titles.size, locale).toBeGreaterThan(20);
    }
  });

  it("keeps English and Chinese demo content independent", () => {
    for (const theme of RESUME_TEMPLATE_CATALOG) {
      const en = getTemplateDemoResume(theme.id, "en");
      const zh = getTemplateDemoResume(theme.id, "zh");
      expect(en.summary).not.toBe(zh.summary);
      expect(en.personalInfo.title).not.toBe(zh.personalInfo.title);
      expect(en.experience[0]?.company).not.toBe(zh.experience[0]?.company);
    }
  });
});

describe("template demo locale sync", () => {
  it("detects demo resume in either language", () => {
    expect(isTemplateDemoResume(getTemplateDemoResume("modern-01", "en"), "modern-01")).toBe(true);
    expect(isTemplateDemoResume(getTemplateDemoResume("modern-01", "zh"), "modern-01")).toBe(true);
    expect(isTemplateDemoResume(getTemplateDemoResume("classic-02", "en"), "modern-01")).toBe(false);
  });

  it("detects legacy compact default placeholders", () => {
    expect(isLegacyDefaultResume(compactResumeFixture)).toBe(true);
    expect(isLegacyDefaultResume(getTemplateDemoResume("classic-02", "en"))).toBe(false);
  });

  it("detects stale two-page demo snapshots still in localStorage", () => {
    const stale = getTemplateDemoResume("modern-01", "en");
    stale.experience.push({
      id: "exp-4",
      company: "Victoria Tech Internship Programme",
      role: "Frontend Intern",
      startDate: "2018-06",
      endDate: "2018-12",
      location: "Sha Tin, Hong Kong",
      bullets: ["Pilot project"],
    });
    expect(isStaleTemplateDemoResume(stale)).toBe(true);
    expect(shouldSyncTemplateDemoToLocale(stale, "modern-01", "en")).toBe(true);
  });

  it("should sync legacy English placeholder when UI locale is Chinese", () => {
    expect(shouldSyncTemplateDemoToLocale(compactResumeFixture, "classic-02", "zh-HK")).toBe(true);
    const zh = templateDemoResumeForLocale(compactResumeFixture, "classic-02", "zh-HK");
    expect(zh?.personalInfo.name).toBe("陳俊樂");
  });

  it("maps stored UI locale to demo content on first load", () => {
    const zhDemo = templateDemoResumeForLocale(
      getTemplateDemoResume("classic-02", "en"),
      "classic-02",
      "zh-HK",
    );
    expect(zhDemo?.personalInfo.name).toBe("陳俊樂");
  });
});

describe("template demo layout", () => {
  it("assigns sections across two demo pages for rich content in both languages", () => {
    for (const locale of ["en", "zh"] as const) {
      for (const def of TEMPLATE_DEFINITION_LIST) {
        const resume = getTemplateDemoResume(def.id, locale);
        const sectionIds = buildFreeLayoutSections(resume).map((section) => section.id);
        const positions = createTemplateDemoLayoutPositions(def.id, sectionIds, resume);
        expect(layoutUsesTwoDemoPages(positions), `${locale}/${def.id}`).toBe(true);
        expect(
          Object.values(positions).some((pos) => pos.pageId === TEMPLATE_DEMO_PAGE_IDS.page2),
          `${locale}/${def.id}`,
        ).toBe(true);
      }
    }
  });

  it("builds a bundle with pages document and positions", () => {
    const bundleEn = buildTemplateDemoBundle("classic-02", "en");
    const bundleZh = buildTemplateDemoBundle("classic-02", "zh");
    expect(bundleEn.pages.pages).toHaveLength(2);
    expect(bundleZh.pages.pages).toHaveLength(2);
    expect(bundleEn.resumeData.personalInfo.name).toBe("Alex Chan");
    expect(bundleZh.resumeData.personalInfo.name).toBe("陳俊樂");
  });

  it("demo layouts have no same-page overlaps or vertical page overflow", () => {
    for (const def of TEMPLATE_DEFINITION_LIST) {
      for (const locale of ["en", "zh"] as const) {
        const resume = getTemplateDemoResume(def.id, locale);
        const sectionIds = buildFreeLayoutSections(resume).map((section) => section.id);
        const positions = resolveTemplateDemoEditorPositions(def.id, sectionIds, resume);
        expect(demoLayoutHasOverlaps(positions), `${def.id}/${locale}`).toBe(false);
        expect(demoLayoutHasPageOverflow(positions), `${def.id}/${locale}`).toBe(false);
        expect(layoutUsesTwoDemoPages(positions), `${def.id}/${locale}`).toBe(true);
        for (const id of sectionIds) {
          expect(sectionOverflowsPrintPage(positions[id]!), `${def.id}/${locale}/${id}`).toBe(false);
        }
      }
    }
  });

  it("modern-01 marginalia zh demo fits A4 after print pipeline", () => {
    const resume = getTemplateDemoResume("modern-01", "zh");
    const sectionIds = buildFreeLayoutSections(resume).map((section) => section.id);
    const positions = resolveTemplateDemoEditorPositions("modern-01", sectionIds, resume);
    for (const id of sectionIds) {
      expect(sectionOverflowsPrintPage(positions[id]!), id).toBe(false);
    }
    expect(positions.experience?.pageId).toBeDefined();
  });

  it("detects stale single-page demo collapse missing page-2 assignments", () => {
    const resume = getTemplateDemoResume("modern-01", "zh");
    const sectionIds = buildFreeLayoutSections(resume).map((section) => section.id);
    const positions = createTemplateDemoLayoutPositions("modern-01", sectionIds, resume);
    const collapsed = Object.fromEntries(
      Object.entries(positions).map(([id, pos]) => [id, { ...pos, pageId: TEMPLATE_DEMO_PAGE_IDS.page1 }]),
    );
    expect(demoLayoutMissingSecondPage(collapsed)).toBe(true);
    expect(layoutUsesTwoDemoPages(positions)).toBe(true);
    expect(demoLayoutMissingSecondPage(positions)).toBe(false);
  });

  it("restored demo layout yields two-page print plan", () => {
    const resume = getTemplateDemoResume("modern-01", "zh");
    const sectionIds = buildFreeLayoutSections(resume).map((section) => section.id);
    const positions = createTemplateDemoLayoutPositions("modern-01", sectionIds, resume);
    const pages = buildTemplateDemoPagesDocument();
    const sectionPageMap = Object.fromEntries(
      sectionIds.map((id) => [id, positions[id]?.pageId ?? pages.pages[0]!.id]),
    );
    const doc = buildLayoutDocument({
      sectionIds,
      draftPositions: positions,
      resumeData: resume,
      freeLayoutEnabled: true,
      templateStyle: "modern-01",
      studioPages: pages.pages,
      studioSectionPageMap: sectionPageMap,
    });
    expect(doc.printPlan.pageIds).toEqual([
      TEMPLATE_DEMO_PAGE_IDS.page1,
      TEMPLATE_DEMO_PAGE_IDS.page2,
    ]);
  });

  it("demo export print plan uses at most two non-empty pages", () => {
    for (const def of TEMPLATE_DEFINITION_LIST.slice(0, 3)) {
      for (const locale of ["en", "zh"] as const) {
        const resume = getTemplateDemoResume(def.id, locale);
        const sectionIds = buildFreeLayoutSections(resume).map((section) => section.id);
        const positions = createTemplateDemoLayoutPositions(def.id, sectionIds, resume);
        const pages = buildTemplateDemoPagesDocument();
        const sectionPageMap = Object.fromEntries(
          sectionIds.map((id) => [id, positions[id]?.pageId ?? pages.pages[0]!.id]),
        );
        const doc = buildLayoutDocument({
          sectionIds,
          draftPositions: positions,
          resumeData: resume,
          freeLayoutEnabled: true,
          templateStyle: def.id,
          studioPages: pages.pages,
          studioSectionPageMap: sectionPageMap,
        });
        expect(doc.printPlan.pageIds.length, `${locale}/${def.id}`).toBeLessThanOrEqual(2);
        for (const pageId of doc.printPlan.pageIds) {
          const onPage = sectionIds.filter((id) => doc.printPlan.positions[id]?.pageId === pageId);
          expect(onPage.length, `${locale}/${def.id}/${pageId}`).toBeGreaterThan(0);
        }
      }
    }
  });
});
