import { describe, expect, it } from "vitest";
import {
  exportSectionPageMapFromPositions,
  healDemoExportLayoutSnapshot,
  normalizePrintLayoutPayload,
} from "../lib/printExportBridge";
import { getTemplateDemoResume } from "../lib/templates/templateDemoContent";
import {
  createTemplateDemoLayoutPositions,
  TEMPLATE_DEMO_PAGE_IDS,
} from "../lib/templates/templateDemoLayout";
import { buildFreeLayoutSections } from "../lib/resumeFreeLayout";

describe("printExportBridge", () => {
  it("normalizePrintLayoutPayload repairs stale sectionPageMap from positions", () => {
    const sections = [{ id: "header" }, { id: "education" }];
    const positions = {
      header: { x: 0, y: 0, width: 400, height: 100, pageId: "demo-page-1" },
      education: { x: 0, y: 120, width: 400, height: 100, pageId: "demo-page-2" },
    };
    const normalized = normalizePrintLayoutPayload({
      enabled: true,
      sections,
      positions,
      pages: [
        { id: "demo-page-1", label: "Page 1" },
        { id: "demo-page-2", label: "Page 2" },
      ],
      sectionPageMap: { header: "demo-page-1", education: "demo-page-1" },
    });
    expect(normalized.sectionPageMap).toEqual({
      header: "demo-page-1",
      education: "demo-page-2",
    });
    expect(normalized.pages?.map((p) => p.id)).toEqual(["demo-page-1", "demo-page-2"]);
    expect(exportSectionPageMapFromPositions(sections, positions)).toEqual(normalized.sectionPageMap);
  });

  it("healDemoExportLayoutSnapshot rebuilds two-page demo print plan from collapsed export", () => {
    const style = "modern-01";
    const resume = getTemplateDemoResume(style, "zh");
    const sectionIds = buildFreeLayoutSections(resume).map((section) => section.id);
    const healed = createTemplateDemoLayoutPositions(style, sectionIds, resume);
    const collapsed = Object.fromEntries(
      Object.entries(healed).map(([id, pos]) => [id, { ...pos, pageId: TEMPLATE_DEMO_PAGE_IDS.page1 }]),
    );
    const result = healDemoExportLayoutSnapshot({
      resumeData: resume,
      activeTemplate: style,
      highlightChanges: false,
      analysisResult: null,
      grayscaleMode: false,
      themeCustomization: {},
      freeLayoutEnabled: true,
      sections: sectionIds.map((id) => ({ id })),
      exportSurfacePositions: collapsed,
      exportPages: [{ id: "export-page-1", label: "Page 1" }],
      sectionPageMap: Object.fromEntries(sectionIds.map((id) => [id, "export-page-1"])),
      layerOrder: sectionIds,
      hiddenSections: {},
    });
    expect(result.exportPages.map((page) => page.id)).toEqual([
      TEMPLATE_DEMO_PAGE_IDS.page1,
      TEMPLATE_DEMO_PAGE_IDS.page2,
    ]);
    const pageIds = [
      ...new Set(Object.values(result.exportSurfacePositions).map((pos) => pos.pageId).filter(Boolean)),
    ].sort();
    expect(pageIds).toEqual([TEMPLATE_DEMO_PAGE_IDS.page1, TEMPLATE_DEMO_PAGE_IDS.page2].sort());
  });

  it("healDemoExportLayoutSnapshot fixes page assignment drift while keeping two pages", () => {
    const style = "modern-01";
    const resume = getTemplateDemoResume(style, "zh");
    const sectionIds = buildFreeLayoutSections(resume).map((section) => section.id);
    const canonical = createTemplateDemoLayoutPositions(style, sectionIds, resume);
    // Canonical two-page stack keeps header/summary/experience on page 1;
    // taller HK header meta pushes projects onto page 2.
    expect(canonical.experience!.pageId).toBe(TEMPLATE_DEMO_PAGE_IDS.page1);
    expect(canonical.projects!.pageId).toBe(TEMPLATE_DEMO_PAGE_IDS.page2);

    const drifted = {
      ...canonical,
      experience: { ...canonical.experience!, pageId: TEMPLATE_DEMO_PAGE_IDS.page2 },
    };
    expect(drifted.experience!.pageId).toBe(TEMPLATE_DEMO_PAGE_IDS.page2);

    const result = healDemoExportLayoutSnapshot({
      resumeData: resume,
      activeTemplate: style,
      highlightChanges: false,
      analysisResult: null,
      grayscaleMode: false,
      themeCustomization: {},
      freeLayoutEnabled: true,
      sections: sectionIds.map((id) => ({ id })),
      exportSurfacePositions: drifted,
      exportPages: [
        { id: TEMPLATE_DEMO_PAGE_IDS.page1, label: "Page 1" },
        { id: TEMPLATE_DEMO_PAGE_IDS.page2, label: "Page 2" },
      ],
      sectionPageMap: Object.fromEntries(
        sectionIds.map((id) => [id, drifted[id]!.pageId!]),
      ),
      layerOrder: sectionIds,
      hiddenSections: {},
    });

    expect(result.exportSurfacePositions.experience?.pageId).toBe(TEMPLATE_DEMO_PAGE_IDS.page1);
    expect(result.exportSurfacePositions.projects?.pageId).toBe(TEMPLATE_DEMO_PAGE_IDS.page2);
    expect(result.exportSurfacePositions.education?.pageId).toBe(TEMPLATE_DEMO_PAGE_IDS.page2);
  });
});
