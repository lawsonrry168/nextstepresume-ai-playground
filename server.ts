import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createApp } from "./server/createApp.ts";

dotenv.config();

const app = createApp();
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("🛠️ Starting Express App in DEVELOPER mode...");
    const projectRoot = process.cwd();
    const vite = await createViteServer({
      configFile: false,
      root: projectRoot,
      envDir: projectRoot,
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          "@": projectRoot,
        },
      },
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("🚀 Starting Express App in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`📡 NextStepResume.ai Analyzer Node listening on port ${PORT}`);
  });
}

void startServer();
