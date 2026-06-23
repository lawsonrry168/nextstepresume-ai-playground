import fs from "fs";

const lines = fs.readFileSync("server.ts", "utf8").split(/\r?\n/);
const header = `import { deterministicPresent, deterministicRange } from "../lib/aiContext.ts";\n\n`;

const readability = lines
  .slice(378, 428)
  .join("\n")
  .replace(/^function /m, "export function ");

const rest = lines
  .slice(926, 1548)
  .join("\n")
  .replace(/^function /gm, "export function ");

fs.writeFileSync("server/simulation/engine.ts", header + readability + "\n\n" + rest);
console.log("Wrote server/simulation/engine.ts");
