import fs from "fs";

const lines = fs
  .readFileSync(
    new URL("../src/components/ResumeSimulatorPlayground.tsx", import.meta.url),
    "utf8"
  )
  .split("\n");

function analyze(start, end) {
  const chunk = lines.slice(start - 1, end).join("\n");
  const sets = [...chunk.matchAll(/\b(set[A-Z][a-zA-Z0-9]*)\b/g)].map((m) => m[1]);
  const handlers = [
    ...chunk.matchAll(
      /\b(handle[A-Z][a-zA-Z0-9]*|export[A-Z][a-zA-Z0-9]*|run[A-Z][a-zA-Z0-9]*|trigger[A-Z][a-zA-Z0-9]*|apply[A-Z][a-zA-Z0-9]*|toggle[A-Z][a-zA-Z0-9]*|save[A-Z][a-zA-Z0-9]*)\b/g
    ),
  ].map((m) => m[1]);
  console.log(`--- ${start}-${end} ---`);
  console.log("setters", [...new Set(sets)].sort().join(", "));
  console.log("handlers", [...new Set(handlers)].sort().join(", "));
}

analyze(2010, 2948);
analyze(2968, 3292);
