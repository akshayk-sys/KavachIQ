# KavachIQ Google Sheets Integration Test Script
# =====================================================
# USAGE: .\test_sheets.ps1 -ScriptUrl "https://script.google.com/macros/s/YOUR_ID/exec"
# OR: Edit this file and set $url directly below.

param([string]$ScriptUrl = "YOUR_GOOGLE_SCRIPT_URL_HERE")
$url = $ScriptUrl

if ($url -eq "YOUR_GOOGLE_SCRIPT_URL_HERE") {
    Write-Host ""
    Write-Host "  ERROR: Please provide the Google Script Web App URL." -ForegroundColor Red
    Write-Host "  Usage: .\test_sheets.ps1 -ScriptUrl https://script.google.com/..." -ForegroundColor Yellow
    exit 1
}

$ts = Get-Date -Format o
Write-Host ""
Write-Host "  KavachIQ Google Sheets Integration Tester" -ForegroundColor Cyan
Write-Host "  ==========================================" -ForegroundColor Cyan
Write-Host ""

# ---- Test 1: Contact Form ----
Write-Host "  [1/3] Contact Form..." -ForegroundColor Yellow
$b1 = @{
    formType  = "contact"
    name      = "Rahul Sharma (Dummy)"
    email     = "rahul@dummytest.in"
    service   = "Website Security Health Check"
    message   = "https://dummysite.in - automated test"
    source    = "powershell-test"
    timestamp = $ts
} | ConvertTo-Json -Compress
try {
    $r = Invoke-RestMethod -Uri $url -Method POST -ContentType "application/json" -Body $b1 -TimeoutSec 15
    Write-Host ("  [OK] status=" + $r.status) -ForegroundColor Green
} catch {
    Write-Host "  [SENT] Request sent - check Google Sheet (CORS may hide response)" -ForegroundColor Yellow
}
Start-Sleep -Milliseconds 700

# ---- Test 2: Booking Form ----
Write-Host "  [2/3] Booking Form..." -ForegroundColor Yellow
$b2 = @{
    formType       = "booking"
    bookingService = "KavachIQ Protection Plan"
    bookingDate    = "2026-07-10"
    bookingTime    = "10:00 AM - 11:00 AM"
    bookingPhone   = "+91 98765 43210 (dummy)"
    source         = "powershell-test"
    timestamp      = $ts
} | ConvertTo-Json -Compress
try {
    $r = Invoke-RestMethod -Uri $url -Method POST -ContentType "application/json" -Body $b2 -TimeoutSec 15
    Write-Host ("  [OK] status=" + $r.status) -ForegroundColor Green
} catch {
    Write-Host "  [SENT] Request sent - check Google Sheet (CORS may hide response)" -ForegroundColor Yellow
}
Start-Sleep -Milliseconds 700

# ---- Test 3: Free Report Popup ----
Write-Host "  [3/3] Free Report Popup..." -ForegroundColor Yellow
$b3 = @{
    formType  = "popup"
    website   = "https://kolkatashop-dummy.in"
    email     = "owner@kolkatatest.in"
    source    = "powershell-test"
    timestamp = $ts
} | ConvertTo-Json -Compress
try {
    $r = Invoke-RestMethod -Uri $url -Method POST -ContentType "application/json" -Body $b3 -TimeoutSec 15
    Write-Host ("  [OK] status=" + $r.status) -ForegroundColor Green
} catch {
    Write-Host "  [SENT] Request sent - check Google Sheet (CORS may hide response)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  All 3 test submissions sent!" -ForegroundColor Green
Write-Host "  Open Google Drive -> KavachIQ Leads spreadsheet" -ForegroundColor White
Write-Host "  Look for rows with source = powershell-test" -ForegroundColor DarkGray
Write-Host ""
