import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const root = join(import.meta.dirname, "..", "src");

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (/\.(tsx?|css)$/.test(name)) files.push(p);
  }
  return files;
}

const replacements = [
  [/indigo-755/g, "emerald-700"],
  [/indigo-505/g, "emerald-600"],
  [/indigo-150/g, "emerald-100"],
  [/indigo-250/g, "emerald-200"],
  [/indigo-950/g, "emerald-950"],
  [/indigo-900/g, "emerald-900"],
  [/indigo-800/g, "emerald-800"],
  [/indigo-700/g, "emerald-700"],
  [/indigo-600/g, "emerald-600"],
  [/indigo-500/g, "emerald-500"],
  [/indigo-400/g, "emerald-400"],
  [/indigo-300/g, "emerald-300"],
  [/indigo-200/g, "emerald-200"],
  [/indigo-100/g, "emerald-100"],
  [/indigo-50/g, "emerald-50"],
  [/border-blue-600/g, "border-emerald-600"],
  [/text-blue-600/g, "text-emerald-600"],
  [/text-blue-700/g, "text-emerald-700"],
  [/bg-blue-600/g, "bg-emerald-600"],
  [/from-blue-50/g, "from-emerald-50"],
  [/to-indigo-50/g, "to-emerald-50"],
  [/via-indigo-50/g, "via-emerald-50"],
  [/from-blue-300/g, "from-emerald-300"],
  [/hover:border-blue-300/g, "hover:border-emerald-300"],
  [/border-blue-100/g, "border-emerald-100"],
  [/border-blue-105/g, "border-emerald-100"],
  [/bg-blue-50/g, "bg-emerald-50"],
  [/text-blue-600/g, "text-emerald-600"],
  [/gray-950/g, "slate-950"],
  [/gray-900/g, "slate-900"],
  [/gray-800/g, "slate-800"],
  [/gray-700/g, "slate-700"],
  [/gray-600/g, "slate-600"],
  [/gray-500/g, "slate-500"],
  [/gray-450/g, "slate-500"],
  [/gray-400/g, "slate-400"],
  [/gray-300/g, "slate-300"],
  [/gray-200/g, "slate-200"],
  [/gray-100/g, "slate-100"],
  [/gray-50/g, "slate-50"],
  [/min-h-screen/g, "min-h-[100dvh]"],
  [/h-screen/g, "min-h-[100dvh]"],
  [/bg-\[#F3F4F6\]/g, "bg-slate-100"],
  [/text-purple-755/g, "text-violet-700"],
  [/border-purple-150/g, "border-violet-100"],
];

let changed = 0;
for (const file of walk(root)) {
  let content = readFileSync(file, "utf8");
  let next = content;
  for (const [from, to] of replacements) {
    next = next.replace(from, to);
  }
  if (next !== content) {
    writeFileSync(file, next, "utf8");
    changed++;
    console.log("updated:", file);
  }
}
console.log(`Done. ${changed} files updated.`);
