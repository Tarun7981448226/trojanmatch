#!/usr/bin/env bash
# Creates the Trojan JobMatch tables and writes .env.local.
# The connection string is read hidden and never printed.
set -euo pipefail
cd "$(dirname "$0")/.."
read -rsp "Neon (Postgres) connection string (hidden): " url; echo
[[ "$url" == postgres* ]] || { echo "That doesn't look like a Postgres connection string."; exit 1; }
DATABASE_URL="$url" node -e '
const fs = require("fs");
const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
const statements = fs.readFileSync("scripts/schema.sql", "utf8").split(/;\s*\n/).map((s) => s.trim()).filter((s) => s && !/^(--[^\n]*\n?)+$/.test(s));
(async () => { for (const s of statements) await sql.query(s); console.log("Tables ready."); })();'
touch .env.local
grep -v -e '^DATABASE_URL=' -e '^SESSION_SECRET=' .env.local > .env.local.tmp || true
printf 'DATABASE_URL=%s\nSESSION_SECRET=%s\n' "$url" "$(openssl rand -base64 48 | tr -d '\n')" >> .env.local.tmp
mv .env.local.tmp .env.local && chmod 600 .env.local
echo "Saved to .env.local."
