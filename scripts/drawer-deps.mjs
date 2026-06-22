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
    ...chunk.matchAll(/\b(handle[A-Z][a-zA-Z0-9]*|apply[A-Z][a-zA-Z0-9]*)\b/g),
  ].map((m) => m[1]);
  const state = [...chunk.matchAll(/\b([a-z][a-zA-Z0-9]{2,})\b/g)]
    .map((m) => m[1])
    .filter((n) =>
      [
        "grammarResult",
        "readabilityResult",
        "skillConsistencyResult",
        "appliedSuggestions",
        "resumeData",
        "grammarChecking",
        "readabilityChecking",
        "skillConsistencyChecking",
      ].includes(n)
    );
  console.log(`--- ${start}-${end} (${end - start + 1} lines) ---`);
  console.log("setters", [...new Set(sets)].sort().join(", "));
  console.log("handlers", [...new Set(handlers)].sort().join(", "));
  console.log("state refs", [...new Set(state)].sort().join(", "));
}

analyze(2216, 2363);
analyze(2368, 2532);
analyze(2537, 2720);
