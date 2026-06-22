import { describe, expect, it } from "vitest";
import { QuotaError } from "../lib/api/quotaError";
import { parseApiJson } from "../lib/apiResponse";

describe("parseApiJson quota handling", () => {
  it("throws QuotaError on 402 and exposes plan metadata", async () => {
    const response = new Response(
      JSON.stringify({
        error: "Monthly AI credit limit reached.",
        code: "quota_exceeded",
        plan: "starter",
      }),
      { status: 402, headers: { "Content-Type": "application/json" } },
    );

    let caught: unknown;
    try {
      await parseApiJson(response);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(QuotaError);
    const quotaErr = caught as QuotaError;
    expect(quotaErr.code).toBe("quota_exceeded");
    expect(quotaErr.plan).toBe("starter");
  });
});
