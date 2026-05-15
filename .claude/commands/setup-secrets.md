# /setup-secrets — Configure GitHub Actions secrets for Pneuma

Your job is to collect the required secret values from the user and set them as GitHub Actions secrets on `Northray101/pneuma` by running `scripts/setup-secrets.mjs`.

## Step 1 — Collect values

Use `AskUserQuestion` to collect all of these in a single prompt (show all questions at once, not one at a time):

1. **GitHub Personal Access Token** — needs `repo` scope. Create at: https://github.com/settings/tokens/new?scopes=repo
2. **SUPABASE_PROJECT_REF** — the project ref from the Supabase URL. For `https://frwozbjygsxiapaselen.supabase.co` this is `frwozbjygsxiapaselen`.
3. **SUPABASE_ACCESS_TOKEN** — a Supabase Personal Access Token. Create at: https://supabase.com/dashboard/account/tokens. This is what the deploy workflow uses to push Edge Functions.
4. **NVIDIA_API_KEY** — primary NVIDIA NIM API key. Get at: https://build.nvidia.com (top-right → Get API Key).
5. **NVIDIA_API_KEY_BACKUP** — backup NVIDIA NIM key (can be a second key from the same account, or a different account). Used automatically if primary is rate-limited.

## Step 2 — Install tweetsodium if needed

```bash
pnpm add -Dw tweetsodium
```

## Step 3 — Run the script

Set the collected values as environment variables and run:

```bash
GITHUB_TOKEN="<github_pat>" \
SECRET_SUPABASE_PROJECT_REF="<value>" \
SECRET_SUPABASE_ACCESS_TOKEN="<value>" \
SECRET_NVIDIA_API_KEY="<value>" \
SECRET_NVIDIA_API_KEY_BACKUP="<value>" \
node scripts/setup-secrets.mjs
```

## Step 4 — Verify

After the script completes successfully, confirm with the user that all secrets are set by showing which ones passed (✓) and which failed (✗).

If any fail with a 401, the GitHub token is invalid or lacks `repo` scope.
If any fail with a 404, the repo name/owner is wrong — check `OWNER`/`REPO` constants in the script.

## Important

- Do NOT echo or log the actual secret values at any point.
- Do NOT store the values in any file.
- Unset the environment variables after the script finishes.
- After success, remind the user to delete the GitHub PAT if they created a temporary one just for this setup.
