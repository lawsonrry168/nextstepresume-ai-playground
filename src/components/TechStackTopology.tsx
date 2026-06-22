/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion } from "motion/react";
import { Server, Cpu, Database, Layout, Eye, ShieldCheck, Terminal, HelpCircle, Code } from "lucide-react";
import { COMPILED_ENDPOINTS } from "../data";
import { BRAND_NAME } from "../lib/brand";
import { useI18n } from "../i18n";

const FINDING_KEYS = ["tailoring", "ats", "pdf"] as const;

export default function TechStackTopology() {
  const { t } = useI18n();
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);

  return (
    <div className="space-y-8" id="tech_topology_root">
      
      {/* Topology Header */}
      <div className="panel-surface p-6 relative overflow-hidden" id="topo-header">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                {t("topology.badge")}
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-mono text-emerald-600 font-semibold">{t("topology.recompiled")}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">
              {BRAND_NAME}
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed max-w-[65ch]">
              {t("brand.slogan")}
            </p>
          </div>
          <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/80 shrink-0">
            <div className="rounded-full bg-emerald-50 p-2 text-emerald-600 border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 font-medium uppercase">{t("topology.inspection")}</div>
              <div className="text-xs font-semibold text-slate-700">{t("topology.verified")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Topology Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="topology-grid">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="graph-panel">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-500 text-slate-400" /> {t("topology.blueprint")}
            </h3>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 uppercase font-bold">
              {t("topology.interactiveNodes")}
            </span>
          </div>

          <div className="flex flex-col gap-6 relative" id="topology-flow">
            {/* Visual connector line (hidden on mobile, dynamic vertical spacing) */}
            <div className="absolute left-[26px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-emerald-300 via-emerald-200 to-emerald-250 hidden md:block z-0"></div>

            {/* Node 1: Client Front-End */}
            <motion.div 
              whileHover={{ x: 4 }}
              className="notebook-node flex gap-4 relative z-10 p-4 transition-all cursor-pointer"
              id="node-frontend"
            >
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 border-emerald-100 p-3 text-emerald-600 shrink-0 h-12 w-12 flex items-center justify-center">
                <Layout className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{t("topology.node1")}</span>
                  <h4 className="text-sm font-semibold text-slate-900">{t("topology.frontendTitle")}</h4>
                </div>
                <p className="text-xs text-slate-600 max-w-xl font-medium leading-relaxed">
                  {t("topology.frontendDesc")}
                </p>
                <div className="text-[10px] font-mono text-slate-400 mt-1">{t("topology.techStack")} {t("topology.techStacks.frontend")}</div>
              </div>
            </motion.div>

            {/* Node 2: API Gateway middleware / Serverless Routes */}
            <motion.div 
              whileHover={{ x: 4 }}
              className="notebook-node flex gap-4 relative z-10 p-4 transition-all cursor-pointer"
              id="node-gateway"
            >
              <div className="rounded-xl bg-purple-50 border border-purple-105 border-purple-100 p-3 text-purple-600 shrink-0 h-12 w-12 flex items-center justify-center">
                <Server className="w-6 h-6 text-purple-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">{t("topology.node2")}</span>
                  <h4 className="text-sm font-semibold text-slate-900">{t("topology.gatewayTitle")}</h4>
                </div>
                <p className="text-xs text-slate-600 max-w-xl font-medium leading-relaxed">
                  {t("topology.gatewayDesc")}
                </p>
                <div className="text-[10px] font-mono text-slate-400 mt-1">{t("topology.architecture")} {t("topology.techStacks.backend")}</div>
              </div>
            </motion.div>

            {/* Node 3: LLM & High-Context Parsing Model */}
            <motion.div 
              whileHover={{ x: 4 }}
              className="notebook-node flex gap-4 relative z-10 p-4 transition-all cursor-pointer"
              id="node-ai"
            >
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-emerald-600 shrink-0 h-12 w-12 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{t("topology.node3")}</span>
                  <h4 className="text-sm font-semibold text-slate-900 font-sans">{t("topology.aiTitle")}</h4>
                </div>
                <p className="text-xs text-slate-600 max-w-xl font-medium leading-relaxed">
                  {t("topology.aiDesc")}
                </p>
                <div className="text-[10px] font-mono text-slate-400 mt-1">{t("topology.promptParams")}</div>
              </div>
            </motion.div>

            {/* Node 4: DB Schema & Persistence */}
            <motion.div 
              whileHover={{ x: 4 }}
              className="notebook-node flex gap-4 relative z-10 p-4 transition-all cursor-pointer"
              id="node-db"
            >
              <div className="rounded-xl bg-emerald-50 border border-emerald-105 border-emerald-100 p-3 text-emerald-600 shrink-0 h-12 w-12 flex items-center justify-center">
                <Database className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{t("topology.node4")}</span>
                  <h4 className="text-sm font-semibold text-slate-900">{t("topology.dbTitle")}</h4>
                </div>
                <p className="text-xs text-slate-600 max-w-xl font-medium leading-relaxed">
                  {t("topology.dbDesc")}
                </p>
                <div className="text-[10px] font-mono text-slate-400 mt-1">{t("topology.databaseModel")} {t("topology.techStacks.database")}</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Findings and PDF Insight Column */}
        <div className="lg:col-span-4 space-y-6" id="findings-column">
          
          {/* Decompilation Findings Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" id="findings-decompiled">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-emerald-600" /> {t("topology.auditsTitle")}
            </h3>
            <div className="space-y-4">
              {FINDING_KEYS.map((key) => (
                <div key={key} className="bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-white transition-all hover:shadow-sm">
                  <div className="text-xs font-bold text-slate-800 font-sans tracking-wide">
                    {t(`topology.findings.${key}.domain`)}
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-sans font-medium text-slate-600">
                    {t(`topology.findings.${key}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Premium PDF Engine Discovery */}
          <div className="notebook-callout p-5 relative overflow-hidden" id="pdf-discovery">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-[var(--m-margin,#c0392b)] mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 font-sans tracking-tight">
                  {t("topology.pdfTitle")}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                  {t("topology.pdfDesc", { brand: BRAND_NAME })}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* API Payload Specifications Subpanel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="api-specs-section">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Code className="text-blue-650 w-4 h-4 text-emerald-600" /> {t("topology.endpointExplorer")}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="endpoint-selector">
          {COMPILED_ENDPOINTS.map((ep) => (
            <button
              id={`btn-ep-${ep.path}`}
              type="button"
              key={ep.path}
              onClick={() => setActiveEndpoint(activeEndpoint === ep.path ? null : ep.path)}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                activeEndpoint === ep.path
                  ? "bg-emerald-50 border-emerald-600 shadow-sm"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-blue-100/65 text-blue-800 border border-emerald-100">
                  {ep.method}
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">{t("topology.routeNode")}</span>
              </div>
              <div className="font-mono text-xs font-bold text-slate-850 text-slate-800 break-all select-all">
                {ep.path}
              </div>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                {t(`topology.endpoints.${ep.localeKey}.role`)}
              </p>
            </button>
          ))}
        </div>

        {/* Selected Endpoint payload / response explorer */}
        {activeEndpoint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden font-mono text-xs shadow-sm"
            id="endpoint-details"
          >
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between font-sans">
              <span className="text-slate-800 font-bold">{t("topology.payloadBlueprint")} <span className="text-blue-650 text-emerald-600">{activeEndpoint}</span></span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{t("topology.schemaMapping")}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              <div className="p-4 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">{t("topology.payloadParams")}</div>
                <pre className="text-slate-800 bg-slate-50 p-3 rounded-lg overflow-x-auto border border-slate-100 font-mono text-xs leading-relaxed">
                  {t(`topology.endpoints.${COMPILED_ENDPOINTS.find((e) => e.path === activeEndpoint)?.localeKey ?? "parse"}.payloadSchema`)}
                </pre>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">{t("topology.responseInterface")}</div>
                <pre className="text-blue-750 text-emerald-700 bg-slate-50 p-3 rounded-lg overflow-x-auto border border-slate-100 font-mono text-xs leading-relaxed">
                  {t(`topology.endpoints.${COMPILED_ENDPOINTS.find((e) => e.path === activeEndpoint)?.localeKey ?? "parse"}.responseSchema`)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
}
