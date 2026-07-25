$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath ".\package.json")) {
    throw "Run this script from the dcz-webaudit-next project root."
}

& .\PREPARE_RELEASE.ps1
if ($LASTEXITCODE -ne 0) { throw "Release preparation failed." }

$projectRoot = (Get-Location).Path
$outputRoot = Join-Path (Split-Path $projectRoot -Parent) "DCZ_WebAudit_Final_Output"
$stagingRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("dcz-webaudit-release-" + [guid]::NewGuid().ToString("N"))
$packageDir = Join-Path $stagingRoot "dcz-webaudit-next"
$zipPath = Join-Path $outputRoot "DCZ_WebAudit_High_End_Revenue_Funnel_v4_Production.zip"
$shaPath = "$zipPath.sha256"

try {
    New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
    node .\scripts\stage-release.mjs $packageDir
    if ($LASTEXITCODE -ne 0) { throw "Release staging failed." }

    node .\scripts\verify-source.mjs --mode=release --root=$packageDir
    if ($LASTEXITCODE -ne 0) { throw "Strict staged-release verification failed." }

    node .\scripts\create-release-manifest.mjs $packageDir
    if ($LASTEXITCODE -ne 0) { throw "Manifest generation failed." }

    Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $shaPath -Force -ErrorAction SilentlyContinue
    Compress-Archive -LiteralPath $packageDir -DestinationPath $zipPath -CompressionLevel Optimal
    if (-not (Test-Path -LiteralPath $zipPath)) { throw "Production ZIP was not created." }

    $hash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
    "$hash  $(Split-Path $zipPath -Leaf)" | Set-Content -LiteralPath $shaPath -Encoding ascii
    $verified = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($verified -ne $hash) { throw "Production ZIP checksum verification failed." }

    Write-Host "FINAL RELEASE CREATED" -ForegroundColor Green
    Write-Host $zipPath
    Write-Host $shaPath
} finally {
    if (Test-Path -LiteralPath $stagingRoot) {
        Remove-Item -LiteralPath $stagingRoot -Recurse -Force
    }
}
