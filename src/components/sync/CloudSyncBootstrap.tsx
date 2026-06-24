import { useCloudSync } from "../../hooks/useCloudSync";

/** Activates PostgreSQL cloud sync when Supabase auth session is present. */
export default function CloudSyncBootstrap() {
  useCloudSync();
  return null;
}
