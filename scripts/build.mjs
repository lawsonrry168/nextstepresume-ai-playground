import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteCli = path.join(root, "node_modules", "vite", "bin", "vite.js");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: root, stdio: "inherit", shell: false });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

const esbuildBase = {
  bundle: true,
  platform: "node",
  format: "cjs",
  packages: "external",
  sourcemap: true,
};

await run("node", [viteCli, "build"]);
await esbuild.build({
  ...esbuildBase,
  entryPoints: [path.join(root, "server.ts")],
  outfile: path.join(root, "dist", "server.cjs"),
});
await esbuild.build({
  ...esbuildBase,
  entryPoints: [path.join(root, "server", "vercelExport.ts")],
  outfile: path.join(root, "api", "index.js"),
});
