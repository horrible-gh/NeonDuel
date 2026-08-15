$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }
Set-Location $root

$go = Get-Command go -ErrorAction SilentlyContinue
if (-not $go) {
    Write-Host '[ERROR] Go was not found in PATH.' -ForegroundColor Red
    Write-Host 'Install Go or add go.exe to PATH, then run this script again.'
    exit 1
}

$dist = Join-Path $root 'dist'
$out = Join-Path $dist 'NeonDuel.exe'

New-Item -ItemType Directory -Force -Path $dist | Out-Null

Write-Host 'Building NeonDuel...'
& go build -trimpath -ldflags='-s -w' -o $out .\main.go
if ($LASTEXITCODE -ne 0) {
    Write-Host '[ERROR] Build failed.' -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ''
Write-Host '[OK] Build complete' -ForegroundColor Green
Write-Host $out
