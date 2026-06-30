import { useEffect, useState } from "react";
import type { AppMode } from "../lib/appMode";

export interface PublicAppConfig {
  loaded: boolean;
  appMode: AppMode;
  billing: {
    provider: "demo" | "stripe";
    checkoutEnabled: boolean;
  };
  auth: {
    enabled: boolean;
    required: boolean;
    supabaseUrl: string | null;
    supabaseAnonKey: string | null;
  };
  sync: {
    enabled: boolean;
  };
}

const DEFAULT_CONFIG: PublicAppConfig = {
  loaded: false,
  appMode: "playground",
  billing: { provider: "demo", checkoutEnabled: false },
  auth: {
    enabled: false,
    required: false,
    supabaseUrl: null,
    supabaseAnonKey: null,
  },
  sync: {
    enabled: false,
  },
};

export function useAppConfig(): PublicAppConfig {
  const [config, setConfig] = useState<PublicAppConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/config")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`config_fetch_failed:${response.status}`);
        }
        return response.json() as Promise<Omit<PublicAppConfig, "loaded">>;
      })
      .then((data) => {
        if (!cancelled) setConfig({ ...data, loaded: true });
      })
      .catch(() => {
        if (!cancelled) setConfig(DEFAULT_CONFIG);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
