@echo off
REM e-Cagraray — Start the system for community access
REM Run this on the barangay server/PC that stays powered on.

cd /d "%~dp0.."

echo.
echo ========================================
echo   e-Cagraray Community Launch
echo   Barangay Cagraray, Bato, Catanduanes
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is not installed. Download from https://nodejs.org
  exit /b 1
)

if not exist ".output\server\index.mjs" (
  echo Building application for production...
  call npm run build
  if errorlevel 1 exit /b 1
)

set PORT=4173
set NODE_ENV=production

echo Starting e-Cagraray server on port %PORT%...
echo.
echo Local access:    http://localhost:%PORT%
echo Network access:  http://YOUR-PC-IP:%PORT%
echo.
echo Share the network URL with residents on the same WiFi/LAN.
echo For internet access, run scripts\start-public.ps1 after this.
echo.
echo Press Ctrl+C to stop the server.
echo.

node .output/server/index.mjs
