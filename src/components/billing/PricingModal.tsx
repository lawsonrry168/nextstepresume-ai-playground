import { Check, X } from "lucide-react";
import { useState } from "react";
import { useI18n } from "../../i18n";
import LegalFooterLinks from "../legal/LegalFooterLinks";
import { useSubscription } from "../../context/SubscriptionProvider";
import { useAppConfig } from "../../hooks/useAppConfig";
import { getOrCreateClientId } from "../../lib/subscription/clientId";
import { withApiAuthHeaders } from "../../lib/apiAuthHeaders";
import { getPlanCatalog, formatPlanPrice, getSprintPassPrice } from "../../lib/subscription/planCatalog";
import { PLAN_ENTITLEMENTS, buildPlanCompareRows } from "../../lib/subscription/entitlements";
import type { SubscriptionPlan } from "../../lib/subscription/types";

const COMPARE_ROWS = buildPlanCompareRows();

function cellLabel(t: (k: string) => string, value: string): string {
  if (/^\d+$/.test(value)) return value;
  return t(`billing.compare.${value}`);
}

export default function PricingModal() {
  const { t, locale } = useI18n();
  const { pricingOpen, closePricing, plan, setPlan } = useSubscription();
  const { billing, loaded: configLoaded } = useAppConfig();
  const [checkoutLoading, setCheckoutLoading] = useState<SubscriptionPlan | null>(null);
  const catalog = getPlanCatalog();
  const sprintPass = getSprintPassPrice();

  async function handleSelectPlan(itemPlan: SubscriptionPlan) {
    if (!configLoaded) {
      return;
    }

    if (itemPlan === "starter") {
      setPlan("starter");
      closePricing();
      return;
    }

    if (billing.checkoutEnabled) {
      setCheckoutLoading(itemPlan);
      try {
        const clientId = getOrCreateClientId();
        const response = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: withApiAuthHeaders({
            "Content-Type": "application/json",
            "X-NSR-Client-Id": clientId,
          }),
          body: JSON.stringify({ plan: itemPlan }),
        });
        const payload = (await response.json()) as { url?: string };
        if (response.ok && payload.url) {
          window.location.assign(payload.url);
          return;
        }
      } catch {
        /* fall through — user stays on modal */
      } finally {
        setCheckoutLoading(null);
      }
      return;
    }

    setPlan(itemPlan);
    closePricing();
  }

  if (!pricingOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-slate-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-modal-title"
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 id="pricing-modal-title" className="text-lg font-black text-slate-900">
              {t("billing.pricingTitle")}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{t("billing.pricingSubtitle")}</p>
          </div>
          <button
            type="button"
            onClick={closePricing}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
            aria-label={t("common.close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mx-6 mt-4 mb-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-xs font-black text-emerald-900">{t("billing.sprintPass")}</p>
            <p className="text-[10px] text-emerald-700">{t("billing.sprintPassHint")}</p>
          </div>
          <p className="text-sm font-black text-emerald-800">{formatPlanPrice(sprintPass, locale)}</p>
        </div>

        <div className="p-6 grid md:grid-cols-3 gap-4">
          {catalog.map((item) => {
            const isCurrent = plan === item.plan;
            const isPopular = item.popular;
            const jobsdbLimit = PLAN_ENTITLEMENTS[item.plan].limits.jobsdbSearch;
            return (
              <div
                key={item.plan}
                className={`relative rounded-2xl border p-5 flex flex-col ${
                  isPopular ? "border-emerald-400 shadow-lg ring-1 ring-emerald-100" : "border-slate-200"
                } ${isCurrent ? "bg-emerald-50/30" : "bg-white"}`}
              >
                {isPopular ? (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    {t("billing.popular")}
                  </span>
                ) : null}
                <h3 className="text-sm font-black text-slate-900">{t(item.nameKey)}</h3>
                <p className="text-[11px] text-slate-500 mt-1 min-h-[2.5rem]">{t(item.taglineKey)}</p>
                <div className="mt-4 mb-4">
                  <span className="text-2xl font-black text-slate-900">
                    {formatPlanPrice(item.monthlyAmount, locale)}
                  </span>
                  {item.monthlyAmount > 0 ? (
                    <span className="text-[10px] text-slate-400 ml-1">{t("billing.perMonth")}</span>
                  ) : null}
                </div>
                <ul className="space-y-2 text-[11px] text-slate-600 flex-1 mb-4">
                  {(["aiCredits", "geminiMessages", "applicationPackages"] as const).map((metric) => {
                    const limit = PLAN_ENTITLEMENTS[item.plan].limits[metric];
                    if (limit <= 0 && item.plan === "starter") return null;
                    const label =
                      limit >= 999_999
                        ? t("billing.usage.unlimited")
                        : String(limit);
                    return (
                      <li key={metric} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{t(`billing.highlights.${metric}`, { count: label })}</span>
                      </li>
                    );
                  })}
                  {jobsdbLimit > 0 ? (
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        {t("billing.highlights.jobsdbSearch", {
                          count:
                            jobsdbLimit >= 999_999
                              ? t("billing.usage.unlimited")
                              : String(jobsdbLimit),
                        })}
                      </span>
                    </li>
                  ) : null}
                  {(item.plan === "pro" || item.plan === "max") && (
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{t("billing.highlights.tailorMatch")}</span>
                    </li>
                  )}
                  {item.plan === "max" && (
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{t("billing.highlights.canvasStudio")}</span>
                    </li>
                  )}
                </ul>
                <button
                  type="button"
                  disabled={!configLoaded || isCurrent || checkoutLoading === item.plan}
                  onClick={() => void handleSelectPlan(item.plan)}
                  className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer transition-all ${
                    isCurrent
                      ? "bg-slate-100 text-slate-400 cursor-default"
                      : isPopular
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {checkoutLoading === item.plan
                    ? t("billing.checkoutLoading")
                    : !configLoaded
                      ? t("common.loading")
                    : isCurrent
                      ? t("billing.currentPlan")
                      : billing.checkoutEnabled && item.plan !== "starter"
                        ? t("billing.checkoutCta")
                        : t("billing.selectPlan")}
                </button>
                <p className="text-[9px] text-slate-400 text-center mt-2">
                  {billing.checkoutEnabled ? t("billing.productionNote") : t("billing.demoNote")}
                </p>
              </div>
            );
          })}
        </div>

        <div className="px-6 pb-6 overflow-x-auto">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-4 font-bold text-slate-500">{t("billing.compare.feature")}</th>
                {(["starter", "pro", "max"] as SubscriptionPlan[]).map((p) => (
                  <th key={p} className="py-2 px-2 font-bold text-slate-700 text-center">
                    {t(`billing.plans.${p}.name`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.key} className="border-b border-slate-100">
                  <td className="py-2 pr-4 text-slate-600">{t(`billing.compare.rows.${row.key}`)}</td>
                  <td className="py-2 px-2 text-center">{cellLabel(t, row.starter)}</td>
                  <td className="py-2 px-2 text-center">{cellLabel(t, row.pro)}</td>
                  <td className="py-2 px-2 text-center">{cellLabel(t, row.max)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-5 border-t border-slate-100 pt-4">
          <LegalFooterLinks />
        </div>
      </div>
    </div>
  );
}
