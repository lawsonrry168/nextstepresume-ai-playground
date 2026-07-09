import { beforeEach, describe, expect, it, vi } from "vitest";
import { compactResumeFixture } from "../data";
import { NSR_STORAGE_KEYS } from "../lib/storageKeys";
import {
  DEMO_SCHEMA_VERSION,
  DEMO_SCHEMA_VERSION_KEY,
  migrateDemoSchemaIfNeeded,
  readDemoSchemaVersion,
} from "../lib/templates/demoSchemaMigration";
import { getTemplateDemoResume } from "../lib/templates/templateDemoContent";

describe("demo schema migration", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, String(value));
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    });
  });

  it("seeds a fresh workspace when no resume is stored", () => {
    const result = migrateDemoSchemaIfNeeded();
    expect(result.migrated).toBe(true);
    expect(result.reason).toBe("fresh");
    expect(readDemoSchemaVersion()).toBe(DEMO_SCHEMA_VERSION);
    const stored = JSON.parse(localStorage.getItem(NSR_STORAGE_KEYS.workspaceResume)!);
    expect(stored.projects.length).toBeGreaterThanOrEqual(2);
    expect(stored.certifications?.length).toBeGreaterThanOrEqual(2);
  });

  it("upgrades compact Alex Chan seed drafts behind the schema version", () => {
    localStorage.setItem(NSR_STORAGE_KEYS.workspaceResume, JSON.stringify(compactResumeFixture));
    localStorage.setItem(NSR_STORAGE_KEYS.workspaceTemplate, "modern-01");
    localStorage.setItem(NSR_STORAGE_KEYS.uiLocale, "zh-TW");
    localStorage.setItem(DEMO_SCHEMA_VERSION_KEY, "1");

    const result = migrateDemoSchemaIfNeeded();
    expect(result.migrated).toBe(true);
    expect(result.reason).toBe("seed-upgrade");
    expect(result.fromVersion).toBe(1);
    expect(readDemoSchemaVersion()).toBe(DEMO_SCHEMA_VERSION);

    const stored = JSON.parse(localStorage.getItem(NSR_STORAGE_KEYS.workspaceResume)!);
    expect(stored.personalInfo.name).toBe("陳俊樂");
    expect(stored.projects.length).toBeGreaterThanOrEqual(2);
    expect(stored.certifications?.length).toBeGreaterThanOrEqual(2);
  });

  it("does not overwrite user-edited resumes when schema is behind", () => {
    const custom = {
      ...getTemplateDemoResume("modern-01", "en"),
      personalInfo: {
        ...getTemplateDemoResume("modern-01", "en").personalInfo,
        name: "User Edited Name",
      },
    };
    localStorage.setItem(NSR_STORAGE_KEYS.workspaceResume, JSON.stringify(custom));
    localStorage.setItem(NSR_STORAGE_KEYS.workspaceTemplate, "modern-01");
    localStorage.setItem(DEMO_SCHEMA_VERSION_KEY, "0");

    const result = migrateDemoSchemaIfNeeded();
    expect(result.migrated).toBe(false);
    expect(result.reason).toBe("user-content-kept");
    const stored = JSON.parse(localStorage.getItem(NSR_STORAGE_KEYS.workspaceResume)!);
    expect(stored.personalInfo.name).toBe("User Edited Name");
    expect(readDemoSchemaVersion()).toBe(DEMO_SCHEMA_VERSION);
  });

  it("is a no-op when schema is already current", () => {
    const demo = getTemplateDemoResume("classic-02", "en");
    localStorage.setItem(NSR_STORAGE_KEYS.workspaceResume, JSON.stringify(demo));
    localStorage.setItem(DEMO_SCHEMA_VERSION_KEY, String(DEMO_SCHEMA_VERSION));
    const result = migrateDemoSchemaIfNeeded();
    expect(result.migrated).toBe(false);
    expect(result.reason).toBe("already-current");
  });
});
