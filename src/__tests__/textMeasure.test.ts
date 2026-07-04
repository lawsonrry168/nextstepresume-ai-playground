import { afterEach, describe, expect, it } from "vitest";
import {
  __resetMeasureContextForTests,
  countWrappedLines,
  fallbackWrappedLineCount,
  isPixelMeasureAvailable,
  measureTextWidth,
  RESUME_BODY_FONT,
} from "../lib/measure/textMeasure";
import { estimateSectionHeightForContent, estimateWrappedLineCount } from "../lib/canvasSectionContentSizing";
import { initialResumeData } from "../data";

afterEach(() => {
  __resetMeasureContextForTests();
});

describe("unified text measurement", () => {
  it("falls back to the char heuristic when no canvas is available", () => {
    __resetMeasureContextForTests("fallback");
    expect(isPixelMeasureAvailable()).toBe(false);
    const width = measureTextWidth("hello");
    expect(width).toBeCloseTo(5 * 7.2 * (RESUME_BODY_FONT.size / 14), 1);
  });

  it("wraps deterministically in the fallback path", () => {
    __resetMeasureContextForTests("fallback");
    expect(countWrappedLines("", 400)).toBe(0);
    const one = countWrappedLines("short line", 400);
    expect(one).toBe(1);
    const many = countWrappedLines(
      "a much longer sentence that will definitely need to wrap across several lines of the layout",
      160,
    );
    expect(many).toBeGreaterThan(2);
  });

  it("produces more lines at narrower widths (monotonic)", () => {
    __resetMeasureContextForTests("fallback");
    const text = "The quick brown fox jumps over the lazy dog again and again until it wraps";
    const wide = countWrappedLines(text, 600);
    const narrow = countWrappedLines(text, 200);
    expect(narrow).toBeGreaterThanOrEqual(wide);
  });

  it("hard-splits tokens wider than the box instead of losing them", () => {
    __resetMeasureContextForTests("fallback");
    const url = "https://example.com/a/very/long/path/that/never/contains/spaces/at/all/really";
    expect(countWrappedLines(url, 150)).toBeGreaterThan(1);
  });

  it("keeps the legacy wrap helper behaviour", () => {
    expect(fallbackWrappedLineCount("one two three", 5)).toBe(3);
    expect(estimateWrappedLineCount("one two three", 5)).toBe(3);
  });

  it("keeps section height estimates stable in test environments", () => {
    const a = estimateSectionHeightForContent("experience", initialResumeData, 456);
    const b = estimateSectionHeightForContent("experience", initialResumeData, 456);
    expect(a).toBe(b);
    expect(a).toBeGreaterThan(100);
    const narrow = estimateSectionHeightForContent("experience", initialResumeData, 216);
    expect(narrow).toBeGreaterThanOrEqual(a);
  });
});
