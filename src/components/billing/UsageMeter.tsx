import { useI18n } from "../../i18n";
import { useSubscription } from "../../context/SubscriptionProvider";

export default function UsageMeter({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const { plan, getUsed, getLimit, getRemainingUsage, openPricing } = useSubscription();
  const used = getUsed("aiCredits");
  const limit = getLimit("aiCredits");
  const remaining = getRemainingUsage("aiCredits");
  const unlimited = limit >= 999_999;
  const pct = unlimited ? 100 : limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <button
      type="button"
      onClick={openPricing}
      className={`w-full text-left rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:border-emerald-200 transition-colors ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-black uppercase text-slate-500">{t("billing.usage.aiCredits")}</span>
        <span className="text-[10px] font-bold text-emerald-700">
          {unlimited
            ? t("billing.usage.unlimited")
            : t("billing.usage.remaining", { count: remaining, total: limit })}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[9px] text-slate-400 mt-1.5">{t(`billing.plans.${plan}.name`)} · {t("billing.usage.resetMonthly")}</p>
    </button>
  );
}
