import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "../auth/supabaseConfig.ts";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!adminClient) {
    adminClient = createClient(getSupabaseUrl()!, getSupabaseServiceRoleKey()!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminClient;
}

export function resetSupabaseAdminForTests(): void {
  adminClient = null;
}

export async function verifySupabaseAccessToken(token: string): Promise<User | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export function clientIdFromUserId(userId: string): string {
  return userId;
}
