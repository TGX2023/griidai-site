@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)
node scripts/init-env.cjs
if errorlevel 1 (
  echo Could not prepare local environment configuration.
  pause
  exit /b 1
)
start "" http://localhost:3000
node server.cjs
pause
