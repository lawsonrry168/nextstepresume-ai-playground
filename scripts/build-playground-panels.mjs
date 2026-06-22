import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const MAIN = path.join(ROOT, "src/components/ResumeSimulatorPlayground.tsx");
const OUT = path.join(ROOT, "src/components/playground");

const lines = fs.readFileSync(MAIN, "utf8").split("\n");

const sections = [
  {
    name: "MatchTabPanel",
    extract: [2949, 3400],
    replace: [2947, 3401],
    replacement: `        {activeTab === 'match' && (
          <MatchTabPanel
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            liveAtsScore={liveAtsScore}
            detectedKeywords={detectedKeywords}
            activeKeywordsList={activeKeywordsList}
            matcherHighlightActive={matcherHighlightActive}
            setMatcherHighlightActive={setMatcherHighlightActive}
            matchLoading={matchLoading}
            matchError={matchError}
            matchAnalysisResult={matchAnalysisResult}
            triggerAIMatchAnalysis={triggerAIMatchAnalysis}
          />
        )}`,
    header: `import React from "react";
import { motion } from "motion/react";
import {
  Target, Sparkles, RefreshCw, AlertTriangle, Code, Briefcase, GraduationCap,
  Award, Languages, HeartHandshake, Layout, TrendingUp, CheckCircle,
} from "lucide-react";
import { AIMatchAnalysisResult } from "../../types";

export interface MatchTabPanelProps {
  jobDescription: string;
  setJobDescription: (value: string) => void;
  liveAtsScore: number;
  detectedKeywords: string[];
  activeKeywordsList: string[];
  matcherHighlightActive: boolean;
  setMatcherHighlightActive: (value: boolean | ((prev: boolean) => boolean)) => void;
  matchLoading: boolean;
  matchError: string | null;
  matchAnalysisResult: AIMatchAnalysisResult | null;
  triggerAIMatchAnalysis: () => void;
}

export default function MatchTabPanel({
  jobDescription,
  setJobDescription,
  liveAtsScore,
  detectedKeywords,
  activeKeywordsList,
  matcherHighlightActive,
  setMatcherHighlightActive,
  matchLoading,
  matchError,
  matchAnalysisResult,
  triggerAIMatchAnalysis,
}: MatchTabPanelProps) {
  return (`,
    footer: `  );
}
`,
    unindent: 10,
  },
  {
    name: "ToolsTabPanel",
    extract: [3732, 5120],
    replace: [3730, 5121],
    replacement: `        {activeTab === 'tools' && (
          <ToolsTabPanel
            voiceRecording={voiceRecording}
            voiceStatus={voiceStatus}
            voiceTarget={voiceTarget}
            setVoiceTarget={setVoiceTarget}
            toggleVoiceRecording={toggleVoiceRecording}
            premiumGrammarText={premiumGrammarText}
            setPremiumGrammarText={setPremiumGrammarText}
            premiumGrammarChecking={premiumGrammarChecking}
            runPremiumGrammarCheck={runPremiumGrammarCheck}
            premiumGrammarResult={premiumGrammarResult}
            salaryRole={salaryRole}
            setSalaryRole={setSalaryRole}
            salaryExp={salaryExp}
            setSalaryExp={setSalaryExp}
            salaryInsightsOpen={salaryInsightsOpen}
            setSalaryInsightsOpen={setSalaryInsightsOpen}
            resumeData={resumeData}
            setResumeData={setResumeData}
            jobDescription={jobDescription}
            heatmapMetric={heatmapMetric}
            setHeatmapMetric={setHeatmapMetric}
            skillsDemand={skillsDemand}
            setSkillsDemand={setSkillsDemand}
            skillsProficiency={skillsProficiency}
            setSkillsProficiency={setSkillsProficiency}
            skillsRelevance={skillsRelevance}
            setSkillsRelevance={setSkillsRelevance}
            smartSuggestionsCategory={smartSuggestionsCategory}
            setSmartSuggestionsCategory={setSmartSuggestionsCategory}
            analysisResult={analysisResult}
            applySmartSuggestion={applySmartSuggestion}
            isAtsCrawling={isAtsCrawling}
            triggerAtsCrawlerSim={triggerAtsCrawlerSim}
            atsLogs={atsLogs}
            clearAtsLogs={clearAtsLogs}
            crawlerSource={crawlerSource}
            setCrawlerSource={setCrawlerSource}
            isComparing={isComparing}
            runResumeComparison={runResumeComparison}
            comparatorResult={comparatorResult}
            comparatorOpen={comparatorOpen}
            setComparatorOpen={setComparatorOpen}
            exportToJson={exportToJson}
            exportToDocx={exportToDocx}
            handleManualSave={handleManualSave}
            shortcutsModalOpen={shortcutsModalOpen}
            setShortcutsModalOpen={setShortcutsModalOpen}
            isPrintPreviewMode={isPrintPreviewMode}
            setIsPrintPreviewMode={setIsPrintPreviewMode}
            activeTemplate={activeTemplate}
            setActiveTemplate={setActiveTemplate}
            autoSaveShouldFail={autoSaveShouldFail}
            setAutoSaveShouldFail={setAutoSaveShouldFail}
            addSystemLog={addSystemLog}
            highlightChanges={highlightChanges}
            detectedKeywords={detectedKeywords}
            activeKeywordsList={activeKeywordsList}
          />
        )}`,
    header: `import React from "react";
import { motion } from "motion/react";
import {
  Wand2, Mic, MicOff, Volume2, Sparkles, RefreshCw, TrendingUp, Award,
  Download, FileUp, FileText, Grid, Layout, Check, AlertCircle, Info,
  ChevronDown, Code, Briefcase, GraduationCap, Target, Eye, Printer,
  ArrowRight, Plus, Trash2, CheckCircle, Cloud, Layers, Maximize2, LayoutGrid,
} from "lucide-react";
import { ResumeData, AnalysisResult, TemplateStyle } from "../../types";
import ResumeTemplateRenderer from "../ResumeTemplateRenderer";
import { formatSalaryRange } from "../../lib/salaryBenchmark";

type PremiumGrammarResult = {
  score: number;
  summary: string;
  suggestions: Array<{
    original: string;
    suggested: string;
    explanation: string;
    severity: "high" | "medium" | "low";
  }>;
};

type ComparatorResult = {
  matchRate: number;
  keyMatches: string[];
  missingSkills: string[];
  criticalGaps: string[];
};

type AtsLogEntry = {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  text: string;
};

export interface ToolsTabPanelProps {
  voiceRecording: boolean;
  voiceStatus: string;
  voiceTarget: "summary" | "grammar_input" | "custom";
  setVoiceTarget: (value: "summary" | "grammar_input" | "custom") => void;
  toggleVoiceRecording: () => void;
  premiumGrammarText: string;
  setPremiumGrammarText: (value: string) => void;
  premiumGrammarChecking: boolean;
  runPremiumGrammarCheck: () => void;
  premiumGrammarResult: PremiumGrammarResult | null;
  salaryRole: string;
  setSalaryRole: (value: string) => void;
  salaryExp: number;
  setSalaryExp: (value: number) => void;
  salaryInsightsOpen: boolean;
  setSalaryInsightsOpen: (value: boolean) => void;
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  jobDescription: string;
  heatmapMetric: "proficiency" | "demand" | "relevance";
  setHeatmapMetric: (value: "proficiency" | "demand" | "relevance") => void;
  skillsDemand: Record<string, number>;
  setSkillsDemand: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  skillsProficiency: Record<string, number>;
  setSkillsProficiency: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  skillsRelevance: Record<string, number>;
  setSkillsRelevance: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  smartSuggestionsCategory: "verbs" | "industry_terms" | "ats_optimized";
  setSmartSuggestionsCategory: (value: "verbs" | "industry_terms" | "ats_optimized") => void;
  analysisResult: AnalysisResult | null;
  applySmartSuggestion: (text: string, type: "summary" | "grammar" | "skill") => void;
  isAtsCrawling: boolean;
  triggerAtsCrawlerSim: (source: string) => void;
  atsLogs: AtsLogEntry[];
  clearAtsLogs: () => void;
  crawlerSource: string;
  setCrawlerSource: (value: string) => void;
  isComparing: boolean;
  runResumeComparison: () => void;
  comparatorResult: ComparatorResult | null;
  comparatorOpen: boolean;
  setComparatorOpen: (value: boolean) => void;
  exportToJson: () => void;
  exportToDocx: () => void;
  handleManualSave: () => void;
  shortcutsModalOpen: boolean;
  setShortcutsModalOpen: (value: boolean) => void;
  isPrintPreviewMode: boolean;
  setIsPrintPreviewMode: (value: boolean) => void;
  activeTemplate: TemplateStyle;
  setActiveTemplate: (style: TemplateStyle) => void;
  autoSaveShouldFail: boolean;
  setAutoSaveShouldFail: (value: boolean) => void;
  addSystemLog: (level: "info" | "warn" | "error", message: string) => void;
  highlightChanges: boolean;
  detectedKeywords: string[];
  activeKeywordsList: string[];
}

export default function ToolsTabPanel({
  voiceRecording,
  voiceStatus,
  voiceTarget,
  setVoiceTarget,
  toggleVoiceRecording,
  premiumGrammarText,
  setPremiumGrammarText,
  premiumGrammarChecking,
  runPremiumGrammarCheck,
  premiumGrammarResult,
  salaryRole,
  setSalaryRole,
  salaryExp,
  setSalaryExp,
  salaryInsightsOpen,
  setSalaryInsightsOpen,
  resumeData,
  setResumeData,
  jobDescription,
  heatmapMetric,
  setHeatmapMetric,
  skillsDemand,
  setSkillsDemand,
  skillsProficiency,
  setSkillsProficiency,
  skillsRelevance,
  setSkillsRelevance,
  smartSuggestionsCategory,
  setSmartSuggestionsCategory,
  analysisResult,
  applySmartSuggestion,
  isAtsCrawling,
  triggerAtsCrawlerSim,
  atsLogs,
  clearAtsLogs,
  crawlerSource,
  setCrawlerSource,
  isComparing,
  runResumeComparison,
  comparatorResult,
  comparatorOpen,
  setComparatorOpen,
  exportToJson,
  exportToDocx,
  handleManualSave,
  shortcutsModalOpen,
  setShortcutsModalOpen,
  isPrintPreviewMode,
  setIsPrintPreviewMode,
  activeTemplate,
  setActiveTemplate,
  autoSaveShouldFail,
  setAutoSaveShouldFail,
  addSystemLog,
  highlightChanges,
  detectedKeywords,
  activeKeywordsList,
}: ToolsTabPanelProps) {
  return (`,
    footer: `  );
}
`,
    unindent: 10,
  },
  {
    name: "PreviewConfigPanel",
    extract: [5125, 5218],
    replace: [5123, 5219],
    replacement: `        {activeTab === 'preview' && (
          <PreviewConfigPanel
            activeTemplate={activeTemplate}
            setActiveTemplate={setActiveTemplate}
            analysisResult={analysisResult}
            highlightChanges={highlightChanges}
            setHighlightChanges={setHighlightChanges}
            handlePrintPDF={handlePrintPDF}
          />
        )}`,
    header: `import React from "react";
import { motion } from "motion/react";
import { Layout, GraduationCap, FileText, Printer } from "lucide-react";
import { AnalysisResult, TemplateStyle } from "../../types";

export interface PreviewConfigPanelProps {
  activeTemplate: TemplateStyle;
  setActiveTemplate: (style: TemplateStyle) => void;
  analysisResult: AnalysisResult | null;
  highlightChanges: boolean;
  setHighlightChanges: (value: boolean | ((prev: boolean) => boolean)) => void;
  handlePrintPDF: () => void;
}

export default function PreviewConfigPanel({
  activeTemplate,
  setActiveTemplate,
  analysisResult,
  highlightChanges,
  setHighlightChanges,
  handlePrintPDF,
}: PreviewConfigPanelProps) {
  return (`,
    footer: `  );
}
`,
    unindent: 10,
  },
  {
    name: "ResumeLivePreviewPanel",
    extract: [5224, 5927],
    replace: [5223, 5927],
    replacement: `      <ResumeLivePreviewPanel
        isPreviewMode={isPreviewMode}
        setIsPreviewMode={setIsPreviewMode}
        liveAtsScore={liveAtsScore}
        previewZoom={previewZoom}
        setPreviewZoom={setPreviewZoom}
        grayscaleMode={grayscaleMode}
        setGrayscaleMode={setGrayscaleMode}
        isComparisonView={isComparisonView}
        setIsComparisonView={setIsComparisonView}
        activeTemplate={activeTemplate}
        setActiveTemplate={setActiveTemplate}
        history={history}
        handleUndo={handleUndo}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        pdfExporting={pdfExporting}
        exportToPDF={exportToPDF}
        handlePrintPDF={handlePrintPDF}
        resumeData={resumeData}
        highlightChanges={highlightChanges}
        setHighlightChanges={setHighlightChanges}
        analysisResult={analysisResult}
        detectedKeywords={detectedKeywords}
        activeKeywordsList={activeKeywordsList}
        matcherHighlightActive={matcherHighlightActive}
        setMatcherHighlightActive={setMatcherHighlightActive}
        atsScoreExpanded={atsScoreExpanded}
        setAtsScoreExpanded={setAtsScoreExpanded}
      />`,
    header: `import React from "react";
import { motion } from "motion/react";
import {
  Layers, Minimize2, Maximize2, Grid, LayoutGrid, Undo, Sparkles,
  Download, Printer, TrendingUp, Eye, FileText,
} from "lucide-react";
import { ResumeData, AnalysisResult, TemplateStyle } from "../../types";
import ResumeTemplateRenderer from "../ResumeTemplateRenderer";

export interface ResumeLivePreviewPanelProps {
  isPreviewMode: boolean;
  setIsPreviewMode: (value: boolean) => void;
  liveAtsScore: number;
  previewZoom: number;
  setPreviewZoom: (value: number) => void;
  grayscaleMode: boolean;
  setGrayscaleMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  isComparisonView: boolean;
  setIsComparisonView: (value: boolean) => void;
  activeTemplate: TemplateStyle;
  setActiveTemplate: (style: TemplateStyle) => void;
  history: ResumeData[];
  handleUndo: () => void;
  chatOpen: boolean;
  setChatOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  pdfExporting: boolean;
  exportToPDF: () => void;
  handlePrintPDF: () => void;
  resumeData: ResumeData;
  highlightChanges: boolean;
  setHighlightChanges: (value: boolean | ((prev: boolean) => boolean)) => void;
  analysisResult: AnalysisResult | null;
  detectedKeywords: string[];
  activeKeywordsList: string[];
  matcherHighlightActive: boolean;
  setMatcherHighlightActive: (value: boolean | ((prev: boolean) => boolean)) => void;
  atsScoreExpanded: boolean;
  setAtsScoreExpanded: (value: boolean) => void;
}

export default function ResumeLivePreviewPanel({
  isPreviewMode,
  setIsPreviewMode,
  liveAtsScore,
  previewZoom,
  setPreviewZoom,
  grayscaleMode,
  setGrayscaleMode,
  isComparisonView,
  setIsComparisonView,
  activeTemplate,
  setActiveTemplate,
  history,
  handleUndo,
  chatOpen,
  setChatOpen,
  pdfExporting,
  exportToPDF,
  handlePrintPDF,
  resumeData,
  highlightChanges,
  setHighlightChanges,
  analysisResult,
  detectedKeywords,
  activeKeywordsList,
  matcherHighlightActive,
  setMatcherHighlightActive,
  atsScoreExpanded,
  setAtsScoreExpanded,
}: ResumeLivePreviewPanelProps) {
  return (`,
    footer: `  );
}
`,
    unindent: 6,
  },
];

