# QMOOSA Universal AI-Web4-Blockchain Master Orchestrator (100/100 Reality Gate)
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " 🚀 QMOOSA UNIVERSAL ENGINEERING MASTER ORCHESTRATOR" -ForegroundColor Cyan
Write-Host " 🛡️ Reality Gate: CodeQL, Smoke, Regression, Sanity & Multi-Engine Sync" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $projectDir) { $projectDir = Get-Location }
Set-Location $projectDir

# Step 1: Deterministic Integration Test
Write-Host "`n[1/6] Running Core Cryptographic & Quantum Tests..." -ForegroundColor Yellow
node test.js
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Core tests failed!" -ForegroundColor Red; exit 1 }

# Step 2: Automated Smoke Tests
Write-Host "`n[2/6] Running Automated Smoke Tests..." -ForegroundColor Yellow
node tests/smoke.test.js
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Smoke tests failed!" -ForegroundColor Red; exit 1 }

# Step 3: Regression Tests
Write-Host "`n[3/6] Running Regression Tests..." -ForegroundColor Yellow
node tests/regression.test.js
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Regression tests failed!" -ForegroundColor Red; exit 1 }

# Step 4: Mathematical Sanity & Invariant Tests
Write-Host "`n[4/6] Running Invariant & Sanity Tests..." -ForegroundColor Yellow
node tests/sanity.test.js
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Sanity tests failed!" -ForegroundColor Red; exit 1 }

# Step 5: CodeQL Static Security Audit
Write-Host "`n[5/6] Running CodeQL Static Security Audit..." -ForegroundColor Yellow
node tests/codeql_check.js
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Security audit failed!" -ForegroundColor Red; exit 1 }

# Step 6: Universal Smart Scaffold Engine (IPFS, Fleek, QuickNode, Smart Contracts, Adapters)
Write-Host "`n[6/6] Executing QMOOSA Universal Smart Scaffold Engine (6 Pillars)..." -ForegroundColor Yellow
node scaffold/cli.js all
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Scaffold execution failed!" -ForegroundColor Red; exit 1 }

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host " 🎉 ALL 6 REALITY GATES PASSED! AUDIT SCORE: 100/100 VERIFIED" -ForegroundColor Green
Write-Host " 📦 IPFS CIDs & Fleek Deployment Configs Generated" -ForegroundColor Green
Write-Host " 🌐 Launching Web Dashboard in Browser (http://localhost:3000)..." -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green

# Ensure port 3000 is clean if previously occupied by a detached node instance
$busyPort = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($busyPort) {
    Write-Host "ℹ️ Reclaiming port 3000 from previous instance (PID: $($busyPort.OwningProcess))..." -ForegroundColor Cyan
    Stop-Process -Id $busyPort.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 400
}

Start-Process "http://localhost:3000"
node server.js
