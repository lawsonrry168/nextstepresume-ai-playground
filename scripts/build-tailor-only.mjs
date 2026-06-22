import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const MAIN = path.join(ROOT, "src/components/ResumeSimulatorPlayground.tsx");
const OUT = path.join(ROOT, "src/components/playground");
const lines = fs.readFileSync(MAIN, "utf8").split("\n");

function unindentLines(text, spaces) {
  const prefix = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line.startsWith(prefix) ? line.slice(spaces) : line))
    .join("\n");
}

const tailorBody = unindentLines(lines.slice(2967, 3292).join("\n"), 8);

const tailorComponent = `import React from "react";
import { motion } from "motion/react";
import {
  TrendingUp, Sparkles, RefreshCw, Award, AlertCircle, CheckCircle, Info,
} from "lucide-react";
import {
  AnalysisResult,
  GrammarToneResult,
  ReadabilityComplexityResult,
  SkillConsistencyResult,
  ResumeData,
} from "../../types";
import { PlaygroundTab } from "./PlaygroundTabNav";

export interface TailorTabPanelProps {
  analysisResult: AnalysisResult | null;
  setActiveTab: (tab: PlaygroundTab) => void;
  triggerAITailor: () => void;
  lastAnalysisSimulated: boolean;
  liveAtsScore: number;
  activeKeywordsList: string[];
  detectedKeywords: string[];
  grammarResult: GrammarToneResult | null;
  grammarChecking: boolean;
  runGrammarToneCheck: () => void;
  readabilityResult: ReadabilityComplexityResult | null;
  readabilityChecking: boolean;
  runReadabilityComplexityCheck: () => void;
  setReadabilityDrawerOpen: (open: boolean) => void;
  skillConsistencyResult: SkillConsistencyResult | null;
  skillConsistencyChecking: boolean;
  runSkillConsistencyCheck: () => void;
  setSkillConsistencyDrawerOpen: (open: boolean) => void;
  resumeData: ResumeData;
  handleApplyTailoredItem: () => void;
}

export default function TailorTabPanel({
  analysisResult,
  setActiveTab,
  triggerAITailor,
  lastAnalysisSimulated,
  liveAtsScore,
  activeKeywordsList,
  detectedKeywords,
  grammarResult,
  grammarChecking,
  runGrammarToneCheck,
  readabilityResult,
  readabilityChecking,
  runReadabilityComplexityCheck,
  setReadabilityDrawerOpen,
  skillConsistencyResult,
  skillConsistencyChecking,
  runSkillConsistencyCheck,
  setSkillConsistencyDrawerOpen,
  resumeData,
  handleApplyTailoredItem,
}: TailorTabPanelProps) {
  return (
    <>
${tailorBody.split("\n").map((l) => `      ${l}`).join("\n")}
    </>
  );
}
`;

fs.writeFileSync(path.join(OUT, "TailorTabPanel.tsx"), tailorComponent);

const tailorReplacement = `        <TailorTabPanel
          analysisResult={analysisResult}
          setActiveTab={setActiveTab}
          triggerAITailor={triggerAITailor}
          lastAnalysisSimulated={lastAnalysisSimulated}
          liveAtsScore={liveAtsScore}
          activeKeywordsList={activeKeywordsList}
          detectedKeywords={detectedKeywords}
          grammarResult={grammarResult}
          grammarChecking={grammarChecking}
          runGrammarToneCheck={runGrammarToneCheck}
          readabilityResult={readabilityResult}
          readabilityChecking={readabilityChecking}
          runReadabilityComplexityCheck={runReadabilityComplexityCheck}
          setReadabilityDrawerOpen={setReadabilityDrawerOpen}
          skillConsistencyResult={skillConsistencyResult}
          skillConsistencyChecking={skillConsistencyChecking}
          runSkillConsistencyCheck={runSkillConsistencyCheck}
          setSkillConsistencyDrawerOpen={setSkillConsistencyDrawerOpen}
          resumeData={resumeData}
          handleApplyTailoredItem={handleApplyTailoredItem}
        />`;

let newLines = [
  ...lines.slice(0, 2966),
  ...tailorReplacement.split("\n"),
  ...lines.slice(3292),
];

let mainText = newLines.join("\n");
if (!mainText.includes('import TailorTabPanel')) {
  mainText = mainText.replace(
    'import MatchTabPanel from "./playground/MatchTabPanel";',
    'import TailorTabPanel from "./playground/TailorTabPanel";\nimport MatchTabPanel from "./playground/MatchTabPanel";'
  );
}

fs.writeFileSync(MAIN, mainText);
console.log("Tailor extracted. Lines:", mainText.split("\n").length);
