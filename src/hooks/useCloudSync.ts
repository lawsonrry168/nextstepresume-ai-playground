import { useEffect } from "react";
import { useAuth } from "../context/AuthProvider";
import { useAppConfig } from "./useAppConfig";
import {
  pullCloudSnapshots,
  setCloudSyncEnabled,
} from "../lib/sync/cloudSyncCoordinator";

export function useCloudSync(): void {
  const { sync } = useAppConfig();
  const { session, enabled: authEnabled } = useAuth();
  const active = sync.enabled && authEnabled && Boolean(session?.access_token);

  useEffect(() => {
    setCloudSyncEnabled(active);
    if (!active) return;
    void pullCloudSnapshots();
  }, [active, session?.access_token]);
}
