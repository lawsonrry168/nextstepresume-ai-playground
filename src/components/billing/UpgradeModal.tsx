import { ArrowRight, Lock, X } from "lucide-react";
import { useI18n } from "../../i18n";
import { useSubscription } from "../../context/SubscriptionProvider";
import { minimumPlanForFeature } from "../../lib/subscription/entitlements";
import type { FeatureId } from "../../lib/subscription/types";

function resolveUpgradePlan(reason: string, minimumPlanFor: (f: FeatureId) => ReturnType<typeof minimumPlanForFeature>) {
  if (reason === "general") return "pro" as const;
  if (reason.startsWith("ai.") || reason.startsWith("export.") || reason.startsWith("import.")) {
    try {
      return minimumPlanFor(reason as FeatureId);
    } catch {
      return "pro" as const;
    }
  }
  if (reason === "geminiThinking") return "max" as const;
  return "pro" as const;
}

export default function UpgradeModal() {
  const { t } = useI18n();
  const { upgradeOpen, upgradeReason, closeUpgrade, openPricing, plan, minimumPlanFor } = useSubscription();

  if (!upgradeOpen) return null;

  const targetPlan = resolveUpgradePlan(String(upgradeReason), minimumPlanFor);
  const reasonKey = `billing.upgrade.reasons.${upgradeReason}`;
  const reasonText = t(reasonKey);
  const description =
    reasonText === reasonKey ? t("billing.upgrade.reasons.general") : reasonText;

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 px-5 py-4 text-white flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-white/10 rounded-xl">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-black">{t("billing.upgrade.title")}</h3>
              <p className="text-[11px] text-emerald-100 mt-0.5">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeUpgrade}
            className="text-white/80 hover:text-white p-1 cursor-pointer"
            aria-label={t("common.close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {t("billing.upgrade.body", {
              current: t(`billing.plans.${plan}.name`),
              target: t(`billing.plans.${targetPlan}.name`),
            })}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => {
                closeUpgrade();
                openPricing();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase py-2.5 rounded-xl cursor-pointer"
            >
              {t("billing.upgrade.viewPlans")}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={closeUpgrade}
              className="flex-1 text-xs font-bold text-slate-500 hover:text-slate-800 py-2.5 rounded-xl border border-slate-200 cursor-pointer"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
