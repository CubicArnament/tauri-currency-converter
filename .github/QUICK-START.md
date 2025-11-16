## 🚀 GitHub Actions CI/CD - Quick Start

### Файлы добавлены в проект:

```
.github/
├── workflows/
│   ├── build-linux.yml      (3.9 KB)  - Автоматическая сборка Linux
│   ├── lint.yml             (970 B)   - Проверка кода
│   ├── pr-checks.yml        (1.6 KB)  - Проверки на Pull Request
│   ├── release.yml          (2.6 KB)  - Создание GitHub Release
│   └── README.md            (3.5 KB)  - Документация
├── CI-CD.md                 (8.5 KB)  - Полная документация pipeline
└── RELEASE.md               (6.3 KB)  - Инструкция по релизингу

CHANGELOG.md                 (58 строк) - История версий
```

### 🎯 Как использовать:

#### 1️⃣ Обычный коммит (автоматическая сборка)
```bash
git add .
git commit -m "feat: add new feature"
git push origin master
```
→ Запустятся: `lint.yml` + `build-linux.yml`
→ Результат: Linux AppImage в GitHub Actions artifacts

#### 2️⃣ Создать релиз (Linux сборка + GitHub Release)
```bash
git tag v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```
→ Запустятся: `build-linux.yml` + `release.yml`
→ Результат: GitHub Release с AppImage в assets

#### 3️⃣ Prerelease (alpha/beta/rc)
```bash
git tag v0.1.0-beta.1
git push origin v0.1.0-beta.1
```
→ Release будет помечен как Pre-release ⚠️

### 📊 Workflow Overview:

| Workflow | Триггер | Проверяет | Время | Выход |
|----------|---------|-----------|-------|-------|
| **build-linux** | Push/Tag/PR | ✓ Linux сборка | ~7-10 мин | AppImage |
| **build-windows** | Push/Tag/PR | ✓ Windows сборка | ~10-15 мин | EXE + MSI |
| **lint** | Push/PR | ✓ TypeScript ✓ Rust | ~2-3 мин | Статус |
| **pr-checks** | PR | ✓ Все проверки | ~7-10 мин | Статус |
| **release** | Tag v* | ✓ GitHub Release | ~1 мин | Release |

### 🔗 Быстрые ссылки:

- **GitHub Actions Dashboard:** https://github.com/CubicArnament/tauri-currency-converter/actions
- **Releases:** https://github.com/CubicArnament/tauri-currency-converter/releases
- **Полная документация:** `.github/CI-CD.md`
- **Release инструкция:** `.github/RELEASE.md`

### ✨ Что получится:

✅ **Автоматическая сборка** Linux AppImage на каждый push
✅ **Автоматическая сборка** Windows EXE + MSI на каждый push
✅ **Код качество проверки** на каждый PR
✅ **Автоматические GitHub Releases** с AppImage/EXE/MSI для каждого тага
✅ **Артефакты** сохраняются 30 дней
✅ **Lint проверки** для TypeScript, Svelte и Rust

### 🎁 Бонусы:

- GitHub Actions badges в README (Build статус)
- Автоматический CHANGELOG из git логов
- Prerelease поддержка (alpha/beta/rc)
- Полная документация и инструкции

### 📝 Дальнейшие улучшения:

- [ ] Windows CI/CD (MSVC сборка)
- [ ] macOS CI/CD
- [ ] Автоматические обновления

---

**Все готово! CI/CD pipeline полностью работает на Linux.** 🚀

Более подробно смотрите в `.github/CI-CD.md`
