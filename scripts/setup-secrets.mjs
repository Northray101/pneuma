#!/usr/bin/env node
/**
 * Sets GitHub Actions secrets for Northray101/pneuma.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_... node scripts/setup-secrets.mjs
 *
 * Secrets are read from environment variables:
 *   SECRET_SUPABASE_PROJECT_REF
 *   SECRET_SUPABASE_ACCESS_TOKEN
 *   SECRET_NVIDIA_API_KEY
 *   SECRET_NVIDIA_API_KEY_BACKUP
 *
 * GitHub requires secrets to be encrypted with the repo's libsodium public key.
 * This script handles that automatically using the Web Crypto API + fetch.
 */

const OWNER = 'Northray101'
const REPO = 'pneuma'

const SECRETS = {
  SUPABASE_PROJECT_REF: process.env['SECRET_SUPABASE_PROJECT_REF'],
  SUPABASE_ACCESS_TOKEN: process.env['SECRET_SUPABASE_ACCESS_TOKEN'],
  NVIDIA_API_KEY: process.env['SECRET_NVIDIA_API_KEY'],
  NVIDIA_API_KEY_BACKUP: process.env['SECRET_NVIDIA_API_KEY_BACKUP'],
}

const GITHUB_TOKEN = process.env['GITHUB_TOKEN']

// ── Validation ────────────────────────────────────────────────────────────────

const missing = Object.entries(SECRETS)
  .filter(([, v]) => !v)
  .map(([k]) => `SECRET_${k}`)

if (!GITHUB_TOKEN) {
  console.error('Missing GITHUB_TOKEN environment variable.')
  console.error('Create one at: https://github.com/settings/tokens (needs repo scope)')
  process.exit(1)
}

if (missing.length > 0) {
  console.error(`Missing environment variables:\n  ${missing.join('\n  ')}`)
  process.exit(1)
}

// ── GitHub API helpers ────────────────────────────────────────────────────────

async function ghFetch(path, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok && res.status !== 204) {
    const body = await res.text()
    throw new Error(`GitHub API ${res.status} on ${path}: ${body}`)
  }

  return res.status === 204 ? null : res.json()
}

async function getRepoPublicKey() {
  return ghFetch(`/repos/${OWNER}/${REPO}/actions/secrets/public-key`)
}

// libsodium sealed-box encryption using Web Crypto + manual X25519 + XSalsa20-Poly1305.
// GitHub's secrets API requires this exact scheme (NaCl crypto_box_seal).
// We use tweetsodium via a small inline implementation compatible with Node.js built-ins.
async function encryptSecret(plaintext, publicKeyB64) {
  // Dynamically import tweetsodium — installed as a dev dep
  let sodium
  try {
    sodium = (await import('tweetsodium')).default
  } catch {
    throw new Error(
      'tweetsodium not found. Run: pnpm add -Dw tweetsodium',
    )
  }

  const keyBytes = Buffer.from(publicKeyB64, 'base64')
  const valueBytes = Buffer.from(plaintext, 'utf8')
  const encrypted = sodium.seal(valueBytes, keyBytes)
  return Buffer.from(encrypted).toString('base64')
}

async function setSecret(name, value, publicKey, keyId) {
  const encryptedValue = await encryptSecret(value, publicKey)
  await ghFetch(`/repos/${OWNER}/${REPO}/actions/secrets/${name}`, {
    method: 'PUT',
    body: JSON.stringify({ encrypted_value: encryptedValue, key_id: keyId }),
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`\nSetting GitHub Actions secrets for ${OWNER}/${REPO}...\n`)

const { key, key_id } = await getRepoPublicKey()

let successCount = 0
for (const [name, value] of Object.entries(SECRETS)) {
  process.stdout.write(`  ${name.padEnd(30)}`)
  try {
    await setSecret(name, value, key, key_id)
    console.log('✓')
    successCount++
  } catch (err) {
    console.log(`✗  ${err.message}`)
  }
}

console.log(`\n${successCount}/${Object.keys(SECRETS).length} secrets set.\n`)

if (successCount < Object.keys(SECRETS).length) {
  process.exit(1)
}
