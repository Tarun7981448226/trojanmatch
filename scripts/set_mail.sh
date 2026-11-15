#!/usr/bin/env bash
# Turns on password-reset emails: saves a Gmail address and its app password
# to .env.local. The app password is read hidden and never printed.
set -euo pipefail
cd "$(dirname "$0")/.."
read -rp "Gmail address that sends the emails: " user
read -rsp "16-letter app password (hidden, spaces are fine): " pass; echo
# Google's copy can carry non-breaking spaces; keep letters only.
pass="$(printf '%s' "$pass" | LC_ALL=C tr -cd 'A-Za-z')"
if [[ ${#pass} -ne 16 ]]; then
  echo "Got ${#pass} letters, expected 16. Nothing saved."
  echo "Tip: copy the code again, or type it in by hand (spaces are fine)."
  exit 1
fi
touch .env.local
grep -v -e '^SMTP_USER=' -e '^SMTP_PASS=' .env.local > .env.local.tmp || true
printf 'SMTP_USER=%s\nSMTP_PASS=%s\n' "$user" "$pass" >> .env.local.tmp
mv .env.local.tmp .env.local; chmod 600 .env.local
echo "Saved."
