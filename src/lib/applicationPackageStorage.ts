import type { ApplicationPackage, ApplicationStatus } from "../types";
import { NSR_STORAGE_KEYS } from "./storageKeys";

const STORAGE_KEY = NSR_STORAGE_KEYS.applicationPackages;

function isStorageAvailable(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function readAll(): ApplicationPackage[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ApplicationPackage[]) : [];
  } catch {
    return [];
  }
}

let packagesChangeListener: (() => void) | null = null;

export function setApplicationPackagesChangeListener(listener: (() => void) | null): void {
  packagesChangeListener = listener;
}

function writeAll(packages: ApplicationPackage[]): void {
  if (!isStorageAvailable()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packages));
  packagesChangeListener?.();
}

export function listApplicationPackages(): ApplicationPackage[] {
  return readAll().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getApplicationPackage(id: string): ApplicationPackage | null {
  return readAll().find((pkg) => pkg.id === id) ?? null;
}

export function saveApplicationPackage(pkg: ApplicationPackage): ApplicationPackage {
  const all = readAll();
  const index = all.findIndex((item) => item.id === pkg.id);
  const next = { ...pkg, updatedAt: new Date().toISOString() };
  if (index >= 0) {
    all[index] = next;
  } else {
    all.unshift(next);
  }
  writeAll(all);
  return next;
}

export function createApplicationPackage(
  input: Omit<ApplicationPackage, "id" | "createdAt" | "updatedAt">
): ApplicationPackage {
  const now = new Date().toISOString();
  const pkg: ApplicationPackage = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  return saveApplicationPackage(pkg);
}

export function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  extra?: Partial<Pick<ApplicationPackage, "notes" | "appliedAt">>
): ApplicationPackage | null {
  const existing = getApplicationPackage(id);
  if (!existing) return null;
  return saveApplicationPackage({
    ...existing,
    ...extra,
    status,
    appliedAt:
      status === "applied" && !existing.appliedAt
        ? new Date().toISOString()
        : extra?.appliedAt ?? existing.appliedAt,
  });
}

export function deleteApplicationPackage(id: string): boolean {
  const all = readAll();
  const filtered = all.filter((pkg) => pkg.id !== id);
  if (filtered.length === all.length) return false;
  writeAll(filtered);
  return true;
}

export function updateApplicationPackageCoverLetter(
  id: string,
  coverLetter: ApplicationPackage["coverLetter"]
): ApplicationPackage | null {
  const existing = getApplicationPackage(id);
  if (!existing) return null;
  return saveApplicationPackage({ ...existing, coverLetter });
}

export type ApplicationPackageFieldUpdate = Partial<
  Pick<
    ApplicationPackage,
    | "interviewPrep"
    | "companyResearch"
    | "timeline"
    | "notes"
    | "appliedAt"
    | "followUpDate"
    | "interviewDate"
    | "status"
    | "coverLetter"
  >
> & {
  /** Explicit null removes the field from storage (clears date/notes). */
  notes?: string | null;
  appliedAt?: string | null;
  followUpDate?: string | null;
  interviewDate?: string | null;
};

export function updateApplicationPackageFields(
  id: string,
  fields: ApplicationPackageFieldUpdate
): ApplicationPackage | null {
  const existing = getApplicationPackage(id);
  if (!existing) return null;

  const next: ApplicationPackage = { ...existing };
  for (const [key, value] of Object.entries(fields) as Array<
    [keyof ApplicationPackageFieldUpdate, unknown]
  >) {
    const record = next as unknown as Record<string, unknown>;
    if (value === null) {
      delete record[key as string];
    } else if (value !== undefined) {
      record[key as string] = value;
    }
  }

  return saveApplicationPackage(next);
}
