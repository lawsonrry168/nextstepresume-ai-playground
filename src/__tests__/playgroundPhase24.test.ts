import { afterEach, describe, expect, it } from "vitest";
import {
  shouldApplyRemoteSnapshot,
  shouldPushLocalSnapshot,
  parseIsoTimestamp,
} from "../../server/sync/syncTimestamp.ts";
import {
  resetPostgresSyncStoreForTests,
  setPostgresSyncStoreForTests,
} from "../../server/sync/postgresSyncStore.ts";
import type { PostgresSyncStore } from "../../server/sync/types.ts";

describe("phase 24 postgres cloud sync", () => {
  afterEach(() => {
    resetPostgresSyncStoreForTests();
  });

  it("parseIsoTimestamp handles invalid values", () => {
    expect(parseIsoTimestamp("")).toBe(0);
    expect(parseIsoTimestamp("2026-06-24T00:00:00.000Z")).toBeGreaterThan(0);
  });

  it("shouldApplyRemoteSnapshot prefers newer remote", () => {
    expect(shouldApplyRemoteSnapshot("2026-06-24T10:00:00.000Z", "2026-06-24T09:00:00.000Z")).toBe(
      true,
    );
    expect(shouldApplyRemoteSnapshot("2026-06-24T09:00:00.000Z", "2026-06-24T10:00:00.000Z")).toBe(
      false,
    );
    expect(shouldApplyRemoteSnapshot("2026-06-24T10:00:00.000Z", null)).toBe(true);
  });

  it("shouldPushLocalSnapshot prefers newer local", () => {
    expect(shouldPushLocalSnapshot("2026-06-24T11:00:00.000Z", "2026-06-24T10:00:00.000Z")).toBe(
      true,
    );
    expect(shouldPushLocalSnapshot("2026-06-24T09:00:00.000Z", "2026-06-24T10:00:00.000Z")).toBe(
      false,
    );
    expect(shouldPushLocalSnapshot(null, "2026-06-24T10:00:00.000Z")).toBe(true);
  });

  it("in-memory postgres sync store upserts workspace and packages", async () => {
    const memory = new Map<string, unknown>();
    const store: PostgresSyncStore = {
      async getWorkspace(userId) {
        return (memory.get(`ws:${userId}`) as ReturnType<PostgresSyncStore["getWorkspace"]> extends Promise<infer T> ? T : never) ?? null;
      },
      async upsertWorkspace(userId, record) {
        memory.set(`ws:${userId}`, record);
        return record;
      },
      async getApplicationPackages(userId) {
        return (memory.get(`pkg:${userId}`) as Awaited<ReturnType<PostgresSyncStore["getApplicationPackages"]>>) ?? null;
      },
      async upsertApplicationPackages(userId, record) {
        memory.set(`pkg:${userId}`, record);
        return record;
      },
    };

    setPostgresSyncStoreForTests(store);
    const userId = "user-1";
    const saved = await store.upsertWorkspace(userId, {
      resumeData: { name: "Ada" },
      jobDescription: "JD",
      templateId: "modern-01",
      updatedAt: "2026-06-24T12:00:00.000Z",
    });
    expect(saved.templateId).toBe("modern-01");
    const loaded = await store.getWorkspace(userId);
    expect(loaded?.jobDescription).toBe("JD");

    const pkgSaved = await store.upsertApplicationPackages(userId, {
      packages: [],
      updatedAt: "2026-06-24T12:00:00.000Z",
    });
    expect(pkgSaved.packages).toEqual([]);
  });
});
