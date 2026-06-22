import fs from "fs";

const lines = fs
  .readFileSync(
    new URL("../src/components/ResumeSimulatorPlayground.tsx", import.meta.url),
    "utf8"
  )
  .split("\n");
const header = lines.slice(40, 2000).join("\n");
const names = new Set();
for (const m of header.matchAll(/const \[([a-zA-Z0-9_]+),/g)) names.add(m[1]);
for (const m of header.matchAll(
  /const (run[A-Za-z]+|handle[A-Za-z]+|trigger[A-Za-z]+|apply[A-Za-z]+|export[A-Za-z]+|save[A-Za-z]+|toggle[A-Za-z]+|clone[A-Za-z]+) =/g
))
  names.add(m[1]);

const chunk = lines.slice(2009, 2948).join("\n");
const used = [];
for (const name of names) {
  const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  if (re.test(chunk)) used.push(name);
}
console.log(used.sort().join("\n"));
