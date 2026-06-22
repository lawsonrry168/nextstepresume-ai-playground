import fs from "fs";

const lines = fs
  .readFileSync(
    new URL("../src/components/ResumeSimulatorPlayground.tsx", import.meta.url),
    "utf8"
  )
  .split("\n");
const chunk = lines.slice(2009, 2948).join("\n");
const calls = [
  ...chunk.matchAll(/\b([a-z][a-zA-Z0-9]*)\(/g),
].map((m) => m[1]);
const freq = {};
for (const c of calls) freq[c] = (freq[c] || 0) + 1;
const filtered = Object.entries(freq)
  .filter(([k]) => !["if", "map", "filter", "split", "join", "trim", "includes", "slice", "push", "set", "get", "parse", "stringify", "preventDefault", "stopPropagation", "focus", "select", "value", "target", "classList", "add", "remove", "toggle", "contains", "toLowerCase", "length", "find", "some", "every", "forEach", "keys", "values", "entries", "from", "isNaN", "max", "min", "round", "floor", "ceil", "abs", "log", "warn", "error"].includes(k))
  .sort((a, b) => b[1] - a[1]);
console.log(filtered.map(([k, v]) => `${k}(${v})`).join("\n"));
