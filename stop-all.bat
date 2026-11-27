@echo off
title HEAL Clinic - Stop All Services
cls
echo ================================================================
echo    STOPPING ALL HEAL CLINIC SERVICES (8000, 3000, 3001, 3002, 3003)...
echo ================================================================
echo.

for %%P in (8000 3000 3001 3002 3003) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr /R ":%%P .*LISTENING"') do (
        echo [x] Stopping process on port %%P (PID %%a)...
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo.
echo ================================================================
echo    ALL HEAL CLINIC SERVICES STOPPED!
echo ================================================================
echo.
pause
