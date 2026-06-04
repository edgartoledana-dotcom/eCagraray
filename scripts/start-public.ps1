# e-Cagraray — Start with public internet access (temporary tunnel)
# For official 24/7 hosting, deploy to Fly.io using scripts\deploy.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  e-Cagraray Public Launch" -ForegroundColor Cyan
Write-Host "  Barangay Cagraray, Bato, Catanduanes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".output\server\index.mjs")) {
    Write-Host "Building application..." -ForegroundColor Yellow
    npm run build
}

$env:PORT = "4173"
$env:NODE_ENV = "production"

# Start server in background job
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    $env:PORT = "4173"
    $env:NODE_ENV = "production"
    node .output/server/index.mjs
}

Start-Sleep -Seconds 3

# Verify server is up
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4173/" -UseBasicParsing -TimeoutSec 10
    Write-Host "Server running (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Server failed to start" -ForegroundColor Red
    Stop-Job $serverJob -ErrorAction SilentlyContinue
    exit 1
}

Write-Host ""
Write-Host "Creating public internet tunnel..." -ForegroundColor Cyan
Write-Host "(This gives a shareable URL while this PC stays on)" -ForegroundColor Gray
Write-Host ""

# Start localtunnel and capture URL
npx --yes localtunnel --port 4173

# Cleanup on exit
Stop-Job $serverJob -ErrorAction SilentlyContinue
Remove-Job $serverJob -ErrorAction SilentlyContinue
