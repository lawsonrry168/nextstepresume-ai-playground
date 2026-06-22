import React from "react";
import { Edit3, TrendingUp, Sparkles, Wand2, Eye, Briefcase, Lock } from "lucide-react";
import { useI18n } from "../../i18n";
import { useSubscription } from "../../context/SubscriptionProvider";
import { minimumPlanForFeature } from "../../lib/subscription/entitlements";
import type { FeatureId } from "../../lib/subscription/types";

export type PlaygroundTab = "content" | "tailor" | "preview" | "match" | "tools" | "applications";

const TAB_FEATURE: Partial<Record<PlaygroundTab, FeatureId>> = {
  tailor: "ai.tailor",
  match: "ai.match",
  tools: "tools.voice",
  applications: "tracker",
};

interface PlaygroundTabNavProps {
  activeTab: PlaygroundTab;
  onTabChange: (tab: PlaygroundTab) => void;
}

export default function PlaygroundTabNav({ activeTab, onTabChange }: PlaygroundTabNavProps) {
  const { t } = useI18n();
  const { canUseTab, canUseFeature, openUpgrade } = useSubscription();

  const tabs: Array<{ id: PlaygroundTab; label: string; short: string; icon: React.ReactNode }> = [
    { id: "content", label: t("tabs.content"), short: t("tabs.short.content"), icon: <Edit3 className="w-3 h-3" /> },
    { id: "preview", label: t("tabs.preview"), short: t("tabs.short.preview"), icon: <Eye className="w-3 h-3" /> },
    { id: "tailor", label: t("tabs.tailor"), short: t("tabs.short.tailor"), icon: <TrendingUp className="w-3 h-3" /> },
    { id: "match", label: t("tabs.match"), short: t("tabs.short.match"), icon: <Sparkles className="w-3 h-3" /> },
    { id: "tools", label: t("tabs.tools"), short: t("tabs.short.tools"), icon: <Wand2 className="w-3 h-3" /> },
    { id: "applications", label: t("tabs.applications"), short: t("tabs.short.applications"), icon: <Briefcase className="w-3 h-3" /> },
  ];

  const handleTabClick = (tab: PlaygroundTab) => {
    if (!canUseTab(tab)) {
      const feature = TAB_FEATURE[tab];
      openUpgrade(feature ?? "general");
      return;
    }
    if (tab === "tools" && !canUseFeature("tools.voice")) {
      openUpgrade("tools.voice");
      return;
    }
    onTabChange(tab);
  };

  return (
    <div
      className="bg-white border border-slate-200 rounded-xl px-1 py-1 flex gap-0.5 overflow-x-auto scrollbar-thin shrink-0"
      id="input-subtabs"
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const locked = !canUseTab(tab.id);
        const requiredPlan = TAB_FEATURE[tab.id] ? minimumPlanForFeature(TAB_FEATURE[tab.id]!) : "pro";
        return (
          <button
            key={tab.id}
            id={`subtab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            title={locked ? t("billing.tabLocked", { plan: t(`billing.plans.${requiredPlan}.name`) }) : undefined}
            onClick={() => handleTabClick(tab.id)}
            className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              isActive
                ? "bg-emerald-600 text-white shadow-sm"
                : locked
                  ? "text-slate-400 hover:bg-amber-50 hover:text-amber-700"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            {locked ? <Lock className="w-3 h-3 opacity-70" /> : tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.short}</span>
          </button>
        );
      })}
    </div>
  );
}
