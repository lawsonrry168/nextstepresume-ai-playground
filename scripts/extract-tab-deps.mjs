import fs from "fs";

const path = new URL(
  "../src/components/ResumeSimulatorPlayground.tsx",
  import.meta.url
);
const lines = fs.readFileSync(path, "utf8").split("\n");
const header = lines.slice(39, 1900).join("\n");
const declared = new Set();
for (const m of header.matchAll(/const \[([a-zA-Z0-9_]+),/g)) declared.add(m[1]);
for (const m of header.matchAll(
  /const (run[A-Za-z]+|handle[A-Za-z]+|trigger[A-Za-z]+|apply[A-Za-z]+|export[A-Za-z]+) =/g
))
  declared.add(m[1]);
for (const m of header.matchAll(/const (activeKeywordsList|missingKeywords|iconMap) =/g))
  declared.add(m[1]);

function usedIn(start, end) {
  const chunk = lines.slice(start - 1, end).join("\n");
  const used = [];
  for (const name of declared) {
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (re.test(chunk)) used.push(name);
  }
  return used.sort();
}

const sections = [
  [2948, 3401, "match"],
  [3731, 5121, "tools"],
  [5124, 5219, "preview"],
  [5224, 6248, "previewCol"],
];
for (const [s, e, n] of sections) {
  console.log(n + ":", usedIn(s, e).join(", "));
}
