import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { setAccessTokenGetter } from "../lib/apiAuthHeaders";
import { getOrCreateClientId } from "../lib/subscription/clientId";
import { syncSubscriptionFromResponse } from "../lib/subscription/usageLedger";
import { initSupabaseBrowserClient, getSupabaseBrowserClient } from "../lib/supabase/browserClient";
import { useAppConfig } from "../hooks/useAppConfig";

interface AuthContextValue {
  enabled: boolean;
  required: boolean;
  loading: boolean;
  user: User | null;
  session: Session | null;
  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function linkAnonymousClient(accessToken: string): Promise<void> {
  const anonymousClientId = getOrCreateClientId();
  try {
    const response = await fetch("/api/auth/link-client", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ anonymousClientId }),
    });
    if (response.ok) {
      syncSubscriptionFromResponse(response);
    }
  } catch {
    /* best effort */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth } = useAppConfig();
  const [loading, setLoading] = useState(auth.enabled);
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!auth.enabled || !auth.supabaseUrl || !auth.supabaseAnonKey) {
      setLoading(false);
      setSession(null);
      setAccessTokenGetter(null);
      return;
    }

    const client = initSupabaseBrowserClient(auth.supabaseUrl, auth.supabaseAnonKey);
    let cancelled = false;

    void client.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = client.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.access_token) {
        await linkAnonymousClient(nextSession.access_token);
      }
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [auth.enabled, auth.supabaseUrl, auth.supabaseAnonKey]);

  useEffect(() => {
    setAccessTokenGetter(() => session?.access_token ?? null);
  }, [session]);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = getSupabaseBrowserClient();
    if (!client) return "Auth is not configured.";
    const { error } = await client.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const client = getSupabaseBrowserClient();
    if (!client) return "Auth is not configured.";
    const { error } = await client.auth.signUp({ email, password });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    await client.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      enabled: auth.enabled,
      required: auth.required,
      loading,
      user: session?.user ?? null,
      session,
      authOpen,
      openAuth: () => setAuthOpen(true),
      closeAuth: () => setAuthOpen(false),
      signIn,
      signUp,
      signOut,
    }),
    [auth.enabled, auth.required, loading, session, authOpen, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
