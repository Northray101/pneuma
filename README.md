# Pneuma

A personal assistant that is direct, remembers you, and controls your devices.

## Stack

| Layer | Tech |
|---|---|
| API | Cloudflare Workers + Hono |
| Database / Auth / Realtime | Supabase (Postgres) |
| AI | Claude (Anthropic) |
| Desktop | Electron + React |
| CLI | Node.js |
| Monorepo | Turborepo + pnpm |

## Structure

```
apps/
  desktop/     Electron app (Mac + Windows)
  cli/         Terminal REPL
services/
  api/         Cloudflare Worker — the only public backend
packages/
  types/       Shared Zod schemas (the contract between all packages)
  sdk/         Typed fetch client used by desktop and CLI
  ui/          Shared React components
supabase/
  migrations/  Postgres schema
```

## Getting Started

### 1. Prerequisites

```bash
node >= 22
pnpm >= 9
wrangler (npm i -g wrangler)
supabase CLI (brew install supabase/tap/supabase)
```

### 2. Install

```bash
pnpm install
```

### 3. Supabase

```bash
supabase start                          # local stack
supabase db push                        # apply migrations
```

For production: link your project (`supabase link`) then `supabase db push`.

### 4. Cloudflare Worker

```bash
cd services/api
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler dev                            # local dev
wrangler deploy                         # production
```

### 5. Desktop

Copy `.env.example` → `apps/desktop/.env.local` and fill in values.

```bash
pnpm --filter @pneuma/desktop dev
```

### 6. CLI

```bash
export SUPABASE_URL=...
export SUPABASE_ANON_KEY=...
export PNEUMA_API_URL=https://api.pneuma.app
export PNEUMA_DEVICE_ID=<your-device-uuid>
pnpm --filter @pneuma/cli dev
```

## Memory

Memories are extracted automatically after each conversation turn using a lightweight Haiku call running async in the Worker. You can also manage them manually via the `/memory` API.

## Device Control

Device actions run locally in the Electron main process — nothing executes on the server. Claude proposes an action block in its reply; the desktop app parses it, runs it via AppleScript (Mac) or PowerShell (Windows), and can feed the result back to Claude.

## Deploying

- **API**: auto-deploys on push to `main` (`.github/workflows/deploy-api.yml`)
- **Desktop**: builds `.dmg` + `.exe` on `v*` tag push (`.github/workflows/release-desktop.yml`)
