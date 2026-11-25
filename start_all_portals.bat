@echo off
echo ========================================================
echo   Starting HEAL Multi-Frontend & Python Backend Suite
echo ========================================================
echo.
echo [1/4] Starting FastAPI Python Backend (Port 8000)...
start "HEAL Backend API :8000" cmd /k "cd /d %~dp0Backend-python && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/4] Starting HEAL Clinic Core Frontend (Port 3000)...
start "HEAL Clinic Core :3000" cmd /k "cd /d %~dp0Frontend && npm run dev -- --port 3000"

echo [3/4] Starting HEAL HRMS & Workforce Frontend (Port 3001)...
start "HEAL HRMS Portal :3001" cmd /k "cd /d %~dp0Frontend-HRMS && npm run dev -- --port 3001"

echo [4/4] Starting HEAL Pharmacy & Dispensary Frontend (Port 3002)...
start "HEAL Pharmacy OS :3002" cmd /k "cd /d %~dp0Frontend-Pharmacy && npm run dev -- --port 3002"

echo.
echo ========================================================
echo All 3 Frontends and Backend API are booting up!
echo   * Backend API:       http://localhost:8000/docs
echo   * Clinic Core App:   http://localhost:3000
echo   * HRMS Suite App:    http://localhost:3001
echo   * Pharmacy OS App:   http://localhost:3002
echo ========================================================
pause
