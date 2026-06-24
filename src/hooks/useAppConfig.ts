import { useEffect, useState } from "react";
import type { AppMode } from "../lib/appMode";

export interface PublicAppConfig {
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
      .then((response) => (response.ok ? response.json() : DEFAULT_CONFIG))
      .then((data: PublicAppConfig) => {
        if (!cancelled) setConfig(data);
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
