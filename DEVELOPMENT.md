# Currency Converter (Tauri + SvelteKit)

A cross-platform currency converter application built with Tauri (Rust backend) and SvelteKit (Svelte frontend).

## Features

✅ **Realtime Conversion** — Two-way currency conversion with debounced API calls (200ms)  
✅ **Caching** — In-memory cache + localStorage persistence (up to 200 entries)  
✅ **Theme Toggle** — Light/dark mode with persistent storage  
✅ **Offline Fallback** — Works in dev mode without Tauri backend  
✅ **Cross-Platform** — Windows (.exe), Linux (AppImage), macOS support  
✅ **Spinner & Badges** — Loading indicator and "cached" badge  
✅ **Number Formatting** — Intl.NumberFormat for proper display  

## Development

### Prerequisites

- **Node.js 18+** and npm
- **Rust** ([install via rustup](https://rustup.rs/))
- **Visual Studio Build Tools 2022+** (for Windows MSVC, optional)
- **clang** (for Linux, install: `sudo apt install clang`)

### Running Dev Server

```bash
npm install
npm run dev
```

This starts a Vite dev server on `http://localhost:1420`. The app works in dev mode with **fallback mock data** (no Tauri backend needed).

**Note:** In dev mode without Tauri, conversion uses a mock rate (1 USD ≈ 0.92 EUR) for demonstration.

### Running Tauri Dev (with backend)

To test with Tauri backend and real API:

```bash
npm install
npm run tauri:dev
```

This runs both frontend and Tauri backend, connecting to real currency API.

## Building

### Cross-Platform Builds

All scripts automatically:
- ✅ Check prerequisites (npm, cargo, compilers)
- ✅ Run `npm install` (installs Node + Rust dependencies)
- ✅ Build frontend
- ✅ Build Rust backend
- ✅ Create platform-specific bundle

#### Windows (.exe) — Run on Windows with MSVC

```powershell
npm run build:windows-msvc
```

Or manually:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-windows-msvc.ps1
```

**Requirements:**
- Visual Studio Build Tools 2022+ with C++ support
- Run from "x64 Native Tools Command Prompt for VS" or ensure cl.exe is in PATH

**Output:** `src-tauri/target/release/currency-converter.exe` + MSI installer

#### Linux (AppImage) — Run on Linux with clang

```bash
npm run build:linux-clang
```

Or manually:
```bash
bash scripts/build-linux-clang.sh
```

**Requirements:**
- clang compiler: `sudo apt install clang`

**Output:** `src-tauri/target/release/bundle/appimage/currency-converter.AppImage` (portable executable)

**Build uses:**
- `export CC=clang CXX=clang++`
- `export RUSTFLAGS="-C linker=clang -C link-arg=-fuse-ld=lld"` (forces clang linker)

### Production Build (Frontend only)

```bash
npm run build
```

Outputs static files to `./build/` directory (suitable for web hosting).

### Type Checking

```bash
npm run check        # Single check
npm run check:watch  # Watch mode
```

## Project Structure

```
src/
  routes/
    +page.svelte          # Main component
    +page.css             # Styles (separate file)
    +layout.js            # SvelteKit layout

src-tauri/
  src/
    lib.rs                # Tauri command handlers
    main.rs               # Tauri app entry
  Cargo.toml

scripts/
  build-windows-msvc.ps1  # PowerShell: Windows MSVC → .exe
  build-linux-clang.sh    # Bash: Linux clang → AppImage

package.json
vite.config.js
svelte.config.js
```

## Architecture

### Frontend (Svelte)

- **Reactive state** using Svelte `$state` runes
- **Effects** (`$effect`) for reactive theme application
- **Debounced conversion** (200ms) for performance
- **localStorage persistence** for cache and theme
- **Conditional Tauri invoke** with fallback for dev mode
- **CSS-in-JS theme switching** via `:global(.theme-dark)` CSS class

### Backend (Tauri/Rust)

- **get_currencies**: Fetches available currencies via Frankfurter API
- **convert_currency**: Calls Frankfurter API to get exchange rates
- Built with `reqwest` for HTTP requests

## Troubleshooting

### Theme not changing

The theme toggle button should switch light/dark mode. If not working:
1. Check browser console for errors
2. Ensure localStorage is enabled
3. Try hard refresh (Ctrl+Shift+R)

### "Tauri not available" warning in dev mode

This is **expected and harmless**. The app falls back to mock data for currency selection and conversion. It shows when running `npm run dev` without Tauri backend.

### Build errors on Windows

Ensure **Visual Studio Build Tools 2022** is installed with C++ support:
1. Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Run in "x64 Native Tools Command Prompt for VS"
3. Try: `npm run build:windows-msvc`

### Build errors on Linux

Ensure clang is installed:
```bash
sudo apt update && sudo apt install clang
npm run build:linux-clang
```

### PostCSS errors on dev server

This has been fixed by separating styles into `+page.css`. If issues persist:
```bash
rm -rf node_modules/.vite .svelte-kit
npm run dev
```

## Scripts Summary

| Script | Purpose | Output |
|--------|---------|--------|
| `npm run dev` | Dev server (SvelteKit only) | Local dev at http://localhost:1420 |
| `npm run tauri:dev` | Tauri dev (full app with backend) | App window + dev server |
| `npm run build` | Frontend build | Static files in `./build/` |
| `npm run tauri:build` | Tauri build (current platform) | Binary + bundle in `src-tauri/target/release/` |
| `npm run build:windows-msvc` | Windows cross-build | `.exe` + MSI installer |
| `npm run build:linux-clang` | Linux cross-build | AppImage executable |
| `npm run check` | TypeScript/Svelte check | Type validation |

## API Integration

The app uses the **Frankfurter API** (free, no auth required):
- Endpoint: `https://api.frankfurter.app/`
- Currencies: `/currencies`
- Conversion: `/latest?from=USD&to=EUR&amount=1`

## Cache

- **In-memory**: Map-based cache during session
- **localStorage**: Persists up to 200 conversion entries
- **Key format**: `FROM|TO|AMOUNT` (e.g., `USD|EUR|100.000000`)
- **Badge**: "cached" indicator appears when using cached result

## Theme

CSS variables in `:root` and `:global(.theme-dark)`:
- `--primary-color`: Main accent color
- `--secondary-color`: Background/input color
- `--text-color`: Text color
- `--white`: Background color
- `--shadow`: Box shadow

Switch theme via button in top-right corner.

## License

MIT
