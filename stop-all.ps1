<#
.SYNOPSIS
    HEAL Clinic Management Suite - Unified Shutdown Script
#>

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   🛑 STOPPING ALL HEAL CLINIC SERVICES...                     " -ForegroundColor Red
Write-Host "================================================================" -ForegroundColor Cyan

$ports = @(8000, 3000, 3001, 3002, 3003, 3004, 3005)

foreach ($p in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($conn in $conns) {
                $pidToKill = $conn.OwningProcess
                if ($pidToKill -gt 0) {
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                    Write-Host "   [✓] Stopped Port $p (PID $pidToKill)" -ForegroundColor Green
                }
            }
        }
    } catch {
        # ignore
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   ✨ ALL SERVICES HAVE BEEN STOPPED.                          " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
