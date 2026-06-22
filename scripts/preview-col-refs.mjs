import fs from "fs";

const lines = fs
  .readFileSync(
    new URL("../src/components/ResumeSimulatorPlayground.tsx", import.meta.url),
    "utf8"
  )
  .split("\n");
const chunk = lines.slice(5223, 5927).join("\n");
const sets = [...chunk.matchAll(/\b(set[A-Z][a-zA-Z0-9]*)\b/g)].map((m) => m[1]);
const handlers = [...chunk.matchAll(/\b(handle[A-Z][a-zA-Z0-9]*|exportTo[A-Z][a-zA-Z]*)\b/g)].map(
  (m) => m[1]
);
const ids = [...chunk.matchAll(/\b([a-z][a-zA-Z0-9]{2,})\b/g)].map((m) => m[1]);
const freq = {};
for (const id of ids) freq[id] = (freq[id] || 0) + 1;
const common = Object.entries(freq)
  .filter(([k]) => !["className", "type", "button", "span", "div", "text", "white", "rounded"].includes(k))
  .sort((a, b) => b[1] - a[1])
  .slice(0, 40);
console.log("setters", [...new Set(sets)].sort().join(", "));
console.log("handlers", [...new Set(handlers)].sort().join(", "));
console.log("common", common.map(([k, v]) => k).join(", "));
