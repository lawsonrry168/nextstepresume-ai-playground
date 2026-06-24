export function getSupabaseUrl(): string | null {
  const value = process.env.SUPABASE_URL?.trim();
  return value || null;
}

export function getSupabaseAnonKey(): string | null {
  const value = process.env.SUPABASE_ANON_KEY?.trim();
  return value || null;
}

export function getSupabaseServiceRoleKey(): string | null {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return value || null;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey() && getSupabaseServiceRoleKey());
}

export function isAuthRequired(): boolean {
  if (process.env.NSR_AUTH_REQUIRED === "1") return true;
  if (process.env.NSR_AUTH_REQUIRED === "0") return false;
  return false;
}

export function shouldRequireAuthInProduction(): boolean {
  return isAuthRequired() && isSupabaseConfigured();
}
