import { describe, expect, it } from "vitest";
import { apiResponseLogLevel, apiResponseOutcomeKey } from "../lib/apiLogMessages";
import zhTW from "../i18n/locales/zh-TW";
import type { MessageTree } from "../i18n/types";

const zhMessages = zhTW as MessageTree;

describe("apiLogMessages", () => {
  it("classifies HTTP status codes for system logs", () => {
    expect(apiResponseLogLevel(200)).toBe("info");
    expect(apiResponseLogLevel(402)).toBe("warn");
    expect(apiResponseLogLevel(429)).toBe("warn");
    expect(apiResponseLogLevel(500)).toBe("error");
    expect(apiResponseLogLevel(0)).toBe("error");
  });

  it("maps status codes to outcome keys for i18n", () => {
    expect(apiResponseOutcomeKey(200)).toBe("success");
    expect(apiResponseOutcomeKey(402)).toBe("rejected");
    expect(apiResponseOutcomeKey(500)).toBe("failed");
  });

  it("defines localized api and system log strings in zh-TW", () => {
    const systemLog = zhMessages.systemLog as MessageTree;
    const apiErrors = zhMessages.apiErrors as MessageTree;
    const geminiInitial = zhMessages.geminiChatInitial as MessageTree;
    expect(systemLog.outcome).toBeTruthy();
    expect(String(apiErrors.rateLimitMinute)).toContain("60");
    expect(String(geminiInitial.message)).toContain("職涯");
  });
});
