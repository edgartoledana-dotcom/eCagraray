# Permanent hosting on Fly.io (Singapore) with persistent data storage.
# Requires: flyctl login + billing card on file (Fly verifies identity; free tier available).
#
# Usage: .\scripts\deploy.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "=== e-Cagraray — Fly.io Permanent Deploy ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: flyctl not found. Install from https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Red
    exit 1
}

$whoami = flyctl auth whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Opening Fly.io login..." -ForegroundColor Yellow
    flyctl auth login
}

Write-Host "Logged in as: $(flyctl auth whoami)" -ForegroundColor Green
Write-Host ""

Write-Host "Building application..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

$appExists = flyctl apps list 2>&1 | Select-String "ecagraray-app"
if (-not $appExists) {
    Write-Host "Creating Fly app 'ecagraray-app'..." -ForegroundColor Cyan
    flyctl apps create ecagraray-app 2>&1 | Tee-Object -Variable createOut
    if ($LASTEXITCODE -ne 0) {
        if ($createOut -match "payment information") {
            Write-Host ""
            Write-Host "Fly.io needs a payment method on file (used for verification; free tier available)." -ForegroundColor Yellow
            Write-Host "Opening billing page — add a card, then press Enter here to continue..." -ForegroundColor Yellow
            Start-Process "https://fly.io/dashboard/personal/billing"
            Read-Host "Press Enter after you have added billing"
            flyctl apps create ecagraray-app
            if ($LASTEXITCODE -ne 0) { exit 1 }
        } else {
            exit 1
        }
    }
}

$volumeExists = flyctl volumes list -a ecagraray-app 2>&1 | Select-String "ecagraray_data"
if (-not $volumeExists) {
    Write-Host "Creating persistent data volume (1 GB, Singapore)..." -ForegroundColor Cyan
    flyctl volumes create ecagraray_data --region sin --size 1 -a ecagraray-app -y
}

Write-Host "Deploying to Fly.io..." -ForegroundColor Cyan
flyctl deploy --config fly.toml -a ecagraray-app

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== PERMANENT LAUNCH SUCCESSFUL ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Public URL: https://ecagraray-app.fly.dev" -ForegroundColor White
    Write-Host "Login:      https://ecagraray-app.fly.dev/login" -ForegroundColor Cyan
    Write-Host "Register:   https://ecagraray-app.fly.dev/register" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Change default passwords after first login (admin / admin123, etc.)." -ForegroundColor Yellow
} else {
    Write-Host "Deployment failed." -ForegroundColor Red
    exit 1
}
