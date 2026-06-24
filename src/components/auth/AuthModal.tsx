import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import { useI18n } from "../../i18n";

export default function AuthModal() {
  const { t } = useI18n();
  const { enabled, authOpen, closeAuth, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!enabled || !authOpen) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const message =
      mode === "signIn" ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setSubmitting(false);
    if (message) {
      setError(message);
      return;
    }
    closeAuth();
    setPassword("");
  }

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 id="auth-modal-title" className="text-lg font-black text-slate-900">
              {mode === "signIn" ? t("auth.signInTitle") : t("auth.signUpTitle")}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{t("auth.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={closeAuth}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
            aria-label={t("common.close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="p-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-600">{t("auth.email")}</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-600">{t("auth.password")}</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>

          {error ? <p className="text-xs text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-wide hover:bg-emerald-700 cursor-pointer disabled:opacity-60"
          >
            {submitting
              ? t("auth.submitting")
              : mode === "signIn"
                ? t("auth.signIn")
                : t("auth.signUp")}
          </button>

          <p className="text-[11px] text-center text-slate-500">
            {mode === "signIn" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
            <button
              type="button"
              className="text-emerald-700 font-bold cursor-pointer"
              onClick={() => {
                setMode(mode === "signIn" ? "signUp" : "signIn");
                setError(null);
              }}
            >
              {mode === "signIn" ? t("auth.signUp") : t("auth.signIn")}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
