import { NSR_STORAGE_KEYS } from "../storageKeys";
import type { ApplicationPackage } from "../../types";
import type { ResumeData } from "../../types";
import { normalizeTemplateStyle, type TemplateStyle } from "../resumeTemplateCatalog";
import {
  fetchRemoteApplicationPackages,
  fetchRemoteWorkspace,
  pushRemoteApplicationPackages,
  pushRemoteWorkspace,
} from "./cloudSyncApi";
import type { ApplicationPackagesSyncSnapshot, WorkspaceSyncSnapshot } from "./types";

let syncEnabled = false;
let workspacePushTimer: ReturnType<typeof setTimeout> | null = null;
let packagesPushTimer: ReturnType<typeof setTimeout> | null = null;

type WorkspaceHydrateHandler = (snapshot: WorkspaceSyncSnapshot) => void;
type PackagesHydrateHandler = (snapshot: ApplicationPackagesSyncSnapshot) => void;

let workspaceHydrateHandler: WorkspaceHydrateHandler | null = null;
let packagesHydrateHandler: PackagesHydrateHandler | null = null;

function readLocalIso(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalIso(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function parseIso(value: string | null | undefined): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function shouldApplyRemote(remoteUpdatedAt: string, localKey: string): boolean {
  const remoteMs = parseIso(remoteUpdatedAt);
  const localMs = parseIso(readLocalIso(localKey));
  if (remoteMs === 0) return false;
  if (localMs === 0) return true;
  return remoteMs >= localMs;
}

function shouldPushLocal(localKey: string, remoteUpdatedAt: string | null | undefined): boolean {
  const localMs = parseIso(readLocalIso(localKey));
  const remoteMs = parseIso(remoteUpdatedAt);
  if (localMs === 0) return true;
  if (remoteMs === 0) return true;
  return localMs > remoteMs;
}

function readLocalWorkspaceForPush(): WorkspaceSyncSnapshot | null {
  try {
    const resumeRaw = localStorage.getItem(NSR_STORAGE_KEYS.workspaceResume);
    if (!resumeRaw) return null;
    const resumeData = JSON.parse(resumeRaw) as ResumeData;
    const jobDescription = localStorage.getItem(NSR_STORAGE_KEYS.workspaceJd) ?? "";
    const activeTemplate = normalizeTemplateStyle(
      localStorage.getItem(NSR_STORAGE_KEYS.workspaceTemplate),
    );
    return {
      resumeData,
      jobDescription,
      activeTemplate,
      updatedAt: readLocalIso(NSR_STORAGE_KEYS.workspaceCloudUpdatedAt) ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function readLocalPackagesForPush(): ApplicationPackage[] {
  try {
    const raw = localStorage.getItem(NSR_STORAGE_KEYS.applicationPackages);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ApplicationPackage[]) : [];
  } catch {
    return [];
  }
}

export function setCloudSyncEnabled(enabled: boolean): void {
  syncEnabled = enabled;
}

export function isCloudSyncActive(): boolean {
  return syncEnabled;
}

export function registerWorkspaceHydrateHandler(handler: WorkspaceHydrateHandler | null): () => void {
  workspaceHydrateHandler = handler;
  return () => {
    if (workspaceHydrateHandler === handler) {
      workspaceHydrateHandler = null;
    }
  };
}

export function registerPackagesHydrateHandler(handler: PackagesHydrateHandler | null): () => void {
  packagesHydrateHandler = handler;
  return () => {
    if (packagesHydrateHandler === handler) {
      packagesHydrateHandler = null;
    }
  };
}

export function scheduleWorkspaceCloudPush(snapshot: WorkspaceSyncSnapshot): void {
  if (!syncEnabled) return;
  if (workspacePushTimer) clearTimeout(workspacePushTimer);
  workspacePushTimer = setTimeout(() => {
    workspacePushTimer = null;
    void pushRemoteWorkspace(snapshot).then((updatedAt) => {
      if (updatedAt) {
        writeLocalIso(NSR_STORAGE_KEYS.workspaceCloudUpdatedAt, updatedAt);
      }
    });
  }, 1200);
}

export function scheduleApplicationPackagesCloudPush(packages: ApplicationPackage[]): void {
  if (!syncEnabled) return;
  if (packagesPushTimer) clearTimeout(packagesPushTimer);
  const updatedAt = new Date().toISOString();
  writeLocalIso(NSR_STORAGE_KEYS.packagesCloudUpdatedAt, updatedAt);
  packagesPushTimer = setTimeout(() => {
    packagesPushTimer = null;
    void pushRemoteApplicationPackages({ packages, updatedAt }).then((remoteUpdatedAt) => {
      if (remoteUpdatedAt) {
        writeLocalIso(NSR_STORAGE_KEYS.packagesCloudUpdatedAt, remoteUpdatedAt);
      }
    });
  }, 1200);
}

async function reconcileWorkspace(): Promise<void> {
  const remote = await fetchRemoteWorkspace();

  if (!remote) {
    const local = readLocalWorkspaceForPush();
    if (local) {
      const savedAt = await pushRemoteWorkspace(local);
      if (savedAt) writeLocalIso(NSR_STORAGE_KEYS.workspaceCloudUpdatedAt, savedAt);
    }
    return;
  }

  if (shouldApplyRemote(remote.updatedAt, NSR_STORAGE_KEYS.workspaceCloudUpdatedAt)) {
    workspaceHydrateHandler?.(remote);
    writeLocalIso(NSR_STORAGE_KEYS.workspaceCloudUpdatedAt, remote.updatedAt);
    return;
  }

  if (shouldPushLocal(NSR_STORAGE_KEYS.workspaceCloudUpdatedAt, remote.updatedAt)) {
    const local = readLocalWorkspaceForPush();
    if (local) {
      const savedAt = await pushRemoteWorkspace(local);
      if (savedAt) writeLocalIso(NSR_STORAGE_KEYS.workspaceCloudUpdatedAt, savedAt);
    }
  }
}

async function reconcileApplicationPackages(): Promise<void> {
  const remote = await fetchRemoteApplicationPackages();

  if (!remote) {
    const packages = readLocalPackagesForPush();
    if (packages.length === 0) return;
    const updatedAt = readLocalIso(NSR_STORAGE_KEYS.packagesCloudUpdatedAt) ?? new Date().toISOString();
    const savedAt = await pushRemoteApplicationPackages({ packages, updatedAt });
    if (savedAt) writeLocalIso(NSR_STORAGE_KEYS.packagesCloudUpdatedAt, savedAt);
    return;
  }

  if (shouldApplyRemote(remote.updatedAt, NSR_STORAGE_KEYS.packagesCloudUpdatedAt)) {
    packagesHydrateHandler?.(remote);
    writeLocalIso(NSR_STORAGE_KEYS.packagesCloudUpdatedAt, remote.updatedAt);
    return;
  }

  if (shouldPushLocal(NSR_STORAGE_KEYS.packagesCloudUpdatedAt, remote.updatedAt)) {
    const packages = readLocalPackagesForPush();
    if (packages.length === 0) return;
    const updatedAt = readLocalIso(NSR_STORAGE_KEYS.packagesCloudUpdatedAt) ?? new Date().toISOString();
    const savedAt = await pushRemoteApplicationPackages({ packages, updatedAt });
    if (savedAt) writeLocalIso(NSR_STORAGE_KEYS.packagesCloudUpdatedAt, savedAt);
  }
}

export async function pullCloudSnapshots(): Promise<void> {
  if (!syncEnabled) return;
  await reconcileWorkspace();
  await reconcileApplicationPackages();
}

export function touchWorkspaceCloudTimestamp(): string {
  const updatedAt = new Date().toISOString();
  writeLocalIso(NSR_STORAGE_KEYS.workspaceCloudUpdatedAt, updatedAt);
  return updatedAt;
}

export function buildWorkspaceSnapshot(
  resumeData: ResumeData,
  jobDescription: string,
  activeTemplate: TemplateStyle,
): WorkspaceSyncSnapshot {
  return {
    resumeData,
    jobDescription,
    activeTemplate,
    updatedAt: touchWorkspaceCloudTimestamp(),
  };
}
