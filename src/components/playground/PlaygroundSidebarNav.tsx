import { useState, type ReactNode } from "react";
import {
  Edit3,
  TrendingUp,
  Sparkles,
  Wand2,
  Eye,
  Maximize2,
  RefreshCw,
  Check,
  ChevronDown,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  AlignLeft,
  Moon,
  Sun,
  Compass,
  Briefcase,
  Rocket,
} from "lucide-react";
import { TailorIntensity } from "../../types";
import type { PlaygroundTab } from "./PlaygroundTabNav";
import { usePersistedBoolean } from "../../hooks/usePersistedBoolean";
import {
  getScoreTone,
  scoreBadgeClass,
  scoreBarClass,
  scoreTextClass,
} from "../../lib/marginaliaUi";
import { BRAND_NAME, BRAND_SHORT } from "../../lib/brand";
import { NSR_STORAGE_KEYS } from "../../lib/storageKeys";
import { useI18n } from "../../i18n";
import LanguageSwitcher from "../layout/LanguageSwitcher";
import PlanBadge from "../billing/PlanBadge";
import UsageMeter from "../billing/UsageMeter";
import { useSubscription } from "../../context/SubscriptionProvider";

interface PlaygroundSidebarNavProps {
  activeTab: PlaygroundTab;
  onTabChange: (tab: PlaygroundTab) => void;
  liveAtsScore: number;
  saveStatus: "saved" | "saving" | "idle" | "error";
  lastSavedTime: string;
  detectedKeywords: string[];
  activeKeywordsList: string[];
  loading: boolean;
  aiAvailable: boolean;
  tailorIntensity: TailorIntensity;
  tailorError: string | null;
  onReset: () => void;
  onOpenPreviewStudio: () => void;
  onTriggerAnalyze: () => void;
  onRetrySave: () => void;
  onIntensityChange: (intensity: TailorIntensity) => void;
  onNavigateOverview?: () => void;
  theme?: "light" | "dark";
  onThemeToggle?: () => void;
  onTourOpen?: () => void;
  onOpenApplicationWizard?: () => void;
}

