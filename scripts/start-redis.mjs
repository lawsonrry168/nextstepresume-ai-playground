import { spawn } from "child_process";
import { existsSync, readdirSync } from "fs";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseRedisPort() {
  const fromEnv = process.env.NSR_REDIS_PORT?.trim();
  if (fromEnv && /^\d+$/.test(fromEnv)) return Number(fromEnv);
  const url = process.env.NSR_REDIS_URL?.trim() || process.env.REDIS_URL?.trim();
  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.port) return Number(parsed.port);
      return parsed.protocol === "rediss:" ? 6380 : 6379;
    } catch {
      /* ignore */
    }
  }
  return 6379;
}

function findRedisServerExe() {
  const explicit = process.env.REDIS_SERVER_PATH?.trim();
  if (explicit && existsSync(explicit)) return explicit;

  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    const packagesRoot = path.join(localAppData, "Microsoft", "WinGet", "Packages");
    if (existsSync(packagesRoot)) {
      for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || !entry.name.includes("redis-windows")) continue;
        const packageDir = path.join(packagesRoot, entry.name);
        for (const child of readdirSync(packageDir, { withFileTypes: true })) {
          if (!child.isDirectory()) continue;
          const candidate = path.join(packageDir, child.name, "redis-server.exe");
          if (existsSync(candidate)) return candidate;
        }
      }
    }
  }

  return "redis-server";
}

function isPortOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const finish = (open) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(open);
    };
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    setTimeout(() => finish(false), 500);
  });
}

const port = parseRedisPort();
const host = "127.0.0.1";
const redisServer = findRedisServerExe();

if (await isPortOpen(port, host)) {
  console.log(`[redis:start] Redis already listening on ${host}:${port}`);
  process.exit(0);
}

console.log(`[redis:start] Starting ${redisServer} on ${host}:${port}`);
console.log("[redis:start] Press Ctrl+C to stop.");

const child = spawn(redisServer, ["--port", String(port), "--bind", host], {
  cwd: root,
  stdio: "inherit",
  shell: false,
});

child.on("error", (err) => {
  console.error(
    `[redis:start] Failed to launch Redis (${redisServer}). Install with:\n` +
      "  winget install taizod1024.redis-windows-fork\n" +
      "Or set REDIS_SERVER_PATH to redis-server.exe.",
  );
  console.error(err.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(0);
    return;
  }
  process.exit(code ?? 1);
});
