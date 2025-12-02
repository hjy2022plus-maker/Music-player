@echo off
setlocal enabledelayedexpansion

:: One-click start for mock API and Vite dev server
if not exist node_modules (
  echo [setup] Installing dependencies...
  npm install || goto :error
)

if "%MOCK_PORT%"=="" set "MOCK_PORT=4000"
if "%DEV_PORT%"=="" set "DEV_PORT=5173"

echo [start] Mock API on http://localhost:%MOCK_PORT% (auto-shifts if busy)
start "Mock API" cmd /k "set MOCK_PORT=%MOCK_PORT% && npm run mock"

echo [start] Frontend on http://localhost:%DEV_PORT%
start "Vite Dev" cmd /k "set DEV_PORT=%DEV_PORT% && npm run dev -- --host --port %DEV_PORT%"

echo Services launching in separate windows.
goto :eof

:error
echo Failed to install dependencies. Check npm output.
exit /b 1
