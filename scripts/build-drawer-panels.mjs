import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const MAIN = path.join(ROOT, "src/components/ResumeSimulatorPlayground.tsx");
const OUT = path.join(ROOT, "src/components/playground");
const lines = fs.readFileSync(MAIN, "utf8").split("\n");

function unindent(text, n) {
  const p = " ".repeat(n);
  return text
    .split("\n")
    .map((l) => (l.startsWith(p) ? l.slice(n) : l))
    .join("\n");
}

function wrap(name, imports, typesImport, propsInterface, destructure, body) {
  return `${imports}
${typesImport}

export interface ${name}Props {
${propsInterface}
}

export default function ${name}({
${destructure}
}: ${name}Props) {
  if (!open) return null;

  return (
    ${body.split("\n").join("\n    ")}
  );
}
`;
}

const configs = [
  {
    file: "GrammarToneDrawer",
    extract: [2216, 2363],
    replace: [2214, 2364],
    replacement: `      <GrammarToneDrawer
        open={grammarDrawerOpen}
        onClose={() => setGrammarDrawerOpen(false)}
        grammarResult={grammarResult}
        appliedSuggestions={appliedSuggestions}
        onApplySuggestion={applySuggestedCorrection}
      />`,
    imports: `import React from "react";
import { Sparkles, Check } from "lucide-react";`,
    types: `import { GrammarToneResult, GrammarSuggestion } from "../../types";`,
    props: `  open: boolean;
  onClose: () => void;
  grammarResult: GrammarToneResult | null;
  appliedSuggestions: Set<string>;
  onApplySuggestion: (suggestion: GrammarSuggestion) => void;`,
    destructure: `  open,
  onClose,
  grammarResult,
  appliedSuggestions,
  onApplySuggestion`,
    transform: (b) =>
      b
        .replace(/setGrammarDrawerOpen\(false\)/g, "onClose()")
        .replace(/applySuggestedCorrection/g, "onApplySuggestion"),
  },
  {
    file: "ReadabilityDrawer",
    extract: [2368, 2532],
    replace: [2366, 2533],
    replacement: `      <ReadabilityDrawer
        open={readabilityDrawerOpen}
        onClose={() => setReadabilityDrawerOpen(false)}
        readabilityResult={readabilityResult}
        appliedSuggestions={appliedSuggestions}
        onApplyCorrection={applyReadabilityCorrection}
      />`,
    imports: `import React from "react";
import { TrendingUp, Check } from "lucide-react";`,
    types: `import { ReadabilityComplexityResult, ReadabilitySuggestion } from "../../types";`,
    props: `  open: boolean;
  onClose: () => void;
  readabilityResult: ReadabilityComplexityResult | null;
  appliedSuggestions: Set<string>;
  onApplyCorrection: (suggestion: ReadabilitySuggestion) => void;`,
    destructure: `  open,
  onClose,
  readabilityResult,
  appliedSuggestions,
  onApplyCorrection`,
    transform: (b) =>
      b
        .replace(/setReadabilityDrawerOpen\(false\)/g, "onClose()")
        .replace(/applyReadabilityCorrection/g, "onApplyCorrection"),
  },
  {
    file: "SkillConsistencyDrawer",
    extract: [2537, 2725],
    replace: [2535, 2726],
    replacement: `      <SkillConsistencyDrawer
        open={skillConsistencyDrawerOpen}
        onClose={() => setSkillConsistencyDrawerOpen(false)}
        skillConsistencyResult={skillConsistencyResult}
        resumeData={resumeData}
        onAddSuggestedSkill={handleAddSuggestedSkill}
        onRemoveFlaggedSkill={handleRemoveFlaggedSkill}
      />`,
    imports: `import React from "react";
import { Award, Plus, Trash2, CheckCircle } from "lucide-react";`,
    types: `import { SkillConsistencyResult, ResumeData } from "../../types";`,
    props: `  open: boolean;
  onClose: () => void;
  skillConsistencyResult: SkillConsistencyResult | null;
  resumeData: ResumeData;
  onAddSuggestedSkill: (skill: string) => void;
  onRemoveFlaggedSkill: (skill: string) => void;`,
    destructure: `  open,
  onClose,
  skillConsistencyResult,
  resumeData,
  onAddSuggestedSkill,
  onRemoveFlaggedSkill`,
    transform: (b) =>
      b
        .replace(/setSkillConsistencyDrawerOpen\(false\)/g, "onClose()")
        .replace(/handleAddSuggestedSkill/g, "onAddSuggestedSkill")
        .replace(/handleRemoveFlaggedSkill/g, "onRemoveFlaggedSkill"),
  },
];

fs.mkdirSync(OUT, { recursive: true });

const sorted = [...configs].sort((a, b) => b.replace[0] - a.replace[0]);
let newLines = [...lines];

for (const c of configs) {
  let body = unindent(lines.slice(c.extract[0] - 1, c.extract[1]).join("\n"), 8);
  body = c.transform(body);
  fs.writeFileSync(
    path.join(OUT, `${c.file}.tsx`),
    wrap(c.file, c.imports, c.types, c.props, c.destructure, body)
  );
  console.log(`Wrote ${c.file}.tsx`);
}

for (const c of sorted) {
  const [rs, re] = c.replace;
  newLines = [...newLines.slice(0, rs - 1), ...c.replacement.split("\n"), ...newLines.slice(re)];
}

let mainText = newLines.join("\n");
if (!mainText.includes('import GrammarToneDrawer')) {
  mainText = mainText.replace(
    'import ResumeLivePreviewPanel from "./playground/ResumeLivePreviewPanel";',
    `import ResumeLivePreviewPanel from "./playground/ResumeLivePreviewPanel";
import GrammarToneDrawer from "./playground/GrammarToneDrawer";
import ReadabilityDrawer from "./playground/ReadabilityDrawer";
import SkillConsistencyDrawer from "./playground/SkillConsistencyDrawer";`
  );
}

fs.writeFileSync(MAIN, mainText);
console.log("Main lines:", mainText.split("\n").length);
