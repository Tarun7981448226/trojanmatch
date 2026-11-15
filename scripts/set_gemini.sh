#!/usr/bin/env bash
# Saves the Gemini API key for the JobMatch agent to .env.local and to
# Vercel production. The key is read hidden and never printed.
set -euo pipefail
cd "$(dirname "$0")/.."
read -rsp "Gemini API key (hidden): " key; echo
key="$(printf '%s' "$key" | tr -d '[:space:]')"
if [[ ${#key} -lt 20 ]]; then echo "That doesn't look like a Gemini key. Nothing saved."; exit 1; fi
touch .env.local
grep -v '^GEMINI_API_KEY=' .env.local > .env.local.tmp || true
printf 'GEMINI_API_KEY=%s\n' "$key" >> .env.local.tmp
mv .env.local.tmp .env.local; chmod 600 .env.local
npx -y vercel@latest env rm GEMINI_API_KEY production --yes >/dev/null 2>&1 || true
printf '%s' "$key" | npx -y vercel@latest env add GEMINI_API_KEY production >/dev/null 2>&1 && echo "Saved locally and on Vercel. Tell Claude 'gemini done'." || echo "Saved locally; Vercel step failed (tell Claude)."
