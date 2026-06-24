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
| `npm run test:ci` | Local mirror of CI unit job (lint + unit tests) |
| `npm run test:ci:full` | Run unit + optional redis + e2e (full pre-merge smoke) |
| `npm run test:e2e` | Playwright smoke tests (starts dev server) |
| `npm run test:redis` | Redis quota integration tests (requires Redis) |
| `npm run redis:start` | Start local Redis (Windows winget path auto-detect) |
| `npm run lint` | TypeScript type check |
| `npm run clean` | Remove build artifacts |

## Windows Note

If the project folder path contains special characters (e.g. `&`), npm scripts invoke Node directly to avoid path parsing issues on Windows.

## PR stack merge order

Merge open stacked PRs into `main` in order (**#1 → #2 → …**). Recent tail of the stack:

| PR | Phase | Branch |
|----|-------|--------|
| #15 | 14 Market banner | `pr/16-phase14-market-banner-ui` |
| #16 | 15 Redis script + E2E | `pr/17-phase15-redis-script-e2e` |
| #17 | 16 E2E helpers + Redis docs | `pr/18-phase16-redis-docs-e2e-helpers` |
| #18 | 17 JSON + visual PDF export | `pr/19-phase17-export-download-e2e` |
| #19 | 18 DOCX + ATS PDF export | `pr/20-phase18-docx-ats-export-e2e` |
| #20 | 19 Studio export E2E | `pr/21-phase19-studio-export-e2e` |
| #21 | 20 CI hygiene + local test:ci | `pr/22-phase20-ci-hygiene` |
| #22 | 21 Full CI runner + workflow concurrency | `pr/23-phase21-ci-full-workflow` |

After each merge, rebase or retarget the next PR if GitHub shows conflicts.

### Pre-merge smoke (local)

```bash
npm run test:ci          # lint + unit (CI unit job)
npm run test:ci:full     # unit + redis (skip if down) + e2e
npm run test:redis       # requires Redis (CI redis job)
npm run test:e2e         # Playwright (CI e2e job)
```

## Production deployment

Set `NSR_APP_MODE=production` and configure Stripe + Redis for multi-instance quota.

| Variable | Purpose |
|----------|---------|
| `NSR_APP_MODE` | `playground` (demo plan buttons) or `production` (Stripe checkout) |
| `NSR_QUOTA_STORE` | `memory` (default) or `redis` for multi-instance quota persistence |
| `NSR_RATE_LIMIT_STORE` | `memory` (default) or `redis` for distributed API rate limiting |
| `NSR_RATE_LIMIT_MAX` | Max `/api/*` requests per IP per minute (default `60`) |
| `NSR_REDIS_URL` | Redis connection string when NSR_QUOTA_STORE=redis or NSR_RATE_LIMIT_STORE=redis |
| `STRIPE_SECRET_KEY` | Stripe API secret |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `STRIPE_PRICE_PRO_MONTHLY` | Stripe Price ID for Pro (HK$88/mo) |
| `STRIPE_PRICE_MAX_MONTHLY` | Stripe Price ID for Max (HK$188/mo) |
| `APP_URL` | Public origin for Stripe success/cancel redirects |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Publishable anon key (exposed via `/api/config`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for JWT verification |
| `NSR_AUTH_REQUIRED` | `1` to require sign-in for `/api/*` when Supabase is configured |
| `GEMINI_API_KEY` | Live AI (optional simulation fallback) |

### Cloud sync (Phase 24)

When signed in with Supabase configured, resume workspace and application packages sync to PostgreSQL:

- `GET/PUT /api/sync/workspace`
- `GET/PUT /api/sync/application-packages`

Apply `supabase/migrations/20260624120000_workspace_sync.sql` after the profiles migration.

### Docker

```bash
docker build -t nextstepresume .
docker run --env-file .env -p 3000:3000 nextstepresume
```

### Production checklist (next phases)

- [x] Stripe Checkout + webhook → server plan authority
- [x] Lock client `/api/subscription/sync` for paid upgrades in production
- [x] Redis plan persistence on `setClientPlan`
- [x] Supabase Auth (JWT → user-scoped quota client)
- [x] PostgreSQL resume / application sync
- [x] Privacy policy & terms pages (`/privacy`, `/terms`)
- [x] Distributed rate limiting (Redis via `NSR_RATE_LIMIT_STORE=redis`)
