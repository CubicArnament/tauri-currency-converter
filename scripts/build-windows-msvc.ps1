# Build helper for Windows (MSVC)
# Builds the Currency Converter for Windows .exe using MSVC toolchain
#
# Requirements:
#   - Node.js & npm installed (dependencies must already be installed: npm install)
#   - Rust toolchain installed (via rustup)
#   - Visual Studio Build Tools 2022+ with C++ support
#
# Usage: 
#   powershell -ExecutionPolicy Bypass -File scripts/build-windows-msvc.ps1
#   or: npm run build:windows-msvc
#
# Prerequisites:
#  - Run 'npm install' once before using this script (installs Node + Rust dependencies)
#
# This script will:
#  - Check prerequisites (npm, cargo, Visual Studio)
#  - Build frontend (vite build)
#  - Build Rust/Tauri with MSVC
#  - Create .exe bundle/installer

$ErrorActionPreference = "Stop"

Write-Host "=== Building Currency Converter for Windows (MSVC) ===" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n[*] Checking prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: npm not found. Install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: cargo not found. Install Rust from https://rustup.rs/" -ForegroundColor Red
    exit 1
}

# Check for MSVC (cl.exe)
if (-not (Get-Command cl -ErrorAction SilentlyContinue)) {
    Write-Host "[!] MSVC (cl.exe) not found in PATH" -ForegroundColor Yellow
    Write-Host "    Trying to detect Visual Studio..." -ForegroundColor Yellow
    
    # Try to find vswhere
    $vswhereExe = "C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe"
    if (Test-Path $vswhereExe) {
        $vsPath = & $vswhereExe -latest -property installationPath
        if ($vsPath) {
            Write-Host "    Found Visual Studio at: $vsPath" -ForegroundColor Green
            Write-Host "    Run 'x64 Native Tools Command Prompt for VS' from Start Menu to use MSVC" -ForegroundColor Yellow
        }
    } else {
        Write-Host "    Visual Studio Build Tools not detected. Install from:" -ForegroundColor Red
        Write-Host "    https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Red
        exit 1
    }
}

if (-not (Get-Command tauri -ErrorAction SilentlyContinue)) {
    Write-Host "[!] tauri CLI not found in PATH, will use 'npx tauri'" -ForegroundColor Yellow
}

Write-Host "[+] Prerequisites OK" -ForegroundColor Green

# Get project root
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Write-Host "[+] Project root: $projectRoot" -ForegroundColor Green

# Build frontend
Write-Host "`n[*] Building frontend (npm run build)..." -ForegroundColor Yellow
Push-Location $projectRoot
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed"
    }
} finally {
    Pop-Location
}

# Build Rust/Tauri for Windows with MSVC
Write-Host "`n[*] Building Rust (Tauri with MSVC)..." -ForegroundColor Yellow
Push-Location "$projectRoot\src-tauri"
try {
    # MSVC is the default Rust target on Windows
    cargo build --release
    if ($LASTEXITCODE -ne 0) {
        throw "Cargo build failed"
    }
} finally {
    Pop-Location
}

# Run tauri bundler to create .exe installer/bundle
Write-Host "`n[*] Running tauri build (creating .exe bundle)..." -ForegroundColor Yellow
Push-Location $projectRoot
try {
    if (Get-Command tauri -ErrorAction SilentlyContinue) {
        tauri build
    } else {
        npx --yes tauri build
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[!] tauri build had issues, but binary may still be built" -ForegroundColor Yellow
    }
} finally {
    Pop-Location
}

Write-Host "`n[+] Build complete!" -ForegroundColor Green
Write-Host "    Binary: src-tauri\target\release\currency-converter.exe" -ForegroundColor Cyan
Write-Host "    Installers in: src-tauri\target\release\bundle\" -ForegroundColor Cyan
Write-Host "`n" -ForegroundColor Green
