import { getSupabaseAdmin } from "../lib/supabaseAdmin.ts";
import { isSupabaseConfigured } from "../auth/supabaseConfig.ts";
import type {
  ApplicationPackagesSyncRecord,
  CanvasLayoutSyncRecord,
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

  async getCanvasLayout(userId: string): Promise<CanvasLayoutSyncRecord | null> {
    const admin = getSupabaseAdmin();
    if (!admin) return null;

    const { data, error } = await admin
      .from("resume_workspaces")
      .select("canvas_layout")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data?.canvas_layout || typeof data.canvas_layout !== "object") return null;
    const layout = data.canvas_layout as Record<string, unknown>;
    const updatedAt = typeof layout.updatedAt === "string" ? layout.updatedAt : "";
    if (!updatedAt) return null;
    return {
      layoutPositions:
        layout.layoutPositions && typeof layout.layoutPositions === "object"
          ? (layout.layoutPositions as Record<string, unknown>)
          : {},
      canvasDocument:
        layout.canvasDocument && typeof layout.canvasDocument === "object"
          ? (layout.canvasDocument as Record<string, unknown>)
          : {},
      canvasElements: Array.isArray(layout.canvasElements) ? layout.canvasElements : [],
      updatedAt,
    };
  }

  async upsertCanvasLayout(userId: string, record: CanvasLayoutSyncRecord): Promise<CanvasLayoutSyncRecord> {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error("supabase_not_configured");

    const updatedAt = record.updatedAt || new Date().toISOString();
    const payload = {
      layoutPositions: record.layoutPositions,
      canvasDocument: record.canvasDocument,
      canvasElements: record.canvasElements,
      updatedAt,
    };

    // Update the existing workspace row first so we never clobber resume_data /
    // job_description / template_id and never bump the workspace's updated_at.
    const { data: updated, error: updateError } = await admin
      .from("resume_workspaces")
      .update({ canvas_layout: payload })
      .eq("user_id", userId)
      .select("canvas_layout")
      .maybeSingle();
    if (updateError) throw updateError;

    let layoutRaw: unknown = updated?.canvas_layout;

    if (!updated) {
      // No workspace row yet — insert a minimal valid row so NOT NULL columns
      // are satisfied while still persisting the canvas layout.
      const { data: inserted, error: insertError } = await admin
        .from("resume_workspaces")
        .insert({
          user_id: userId,
          resume_data: {},
          job_description: "",
          template_id: "modern-01",
          canvas_layout: payload,
          updated_at: updatedAt,
        })
        .select("canvas_layout")
        .single();
      if (insertError) throw insertError;
      layoutRaw = inserted?.canvas_layout;
    }

    const layout =
      layoutRaw && typeof layoutRaw === "object"
        ? (layoutRaw as Record<string, unknown>)
        : payload;
    return {
      layoutPositions:
        layout.layoutPositions && typeof layout.layoutPositions === "object"
          ? (layout.layoutPositions as Record<string, unknown>)
          : {},
      canvasDocument:
        layout.canvasDocument && typeof layout.canvasDocument === "object"
          ? (layout.canvasDocument as Record<string, unknown>)
          : {},
      canvasElements: Array.isArray(layout.canvasElements) ? layout.canvasElements : [],
      updatedAt: typeof layout.updatedAt === "string" ? layout.updatedAt : updatedAt,
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
