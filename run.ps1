# Quantum-Cybernetic Crypto Engine Master Launch Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " 🚀 INITIALIZING QUANTUM-CYBERNETIC CRYPTO ENGINE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "1. Running Autonomous Verification Tests..." -ForegroundColor Yellow
node test.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n2. Launching Web Dashboard in Browser..." -ForegroundColor Green
    Start-Process "http://localhost:3000"
    
    Write-Host "`n3. Starting Quantum-Cybernetic Blockchain Server on port 3000..." -ForegroundColor Green
    node server.js
} else {
    Write-Host "`n❌ Tests failed. Please inspect logs." -ForegroundColor Red
}
