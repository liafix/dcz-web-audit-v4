#!/usr/bin/env bash
set -euo pipefail

[[ -f package.json ]] || { echo "Run this script from the dcz-webaudit-next project root." >&2; exit 1; }
[[ "$(node --version)" =~ ^v22\. ]] || { echo "Node.js 22.x is required. Current: $(node --version)" >&2; exit 1; }
npm_cli="$(npm root --global)/npm/bin/npm-cli.js"
[[ -f "$npm_cli" ]] || { echo "Unable to locate the npm CLI." >&2; exit 1; }
[[ "$(node "$npm_cli" --version)" == "10.9.4" ]] || { echo "npm 10.9.4 is required. Current: $(node "$npm_cli" --version)" >&2; exit 1; }

node scripts/verify-lockfile.mjs
node "$npm_cli" ci --include=dev --no-audit --no-fund
node "$npm_cli" run verify:workspace
node "$npm_cli" audit --omit=dev --audit-level=high
node "$npm_cli" run lint
node "$npm_cli" run typecheck
node "$npm_cli" run test
node "$npm_cli" run build
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git diff --check; fi
echo "RELEASE GATE PASS"
