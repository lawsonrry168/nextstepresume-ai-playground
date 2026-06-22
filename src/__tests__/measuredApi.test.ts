import { describe, expect, it } from "vitest";
import { apiResponseLogLevel, apiResponseOutcomeLabel } from "../hooks/useMeasuredApi";

describe("useMeasuredApi response logging", () => {
  it("classifies HTTP status codes for system logs", () => {
    expect(apiResponseLogLevel(200)).toBe("info");
    expect(apiResponseLogLevel(402)).toBe("warn");
    expect(apiResponseLogLevel(429)).toBe("warn");
    expect(apiResponseLogLevel(500)).toBe("error");
    expect(apiResponseLogLevel(0)).toBe("error");
  });

  it("labels outcomes without treating 4xx as success", () => {
    expect(apiResponseOutcomeLabel(200)).toBe("成功");
    expect(apiResponseOutcomeLabel(402)).toBe("被拒");
    expect(apiResponseOutcomeLabel(500)).toBe("失敗");
  });
});
