#!/usr/bin/env bash
set -euo pipefail

[[ -f package.json ]] || { echo "Run this script from the dcz-webaudit-next project root." >&2; exit 1; }
./PREPARE_RELEASE.sh
command -v zip >/dev/null || { echo "The zip command is required." >&2; exit 1; }

root="$(pwd)"
output="$(dirname "$root")/DCZ_WebAudit_Final_Output"
staging="$(mktemp -d)"
package_dir="$staging/dcz-webaudit-next"
zip_path="$output/DCZ_WebAudit_High_End_Revenue_Funnel_v4_Production.zip"
trap 'rm -rf -- "$staging"' EXIT

mkdir -p "$output"
node scripts/stage-release.mjs "$package_dir"
node scripts/verify-source.mjs --mode=release --root="$package_dir"
node scripts/create-release-manifest.mjs "$package_dir"
rm -f -- "$zip_path" "$zip_path.sha256"
(cd "$staging" && zip -qr "$zip_path" dcz-webaudit-next)
sha256sum "$zip_path" > "$zip_path.sha256"
sha256sum --check "$zip_path.sha256"
echo "FINAL RELEASE CREATED"
echo "$zip_path"
echo "$zip_path.sha256"
