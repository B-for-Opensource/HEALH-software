<#
.SYNOPSIS
    HEAL Clinic Management Suite - Unified Dev Launcher (PowerShell)
.DESCRIPTION
    Launches 1 FastAPI backend and 4 React frontends in dedicated terminal windows.
    - Backend:   FastAPI Python Server   (Port 8000)
    - Frontend:  Core Clinic Frontend    (Port 3000)
    - HRMS:      HRMS and Workforce      (Port 3001)
    - Pharmacy:  Pharmacy and Dispensary (Port 3002)
    - Patient:   Patient Health Portal   (Port 3003)
#>

[CmdletBinding()]
param (
    [switch]$OpenBrowser = $false
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   HEAL CLINIC MANAGEMENT SUITE - LOCAL DEV LAUNCHER            " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$FinalDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path "$FinalDir\Backend-python")) {
    if (Test-Path "$FinalDir\FINAL\Backend-python") {
        $FinalDir = "$FinalDir\FINAL"
    } else {
        $FinalDir = "d:\HEAL\FINAL"
    }
}

$backendDir  = Join-Path $FinalDir "Backend-python"
$coreDir     = Join-Path $FinalDir "Frontend"
$hrmsDir     = Join-Path $FinalDir "Frontend-HRMS"
$pharmacyDir = Join-Path $FinalDir "Frontend-Pharmacy"
$patientDir  = Join-Path $FinalDir "Frontend-Patient"

function Release-Port {
    param ([int]$Port, [string]$ServiceName)
    $lines = netstat -ano | findstr /R ":$Port .*LISTENING"
    foreach ($line in $lines) {
        $parts = ($line.Trim() -split '\s+')
        $targetPid = $parts[-1]
        if ($targetPid -match '^\d+$' -and [int]$targetPid -gt 0) {
            Write-Host "   [!] Port $Port in use by PID $targetPid. Stopping previous $ServiceName..." -ForegroundColor Yellow
            Stop-Process -Id [int]$targetPid -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "[1/6] Checking and releasing ports (8000, 3000, 3001, 3002, 3003)..." -ForegroundColor Green
Release-Port -Port 8000 -ServiceName "FastAPI Backend"
Release-Port -Port 3000 -ServiceName "Core Frontend"
Release-Port -Port 3001 -ServiceName "HRMS Frontend"
Release-Port -Port 3002 -ServiceName "Pharmacy Frontend"
Release-Port -Port 3003 -ServiceName "Patient Portal Frontend"
Start-Sleep -Milliseconds 500

# 1. Start FastAPI Backend (Port 8000)
Write-Host "[2/6] Launching FastAPI Backend (Port 8000)..." -ForegroundColor Cyan
$arg1 = "/k `"cd /d `"$backendDir`" & title [HEAL 8000] FastAPI Backend & python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload`""
Start-Process cmd.exe -ArgumentList $arg1

# 2. Start Core Frontend (Port 3000)
Write-Host "[3/6] Launching Core Clinic Frontend (Port 3000)..." -ForegroundColor Cyan
$arg2 = "/k `"cd /d `"$coreDir`" & title [HEAL 3000] Core Clinic Frontend & npm run dev -- --host 127.0.0.1 --port 3000`""
Start-Process cmd.exe -ArgumentList $arg2

# 3. Start HRMS Frontend (Port 3001)
Write-Host "[4/6] Launching HRMS Frontend (Port 3001)..." -ForegroundColor Cyan
$arg3 = "/k `"cd /d `"$hrmsDir`" & title [HEAL 3001] HRMS Suite & npm run dev -- --host 127.0.0.1 --port 3001`""
Start-Process cmd.exe -ArgumentList $arg3

# 4. Start Pharmacy Frontend (Port 3002)
Write-Host "[5/6] Launching Pharmacy Frontend (Port 3002)..." -ForegroundColor Cyan
$arg4 = "/k `"cd /d `"$pharmacyDir`" & title [HEAL 3002] Pharmacy OS & npm run dev -- --host 127.0.0.1 --port 3002`""
Start-Process cmd.exe -ArgumentList $arg4

# 5. Start Patient Portal Frontend (Port 3003)
Write-Host "[6/6] Launching Patient Portal Frontend (Port 3003)..." -ForegroundColor Cyan
$arg5 = "/k `"cd /d `"$patientDir`" & title [HEAL 3003] Patient Portal & npm run dev -- --host 127.0.0.1 --port 3003`""
Start-Process cmd.exe -ArgumentList $arg5

Write-Host ""
Write-Host "Waiting for services to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 5

function Test-Service {
    param ([string]$Url, [string]$Name)
    try {
        $res = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Write-Host "   [OK] $Name is UP (HTTP $($res.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "   [..] $Name is starting up..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Service Health Status:" -ForegroundColor Yellow
Test-Service -Url "http://127.0.0.1:8000/health" -Name "FastAPI Backend  (Port 8000)"
Test-Service -Url "http://127.0.0.1:3000"        -Name "Core Clinic App  (Port 3000)"
Test-Service -Url "http://127.0.0.1:3001"        -Name "HRMS App         (Port 3001)"
Test-Service -Url "http://127.0.0.1:3002"        -Name "Pharmacy App     (Port 3002)"
Test-Service -Url "http://127.0.0.1:3003"        -Name "Patient Portal   (Port 3003)"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   ALL 5 SERVICES READY FOR LOCAL TESTING!                      " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   Core Clinic App:       http://localhost:3000" -ForegroundColor White
Write-Host "   HRMS and Workforce:    http://localhost:3001" -ForegroundColor White
Write-Host "   Pharmacy App:          http://localhost:3002" -ForegroundColor White
Write-Host "   Patient Portal App:    http://localhost:3003" -ForegroundColor White
Write-Host "   FastAPI Backend API:   http://localhost:8000" -ForegroundColor White
Write-Host "   Swagger API Docs:      http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "To stop all services anytime: .\stop-all.ps1 or stop-all.bat" -ForegroundColor Yellow
Write-Host ""

if ($OpenBrowser) {
    Start-Process "http://localhost:3000"
}
