import { describe, expect, it, beforeEach, vi } from "vitest";
import { createQuotaStore } from "../../server/quota/createQuotaStore.ts";
import { InMemoryQuotaStore } from "../../server/quota/inMemoryQuotaStore.ts";
import {
  applyUsageDeltas,
  getClientRecord,
  resetClientStoreForTests,
  setClientPlan,
} from "../lib/subscription/serverClientStore";
import { emptyUsage } from "../lib/subscription/usageLedger";
import { ensureLocaleLoaded, setActiveLocale } from "../i18n/translate";
import { pdfExportError, getPdfExportModeLabels } from "../lib/pdfExportI18n";
import zhTW from "../i18n/locales/zh-TW";
import type { MessageTree } from "../i18n/types";

const zhMessages = zhTW as MessageTree;

describe("quota store factory", () => {
  beforeEach(() => {
    resetClientStoreForTests();
  });

  it("creates in-memory store by default", () => {
    const store = createQuotaStore("memory");
    expect(store).toBeInstanceOf(InMemoryQuotaStore);
  });

  it("warns and falls back when redis is requested", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const store = createQuotaStore("redis");
    expect(store).toBeInstanceOf(InMemoryQuotaStore);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("redis"));
    warn.mockRestore();
  });

  it("setClientPlan creates record when missing", () => {
    const clientId = "phase7-client-12345678";
    setClientPlan(clientId, "pro");
    const record = getClientRecord(clientId);
    expect(record.plan).toBe("pro");
  });

  it("applyUsageDeltas increments usage through store", () => {
    const clientId = "phase7-usage-12345678";
    setClientPlan(clientId, "starter");
    applyUsageDeltas(clientId, [{ metric: "aiCredits", amount: 3 }]);
    const record = getClientRecord(clientId);
    expect(record.usage.aiCredits).toBe(3);
    expect(record.usage).toEqual({ ...emptyUsage(), aiCredits: 3 });
  });
});

describe("lib pdf export i18n", () => {
  beforeEach(async () => {
    setActiveLocale("zh-TW");
    await ensureLocaleLoaded("zh-TW");
  });

  it("resolves export error messages from locale keys", () => {
    const exportErrors = zhMessages.exportErrors as MessageTree;
    expect(pdfExportError("previewNotFound")).toBe(String(exportErrors.previewNotFound));
    expect(pdfExportError("colorFormatUnsupported")).toBe(String(exportErrors.colorFormatUnsupported));
  });

  it("resolves pdf export mode labels", () => {
    const pdfExportModes = zhMessages.pdfExportModes as MessageTree;
    const visual = pdfExportModes.visual as MessageTree;
    const ats = pdfExportModes.ats as MessageTree;
    const labels = getPdfExportModeLabels();
    expect(labels.visual.title).toBe(String(visual.title));
    expect(labels.ats.hint).toBe(String(ats.hint));
  });
});
