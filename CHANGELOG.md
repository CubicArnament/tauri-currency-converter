# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CI/CD pipeline with GitHub Actions (Linux builds)
- GitHub Actions workflows for linting and PR checks
- Release automation documentation

### Changed
- Script improvements and documentation updates

### Fixed
- Various code quality improvements

---

## [0.1.0] - 2025-11-16

### Added
- ✅ Basic currency conversion (two-way binding)
- ✅ 50+ supported currencies (major global, Asian, American, European, CIS)
- ✅ Backend TTL cache with 5 minute expiration
- ✅ Frontend localStorage cache (up to 200 conversions)
- ✅ Light/dark theme toggle with persistent storage
- ✅ Debounced API calls (200ms) for performance
- ✅ Loading spinner and cache indicator badges
- ✅ Number formatting with Intl.NumberFormat
- ✅ Cross-platform build scripts (Windows MSVC, Linux clang)
- ✅ Dev mode with mock data fallback
- ✅ TypeScript/Svelte type checking
- ✅ Comprehensive documentation (English + Russian)

### Technical Details
- **Frontend:** SvelteKit 5, Svelte, TypeScript, Vite, CSS Grid
- **Backend:** Tauri 2, Rust (async/await), reqwest, lazy_static
- **API:** exchangerate-api.com (50+ currencies)
- **Caching:** TTL-based backend cache + localStorage frontend cache
- **Build Targets:** 
  - Windows: MSVC → .exe + MSI installer
  - Linux: clang → AppImage (portable)
  - Web: Static files

### Known Limitations
- Windows CI/CD not yet implemented (manual builds only)
- macOS support not tested
- No cryptocurrency support (planned for future)

---

## Release Template

For new releases, copy the following template:

```markdown
## [X.X.X] - YYYY-MM-DD

### Added
- Feature 1
- Feature 2

### Changed
- Change 1

### Fixed
- Bug fix 1

### Removed
- Deprecated feature 1
```

---

**[Back to README](../README.md)**
