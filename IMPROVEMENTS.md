Realtime conversion, caching and Windows build notes

- Realtime conversion: the UI converts automatically as you type in either the "Amount" (left) or "Converted to" (right) fields. There is a debounce (300ms) to avoid excessive network calls. Tweak `DEBOUNCE_MS` in `src/routes/+page.svelte` as needed.

- Caching: a small in-memory cache reduces duplicate requests for the same currency pair & amount. Cached results are used instantly and marked as `(cached)` in the result text.

- Loading indicator: a spinner appears next to the result while a conversion request is in-flight (`isConverting` flag).

- Build Windows from WSL: a helper script `scripts/build-windows.sh` and npm script `npm run build:windows` were added. The script cross-compiles the Rust/Tauri backend for `x86_64-pc-windows-gnu` using `mingw-w64`. See the script header for requirements (install `mingw-w64`, `rustup`, etc.).

Quick test steps

1. Run frontend dev server:

```bash
npm run dev
```

2. Open the app or use `npx tauri dev`.

3. Type into either field and watch the converted value update after ~300ms. Change currencies and use the swap button to validate behavior.

4. To build a Windows binary from WSL (optional):

```bash
# ensure dependencies in WSL: mingw-w64, rustup, cargo, npm
sudo apt update && sudo apt install -y mingw-w64 build-essential curl
# then
npm run build:windows
```

If you'd like debounce tuning, persisted cache (localStorage), or precision formatting changes, tell me and I'll add them.
