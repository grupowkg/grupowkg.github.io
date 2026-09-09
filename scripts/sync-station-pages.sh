#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"

# Do not overwrite or mix in an operator's in-progress work.
if [[ -n "$(git status --porcelain)" ]]; then
  echo 'Repository has local changes; skipping station-page sync.'
  exit 0
fi

git pull --ff-only origin master
node scripts/generate-station-pages.mjs

if [[ -z "$(git status --porcelain)" ]]; then
  echo 'Station pages are already current.'
  exit 0
fi

git add -A -- .
git diff --cached --check
git commit -m 'Sync WKG Play station pages'
git push origin master
