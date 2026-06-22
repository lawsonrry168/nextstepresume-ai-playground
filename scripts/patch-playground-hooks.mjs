import fs from "fs";
import path from "path";

const MAIN = path.join(
  path.resolve(import.meta.dirname, ".."),
  "src/components/ResumeSimulatorPlayground.tsx"
);

let lines = fs.readFileSync(MAIN, "utf8").split("\n");

function removeRange(start, end) {
  lines = [...lines.slice(0, start - 1), ...lines.slice(end)];
}

// 1) Update imports block
const importInsert = `import { usePlaygroundAudits } from "../hooks/usePlaygroundAudits";
import { useGeminiChat } from "../hooks/useGeminiChat";
import GeminiChatSidebar from "./playground/GeminiChatSidebar";`;

const workspaceImport = 'import WorkspaceAnalyzePanel from "./playground/WorkspaceAnalyzePanel";';
if (!lines.join("\n").includes("usePlaygroundAudits")) {
  const idx = lines.findIndex((l) => l.includes(workspaceImport));
  lines.splice(idx + 1, 0, ...importInsert.split("\n"));
}

// Re-read line numbers after import insert
let text = lines.join("\n");

// Remove blocks by searching markers (more stable than line numbers)
function replaceBetween(startMarker, endMarker, replacement) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  if (start === -1 || end === -1) {
    console.warn("Marker not found:", startMarker.slice(0, 40));
    return;
  }
  text = text.slice(0, start) + replacement + text.slice(end);
}

// Remove chat section + functions
replaceBetween(
  "  // =========================================================================\n  // Task 3: Ask Gemini Chat",
  "  // =========================================================================\n  // Premium Utilities States",
  ""
);

replaceBetween(
  "  const executeSendChatMessage = async (presetText?: string) => {",
  "  // =========================================================================\n  // Premium Tools Utility Handlers",
  ""
);

// Remove grammar check before premium tools (already removed executeSend if overlapping)
if (text.includes("  const runGrammarToneCheck = async () => {")) {
  replaceBetween(
    "  const runGrammarToneCheck = async () => {",
    "  // =========================================================================\n  // Premium Tools Utility Handlers",
    ""
  );
}

replaceBetween(
  "  // 1. Premium Grammar Checker API Trigger\n  const runPremiumGrammarCheck = async (textToCheck?: string) => {",
  "  // 3. Web Speech API Voice Dictation Action\n  const toggleVoiceRecording = () => {",
  "  // 3. Web Speech API Voice Dictation Action\n  const toggleVoiceRecording = () => {"
);

replaceBetween(
  "  // Readability & Complexity states\n  const [readabilityChecking, setReadabilityChecking]",
  "  // WYSIWYG Editor State and formatting logic\n  const [activeInputId, setActiveInputId]",
  "  // WYSIWYG Editor State and formatting logic\n  const [activeInputId, setActiveInputId]"
);

replaceBetween(
  "  // Trigger server-side AI parsing/scoring and optimization\n  const triggerAITailor = async () => {",
  "  // Printing Function\n  const handlePrintPDF = () => {",
  "  // Printing Function\n  const handlePrintPDF = () => {"
);

replaceBetween(
  "  const handleApplyTailoredItem = () => {",
  "  return (\n    <div className=\"grid grid-cols-1 lg:grid-cols-12 gap-8\" id=\"playground-core\">",
  "  return (\n    <div className=\"grid grid-cols-1 lg:grid-cols-12 gap-8\" id=\"playground-core\">"
);

// Remove grammar states block
replaceBetween(
  "  // Grammar & Tone checking states\n  const [grammarChecking, setGrammarChecking]",
  "  // =========================================================================\n  // Task 4: State History Stack",
  "  // =========================================================================\n  // Task 4: State History Stack"
);

// Remove duplicate state declarations
text = text.replace(
  /  const \[loading, setLoading\] = useState<boolean>\(false\);\n  const \[activeTab, setActiveTab\]/,
  "  const [activeTab, setActiveTab]"
);
text = text.replace(
  /  const \[analysisResult, setAnalysisResult\] = useState<AnalysisResult \| null>\(null\);\n  const \[matchAnalysisResult, setMatchAnalysisResult\][\s\S]*?const \[lastAnalysisSimulated, setLastAnalysisSimulated\] = useState<boolean>\(false\);\n/,
  ""
);

// Remove premium grammar state in utilities section if still present
text = text.replace(
  /  const \[premiumGrammarText, setPremiumGrammarText\] = useState<string>\(""\);\n  const \[premiumGrammarChecking, setPremiumGrammarChecking\][\s\S]*?\} \| null>\(null\);\n\n/,
  ""
);

