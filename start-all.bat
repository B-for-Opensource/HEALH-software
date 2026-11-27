@echo off
title HEAL Clinic - Dev Launcher
cls
echo ================================================================
echo    HEAL CLINIC MANAGEMENT SUITE - LOCAL DEV LAUNCHER
echo ================================================================
echo.

set "SCRIPT_DIR=%~dp0"
if exist "%SCRIPT_DIR%Backend-python" (
    set "FINAL_DIR=%SCRIPT_DIR%"
) else (
    set "FINAL_DIR=%SCRIPT_DIR%FINAL\"
)

echo [1/5] Launching FastAPI Backend (Port 8000)...
start "[HEAL 8000] FastAPI Backend" cmd /k "cd /d %FINAL_DIR%Backend-python && title [HEAL 8000] FastAPI Backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/5] Launching Core Clinic Frontend (Port 3000)...
start "[HEAL 3000] Core Clinic Frontend" cmd /k "cd /d %FINAL_DIR%Frontend && title [HEAL 3000] Core Clinic Frontend && npm run dev -- --host 127.0.0.1 --port 3000"

echo [3/5] Launching HRMS & Workforce Suite (Port 3001)...
start "[HEAL 3001] HRMS & Workforce Suite" cmd /k "cd /d %FINAL_DIR%Frontend-HRMS && title [HEAL 3001] HRMS Suite && npm run dev -- --host 127.0.0.1 --port 3001"

echo [4/5] Launching Pharmacy & Dispensary OS (Port 3002)...
start "[HEAL 3002] Pharmacy & Dispensary OS" cmd /k "cd /d %FINAL_DIR%Frontend-Pharmacy && title [HEAL 3002] Pharmacy OS && npm run dev -- --host 127.0.0.1 --port 3002"

echo [5/5] Launching Patient Health Portal (Port 3003)...
start "[HEAL 3003] Patient Health Portal" cmd /k "cd /d %FINAL_DIR%Frontend-Patient && title [HEAL 3003] Patient Portal && npm run dev -- --host 127.0.0.1 --port 3003"

echo.
echo ================================================================
echo    ALL 5 SERVICES LAUNCHED!
echo ================================================================
echo    * Core Clinic App:       http://localhost:3000
echo    * HRMS & Workforce App:  http://localhost:3001
echo    * Pharmacy App:          http://localhost:3002
echo    * Patient Portal App:    http://localhost:3003
echo    * FastAPI Backend API:   http://localhost:8000
echo    * Swagger API Docs:      http://localhost:8000/docs
echo ================================================================
echo.
echo This window can now be closed. Each service has its own dedicated window.
echo To stop everything anytime, double-click stop-all.bat
echo.
pause
