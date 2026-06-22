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
  resumeData: import("../../types").ResumeData;
  handleApplyTailoredItem: (field: string, value: string) => void;
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

const contentBody = unindentLines(lines.slice(2009, 2948).join("\n"), 10);
const contentComponent = `import React from "react";
import { motion } from "motion/react";
import {
  FileText, Briefcase, GraduationCap, Code, Sparkles, Check,
  RefreshCw, AlertCircle, Plus, Trash2, CheckCircle, Info,
  ChevronDown, Award, HeartHandshake, Languages, Bold, Italic, List,
  User, Cloud, Target, Edit3, GripVertical,
} from "lucide-react";
import { ResumeData, TemplateStyle } from "../../types";

export interface ContentTabEditorPanelProps {
  jobDescription: string;
  setJobDescription: (value: string) => void;
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  activeInputId: string | null;
  handleElementSelectOrFocus: (e: React.SyntheticEvent<HTMLElement>) => void;
  applyFormatToActiveField: (format: "bold" | "italic" | "bullet") => void;
  dropdownOpen: boolean;
  setDropdownOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  editSection: string | null;
  setEditSection: (value: string | null) => void;
  importModalOpen: boolean;
  setImportModalOpen: (value: boolean) => void;
  verbsPanelOpen: boolean;
  setVerbsPanelOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  selectedVerbCategory: string;
  setSelectedVerbCategory: (value: string) => void;
  grammarChecking: boolean;
  runGrammarToneCheck: () => void;
  readabilityChecking: boolean;
  runReadabilityComplexityCheck: () => void;
  skillConsistencyChecking: boolean;
  runSkillConsistencyCheck: () => void;
  saveImmediateSnapshot: () => void;
  history: ResumeData[];
  isDragOverSkillsDropzone: boolean;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragEnter: (e: React.DragEvent, index: number) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, dropIndex: number) => void;
  addExperience: () => void;
  removeExperience: (index: number) => void;
  addEducation: () => void;
  removeEducation: (index: number) => void;
  addSkill: (skill: string) => void;
  removeSkill: (index: number) => void;
  addCertification: () => void;
  removeCertification: (index: number) => void;
  addLanguage: () => void;
  removeLanguage: (index: number) => void;
  addVolunteer: () => void;
  removeVolunteer: (index: number) => void;
}

export default function ContentTabEditorPanel(props: ContentTabEditorPanelProps) {
  const {
    jobDescription,
    setJobDescription,
    resumeData,
    setResumeData,
    activeInputId,
    handleElementSelectOrFocus,
    applyFormatToActiveField,
    dropdownOpen,
    setDropdownOpen,
    editSection,
    setEditSection,
    importModalOpen,
    setImportModalOpen,
    verbsPanelOpen,
    setVerbsPanelOpen,
    selectedVerbCategory,
    setSelectedVerbCategory,
    grammarChecking,
    runGrammarToneCheck,
    readabilityChecking,
    runReadabilityComplexityCheck,
    skillConsistencyChecking,
    runSkillConsistencyCheck,
    saveImmediateSnapshot,
    history,
    isDragOverSkillsDropzone,
    handleDragStart,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    addExperience,
    removeExperience,
    addEducation,
    removeEducation,
    addSkill,
    removeSkill,
    addCertification,
    removeCertification,
    addLanguage,
    removeLanguage,
    addVolunteer,
    removeVolunteer,
  } = props;

  return (
${contentBody.split("\n").map((l) => `    ${l}`).join("\n")}
  );
}
`;

fs.writeFileSync(path.join(OUT, "ContentTabEditorPanel.tsx"), contentComponent);

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

const contentReplacement = `        {activeTab === 'content' && (
          <ContentTabEditorPanel
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            resumeData={resumeData}
            setResumeData={setResumeData}
            activeInputId={activeInputId}
            handleElementSelectOrFocus={handleElementSelectOrFocus}
            applyFormatToActiveField={applyFormatToActiveField}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            editSection={editSection}
            setEditSection={setEditSection}
            importModalOpen={importModalOpen}
            setImportModalOpen={setImportModalOpen}
            verbsPanelOpen={verbsPanelOpen}
            setVerbsPanelOpen={setVerbsPanelOpen}
            selectedVerbCategory={selectedVerbCategory}
            setSelectedVerbCategory={setSelectedVerbCategory}
            grammarChecking={grammarChecking}
            runGrammarToneCheck={runGrammarToneCheck}
            readabilityChecking={readabilityChecking}
            runReadabilityComplexityCheck={runReadabilityComplexityCheck}
            skillConsistencyChecking={skillConsistencyChecking}
            runSkillConsistencyCheck={runSkillConsistencyCheck}
            saveImmediateSnapshot={saveImmediateSnapshot}
            history={history}
            isDragOverSkillsDropzone={isDragOverSkillsDropzone}
            handleDragStart={handleDragStart}
            handleDragEnter={handleDragEnter}
            handleDragLeave={handleDragLeave}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            addExperience={addExperience}
            removeExperience={removeExperience}
            addEducation={addEducation}
            removeEducation={removeEducation}
            addSkill={addSkill}
            removeSkill={removeSkill}
            addCertification={addCertification}
            removeCertification={removeCertification}
            addLanguage={addLanguage}
            removeLanguage={removeLanguage}
            addVolunteer={addVolunteer}
            removeVolunteer={removeVolunteer}
          />
        )}`;

let newLines = [...lines];
// Replace tailor block (2967-3292) - 0-indexed 2966-3291
newLines = [
  ...newLines.slice(0, 2966),
  ...tailorReplacement.split("\n"),
  ...newLines.slice(3292),
];

// Content was at 2008-2948, after tailor replace line numbers unchanged for content (tailor is after content)
newLines = [
  ...newLines.slice(0, 2008),
  ...contentReplacement.split("\n"),
  ...newLines.slice(2949),
];

const importLines = `import ContentTabEditorPanel from "./playground/ContentTabEditorPanel";
import TailorTabPanel from "./playground/TailorTabPanel";`;

let mainText = newLines.join("\n");
if (!mainText.includes("ContentTabEditorPanel")) {
  mainText = mainText.replace(
    'import MatchTabPanel from "./playground/MatchTabPanel";',
    `${importLines}\nimport MatchTabPanel from "./playground/MatchTabPanel";`
  );
}

fs.writeFileSync(MAIN, mainText);
console.log("Done. New line count:", mainText.split("\n").length);
