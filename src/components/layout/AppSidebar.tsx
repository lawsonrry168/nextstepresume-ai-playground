import type { ReactNode } from "react";
import {
  Terminal,
  Sparkles,
  AlignLeft,
  Sun,
  Moon,
  Compass,
  CheckCircle,
  ShieldAlert,
  Server,
  Cpu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { usePersistedBoolean } from "../../hooks/usePersistedBoolean";
import { useI18n } from "../../i18n";
import { BRAND_NAME } from "../../lib/brand";
import { NSR_STORAGE_KEYS } from "../../lib/storageKeys";
import LanguageSwitcher from "./LanguageSwitcher";
import AuthButton from "../auth/AuthButton";

export type MainViewMode = "overview" | "simulator";

interface AppSidebarProps {
  activeView: MainViewMode;
  onViewChange: (view: MainViewMode) => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onTourOpen: () => void;
  geminiStatus: { enabled: boolean; loading: boolean };
  serverConnectionError: boolean;
}

export default function AppSidebar({
  activeView,
  onViewChange,
  theme,
  onThemeToggle,
  onTourOpen,
  geminiStatus,
  serverConnectionError,
}: AppSidebarProps) {
  const { t } = useI18n();
  const [collapsed, , toggleCollapsed] = usePersistedBoolean(NSR_STORAGE_KEYS.appSidebarCollapsed, true);

  const navItems: Array<{
    id: MainViewMode;
    label: string;
    icon: ReactNode;
  }> = [
    {
      id: "overview",
      label: t("nav.overview"),
      icon: <AlignLeft className="w-4 h-4 shrink-0" />,
    },
    {
      id: "simulator",
      label: t("nav.simulator"),
      icon: <Sparkles className="w-4 h-4 shrink-0" />,
    },
  ];

  const statusDotClass = geminiStatus.loading
    ? "bg-slate-300"
    : serverConnectionError
      ? "bg-[var(--m-red,#c0392b)]"
      : geminiStatus.enabled
        ? "bg-[var(--m-rule,#5b8fb9)]"
        : "bg-[var(--m-marker,#f5d76e)]";

  const statusTitle = geminiStatus.loading
    ? t("status.connecting")
    : serverConnectionError
      ? t("status.apiOffline")
      : geminiStatus.enabled
        ? t("status.geminiConnected")
        : t("status.simulationMode");

  return (
    <aside
      className={`no-print shrink-0 flex flex-col border-r border-slate-200 bg-white min-h-[100dvh] sticky top-0 z-40 transition-[width] duration-200 ease-out ${
        collapsed ? "w-[56px]" : "w-[200px]"
      }`}
      id="app-sidebar"
      data-collapsed={collapsed ? "true" : "false"}
    >
      <div
        className={`border-b border-slate-100 flex items-center ${
          collapsed ? "flex-col gap-2 px-2 py-3" : "justify-between gap-2 px-4 py-4"
        }`}
      >
        <div className={`flex items-center min-w-0 ${collapsed ? "justify-center" : "gap-2.5"}`}>
          <div className="rounded-lg btn-accent p-2 shadow-sm shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <h1 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">
                {BRAND_NAME}
              </h1>
              <p className="text-[9px] text-slate-400 font-medium truncate">{t("brand.slogan")}</p>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 cursor-pointer transition shrink-0"
          title={collapsed ? t("nav.expandNav") : t("nav.collapseNav")}
          aria-label={collapsed ? t("nav.expandNav") : t("nav.collapseNav")}
          id="app-sidebar-toggle"
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      <nav
        className={`flex-1 py-3 space-y-0.5 overflow-y-auto ${collapsed ? "px-1.5" : "px-2"}`}
        id="app-sidebar-nav"
        aria-label={t("nav.mainNav")}
      >
        {!collapsed ? (
          <p className="px-2.5 pb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">{t("nav.workspace")}</p>
        ) : null}
        {navItems.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              id={item.id === "overview" ? "nav-btn-overview" : "nav-btn-simulator"}
              type="button"
              title={collapsed ? item.label : undefined}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                collapsed ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2 text-left"
              } ${
                active
                  ? "btn-accent shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.icon}
              {!collapsed ? <span>{item.label}</span> : null}
            </button>
          );
        })}
      </nav>

      <div
        className={`border-t border-slate-100 space-y-2 ${
          collapsed ? "px-1.5 py-2" : "px-3 py-3"
        }`}
        id="navigation-side-status"
      >
        {collapsed ? (
          <div className="flex justify-center" title={statusTitle}>
            <span className={`w-2.5 h-2.5 rounded-full ${statusDotClass}`} />
          </div>
        ) : (
          <div className="px-1">
            {geminiStatus.loading ? (
              <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 animate-spin text-[var(--m-rule,#5b8fb9)]" /> {t("status.connecting")}
              </span>
            ) : serverConnectionError ? (
              <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-1 rounded-lg border border-rose-200 flex items-center gap-1 font-medium">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> {t("status.apiOffline")}
              </span>
            ) : geminiStatus.enabled ? (
              <span className="sticker-pill sticker-mint text-[10px] px-2 py-1 flex items-center gap-1 font-medium">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" /> {t("status.geminiConnected")}
              </span>
            ) : (
              <span className="sticker-pill sticker-marker text-[10px] px-2 py-1 flex items-center gap-1 font-medium">
                <Server className="w-3.5 h-3.5 shrink-0" /> {t("status.simulationMode")}
              </span>
            )}
          </div>
        )}

        <AuthButton collapsed={collapsed} />

        <div className={`flex items-center gap-1 ${collapsed ? "flex-col" : ""}`}>
          <button
            type="button"
            onClick={onThemeToggle}
            className={`p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer transition flex items-center justify-center ${
              collapsed ? "w-full" : "flex-1"
            }`}
            title={theme === "light" ? t("theme.dark") : t("theme.light")}
            id="theme-toggler"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onTourOpen}
            className={`p-2 rounded-lg notebook-chip hover:opacity-90 cursor-pointer transition flex items-center justify-center ${
              collapsed ? "w-full" : "flex-1"
            }`}
            title={t("theme.tour")}
            id="tour-trigger"
          >
            <Compass className="w-4 h-4" />
          </button>
          <LanguageSwitcher compact={collapsed} className={collapsed ? "w-full" : "flex-1"} />
        </div>
      </div>
    </aside>
  );
}
