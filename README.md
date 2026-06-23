<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# NextStepResume.ai Playground (Hong Kong)

Ready for what's next? Craft your NextStep CV for **Hong Kong** — JobsDB HK, British English AI tailoring, and HK$ pricing.

Local playground for ATS resume optimisation, JD tailoring, and template rendering.

## Hong Kong features

- **JobsDB HK** search & import (default tab, Pro: 30 searches/mo)
- **HK$ pricing** — Starter free · Pro HK$88/mo · Max HK$188/mo · 30-day Pass HK$128
- **British English** AI prompts for corporate HK hiring
- **HK CV fields** — right to work, notice period, expected salary (HKD/month)
- **HKD salary benchmarks** (monthly)
- **WhatsApp follow-up** links in application tracker
- Locales: **English** + **繁體中文（香港）**

## Run Locally

View your app in AI Studio: https://ai.studio/apps/a22693ce-827d-4c8c-8e19-0debc6a63018

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and set your `GEMINI_API_KEY` (optional — the app runs in simulation mode without it):
   ```bash
   cp .env.example .env
   ```
3. Run the app:
   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Express + Vite dev server |
| `npm run build` | Build frontend and server bundle |
| `npm run start` | Run production server |
| `npm test` | Run Vitest unit tests |
| `npm run test:e2e` | Playwright smoke tests (starts dev server) |
| `npm run test:redis` | Redis quota integration tests (requires Redis) |
| `npm run redis:start` | Start local Redis (Windows winget path auto-detect) |
| `npm run lint` | TypeScript type check |
| `npm run clean` | Remove build artifacts |

## Windows Note

If the project folder path contains special characters (e.g. `&`), npm scripts invoke Node directly to avoid path parsing issues on Windows.
