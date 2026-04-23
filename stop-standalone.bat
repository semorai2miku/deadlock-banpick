@echo off
setlocal
cd /d "%~dp0"

if exist "runner\stop-standalone.cjs" (
  node runner\stop-standalone.cjs
  exit /b 0
)

node scripts\stop-standalone.cjs