export default function PlaygroundSidebarNav({
  activeTab,
  onTabChange,
  liveAtsScore,
  saveStatus,
  lastSavedTime,
  detectedKeywords,
  activeKeywordsList,
  loading,
  aiAvailable,
  tailorIntensity,
  tailorError,
  onReset,
  onOpenPreviewStudio,
  onTriggerAnalyze,
  onRetrySave,
  onIntensityChange,
  onNavigateOverview,
  theme,
  onThemeToggle,
  onTourOpen,
  onOpenApplicationWizard,
}: PlaygroundSidebarNavProps) {
  const { t } = useI18n();
  const { canUseTab, openUpgrade, openPricing } = useSubscription();
  const [collapsed, , toggleCollapsed] = usePersistedBoolean(NSR_STORAGE_KEYS.playgroundSidebarCollapsed, true);
  const [keywordsOpen, setKeywordsOpen] = useState(false);
  const scoreTone = getScoreTone(liveAtsScore);

  const tabs: Array<{ id: PlaygroundTab; label: string; icon: ReactNode }> = [
    { id: "content", label: t("playground.sidebar.tabs.content"), icon: <Edit3 className="w-4 h-4" /> },
    { id: "tailor", label: t("playground.sidebar.tabs.tailor"), icon: <TrendingUp className="w-4 h-4" /> },
    { id: "match", label: t("playground.sidebar.tabs.match"), icon: <Sparkles className="w-4 h-4" /> },
    { id: "tools", label: t("playground.sidebar.tabs.tools"), icon: <Wand2 className="w-4 h-4" /> },
    { id: "applications", label: t("playground.sidebar.tabs.applications"), icon: <Briefcase className="w-4 h-4" /> },
    { id: "preview", label: t("playground.sidebar.tabs.preview"), icon: <Eye className="w-4 h-4" /> },
  ];

  const expandLabel = t("playground.expandSidebar");
  const collapseLabel = t("playground.collapseSidebar");

  return (
    <aside
      className={`no-print shrink-0 flex flex-col border-r border-slate-200 bg-slate-50/80 h-full min-h-0 transition-[width] duration-200 ease-out ${
        collapsed ? "w-[48px]" : "w-[176px]"
      }`}
      id="playground-sidebar"
      data-collapsed={collapsed ? "true" : "false"}
    >
      <div className={`border-b border-slate-200/80 ${collapsed ? "px-1 py-2" : "px-2.5 py-2.5"}`}>
        <div className={`flex items-center mb-1.5 ${collapsed ? "justify-center flex-col gap-1" : "justify-between"}`}>
          {collapsed ? (
            <span className="p-1.5 rounded-lg btn-accent font-display text-sm font-bold" title={BRAND_NAME}>
              N
            </span>
          ) : (
            <p className="font-display text-lg font-bold text-[var(--m-ink,#1a2438)] leading-none">{BRAND_SHORT}</p>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white cursor-pointer transition"
            title={collapsed ? expandLabel : collapseLabel}
            aria-label={collapsed ? expandLabel : collapseLabel}
            id="playground-sidebar-toggle"
          >
            {collapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
          </button>
        </div>
        {onOpenApplicationWizard ? (
          <button
            type="button"
            onClick={onOpenApplicationWizard}
            className={`w-full mb-2 flex items-center rounded-lg font-bold transition-all cursor-pointer btn-accent shadow-sm ${
              collapsed ? "justify-center p-2" : "gap-2 px-2.5 py-2 text-left text-[11px]"
            }`}
            title={collapsed ? t("playground.oneClickApply") : undefined}
            id="one-click-application-wizard"
          >
            <Rocket className="w-4 h-4 shrink-0" />
            {!collapsed ? t("playground.oneClickApply") : null}
          </button>
        ) : null}
        {!collapsed ? (
          <div className="space-y-2 mb-2">
            <PlanBadge onClick={openPricing} />
            <UsageMeter />
          </div>
        ) : null}
        <nav className="space-y-0.5" id="input-subtabs" role="tablist" aria-label={t("playground.sidebar.ariaResumeTools")}>
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            const locked = !canUseTab(tab.id);
            return (
              <button
                key={tab.id}
                id={`subtab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                title={collapsed ? tab.label : locked ? t("billing.tabLocked", { plan: "Pro" }) : undefined}
                onClick={() => {
                  if (!canUseTab(tab.id)) {
                    openUpgrade("general");
                    return;
                  }
                  onTabChange(tab.id);
                }}
                className={`w-full flex items-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  collapsed ? "justify-center p-2" : "gap-2 px-2.5 py-2 text-left"
                } ${
                  active
                    ? "nav-tab-active"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                }`}
              >
                {tab.icon}
                {!collapsed ? tab.label : null}
              </button>
            );
          })}
        </nav>
      </div>

      {collapsed ? (
        <div className="flex-1 flex flex-col items-center gap-2 px-1.5 py-3 min-h-0">
          <div
            className={`w-full aspect-square max-w-[40px] rounded-lg flex flex-col items-center justify-center ${scoreBadgeClass[scoreTone]}`}
            id="realtime-ats-score-container"
            title={t("playground.sidebar.atsTooltip", { score: liveAtsScore })}
          >
            <span className="text-sm font-black font-mono leading-none">{liveAtsScore}</span>
          </div>
          <button
            id="btn-trigger-ai"
            type="button"
            disabled={loading}
            onClick={onTriggerAnalyze}
            title={t("playground.optimizeResume")}
            className="w-full max-w-[40px] aspect-square btn-accent disabled:bg-slate-200 text-white rounded-lg flex items-center justify-center cursor-pointer shadow-sm"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </button>
          {saveStatus === "saving" ? (
            <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
          ) : saveStatus === "error" ? (
            <button type="button" onClick={onRetrySave} className="text-[8px] text-rose-600 font-bold cursor-pointer" title={t("playground.retrySave")}>
              !
            </button>
          ) : (
            <Check className="w-3.5 h-3.5 text-[var(--m-rule,#5b8fb9)]" title={lastSavedTime || t("playground.savedAt")} />
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin" id="workspace-action-panel">
          <div className={`rounded-xl p-3 ${scoreBadgeClass[scoreTone]}`} id="realtime-ats-score-container">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase">{t("playground.atsScore")}</span>
              <div className="flex items-center gap-1">
                {saveStatus === "error" ? (
                  <button
                    type="button"
                    onClick={onRetrySave}
                    className="text-[8px] px-1 py-0.5 bg-rose-600 text-white rounded font-bold cursor-pointer"
                  >
                    {t("common.retry")}
                  </button>
                ) : saveStatus === "saving" ? (
                  <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                ) : (
                  <Check className="w-3 h-3 text-[var(--m-rule,#5b8fb9)]" title={lastSavedTime || t("playground.savedAt")} />
                )}
                <button
                  type="button"
                  onClick={onReset}
                  className="text-[8px] text-rose-600 font-bold cursor-pointer"
                >
                  {t("common.reset")}
                </button>
              </div>
            </div>
            <div className="flex items-end gap-1">
              <span className={`text-2xl font-black font-mono leading-none ${scoreTextClass[scoreTone]}`}>
                {liveAtsScore}
              </span>
              <span className="text-[10px] text-slate-500 font-bold pb-0.5">{t("playground.scoreOutOf")}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/60 overflow-hidden">
              <div
                className={`h-full rounded-full ${scoreBarClass[scoreTone]}`}
                style={{ width: `${liveAtsScore}%` }}
              />
            </div>
          </div>

          <div className="space-y-2" id="tailor-intensity-panel">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{t("playground.intensity")}</p>
            <div className="flex gap-1">
              {(["balanced", "aggressive"] as TailorIntensity[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onIntensityChange(mode)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                    tailorIntensity === mode
                      ? "btn-accent border-transparent text-white"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {mode === "balanced" ? t("playground.intensityBalanced") : t("playground.intensityAggressive")}
                </button>
              ))}
            </div>
          </div>

          <button
            id="btn-trigger-ai"
            type="button"
            disabled={loading}
            onClick={onTriggerAnalyze}
            className="w-full btn-accent disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 px-3 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {t("playground.analyzing")}
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                {t("playground.optimizeResume")}
              </>
            )}
          </button>

          {activeKeywordsList.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-2">
              <button
                type="button"
                onClick={() => setKeywordsOpen((v) => !v)}
                className="w-full flex items-center justify-between text-[10px] font-bold text-slate-500 cursor-pointer"
              >
                <span>
                  {t("playground.keywordsCount", {
                    matched: detectedKeywords.length,
                    total: activeKeywordsList.length,
                  })}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${keywordsOpen ? "rotate-180" : ""}`} />
              </button>
              {keywordsOpen ? (
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pt-2">
                  {activeKeywordsList.map((word) => {
                    const present = detectedKeywords.includes(word);
                    return (
                      <span
                        key={word}
                        className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                          present
                            ? "notebook-chip font-bold"
                            : "bg-slate-100 text-slate-400 border-slate-200"
                        }`}
                      >
                        {present ? (
                          <Check className="w-2.5 h-2.5 inline shrink-0" aria-hidden />
                        ) : (
                          <span className="opacity-40">·</span>
                        )}{" "}
                        {word}
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          {!aiAvailable ? (
            <div className="flex items-start gap-2 status-warn p-2" id="server-status-info">
              <Info className="w-3.5 h-3.5 text-[var(--m-margin,#c0392b)] shrink-0 mt-0.5" />
              <p className="text-[9px] text-[var(--m-ink,#1a2438)] font-medium leading-snug">{t("playground.simulationNotice")}</p>
            </div>
          ) : null}

          {tailorError ? (
            <p className="text-[10px] text-rose-600 font-medium p-2 rounded-xl bg-rose-50 border border-rose-100" role="alert">
              {tailorError}
            </p>
          ) : null}
        </div>
      )}

      <div className={`border-t border-slate-200/80 space-y-1 ${collapsed ? "p-1" : "p-2"}`}>
        {onNavigateOverview ? (
          <button
            type="button"
            onClick={onNavigateOverview}
            title={t("nav.overview")}
            className={`w-full flex items-center rounded-lg text-slate-600 hover:bg-white cursor-pointer ${
              collapsed ? "justify-center p-2" : "gap-2 px-2 py-1.5 text-[10px] font-bold"
            }`}
            id="nav-btn-overview"
          >
            <AlignLeft className="w-3.5 h-3.5 shrink-0" />
            {!collapsed ? t("nav.overview") : null}
          </button>
        ) : null}
        <div className={`flex gap-1 ${collapsed ? "flex-col" : ""}`}>
          <LanguageSwitcher compact={collapsed} className={collapsed ? "w-full" : "flex-1"} />
          {(onThemeToggle || onTourOpen) && (
            <>
              {onThemeToggle ? (
                <button
                  type="button"
                  onClick={onThemeToggle}
                  title={theme === "light" ? t("theme.dark") : t("theme.light")}
                  className={`flex-1 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer ${
                    collapsed ? "p-2" : "py-1.5"
                  }`}
                  id="theme-toggler"
                >
                  {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                </button>
              ) : null}
              {onTourOpen ? (
                <button
                  type="button"
                  onClick={onTourOpen}
                  title={t("theme.tour")}
                  className={`flex-1 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-[var(--m-red,#c0392b)] hover:bg-[color-mix(in_srgb,var(--m-mint)_80%,white)] cursor-pointer ${
                    collapsed ? "p-2" : "py-1.5"
                  }`}
                  id="tour-trigger"
                >
                  <Compass className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </>
          )}
        </div>
        <button
          id="workspace-btn-preview-mode"
          type="button"
          onClick={onOpenPreviewStudio}
          title={t("playground.sidebar.studioFullscreen")}
          className={`w-full rounded-xl font-bold notebook-chip hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5 ${
            collapsed ? "p-2" : "py-2 px-2.5 text-[10px]"
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          {!collapsed ? t("playground.sidebar.studio") : null}
        </button>
      </div>
    </aside>
  );
}
