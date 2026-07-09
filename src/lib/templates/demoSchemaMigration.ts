import { DEFAULT_A4_TEMPLATE, normalizeTemplateStyle } from "../resumeTemplateCatalog";
import { NSR_STORAGE_KEYS } from "../storageKeys";
import { persistTemplateDemoLayout } from "./applyTemplateDemo";
import { getTemplateDemoResume } from "./templateDemoContent";
import { readStoredUiLocale } from "./templateDemoLocale";
import {
  isLegacyDefaultResume,
  isStaleTemplateDemoResume,
  isTemplateDemoResume,
} from "./templateDemoMatch";
import type { ResumeData } from "../../types";
import type { TemplateStyle } from "../resumeTemplateCatalog";

/**
 * Bump when seed demo content / two-page layout contract changes.
 * Browsers with an older version auto-migrate syncable seed drafts once.
 */
export const DEMO_SCHEMA_VERSION = 2;

export const DEMO_SCHEMA_VERSION_KEY = NSR_STORAGE_KEYS.demoSchemaVersion;

export function readDemoSchemaVersion(): number {
  if (typeof localStorage === "undefined") return 0;
  try {
    const raw = localStorage.getItem(DEMO_SCHEMA_VERSION_KEY);
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function writeDemoSchemaVersion(version = DEMO_SCHEMA_VERSION): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(DEMO_SCHEMA_VERSION_KEY, String(version));
  } catch {
    /* ignore */
  }
}

function readStoredResume(): ResumeData | null {
  try {
    const raw = localStorage.getItem(NSR_STORAGE_KEYS.workspaceResume);
    if (!raw) return null;
    return JSON.parse(raw) as ResumeData;
  } catch {
    return null;
  }
}

function readStoredTemplate(): TemplateStyle {
  try {
    return normalizeTemplateStyle(localStorage.getItem(NSR_STORAGE_KEYS.workspaceTemplate));
  } catch {
    return DEFAULT_A4_TEMPLATE;
  }
}

function isSeedLikeResume(resume: ResumeData, style: TemplateStyle): boolean {
  return (
    isTemplateDemoResume(resume, style) ||
    isLegacyDefaultResume(resume) ||
    isStaleTemplateDemoResume(resume)
  );
}

export type DemoSchemaMigrationResult = {
  migrated: boolean;
  fromVersion: number;
  toVersion: number;
  reason?: "fresh" | "seed-upgrade" | "already-current" | "user-content-kept";
};

/**
 * One-shot boot migration: upgrade stale/legacy/compact seed demos to the
 * current two-page template demo + layout. Never overwrites user-edited resumes
 * when schema is already current; when schema is behind, only seed-like content
 * is replaced.
 */
export function migrateDemoSchemaIfNeeded(): DemoSchemaMigrationResult {
  if (typeof localStorage === "undefined") {
    return { migrated: false, fromVersion: 0, toVersion: DEMO_SCHEMA_VERSION, reason: "already-current" };
  }

  const fromVersion = readDemoSchemaVersion();
  if (fromVersion >= DEMO_SCHEMA_VERSION) {
    return {
      migrated: false,
      fromVersion,
      toVersion: DEMO_SCHEMA_VERSION,
      reason: "already-current",
    };
  }

  const locale = readStoredUiLocale();
  const style = readStoredTemplate();
  const stored = readStoredResume();

  if (!stored) {
    const demo = getTemplateDemoResume(style, locale);
    localStorage.setItem(NSR_STORAGE_KEYS.workspaceResume, JSON.stringify(demo));
    localStorage.setItem(NSR_STORAGE_KEYS.workspaceTemplate, style);
    persistTemplateDemoLayout(style, locale);
    writeDemoSchemaVersion();
    return {
      migrated: true,
      fromVersion,
      toVersion: DEMO_SCHEMA_VERSION,
      reason: "fresh",
    };
  }

  if (!isSeedLikeResume(stored, style)) {
    // User content: bump version so we don't keep re-checking forever, but keep data.
    writeDemoSchemaVersion();
    return {
      migrated: false,
      fromVersion,
      toVersion: DEMO_SCHEMA_VERSION,
      reason: "user-content-kept",
    };
  }

  const demo = getTemplateDemoResume(style, locale);
  localStorage.setItem(NSR_STORAGE_KEYS.workspaceResume, JSON.stringify(demo));
  localStorage.setItem(NSR_STORAGE_KEYS.workspaceTemplate, style);
  persistTemplateDemoLayout(style, locale);
  writeDemoSchemaVersion();
  return {
    migrated: true,
    fromVersion,
    toVersion: DEMO_SCHEMA_VERSION,
    reason: "seed-upgrade",
  };
}