// Replace chat sidebar JSX
replaceBetween(
  "    {/* =========================================================================\n        Task 3: Ask Gemini Career Advisor Slide-over Chat Sidebar Drawer",
  "    <ResumeImportModal",
  `    <GeminiChatSidebar
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        thinkingMode={thinkingMode}
        onThinkingModeChange={setThinkingMode}
        chatMessages={chatMessages}
        chatInput={chatInput}
        onChatInputChange={setChatInput}
        chatLoading={chatLoading}
        onSendMessage={executeSendChatMessage}
        resumeData={resumeData}
      />

    <ResumeImportModal`
);

// Insert hooks after handleManualSave block
const hookBlock = `
  const [activeTab, setActiveTab] = useState<PlaygroundTab>("content");
  const [highlightChanges, setHighlightChanges] = useState<boolean>(true);
  const [tailorIntensity, setTailorIntensity] = useState<TailorIntensity>("balanced");
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [atsScoreExpanded, setAtsScoreExpanded] = useState<boolean>(false);
  const [matcherHighlightActive, setMatcherHighlightActive] = useState<boolean>(false);
  const [isPrintPreviewMode, setIsPrintPreviewMode] = useState<boolean>(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);

  const atsLive = React.useMemo(
    () => calculateLiveAtsScore(resumeData, jobDescription),
    [resumeData, jobDescription]
  );
  const liveAtsScore = atsLive.score;
  const activeKeywordsList = atsLive.keywords;
  const detectedKeywords = atsLive.detected;

  const {
    loading,
    analysisResult,
    tailorError,
    lastAnalysisSimulated,
    triggerAITailor,
    matchAnalysisResult,
    matchLoading,
    matchError,
    triggerAIMatchAnalysis,
    grammarChecking,
    grammarResult,
    grammarDrawerOpen,
    setGrammarDrawerOpen,
    appliedSuggestions,
    runGrammarToneCheck,
    applySuggestedCorrection,
    readabilityChecking,
    readabilityResult,
    readabilityDrawerOpen,
    setReadabilityDrawerOpen,
    runReadabilityComplexityCheck,
    applyReadabilityCorrection,
    skillConsistencyChecking,
    skillConsistencyResult,
    skillConsistencyDrawerOpen,
    setSkillConsistencyDrawerOpen,
    runSkillConsistencyCheck,
    handleAddSuggestedSkill,
    handleRemoveFlaggedSkill,
    premiumGrammarText,
    setPremiumGrammarText,
    premiumGrammarChecking,
    premiumGrammarResult,
    runPremiumGrammarCheck,
  } = usePlaygroundAudits({
    resumeData,
    setResumeData,
    jobDescription,
    measuredFetch,
    onNotifyServerStatus,
    pushToast,
    aiAvailable,
    tailorIntensity,
    setActiveTab,
    setHighlightChanges,
  });

  const {
    chatOpen,
    setChatOpen,
    thinkingMode,
    setThinkingMode,
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    executeSendChatMessage,
  } = useGeminiChat({
    resumeData,
    jobDescription,
    detectedKeywords,
    activeKeywordsList,
    measuredFetch,
    onNotifyServerStatus,
    pushToast,
  });
`;

// Remove old duplicate state if hook block will duplicate
text = text.replace(
  /  const \[activeTab, setActiveTab\] = useState<PlaygroundTab>\("content"\);\n  const \[highlightChanges, setHighlightChanges\][\s\S]*?const \[shortcutsModalOpen, setShortcutsModalOpen\] = useState<boolean>\(false\);\n/,
  ""
);

const insertAfter = "  };\n\n  const exportSystemLogsWithToast";
if (!text.includes("usePlaygroundAudits({")) {
  text = text.replace(insertAfter, `  };${hookBlock}\n  const exportSystemLogsWithToast`);
}

// Remove duplicate atsLive block later in file
text = text.replace(
  /\n  const atsLive = React\.useMemo\(\n    \(\) => calculateLiveAtsScore\(resumeData, jobDescription\),\n    \[resumeData, jobDescription\]\n  \);\n  const liveAtsScore = atsLive\.score;\n  const activeKeywordsList = atsLive\.keywords;\n  const detectedKeywords = atsLive\.detected;\n\n/,
  "\n"
);

// Clean unused imports
text = text.replace(
  /import \{ parseApiJson, parseAskGeminiReply \}/,
  "import { parseApiJson }"
);
text = text.replace(
  /, GrammarSuggestion, GrammarToneResult, ReadabilityComplexityResult, ReadabilitySuggestion, SkillConsistencyResult, SkillConsistencyIssue, AIMatchAnalysisResult, MatchGapSeverityIssue/,
  ""
);

fs.writeFileSync(MAIN, text);
console.log("Patched. Lines:", text.split("\n").length);
