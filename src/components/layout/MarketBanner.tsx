import { useI18n } from "../../i18n";

export default function MarketBanner() {
  const { t } = useI18n();
  const label = t("market.banner");
  if (!label || label === "market.banner") return null;

  return (
    <div
      className="shrink-0 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1.5 text-center text-[10px] font-bold tracking-wide text-emerald-800"
      id="market_banner_hk"
    >
      {label}
    </div>
  );
}
