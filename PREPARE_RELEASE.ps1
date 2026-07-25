$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath ".\package.json")) {
    throw "Run this script from the dcz-webaudit-next project root."
}

function Invoke-Gate {
    param([string]$Name, [scriptblock]$Command)
    Write-Host "==> $Name" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE." }
}

$nodeVersion = (& node --version).TrimStart("v")
$nodeMajor = [int]($nodeVersion.Split(".")[0])
if ($nodeMajor -ne 22) { throw "Node.js 22.x is required. Current version: $nodeVersion" }

$npmRoot = (& npm.cmd root --global).Trim()
$npmCli = Join-Path $npmRoot "npm\bin\npm-cli.js"
if (-not (Test-Path -LiteralPath $npmCli)) { throw "Unable to locate the npm CLI." }
$npmVersion = (& node $npmCli --version).Trim()
if ($npmVersion -ne "10.9.4") { throw "npm 10.9.4 is required. Current version: $npmVersion" }

Invoke-Gate "Lockfile validation" { node .\scripts\verify-lockfile.mjs }
Invoke-Gate "Clean dependency installation" { node $npmCli ci --include=dev --no-audit --no-fund }
Invoke-Gate "Workspace source and secret verification" { node $npmCli run verify:workspace }
Invoke-Gate "Production dependency audit" { node $npmCli audit --omit=dev --audit-level=high }
Invoke-Gate "ESLint" { node $npmCli run lint }
Invoke-Gate "TypeScript" { node $npmCli run typecheck }
Invoke-Gate "Unit tests" { node $npmCli run test }
Invoke-Gate "Next.js production build" { node $npmCli run build }

if ((Get-Command git -ErrorAction SilentlyContinue) -and (Test-Path -LiteralPath ".\.git")) {
    Invoke-Gate "Git whitespace verification" { git diff --check }
}

Write-Host "RELEASE GATE PASS" -ForegroundColor Green
