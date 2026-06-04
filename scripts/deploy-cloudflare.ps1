# Permanent hosting on Cloudflare Workers (free, no credit card)
# URL will be: https://ecagraray.<your-subdomain>.workers.dev

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "=== e-Cagraray — Cloudflare Permanent Deploy ===" -ForegroundColor Cyan
Write-Host ""

$whoami = npx wrangler whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Logging in to Cloudflare (complete the browser step)..." -ForegroundColor Yellow
    npx wrangler login
}

Write-Host "Logged in:" -ForegroundColor Green
npx wrangler whoami
Write-Host ""

# Create D1 database if wrangler.json still has placeholder id (after build)
$wranglerJsonPath = ".output/server/wrangler.json"
if (-not (Test-Path $wranglerJsonPath)) {
    Write-Host "ERROR: Run build first — $wranglerJsonPath not found" -ForegroundColor Red
    exit 1
}
$wranglerJson = Get-Content $wranglerJsonPath -Raw
if ($wranglerJson -match '"database_id": "local-ecagraray-db"') {
    Write-Host "Creating Cloudflare D1 database..." -ForegroundColor Cyan
    $createOut = npx wrangler d1 create ecagraray 2>&1 | Out-String
    Write-Host $createOut
    if ($createOut -match 'database_id = "([a-f0-9-]+)"') {
        $dbId = $Matches[1]
        $wranglerJson = $wranglerJson -replace '"database_id": "local-ecagraray-db"', "`"database_id`": `"$dbId`""
        Set-Content $wranglerJsonPath $wranglerJson -NoNewline
        Write-Host "Updated wrangler.json with database_id: $dbId" -ForegroundColor Green
    } else {
        Write-Host "Could not parse D1 database_id. Update .output/server/wrangler.json manually." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Building for Cloudflare Workers..." -ForegroundColor Cyan
$env:DEPLOY_TARGET = "cloudflare"
npm run build:cloudflare
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "Applying database migrations..." -ForegroundColor Cyan
Push-Location $PSScriptRoot\..
try {
    npx wrangler d1 migrations apply ecagraray --remote --config .output/server/wrangler.json
    if ($LASTEXITCODE -ne 0) { exit 1 }
} finally {
    Pop-Location
}

Write-Host "Deploying to Cloudflare (from .output/server)..." -ForegroundColor Cyan
Push-Location .output/server
try {
    npx wrangler deploy
    if ($LASTEXITCODE -ne 0) { exit 1 }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "=== PERMANENT LAUNCH SUCCESSFUL ===" -ForegroundColor Green
Write-Host ""
Write-Host "Your permanent URL is shown above (workers.dev)." -ForegroundColor White
Write-Host "Share it with Barangay Cagraray residents and officials." -ForegroundColor Yellow
Write-Host ""
Write-Host "Login: https://<your-workers-url>/login" -ForegroundColor Cyan
Write-Host "Register: https://<your-workers-url>/register" -ForegroundColor Cyan