function unindentLines(text, spaces) {
  const prefix = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line.startsWith(prefix) ? line.slice(spaces) : line))
    .join("\n");
}

fs.mkdirSync(OUT, { recursive: true });

// Process replacements from bottom to top to preserve line numbers
const sorted = [...sections].sort((a, b) => b.replace[0] - a.replace[0]);
let newLines = [...lines];

for (const section of sorted) {
  const [rs, re] = section.replace;
  const [es, ee] = section.extract;
  const body = unindentLines(lines.slice(es - 1, ee).join("\n"), section.unindent);
  const componentContent = `${section.header}\n    ${body.split("\n").join("\n    ")}\n${section.footer}`;
  fs.writeFileSync(path.join(OUT, `${section.name}.tsx`), componentContent);
  console.log(`Created ${section.name}.tsx`);

  const replacementLines = section.replacement.split("\n");
  newLines = [...newLines.slice(0, rs - 1), ...replacementLines, ...newLines.slice(re)];
}

// Add imports after existing playground imports
const importBlock = `import MatchTabPanel from "./playground/MatchTabPanel";
import ToolsTabPanel from "./playground/ToolsTabPanel";
import PreviewConfigPanel from "./playground/PreviewConfigPanel";
import ResumeLivePreviewPanel from "./playground/ResumeLivePreviewPanel";`;

const mainText = newLines.join("\n");
if (!mainText.includes("MatchTabPanel")) {
  const marker = 'import WorkspaceAnalyzePanel from "./playground/WorkspaceAnalyzePanel";';
  const updated = mainText.replace(marker, `${marker}\n${importBlock}`);
  fs.writeFileSync(MAIN, updated);
} else {
  fs.writeFileSync(MAIN, mainText);
}

console.log("Main file updated. New line count:", newLines.length);
