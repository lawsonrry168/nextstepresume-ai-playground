import { describe, expect, it } from "vitest";
import { computeResponsiveFitScale } from "../hooks/useResponsiveScale";

describe("computeResponsiveFitScale", () => {
  it("caps the scale at 1 when the container is wider than the page", () => {
    expect(computeResponsiveFitScale(1400, 794, 32)).toBe(1);
  });

  it("shrinks the scale when the container is narrower than the page", () => {
    expect(computeResponsiveFitScale(640, 794, 24)).toBeCloseTo((640 - 48) / 794, 4);
  });

  it("falls back to 1 for invalid dimensions", () => {
    expect(computeResponsiveFitScale(0, 794)).toBe(1);
    expect(computeResponsiveFitScale(800, 0)).toBe(1);
  });
});
