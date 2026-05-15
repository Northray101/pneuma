# Pneuma

A personal assistant that is direct, remembers you, and controls your devices.

## Stack

| Layer | Tech |
|---|---|
| Backend / Auth / Realtime | Supabase (Edge Functions + Postgres) |
| AI | NVIDIA NIM (primary + backup key failover) |
| Desktop | Electron + React |
| CLI | Node.js |
| Monorepo | Turborepo + pnpm |

## Structure

```
apps/
  desktop/            Electron app (Mac + Windows)
  cli/                Terminal REPL
packages/
  types/              Shared Zod schemas (the contract between all packages)
  sdk/                Typed fetch client used by desktop and CLI
  ui/                 Shared React components
supabase/
  functions/
    _shared/          Shared utilities (NVIDIA client, auth, context builder)
    chat/             POST /chat — streaming SSE, multimodal support
    memory/           GET|POST|PATCH|DELETE /memory
    sync/             GET /sync/delta, POST /sync/ping
    devices/          GET /devices, POST /devices/register
  migrations/         Postgres schema
```

## Getting Started

### 1. Prerequisites

```bash
node >= 22
pnpm >= 9
supabase CLI   # brew install supabase/tap/supabase
deno >= 2      # for local Edge Function dev
```

### 2. Install

```bash
pnpm install
```

### 3. Supabase — local dev

```bash
supabase start
supabase db push
```

### 4. Set secrets

```bash
supabase secrets set NVIDIA_API_KEY=nvapi-...
supabase secrets set NVIDIA_API_KEY_BACKUP=nvapi-...
```

For production, link your project first:
```bash
supabase link --project-ref <your-ref>
supabase db push
supabase secrets set NVIDIA_API_KEY=... NVIDIA_API_KEY_BACKUP=...
```

### 5. Run Edge Functions locally

```bash
supabase functions serve
```

Functions are available at `http://localhost:54321/functions/v1/<name>`.

### 6. Desktop

Copy `.env.example` → `apps/desktop/.env.local` and fill in values.

```bash
pnpm --filter @pneuma/desktop dev
```

### 7. CLI

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=...
export PNEUMA_API_URL=https://your-project.supabase.co/functions/v1
export PNEUMA_DEVICE_ID=<uuid>
pnpm --filter @pneuma/cli dev
```

## NVIDIA Integration

All AI calls go through `supabase/functions/_shared/nvidia.ts`. The client:

1. Tries the **primary** `NVIDIA_API_KEY`
2. On 429/503/502 (rate-limited or overloaded), automatically falls back to `NVIDIA_API_KEY_BACKUP`

Models used:
| Purpose | Model |
|---|---|
| Main chat | `meta/llama-3.1-70b-instruct` |
| Vision / multimodal | `nvidia/llama-3.2-90b-vision-instruct` |
| Memory extraction | `meta/llama-3.1-8b-instruct` |

Send `imageUrl` in a chat request to auto-route to the vision model.

## Memory

Extracted automatically after each turn using the fast 8B model running async (`EdgeRuntime.waitUntil`). Manageable manually via the `/memory` function.

## Device Control

Actions run locally in the Electron main process. The assistant proposes an `action` block in its reply; the desktop parses it and executes via AppleScript (Mac) or PowerShell (Windows).

## Deploying

- **Edge Functions**: auto-deploys on push to `main` (`.github/workflows/deploy-functions.yml`)
- **Desktop**: builds `.dmg` + `.exe` on `v*` tag push (`.github/workflows/release-desktop.yml`)

## GitHub Secrets Required

| Secret | Description |
|---|---|
| `SUPABASE_PROJECT_REF` | Project reference ID from Supabase dashboard |
| `SUPABASE_ACCESS_TOKEN` | Personal access token for Supabase CLI |
| `NVIDIA_API_KEY` | Primary NVIDIA NIM API key |
| `NVIDIA_API_KEY_BACKUP` | Backup NVIDIA NIM API key |
| `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `CSC_LINK`, `CSC_KEY_PASSWORD` | Mac notarization |
