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

const contentBody = unindentLines(lines.slice(2010, 2948).join("\n"), 10);

const contentComponent = `import React from "react";
import { motion } from "motion/react";
import {
  FileText, Briefcase, GraduationCap, Code, Sparkles, Check,
  RefreshCw, AlertCircle, Plus, Trash2, CheckCircle, Info,
  ChevronDown, Award, HeartHandshake, Languages, Bold, Italic, List,
  User, Cloud, Target, Edit3, GripVertical,
} from "lucide-react";
import { ResumeData } from "../../types";

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
  isDragOverSkillsDropzone: boolean;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragEnter: (e: React.DragEvent, index: number) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, dropIndex: number) => void;
  updatePersonalInfo: (field: string, value: string) => void;
  updateSummary: (value: string) => void;
  updateExperienceBullet: (expId: string, bulletIdx: number, value: string) => void;
  addExperienceBullet: (expId: string) => void;
  removeExperienceBullet: (expId: string, bulletIdx: number) => void;
  addSkill: (skillName: string) => void;
  removeSkill: (skillIndex: number) => void;
  insertPreformattedSection: (type: "certifications" | "volunteerWork" | "languages") => void;
  addCertification: (name: string) => void;
  removeCertification: (idx: number) => void;
  addVolunteerWork: (name: string) => void;
  removeVolunteerWork: (idx: number) => void;
  addLanguage: (name: string) => void;
  removeLanguage: (idx: number) => void;
  getRecommendedVerbCategory: () => string;
  insertActionVerb: (verb: string) => void;
}

export default function ContentTabEditorPanel({
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
  isDragOverSkillsDropzone,
  handleDragStart,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  updatePersonalInfo,
  updateSummary,
  updateExperienceBullet,
  addExperienceBullet,
  removeExperienceBullet,
  addSkill,
  removeSkill,
  insertPreformattedSection,
  addCertification,
  removeCertification,
  addVolunteerWork,
  removeVolunteerWork,
  addLanguage,
  removeLanguage,
  getRecommendedVerbCategory,
  insertActionVerb,
}: ContentTabEditorPanelProps) {
  return (
${contentBody.split("\n").map((l) => `    ${l}`).join("\n")}
  );
}
`;

fs.writeFileSync(path.join(OUT, "ContentTabEditorPanel.tsx"), contentComponent);

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
            isDragOverSkillsDropzone={isDragOverSkillsDropzone}
            handleDragStart={handleDragStart}
            handleDragEnter={handleDragEnter}
            handleDragLeave={handleDragLeave}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            updatePersonalInfo={updatePersonalInfo}
            updateSummary={updateSummary}
            updateExperienceBullet={updateExperienceBullet}
            addExperienceBullet={addExperienceBullet}
            removeExperienceBullet={removeExperienceBullet}
            addSkill={addSkill}
            removeSkill={removeSkill}
            insertPreformattedSection={insertPreformattedSection}
            addCertification={addCertification}
            removeCertification={removeCertification}
            addVolunteerWork={addVolunteerWork}
            removeVolunteerWork={removeVolunteerWork}
            addLanguage={addLanguage}
            removeLanguage={removeLanguage}
            getRecommendedVerbCategory={getRecommendedVerbCategory}
            insertActionVerb={insertActionVerb}
          />
        )}`;

const newLines = [
  ...lines.slice(0, 2009),
  ...contentReplacement.split("\n"),
  ...lines.slice(2949),
];

let mainText = newLines.join("\n");
if (!mainText.includes("ContentTabEditorPanel")) {
  mainText = mainText.replace(
    'import TailorTabPanel from "./playground/TailorTabPanel";',
    'import ContentTabEditorPanel from "./playground/ContentTabEditorPanel";\nimport TailorTabPanel from "./playground/TailorTabPanel";'
  );
}

fs.writeFileSync(MAIN, mainText);
console.log("Content extracted. Lines:", mainText.split("\n").length);
