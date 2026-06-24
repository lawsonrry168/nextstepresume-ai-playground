import { withApiAuthHeaders } from "../apiAuthHeaders";
import type { ApplicationPackagesSyncSnapshot, WorkspaceSyncSnapshot } from "./types";
import type { ApplicationPackage } from "../../types";
import type { TemplateStyle } from "../resumeTemplateCatalog";

export async function fetchRemoteWorkspace(): Promise<WorkspaceSyncSnapshot | null> {
  const response = await fetch("/api/sync/workspace", {
    headers: withApiAuthHeaders(),
  });
  if (response.status === 404) return null;
  if (!response.ok) return null;
  const data = (await response.json()) as {
    resumeData: WorkspaceSyncSnapshot["resumeData"];
    jobDescription: string;
    activeTemplate: TemplateStyle;
    updatedAt: string;
  };
  return {
    resumeData: data.resumeData,
    jobDescription: data.jobDescription,
    activeTemplate: data.activeTemplate,
    updatedAt: data.updatedAt,
  };
}

export async function pushRemoteWorkspace(snapshot: WorkspaceSyncSnapshot): Promise<string | null> {
  const response = await fetch("/api/sync/workspace", {
    method: "PUT",
    headers: withApiAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(snapshot),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { updatedAt?: string };
  return data.updatedAt ?? snapshot.updatedAt;
}

export async function fetchRemoteApplicationPackages(): Promise<ApplicationPackagesSyncSnapshot | null> {
  const response = await fetch("/api/sync/application-packages", {
    headers: withApiAuthHeaders(),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    packages: ApplicationPackage[];
    updatedAt: string | null;
  };
  if (!data.updatedAt) return null;
  return {
    packages: Array.isArray(data.packages) ? data.packages : [],
    updatedAt: data.updatedAt,
  };
}

export async function pushRemoteApplicationPackages(
  snapshot: ApplicationPackagesSyncSnapshot,
): Promise<string | null> {
  const response = await fetch("/api/sync/application-packages", {
    method: "PUT",
    headers: withApiAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(snapshot),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { updatedAt?: string };
  return data.updatedAt ?? snapshot.updatedAt;
}
