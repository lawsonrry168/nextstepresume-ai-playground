/** NextStepResume.ai — canonical browser storage keys */
export const NSR_STORAGE_KEYS = {
  tourSeen: "nsr_tour_seen",
  appSidebarCollapsed: "nsr_app_sidebar_collapsed",
  playgroundSidebarCollapsed: "nsr_playground_sidebar_collapsed",
  applicationPackages: "nsr_application_packages",
  editorPreviewSplit: "nsr_playground_editor_preview_split",
  followUpPrefs: "nsr_follow_up_notification_prefs",
  followUpNotified: "nsr_follow_up_notified_keys",
  workspaceResume: "nsr_workspace_resume",
  workspaceJd: "nsr_workspace_jd",
  workspaceTemplate: "nsr_workspace_template",
  themeCustomization: "nsr_theme_customization",
  freeLayoutByFamily: "nsr_free_layout_by_family",
  freeLayoutEnabled: "nsr_free_layout_enabled",
  freeLayoutSnap: "nsr_free_layout_snap",
  freeLayoutLivePreview: "nsr_free_layout_live_preview",
  canvasViewport: "nsr_canvas_viewport",
  studioViewMode: "nsr_studio_view_mode",
  canvasPages: "nsr_canvas_pages",
  canvasLayers: "nsr_canvas_layers",
  canvasStudioUi: "nsr_canvas_studio_ui",
  uiLocale: "nsr_ui_locale",
  subscriptionPlan: "nsr_subscription_plan",
  usageLedger: "nsr_usage_ledger",
  clientId: "nsr_client_id",
  workspaceCloudUpdatedAt: "nsr_workspace_cloud_updated_at",
  packagesCloudUpdatedAt: "nsr_packages_cloud_updated_at",
} as const;

/** FirstResume.ai / ats_resume_* / fr_* keys — removed on boot */
export const LEGACY_STORAGE_KEYS = [
  "firstresume_tour_seen",
  "nextstepresume_tour_seen",
  "fr_app_sidebar_collapsed",
  "fr_playground_sidebar_collapsed",
  "fr_application_packages",
  "fr_playground_editor_preview_split",
  "fr_follow_up_notification_prefs",
  "fr_follow_up_notified_keys",
  "ats_resume_playground_data",
  "ats_resume_playground_jd",
  "ats_resume_playground_template",
  "ats_resume_playground_theme_customization",
  "ats_resume_free_layout_positions",
  "ats_resume_free_layout_by_family",
  "ats_resume_free_layout_enabled",
  "ats_resume_free_layout_snap",
  "ats_resume_free_layout_live_preview",
] as const;

export function purgeLegacyStorage(): void {
  if (typeof localStorage === "undefined") return;
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore quota / privacy mode errors
  }
}
