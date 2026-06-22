/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, ShieldAlert, Cpu, Search, Laptop, FileText, BookOpen } from "lucide-react";
import { useI18n } from "../i18n";

export default function ReverseAnalysisDashboard() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'comparison' | 'ats_secrets' | 'prompt_spec'>('comparison');

  return (
    <div className="space-y-8" id="analysis_dashboard_root">

      {/* Dynamic Sub-Navigation for Dashboard */}
      <div className="flex border-b border-slate-200" id="dash-tabs">
        <button
          id="btn-tab-comparison"
          type="button"
          onClick={() => setActiveTab('comparison')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'comparison'
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          {t("dashboard.tabs.comparison")}
        </button>
        <button
          id="btn-tab-ats"
          type="button"
          onClick={() => setActiveTab('ats_secrets')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ats_secrets'
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          {t("dashboard.tabs.atsSecrets")}
        </button>
        <button
          id="btn-tab-prompt"
          type="button"
          onClick={() => setActiveTab('prompt_spec')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'prompt_spec'
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          {t("dashboard.tabs.promptSpec")}
        </button>
      </div>

      {activeTab === 'comparison' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          id="comparison-slide"
        >
          {/* Box 1: Legacy Resume Builders */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="box-legacy">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-800 font-sans">{t("dashboard.comparison.legacy.title")}</h3>
            </div>
            <ul className="space-y-4 font-medium" id="legacy-bullets">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-2 shrink-0"></span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{t("dashboard.comparison.legacy.bullets.staticTemplates.title")}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {t("dashboard.comparison.legacy.bullets.staticTemplates.desc")}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-2 shrink-0"></span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{t("dashboard.comparison.legacy.bullets.canvasExport.title")}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {t("dashboard.comparison.legacy.bullets.canvasExport.desc")}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-2 shrink-0"></span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{t("dashboard.comparison.legacy.bullets.blankMatrix.title")}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {t("dashboard.comparison.legacy.bullets.blankMatrix.desc")}
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Box 2: NextStepResume.ai Strategy */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm" id="box-ai-strategy">
            <div className="absolute right-0 top-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-4 text-emerald-600">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-blue-605" />
              <h3 className="text-base font-bold text-slate-800 font-sans">{t("dashboard.comparison.ai.title")}</h3>
            </div>
            <ul className="space-y-4 font-medium" id="ai-bullets">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-2 shrink-0"></span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-850 text-slate-900">{t("dashboard.comparison.ai.bullets.tailoringEngine.title")}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {t("dashboard.comparison.ai.bullets.tailoringEngine.desc")}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-2 shrink-0"></span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-850 text-slate-900">{t("dashboard.comparison.ai.bullets.printPipeline.title")}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {t("dashboard.comparison.ai.bullets.printPipeline.desc")}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-2 shrink-0"></span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-850 text-slate-900">{t("dashboard.comparison.ai.bullets.starMetrics.title")}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {t("dashboard.comparison.ai.bullets.starMetrics.desc")}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </motion.div>
      )}

      {activeTab === 'ats_secrets' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
          id="ats-secrets-slide"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="ats-anatomy">
            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2 font-sans">
              <Cpu className="w-5 h-5 text-emerald-600" />
              {t("dashboard.ats.title")}
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed font-medium">
              {t("dashboard.ats.intro")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6" id="ats-scan-grid">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all font-medium">
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-emerald-600 w-9 h-9 flex items-center justify-center mb-3">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">{t("dashboard.ats.cards.keywordDensity.title")}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t("dashboard.ats.cards.keywordDensity.desc")}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all font-medium">
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-emerald-600 w-9 h-9 flex items-center justify-center mb-3">
                  <Laptop className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">{t("dashboard.ats.cards.ocrPredictability.title")}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t("dashboard.ats.cards.ocrPredictability.desc")}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all font-medium">
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-emerald-600 w-9 h-9 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">{t("dashboard.ats.cards.semanticWeight.title")}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t("dashboard.ats.cards.semanticWeight.desc")}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'prompt_spec' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
          id="prompt-spec-slide"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="prompt-spec-box">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-800 font-sans">{t("dashboard.prompt.title")}</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">
              {t("dashboard.prompt.intro")}
            </p>

            <div className="space-y-3" id="prompt-phases">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:bg-white hover:border-slate-200 transition-all font-medium hover:shadow-sm">
                <div className="text-xs font-mono font-bold text-emerald-700 uppercase">{t("dashboard.prompt.phases.phase1.title")}</div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {t("dashboard.prompt.phases.phase1.desc")}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:bg-white hover:border-slate-200 transition-all font-medium hover:shadow-sm">
                <div className="text-xs font-mono font-bold text-emerald-700 uppercase">{t("dashboard.prompt.phases.phase2.title")}</div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {t("dashboard.prompt.phases.phase2.desc")}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:bg-white hover:border-slate-200 transition-all font-medium hover:shadow-sm">
                <div className="text-xs font-mono font-bold text-blue-705 text-emerald-700 uppercase">{t("dashboard.prompt.phases.phase3.title")}</div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {t("dashboard.prompt.phases.phase3.desc")}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:bg-white hover:border-slate-200 transition-all font-medium hover:shadow-sm">
                <div className="text-xs font-mono font-bold text-emerald-700 uppercase">{t("dashboard.prompt.phases.phase4.title")}</div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {t("dashboard.prompt.phases.phase4.desc")}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}
