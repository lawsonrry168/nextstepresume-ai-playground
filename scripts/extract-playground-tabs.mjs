import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src/components");
const MAIN = path.join(SRC, "ResumeSimulatorPlayground.tsx");
const OUT_DIR = path.join(SRC, "playground");

const lines = fs.readFileSync(MAIN, "utf8").split("\n");

function sliceInner(start, end) {
  const chunk = lines.slice(start - 1, end);
  // Drop outer `{activeTab === 'x' && (` and closing `)}` if present
  let body = chunk.join("\n");
  return body;
}

function unindent(text, spaces = 8) {
  const prefix = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line.startsWith(prefix) ? line.slice(spaces) : line))
    .join("\n");
}

function buildComponent(name, propsType, body, extraImports = "") {
  return `import React from "react";
import { motion } from "motion/react";
import {
  FileText, Briefcase, GraduationCap, Code, Sparkles, Check,
  RefreshCw, TrendingUp, AlertCircle, AlertTriangle, Layout,
  Eye, Edit3, Printer, ArrowRight, User, Plus, Trash2, CheckCircle, Info,
  ChevronDown, Award, HeartHandshake, Languages, Maximize2, Minimize2, Grid, Layers, LayoutGrid,
  Bold, Italic, List, Cloud, Target, Undo, Volume2, Mic, MicOff, Wand2, Download, FileUp
} from "lucide-react";
import { ResumeData, AnalysisResult, TemplateStyle, GrammarToneResult, ReadabilityComplexityResult, SkillConsistencyResult, AIMatchAnalysisResult, TailorIntensity } from "../../types";
import ResumeTemplateRenderer from "../ResumeTemplateRenderer";
import { formatSalaryRange } from "../../lib/salaryBenchmark";
${extraImports}

export interface ${propsType} {
  // Props are passed from ResumeSimulatorPlayground — see usage site for wiring.
  [key: string]: unknown;
}

export default function ${name}(props: ${propsType}) {
  const p = props as Record<string, unknown>;
${Object.keys({}).length ? "" : "  // Destructure commonly used props inline via p.* in migrated JSX"}
  return (
${unindent(body, 4)}
  );
}
`;
}

// Simpler approach: use spread props with explicit destructuring generated later
function buildComponentV2(name, interfaceBody, destructureList, jsxBody) {
  return `import React from "react";
import { motion } from "motion/react";
import {
  FileText, Briefcase, GraduationCap, Code, Sparkles, Check,
  RefreshCw, TrendingUp, AlertCircle, AlertTriangle, Layout,
  Eye, Edit3, Printer, ArrowRight, User, Plus, Trash2, CheckCircle, Info,
  ChevronDown, Award, HeartHandshake, Languages, Maximize2, Minimize2, Grid, Layers, LayoutGrid,
  Bold, Italic, List, Target, Undo, Volume2, Mic, MicOff, Wand2, Download, FileUp, Cloud, HeartHandshake as HeartHandshakeIcon
} from "lucide-react";
import {
  ResumeData,
  AnalysisResult,
  TemplateStyle,
  GrammarToneResult,
  ReadabilityComplexityResult,
  SkillConsistencyResult,
  AIMatchAnalysisResult,
} from "../../types";
import ResumeTemplateRenderer from "../ResumeTemplateRenderer";
import { formatSalaryRange } from "../../lib/salaryBenchmark";

export interface ${name}Props {
${interfaceBody}
}

export default function ${name}({
${destructureList}
}: ${name}Props) {
  return (
${unindent(jsxBody, 4)}
  );
}
`;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// Extract raw JSX bodies (motion.div blocks only)
const extractions = {
  MatchTabPanel: { start: 2949, end: 3400 },
  TailorTabPanel: { start: 3404, end: 3728, note: "includes empty + filled states" },
  ToolsTabPanel: { start: 3732, end: 5120 },
  PreviewConfigPanel: { start: 5125, end: 5218 },
  ResumeLivePreviewPanel: { start: 5224, end: 5927 },
};

for (const [name, { start, end }] of Object.entries(extractions)) {
  const body = lines.slice(start - 1, end).join("\n");
  const outPath = path.join(OUT_DIR, `${name}.tsx`);
  // Write placeholder - will be fixed by second pass
  fs.writeFileSync(outPath, `// PLACEHOLDER ${name}\n${body}`);
  console.log(`Wrote ${name}: ${end - start + 1} lines`);
}

console.log("Raw extraction done. Run fix-components pass.");
