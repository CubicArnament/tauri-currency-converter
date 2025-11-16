#!/usr/bin/env bash
set -euo pipefail

# Build helper for Linux using clang
# Builds the Currency Converter for Linux AppImage using clang
#
# Requirements:
#   - Node.js & npm installed
#   - Rust toolchain installed (via rustup)
#   - clang & clang++ installed (apt install clang)
#
# Usage: bash scripts/build-linux-clang.sh
#
# This script will:
#  - Install dependencies via npm install (Node + Rust)
#  - Build frontend (vite build)
#  - Build Rust/Tauri with clang toolchain and flags
#  - Create AppImage bundle

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo "Project root: $ROOT_DIR"

# Check prerequisites
echo "==> Checking prerequisites..."

command -v npm >/dev/null 2>&1 || { echo "ERROR: npm not found. Install Node.js/npm."; exit 1; }
command -v cargo >/dev/null 2>&1 || { echo "ERROR: cargo not found. Install rustup/cargo from https://rustup.rs"; exit 1; }
command -v clang >/dev/null 2>&1 || { echo "ERROR: clang not found. Install: sudo apt install clang"; exit 1; }
command -v clang++ >/dev/null 2>&1 || { echo "ERROR: clang++ not found. Install: sudo apt install clang"; exit 1; }

echo "[+] All prerequisites found"

# Install dependencies (installs both Node and Rust dependencies)
echo ""
echo "==> Installing dependencies (npm install)"
cd "$ROOT_DIR"
npm install

# Build frontend
echo ""
echo "==> Building frontend (npm run build)"
npm run build

# Build Tauri with clang and RUSTFLAGS for clang linker
echo ""
echo "==> Building Tauri (Linux AppImage with clang)"
export CC=clang
export CXX=clang++
export RUSTFLAGS="-C linker=clang -C link-arg=-fuse-ld=lld"

cd "$ROOT_DIR/src-tauri"

if command -v tauri >/dev/null 2>&1; then
  tauri build
elif command -v npx >/dev/null 2>&1; then
  npx --yes tauri build
else
  echo "ERROR: tauri CLI not found. Try: npm install -g @tauri-apps/cli"
  exit 1
fi

echo ""
echo "[+] Build complete!"
echo "    Check for AppImage in: src-tauri/target/release/bundle/appimage/"
echo "    Or binary in: src-tauri/target/release/currency-converter"
echo ""
