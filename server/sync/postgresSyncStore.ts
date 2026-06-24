import { getSupabaseAdmin } from "../lib/supabaseAdmin.ts";
import { isSupabaseConfigured } from "../auth/supabaseConfig.ts";
import type {
  ApplicationPackagesSyncRecord,
  PostgresSyncStore,
  WorkspaceSyncRecord,
} from "./types.ts";

function rowToWorkspace(row: {
  resume_data: unknown;
  job_description: string;
  template_id: string;
  updated_at: string;
}): WorkspaceSyncRecord {
  return {
    resumeData:
      row.resume_data && typeof row.resume_data === "object"
        ? (row.resume_data as Record<string, unknown>)
        : {},
    jobDescription: row.job_description ?? "",
    templateId: row.template_id ?? "modern-01",
    updatedAt: row.updated_at,
  };
}

export class SupabasePostgresSyncStore implements PostgresSyncStore {
  async getWorkspace(userId: string): Promise<WorkspaceSyncRecord | null> {
    const admin = getSupabaseAdmin();
    if (!admin) return null;

    const { data, error } = await admin
      .from("resume_workspaces")
      .select("resume_data, job_description, template_id, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return rowToWorkspace(data);
  }

  async upsertWorkspace(userId: string, record: WorkspaceSyncRecord): Promise<WorkspaceSyncRecord> {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error("supabase_not_configured");

    const updatedAt = record.updatedAt || new Date().toISOString();
    const { data, error } = await admin
      .from("resume_workspaces")
      .upsert({
        user_id: userId,
        resume_data: record.resumeData,
        job_description: record.jobDescription,
        template_id: record.templateId,
        updated_at: updatedAt,
      })
      .select("resume_data, job_description, template_id, updated_at")
      .single();

    if (error) throw error;
    return rowToWorkspace(data);
  }

  async getApplicationPackages(userId: string): Promise<ApplicationPackagesSyncRecord | null> {
    const admin = getSupabaseAdmin();
    if (!admin) return null;

    const { data, error } = await admin
      .from("user_application_packages")
      .select("packages, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const packages = Array.isArray(data.packages) ? data.packages : [];
    return {
      packages: packages as ApplicationPackagesSyncRecord["packages"],
      updatedAt: data.updated_at,
    };
  }

  async upsertApplicationPackages(
    userId: string,
    record: ApplicationPackagesSyncRecord,
  ): Promise<ApplicationPackagesSyncRecord> {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error("supabase_not_configured");

    const updatedAt = record.updatedAt || new Date().toISOString();
    const { data, error } = await admin
      .from("user_application_packages")
      .upsert({
        user_id: userId,
        packages: record.packages,
        updated_at: updatedAt,
      })
      .select("packages, updated_at")
      .single();

    if (error) throw error;
    return {
      packages: Array.isArray(data.packages) ? data.packages : [],
      updatedAt: data.updated_at,
    };
  }
}

let syncStore: PostgresSyncStore = new SupabasePostgresSyncStore();

export function getPostgresSyncStore(): PostgresSyncStore {
  return syncStore;
}

export function setPostgresSyncStoreForTests(store: PostgresSyncStore): void {
  syncStore = store;
}

export function resetPostgresSyncStoreForTests(): void {
  syncStore = new SupabasePostgresSyncStore();
}

export function isPostgresSyncConfigured(): boolean {
  return isSupabaseConfigured();
}
