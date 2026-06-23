import { useState, useEffect } from "react";
import { markTourSeen } from "../lib/brand";
import { useI18n } from "../i18n";
import { Compass, ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";

type TourStepId = "welcome" | "sidebar" | "apiStatus" | "resumeMatch" | "diagnostics" | "atsKeywords";

interface TourStepConfig {
  id: TourStepId;
  targetId: string;
  view: "overview" | "simulator";
}

const TOUR_STEP_CONFIG: TourStepConfig[] = [
  { id: "welcome", targetId: "app-sidebar", view: "overview" },
  { id: "sidebar", targetId: "app-sidebar-nav", view: "overview" },
  { id: "apiStatus", targetId: "navigation-side-status", view: "overview" },
  { id: "resumeMatch", targetId: "content-tab-view", view: "simulator" },
  { id: "diagnostics", targetId: "system-diagnostic-panel", view: "simulator" },
  { id: "atsKeywords", targetId: "floating-ats-compliance-widget", view: "simulator" },
];

interface TutorialTourProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: "overview" | "simulator";
  setActiveView: (view: "overview" | "simulator") => void;
}

export default function TutorialTour({
  isOpen,
  onClose,
  activeView,
  setActiveView,
}: TutorialTourProps) {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [highlightCoords, setHighlightCoords] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const stepConfig = TOUR_STEP_CONFIG[currentStep];
  const stepTitle = t(`tour.steps.${stepConfig.id}.title`);
  const stepContent = t(`tour.steps.${stepConfig.id}.content`);
  const stepTip = t(`tour.steps.${stepConfig.id}.tip`);

  // Auto handle view switching and scrolling when step changes
  useEffect(() => {
    if (!isOpen) return;

    const step = TOUR_STEP_CONFIG[currentStep];

    // 1. Switch viewport active mode automatically if needed
    if (activeView !== step.view) {
      setActiveView(step.view);
    }

    // 2. Schedule scrolling & spotlight measuring after component layout settles
    const timer = setTimeout(() => {
      const element = document.getElementById(step.targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });

        // Measure exact coordinates on screen
        const rect = element.getBoundingClientRect();
        setHighlightCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setHighlightCoords(null);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [currentStep, isOpen, activeView, setActiveView]);

  // Recalculate spotlight coordinates on window resize or scroll
  useEffect(() => {
    if (!isOpen) return;
    const updateCoords = () => {
      const step = TOUR_STEP_CONFIG[currentStep];
      const element = document.getElementById(step.targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }
    };
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords);
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords);
    };
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < TOUR_STEP_CONFIG.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    markTourSeen();
    onClose();
  };

  return (
    <>
      {/* 1. Backdrop Overlay Mask */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-[9990] transition-all duration-300 no-print"
        onClick={handleFinish}
      />

      {/* 2. Spotlight Focus Box (Rendered dynamically based on client coords) */}
      {highlightCoords && (
        <div
          className="absolute z-[9991] rounded-xl border-2 border-[var(--m-margin,#c0392b)]/80 shadow-[0_4px_24px_-4px_rgba(192,57,43,0.2)] pointer-events-none transition-all duration-300 no-print"
          style={{
            top: highlightCoords.top - 8,
            left: highlightCoords.left - 8,
            width: highlightCoords.width + 16,
            height: highlightCoords.height + 16,
          }}
        />
      )}

      {/* 3. Floating Guidance Prompt Box */}
      <div
        className="fixed z-[9992] bottom-6 left-1/2 transform -translate-x-1/2 md:bottom-auto md:top-24 md:left-auto md:right-10 md:translate-x-0 w-[calc(100%-2rem)] max-w-sm panel-surface rounded-3xl shadow-2xl p-5 font-sans animate-fade-in no-print"
        id="tour-guidance-popover"
      >
        {/* Header Indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-1.5 text-[var(--m-red,#c0392b)]">
            <Compass className="w-4 h-4 animate-spin" />
            <span className="text-xs font-black tracking-widest uppercase">
              {t("tour.stepOf", { current: currentStep + 1, total: TOUR_STEP_CONFIG.length })}
            </span>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
            title={t("tour.closeTour")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h4 className="text-sm font-extrabold text-slate-800">{stepTitle}</h4>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">{stepContent}</p>

          {/* Quick Tip Bar */}
          <div className="notebook-tip rounded-xl p-2.5 flex gap-2">
            <Sparkles className="w-4 h-4 text-[var(--m-margin,#c0392b)] shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-800 font-semibold leading-normal">
              <strong>{t("tour.tipLabel")} </strong>
              {stepTip}
            </p>
          </div>
        </div>

        {/* Controls Layout */}
        <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleFinish}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer transition"
          >
            {t("tour.skip")}
          </button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg cursor-pointer transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{t("tour.prev")}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 btn-accent text-[11px] px-3.5 py-1.5 rounded-lg cursor-pointer transition shadow-sm hover:shadow"
            >
              <span>{currentStep === TOUR_STEP_CONFIG.length - 1 ? t("tour.finish") : t("tour.next")}</span>
              {currentStep < TOUR_STEP_CONFIG.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
