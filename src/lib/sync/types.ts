import type { ResumeData, ApplicationPackage } from "../../types";
import type { TemplateStyle } from "../resumeTemplateCatalog";

export interface WorkspaceSyncSnapshot {
  resumeData: ResumeData;
  jobDescription: string;
  activeTemplate: TemplateStyle;
  updatedAt: string;
}

export interface ApplicationPackagesSyncSnapshot {
  packages: ApplicationPackage[];
  updatedAt: string;
}
