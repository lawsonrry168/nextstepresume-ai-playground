import { describe, expect, it } from "vitest";
import { collectLivePreviewProps } from "../lib/playgroundLivePreviewProps";
import { initialResumeData } from "../data";
import { resolveResumeTheme, DEFAULT_THEME_CUSTOMIZATION } from "../lib/resumeThemeCustomization";
import type { ResumeLivePreviewPanelProps } from "../components/playground/ResumeLivePreviewPanel";

describe("playgroundLivePreviewProps", () => {
  it("returns the same props object for split and fullscreen preview mounts", () => {
    const base: ResumeLivePreviewPanelProps = {
      isPreviewMode: false,
      setIsPreviewMode: () => undefined,
      liveAtsScore: 72,
      previewZoom: 100,
      setPreviewZoom: () => undefined,
      grayscaleMode: false,
      setGrayscaleMode: () => undefined,
      studioViewMode: "single",
      setStudioViewMode: () => undefined,
      activeTemplate: "modern-01",
      setActiveTemplate: () => undefined,
      history: [],
      handleUndo: () => undefined,
      chatOpen: false,
      setChatOpen: () => undefined,
      pdfExporting: false,
      exportToPDF: () => undefined,
      exportToJson: () => undefined,
      exportToDocx: () => undefined,
      resumeData: initialResumeData,
      highlightChanges: true,
      setHighlightChanges: () => undefined,
      analysisResult: null,
      detectedKeywords: [],
      activeKeywordsList: [],
      matcherHighlightActive: false,
      setMatcherHighlightActive: () => undefined,
      atsScoreExpanded: false,
      setAtsScoreExpanded: () => undefined,
      themeCustomization: DEFAULT_THEME_CUSTOMIZATION,
      onThemeCustomizationChange: () => undefined,
      onThemeCustomizationReset: () => undefined,
      resolvedTheme: resolveResumeTheme("modern-01", DEFAULT_THEME_CUSTOMIZATION),
    };

    expect(collectLivePreviewProps(base)).toBe(base);
  });
});
