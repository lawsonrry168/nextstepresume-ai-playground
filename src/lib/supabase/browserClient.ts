import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let configuredUrl: string | null = null;
let configuredAnonKey: string | null = null;

export function initSupabaseBrowserClient(url: string, anonKey: string): SupabaseClient {
  if (browserClient && configuredUrl === url && configuredAnonKey === anonKey) {
    return browserClient;
  }
  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  configuredUrl = url;
  configuredAnonKey = anonKey;
  return browserClient;
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  return browserClient;
}

export function resetSupabaseBrowserClientForTests(): void {
  browserClient = null;
  configuredUrl = null;
  configuredAnonKey = null;
}
