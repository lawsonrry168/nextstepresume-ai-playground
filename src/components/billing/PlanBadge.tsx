import { Crown, Sparkles, Zap } from "lucide-react";
import { useI18n } from "../../i18n";
import { useSubscription } from "../../context/SubscriptionProvider";
import type { SubscriptionPlan } from "../../lib/subscription/types";

const PLAN_ICON: Record<SubscriptionPlan, typeof Sparkles> = {
  starter: Sparkles,
  pro: Zap,
  max: Crown,
};

const PLAN_CLASS: Record<SubscriptionPlan, string> = {
  starter: "bg-slate-100 text-slate-600 border-slate-200",
  pro: "bg-emerald-50 text-emerald-700 border-emerald-200",
  max: "bg-amber-50 text-amber-800 border-amber-200",
};

export default function PlanBadge({ onClick, compact = false }: { onClick?: () => void; compact?: boolean }) {
  const { t } = useI18n();
  const { plan } = useSubscription();
  const Icon = PLAN_ICON[plan];
  const label = t(`billing.plans.${plan}.name`);

  const className = `inline-flex items-center gap-1 rounded-lg border font-bold uppercase tracking-wide ${
    compact ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-1"
  } ${PLAN_CLASS[plan]} ${onClick ? "cursor-pointer hover:opacity-90" : ""}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} title={t("billing.viewPlans")}>
        <Icon className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
        {label}
      </button>
    );
  }

  return (
    <span className={className}>
      <Icon className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {label}
    </span>
  );
}
