/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, AlignLeft } from "lucide-react";
import TechStackTopology from "./components/TechStackTopology";
import ReverseAnalysisDashboard from "./components/ReverseAnalysisDashboard";
import ResumeSimulatorPlayground from "./components/ResumeSimulatorPlayground";
import TutorialTour from "./components/TutorialTour";
import AppSidebar, { type MainViewMode } from "./components/layout/AppSidebar";
import { useI18n } from "./i18n";
import { hasSeenTour } from "./lib/brand";

export default function App() {
  const { t } = useI18n();
  const [activeView, setActiveView] = useState<MainViewMode>("simulator");
  const [geminiStatus, setGeminiStatus] = useState<{ enabled: boolean; loading: boolean }>({ enabled: false, loading: true });
  const [serverConnectionError, setServerConnectionError] = useState<boolean>(false);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") return saved;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    } catch {
      // Safe fallback
    }
    return "light";
  });

  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      localStorage.setItem("theme", theme);
    } catch (err) {
      console.error("Theme storage sync error:", err);
    }
  }, [theme]);

  useEffect(() => {
    const tourSeen = hasSeenTour();
    if (!tourSeen) {
      setIsTourOpen(true);
    }
  }, []);

  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        setGeminiStatus({
          enabled: !!data.ai_enabled,
          loading: false,
        });
        setServerConnectionError(false);
      } catch (err) {
        console.error("Health check error:", err);
        setGeminiStatus({ enabled: false, loading: false });
        setServerConnectionError(true);
      }
    };
    checkServerHealth();
  }, []);

  return (
    <div
      className="marginalia-theme min-h-[100dvh] flex font-sans transition-colors duration-300"
      id="app_root"
    >
      {activeView === "overview" ? (
        <AppSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          theme={theme}
          onThemeToggle={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
          onTourOpen={() => setIsTourOpen(true)}
          geminiStatus={geminiStatus}
          serverConnectionError={serverConnectionError}
        />
      ) : null}

      <div
        id="app-main-shell"
        className={`flex-1 flex flex-col min-w-0 min-h-[100dvh] w-full ${
          activeView === "overview" ? "notebook-bg" : ""
        }`}
      >
        <main className="flex-1 min-h-0 flex flex-col w-full" id="app_main">
          {activeView === "overview" && (
            <div
              className="flex-1 overflow-y-auto w-full px-5 py-8 lg:px-10 notebook-margin no-print"
              id="screen-overview"
            >
              <div className="max-w-6xl space-y-12">
              <TechStackTopology />

              <div>
                <div className="mb-6 max-w-2xl">
                  <h3 className="text-xl font-serif-heading font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <AlignLeft className="text-emerald-600 w-5 h-5" /> {t("overview.architectureCompare.title")}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    {t("overview.architectureCompare.desc")}
                  </p>
                </div>
                <ReverseAnalysisDashboard />
              </div>

              <div className="panel-surface p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" /> {t("overview.testEndpoints.title")}
                  </h4>
                  <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
                    {t("overview.testEndpoints.desc")}
                  </p>
                </div>
                <button
                  id="btn-promo-play"
                  type="button"
                  onClick={() => setActiveView("simulator")}
                  className="btn-accent px-5 py-2.5 rounded-xl text-xs shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  {t("overview.testEndpoints.button")} <TrendingUp className="w-4 h-4" />
                </button>
              </div>
              </div>
            </div>
          )}

          {activeView === "simulator" && (
            <div id="screen-simulator" className="flex-1 min-h-0 flex flex-col">
              <ResumeSimulatorPlayground
                onNotifyServerStatus={(reachable) => {
                  setServerConnectionError(!reachable);
                }}
                aiAvailable={geminiStatus.enabled}
                onNavigateOverview={() => setActiveView("overview")}
                theme={theme}
                onThemeToggle={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
                onTourOpen={() => setIsTourOpen(true)}
              />
            </div>
          )}
        </main>

        {activeView === "overview" ? (
          <footer
            className="border-t border-slate-200 py-4 text-slate-400 text-xs no-print text-center shrink-0 w-full"
            id="app_footer"
          >
            <p className="font-medium">{t("overview.footer.copyright")}</p>
            <p className="mt-1 text-[10px] text-slate-500">{t("brand.slogan")}</p>
          </footer>
        ) : null}
      </div>

      <TutorialTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        activeView={activeView}
        setActiveView={setActiveView}
      />
    </div>
  );
}
