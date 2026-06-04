# Permanent FREE hosting - Cloudflare Workers (no credit card)
# URL: https://ecagraray.<subdomain>.workers.dev

Set-Location $PSScriptRoot\..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  e-Cagraray - FREE Permanent Launch" -ForegroundColor Cyan
Write-Host "  Cloudflare Workers (no billing/card)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
npx wrangler whoami *> $null
$loggedIn = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevEap

if (-not $loggedIn) {
    Write-Host "Sign in to Cloudflare (free account, no card required):" -ForegroundColor Yellow
    Write-Host "  Browser will open - click Allow / Authorize." -ForegroundColor Gray
    npx wrangler login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Login failed. Create a token at:" -ForegroundColor Yellow
        Write-Host "  https://dash.cloudflare.com/profile/api-tokens" -ForegroundColor Gray
        exit 1
    }
}

Write-Host "Cloudflare account:" -ForegroundColor Green
npx wrangler whoami
Write-Host ""

Write-Host "Building for Cloudflare Workers..." -ForegroundColor Cyan
$env:DEPLOY_TARGET = "cloudflare"
npm run build:cloudflare
if ($LASTEXITCODE -ne 0) { exit 1 }

$wranglerJsonPath = ".output/server/wrangler.json"
if (-not (Test-Path $wranglerJsonPath)) {
    Write-Host "ERROR: Build did not produce $wranglerJsonPath" -ForegroundColor Red
    exit 1
}

$wranglerJson = Get-Content $wranglerJsonPath -Raw
if ($wranglerJson -match '"database_id": "local-ecagraray-db"') {
    $dbId = $null
    Write-Host "Checking for existing D1 database..." -ForegroundColor Cyan
    $listOut = npx wrangler d1 list 2>&1
    foreach ($line in $listOut) {
        if ($line -match '([a-f0-9-]{36}).*?ecagraray') {
            $dbId = $Matches[1]
            Write-Host "Found existing database ID: $dbId" -ForegroundColor Green
            break
        }
    }

    if (-not $dbId) {
        Write-Host "Creating free D1 database..." -ForegroundColor Cyan
        $createOut = npx wrangler d1 create ecagraray 2>&1 | Out-String
        Write-Host $createOut
        if ($createOut -match 'database_id = "([a-f0-9-]+)"') {
            $dbId = $Matches[1]
            Write-Host "Database created: $dbId" -ForegroundColor Green
        } elseif ($createOut -match 'already exists') {
            $listOut2 = npx wrangler d1 list 2>&1
            foreach ($line in $listOut2) {
                if ($line -match '([a-f0-9-]{36}).*?ecagraray') {
                    $dbId = $Matches[1]
                    Write-Host "Found existing database ID after conflict: $dbId" -ForegroundColor Green
                    break
                }
            }
        }
    }

    if ($dbId) {
        $wranglerJson = $wranglerJson -replace '"database_id": "local-ecagraray-db"', ('"database_id": "' + $dbId + '"')
        Set-Content $wranglerJsonPath $wranglerJson -NoNewline
        Write-Host "Database configured: $dbId" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Could not find or create D1 database." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Applying database schema..." -ForegroundColor Cyan
if (Test-Path migrations) {
    Copy-Item -Path migrations -Destination .output/server/migrations -Recurse -Force
}
npx wrangler d1 migrations apply ecagraray --remote --config .output/server/wrangler.json
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "Publishing (permanent URL)..." -ForegroundColor Cyan
Push-Location .output/server
try {
    npx wrangler deploy --config wrangler.json
    if ($LASTEXITCODE -ne 0) { exit 1 }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "=== OFFICIAL LAUNCH COMPLETE ===" -ForegroundColor Green
Write-Host "Share the workers.dev URL with Barangay Cagraray." -ForegroundColor White
Write-Host "Login:  <url>/login" -ForegroundColor Cyan
Write-Host "Register: <url>/register" -ForegroundColor Cyan
