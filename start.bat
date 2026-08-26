@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo Install Node.js 24.x, then run this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing Helix Scramjet dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Starting Helix Scramjet...
start "" http://localhost:8080/viewer.html
node server.js
