import { describe, expect, it } from "vitest";
import { resolveEffectiveClientPlan } from "../lib/subscription/effectiveClientPlan";

describe("resolveEffectiveClientPlan", () => {
  it("stays locked to starter before config is trusted", () => {
    expect(
      resolveEffectiveClientPlan({
        appConfigLoaded: false,
        appMode: "playground",
        trustedServerPlan: "max",
        trustedServerPlanReady: true,
      }),
    ).toBe("starter");
  });

  it("unlocks full demo only after confirmed playground config", () => {
    expect(
      resolveEffectiveClientPlan({
        appConfigLoaded: true,
        appMode: "playground",
        trustedServerPlan: "starter",
        trustedServerPlanReady: false,
      }),
    ).toBe("max");
  });

  it("ignores local paid state in production until server plan is trusted", () => {
    expect(
      resolveEffectiveClientPlan({
        appConfigLoaded: true,
        appMode: "production",
        trustedServerPlan: "max",
        trustedServerPlanReady: false,
      }),
    ).toBe("starter");
  });

  it("uses the trusted server plan in production after sync", () => {
    expect(
      resolveEffectiveClientPlan({
        appConfigLoaded: true,
        appMode: "production",
        trustedServerPlan: "pro",
        trustedServerPlanReady: true,
      }),
    ).toBe("pro");
  });
});
