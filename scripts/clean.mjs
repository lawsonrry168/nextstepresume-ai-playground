import fs from "fs";

for (const target of ["dist", "server.js", "server.cjs"]) {
  try {
    fs.rmSync(target, { recursive: true, force: true });
  } catch {
    // ignore missing paths
  }
}
