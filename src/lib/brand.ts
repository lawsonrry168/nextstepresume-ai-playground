import { NSR_STORAGE_KEYS } from "./storageKeys";

/** Site-wide brand strings */
export const BRAND_NAME = "NextStepResume.ai";
export const BRAND_SHORT = "NextStepResume";

export function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(NSR_STORAGE_KEYS.tourSeen) === "true";
  } catch {
    return false;
  }
}

export function markTourSeen(): void {
  try {
    localStorage.setItem(NSR_STORAGE_KEYS.tourSeen, "true");
  } catch {
    // ignore storage errors
  }
}
