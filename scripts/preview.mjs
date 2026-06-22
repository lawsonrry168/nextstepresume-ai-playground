import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tsxCli = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");

const child = spawn("node", [tsxCli, "server.ts"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, PORT: "3013" },
  shell: false,
});

child.on("exit", (code) => process.exit(code ?? 0));
