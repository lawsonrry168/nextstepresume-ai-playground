import type { ApplicationPackage } from "../types";
import { t } from "../i18n/translate";
import { NSR_STORAGE_KEYS } from "./storageKeys";

export type FollowUpReminderKind = "follow_up_due" | "follow_up_overdue" | "interview_today" | "interview_tomorrow";

export interface FollowUpReminder {
  packageId: string;
  companyName: string;
  jobTitle: string;
  kind: FollowUpReminderKind;
  targetDate: string;
  title: string;
  body: string;
  notifyKey: string;
}

export interface FollowUpNotificationPrefs {
  enabled: boolean;
  permissionGranted: boolean;
}

const PREFS_KEY = NSR_STORAGE_KEYS.followUpPrefs;
const NOTIFIED_KEY = NSR_STORAGE_KEYS.followUpNotified;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isStorageAvailable(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

export function loadFollowUpNotificationPrefs(): FollowUpNotificationPrefs {
  if (!isStorageAvailable()) {
    return { enabled: false, permissionGranted: false };
  }
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { enabled: false, permissionGranted: false };
    const parsed = JSON.parse(raw) as FollowUpNotificationPrefs;
    return syncNotificationPrefsWithBrowser({
      enabled: Boolean(parsed.enabled),
      permissionGranted: Boolean(parsed.permissionGranted),
    });
  } catch {
    return { enabled: false, permissionGranted: false };
  }
}

export function saveFollowUpNotificationPrefs(prefs: FollowUpNotificationPrefs): void {
  if (!isStorageAvailable()) return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/** Align stored prefs with live Notification.permission (revoked/denied in browser settings). */
export function syncNotificationPrefsWithBrowser(
  prefs: FollowUpNotificationPrefs
): FollowUpNotificationPrefs {
  if (!isBrowserNotificationSupported()) {
    return { enabled: false, permissionGranted: false };
  }
  const permission = Notification.permission;
  if (permission === "granted") {
    return { enabled: prefs.enabled, permissionGranted: true };
  }
  if (permission === "denied") {
    return { enabled: false, permissionGranted: false };
  }
  return { enabled: prefs.enabled, permissionGranted: false };
}

export function loadNotifiedKeys(): Set<string> {
  if (!isStorageAvailable()) return new Set();
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    return new Set();
  }
}

export function saveNotifiedKeys(keys: Set<string>): void {
  if (!isStorageAvailable()) return;
  const trimmed = [...keys].slice(-200);
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(trimmed));
}

export function markReminderNotified(notifyKey: string): void {
  const keys = loadNotifiedKeys();
  keys.add(notifyKey);
  saveNotifiedKeys(keys);
}

export function isReminderAlreadyNotified(notifyKey: string): boolean {
  return loadNotifiedKeys().has(notifyKey);
}

/** Drop stale notify keys when user changes follow-up / interview dates. */
export function clearNotificationKeysForPackage(packageId: string): void {
  const keys = loadNotifiedKeys();
  const prefix = `${packageId}:`;
  let changed = false;
  for (const key of keys) {
    if (key.startsWith(prefix)) {
      keys.delete(key);
      changed = true;
    }
  }
  if (changed) saveNotifiedKeys(keys);
}

const ACTIVE_STATUSES = new Set(["draft", "ready", "applied", "interviewing"]);

export function collectFollowUpReminders(
  packages: ApplicationPackage[],
  now: Date = new Date()
): FollowUpReminder[] {
  const today = startOfDay(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const reminders: FollowUpReminder[] = [];

  for (const pkg of packages) {
    if (!ACTIVE_STATUSES.has(pkg.status)) continue;

    if (pkg.followUpDate) {
      const followDay = startOfDay(new Date(pkg.followUpDate));
      const dk = dayKey(pkg.followUpDate);

      if (followDay.getTime() <= today.getTime()) {
        const overdue = followDay.getTime() < today.getTime();
        const kind: FollowUpReminderKind = overdue ? "follow_up_overdue" : "follow_up_due";
        reminders.push({
          packageId: pkg.id,
          companyName: pkg.companyName,
          jobTitle: pkg.jobTitle,
          kind,
          targetDate: pkg.followUpDate,
          title: overdue
            ? t("followUpNotifications.followUpOverdueTitle", { company: pkg.companyName })
            : t("followUpNotifications.followUpDueTitle", { company: pkg.companyName }),
          body: overdue
            ? t("followUpNotifications.followUpOverdueBody", { jobTitle: pkg.jobTitle })
            : t("followUpNotifications.followUpDueBody", { jobTitle: pkg.jobTitle }),
          notifyKey: `${pkg.id}:${kind}:${dk}`,
        });
      }
    }

    if (pkg.interviewDate) {
      const interviewDay = startOfDay(new Date(pkg.interviewDate));
      const dk = dayKey(pkg.interviewDate);

      if (interviewDay.getTime() === today.getTime()) {
        reminders.push({
          packageId: pkg.id,
          companyName: pkg.companyName,
          jobTitle: pkg.jobTitle,
          kind: "interview_today",
          targetDate: pkg.interviewDate,
          title: t("followUpNotifications.interviewTodayTitle", { company: pkg.companyName }),
          body: t("followUpNotifications.interviewTodayBody", { jobTitle: pkg.jobTitle }),
          notifyKey: `${pkg.id}:interview_today:${dk}`,
        });
      } else if (interviewDay.getTime() === tomorrow.getTime()) {
        reminders.push({
          packageId: pkg.id,
          companyName: pkg.companyName,
          jobTitle: pkg.jobTitle,
          kind: "interview_tomorrow",
          targetDate: pkg.interviewDate,
          title: t("followUpNotifications.interviewTomorrowTitle", { company: pkg.companyName }),
          body: t("followUpNotifications.interviewTomorrowBody", { jobTitle: pkg.jobTitle }),
          notifyKey: `${pkg.id}:interview_tomorrow:${dk}`,
        });
      }
    }
  }

  return reminders.sort((a, b) => a.kind.localeCompare(b.kind));
}

export function getPendingNotifications(
  packages: ApplicationPackage[],
  now: Date = new Date()
): FollowUpReminder[] {
  return collectFollowUpReminders(packages, now).filter(
    (r) => !isReminderAlreadyNotified(r.notifyKey)
  );
}

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isBrowserNotificationSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function showBrowserNotification(reminder: FollowUpReminder): void {
  if (!isBrowserNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  try {
    const notification = new Notification(reminder.title, {
      body: reminder.body,
      tag: reminder.notifyKey,
      requireInteraction: reminder.kind === "follow_up_overdue",
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    markReminderNotified(reminder.notifyKey);
  } catch (err) {
    console.warn("Failed to show notification", err);
  }
}

export function dispatchPendingFollowUpNotifications(
  packages: ApplicationPackage[],
  prefs: FollowUpNotificationPrefs,
  now: Date = new Date()
): FollowUpReminder[] {
  const synced = syncNotificationPrefsWithBrowser(prefs);
  if (synced.enabled !== prefs.enabled || synced.permissionGranted !== prefs.permissionGranted) {
    saveFollowUpNotificationPrefs(synced);
  }

  if (!synced.enabled || !synced.permissionGranted) return [];
  if (!isBrowserNotificationSupported()) return [];
  if (Notification.permission !== "granted") return [];

  const pending = getPendingNotifications(packages, now);
  for (const reminder of pending) {
    showBrowserNotification(reminder);
  }
  return pending;
}
