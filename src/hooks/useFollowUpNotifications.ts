import { useCallback, useEffect, useState } from "react";
import type { ApplicationPackage } from "../types";
import {
  dispatchPendingFollowUpNotifications,
  getPendingNotifications,
  loadFollowUpNotificationPrefs,
  requestBrowserNotificationPermission,
  saveFollowUpNotificationPrefs,
  syncNotificationPrefsWithBrowser,
  isBrowserNotificationSupported,
  type FollowUpNotificationPrefs,
  type FollowUpReminder,
} from "../lib/followUpReminderEngine";

const CHECK_INTERVAL_MS = 15 * 60 * 1000;

export function useFollowUpNotifications(packages: ApplicationPackage[]) {
  const [prefs, setPrefs] = useState<FollowUpNotificationPrefs>(() =>
    loadFollowUpNotificationPrefs()
  );
  const [pendingReminders, setPendingReminders] = useState<FollowUpReminder[]>([]);
  const [enabling, setEnabling] = useState(false);

  const refreshPending = useCallback(() => {
    setPendingReminders(getPendingNotifications(packages));
  }, [packages]);

  const runCheck = useCallback(() => {
    const loaded = loadFollowUpNotificationPrefs();
    const synced = syncNotificationPrefsWithBrowser(loaded);
    if (
      synced.enabled !== loaded.enabled ||
      synced.permissionGranted !== loaded.permissionGranted
    ) {
      saveFollowUpNotificationPrefs(synced);
    }
    setPrefs(synced);
    dispatchPendingFollowUpNotifications(packages, synced);
    refreshPending();
  }, [packages, refreshPending]);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    if (!prefs.enabled) return;

    runCheck();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        runCheck();
      }
    }, CHECK_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") runCheck();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [prefs.enabled, runCheck]);

  const enableNotifications = useCallback(async () => {
    if (!isBrowserNotificationSupported()) {
      return { ok: false, reason: "unsupported" as const };
    }
    setEnabling(true);
    try {
      const permission = await requestBrowserNotificationPermission();
      if (permission !== "granted") {
        const next = syncNotificationPrefsWithBrowser({
          enabled: false,
          permissionGranted: false,
        });
        saveFollowUpNotificationPrefs(next);
        setPrefs(next);
        return {
          ok: false,
          reason: permission === "denied" ? ("denied" as const) : ("dismissed" as const),
        };
      }
      const next = syncNotificationPrefsWithBrowser({
        enabled: true,
        permissionGranted: true,
      });
      saveFollowUpNotificationPrefs(next);
      setPrefs(next);
      dispatchPendingFollowUpNotifications(packages, next);
      refreshPending();
      return { ok: true as const };
    } finally {
      setEnabling(false);
    }
  }, [packages, refreshPending]);

  const disableNotifications = useCallback(() => {
    const next = syncNotificationPrefsWithBrowser({
      ...loadFollowUpNotificationPrefs(),
      enabled: false,
    });
    saveFollowUpNotificationPrefs(next);
    setPrefs(next);
  }, []);

  const supported = isBrowserNotificationSupported();

  return {
    prefs,
    pendingReminders,
    enabling,
    supported,
    enableNotifications,
    disableNotifications,
    runCheck,
  };
}
