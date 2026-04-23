@echo off
setlocal
cd /d "%~dp0"

if exist "runner\launch-standalone.cjs" (
  echo Starting local standalone draft...
  node runner\launch-standalone.cjs
  exit /b 0
)

if not exist "frontend\dist-standalone\index.html" (
  echo [1/2] Building standalone package...
  call npm run build:standalone
  if errorlevel 1 (
    echo Build failed.
    pause
    exit /b 1
  )
)

echo [2/2] Starting local standalone draft...
node scripts\launch-standalone.cjs

exit /b 0
