import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "src");

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (/\.(tsx?|css)$/.test(name)) files.push(p);
  }
  return files;
}

const cleanup = [
  [/border-indigo-105 border-emerald-100/g, "border-emerald-100"],
  [/text-indigo-650/g, "text-emerald-600"],
  [/text-gray-650/g, "text-slate-600"],
  [/text-gray-605/g, "text-slate-600"],
  [/text-gray-550/g, "text-slate-500"],
  [/divide-gray-205 divide-slate-200/g, "divide-slate-200"],
  [/text-gray-455 text-slate-400/g, "text-slate-400"],
  [/text-slate-805 text-slate-800/g, "text-slate-800"],
  [/bg-gray-150 bg-slate-200/g, "bg-slate-200"],
  [/border-gray-205/g, "border-slate-200"],
  [/border-gray-250 border-slate-200/g, "border-slate-200"],
  [/border-slate-250/g, "border-slate-200"],
  [/hover:bg-gray-155/g, "hover:bg-slate-100"],
  [/hover:bg-indigo-55/g, "hover:bg-emerald-50"],
  [/text-indigo-750 text-emerald-600/g, "text-emerald-600"],
  [/ z-55 /g, " z-50 "],
  [/sky-/g, "emerald-"],
];

for (const file of walk(root)) {
  let content = readFileSync(file, "utf8");
  let next = content;
  for (const [from, to] of cleanup) {
    next = next.replace(from, to);
  }
  if (next !== content) writeFileSync(file, next, "utf8");
}
console.log("Cleanup done.");
