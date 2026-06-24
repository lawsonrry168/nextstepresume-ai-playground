import type { ApplicationPackage } from "../../src/types.ts";

export interface WorkspaceSyncRecord {
  resumeData: Record<string, unknown>;
  jobDescription: string;
  templateId: string;
  updatedAt: string;
}

export interface ApplicationPackagesSyncRecord {
  packages: ApplicationPackage[];
  updatedAt: string;
}

export interface PostgresSyncStore {
  getWorkspace(userId: string): Promise<WorkspaceSyncRecord | null>;
  upsertWorkspace(userId: string, record: WorkspaceSyncRecord): Promise<WorkspaceSyncRecord>;
  getApplicationPackages(userId: string): Promise<ApplicationPackagesSyncRecord | null>;
  upsertApplicationPackages(
    userId: string,
    record: ApplicationPackagesSyncRecord,
  ): Promise<ApplicationPackagesSyncRecord>;
}
