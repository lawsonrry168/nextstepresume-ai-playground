import { LogIn, LogOut, UserRound } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import { useI18n } from "../../i18n";

interface AuthButtonProps {
  collapsed?: boolean;
}

export default function AuthButton({ collapsed = false }: AuthButtonProps) {
  const { t } = useI18n();
  const { enabled, loading, user, openAuth, signOut } = useAuth();

  if (!enabled) return null;

  if (loading) {
    return (
      <div
        className={`text-[10px] text-slate-400 ${collapsed ? "text-center px-1" : "px-1"}`}
        aria-live="polite"
      >
        {collapsed ? "…" : t("auth.loading")}
      </div>
    );
  }

  if (user) {
    const label = user.email ?? t("auth.signedIn");
    return (
      <div className={`space-y-1 ${collapsed ? "flex flex-col items-center" : ""}`}>
        {!collapsed ? (
          <p className="text-[10px] text-slate-500 truncate px-1" title={label}>
            <UserRound className="w-3 h-3 inline mr-1" />
            {label}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void signOut()}
          className={`p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer transition flex items-center justify-center gap-1 ${
            collapsed ? "w-full" : "w-full"
          }`}
          title={t("auth.signOut")}
          id="auth-sign-out"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed ? <span className="text-[10px] font-bold">{t("auth.signOut")}</span> : null}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={openAuth}
      className={`p-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer transition flex items-center justify-center gap-1 ${
        collapsed ? "w-full" : "w-full"
      }`}
      title={t("auth.signIn")}
      id="auth-sign-in"
    >
      <LogIn className="w-4 h-4" />
      {!collapsed ? <span className="text-[10px] font-bold">{t("auth.signIn")}</span> : null}
    </button>
  );
}
