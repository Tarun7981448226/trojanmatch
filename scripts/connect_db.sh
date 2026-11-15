#!/bin/bash
# Connects your local TrojanMatch copy to its own Neon branch and sets up the
# tables. The connection string is read silently and only written to
# frontend/.env.local (gitignored); it is never printed.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Paste the TrojanMatch Neon branch connection string (input is hidden), then press Enter:"
read -rs DB_URL
echo
case "$DB_URL" in postgres*://*) ;; *) echo "That doesn't look like a Postgres connection string."; exit 1 ;; esac

echo "This will DELETE private SKYNET data (resumes, fit scores, your decisions) in that database."
echo "Only continue if it is the new 'trojanmatch' branch, NOT SKYNET's main branch."
read -rp "Type trojanmatch to continue: " CONFIRM
[ "$CONFIRM" = "trojanmatch" ] || { echo "Stopped. Nothing changed."; exit 1; }

psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f scripts/trojanmatch_setup.sql
echo "Jobs in the shared feed: $(psql "$DB_URL" -tAc 'select count(*) from jobs')"
echo "Account tables ready:    $(psql "$DB_URL" -tAc "select string_agg(table_name, ', ') from information_schema.tables where table_name like 'tm_%'")"

SECRET=$(openssl rand -base64 48 | tr -d '\n')
{
  echo "DATABASE_URL=$DB_URL"
  echo "SESSION_SECRET=$SECRET"
} > .env.local
chmod 600 .env.local
echo "Saved to frontend/.env.local. Restart the dev server to use it."
