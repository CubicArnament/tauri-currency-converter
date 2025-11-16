# CI/CD Pipeline Documentation

## Overview

Currency Converter использует GitHub Actions для автоматической сборки, тестирования и создания релизов.

## Workflows

### 1. **build-linux.yml** - Build Linux AppImage

**Триггеры:**
- Push на ветки: `master`, `main`, `develop`
- Все теги вида `v*` (например, `v0.1.0`)
- Pull Requests на основные ветки

**Что делает:**
1. ✅ Проверяет код (checkout)
2. ✅ Устанавливает Node.js 20 и кеширует зависимости
3. ✅ Устанавливает Rust stable toolchain
4. ✅ Устанавливает системные зависимости (clang, gtk3, webkit2gtk и т.д.)
5. ✅ Кеширует Rust артефакты для ускорения
6. ✅ Устанавливает npm зависимости
7. ✅ Собирает фронтенд (Svelte)
8. ✅ Собирает Rust/Tauri приложение
9. ✅ Создает AppImage
10. ✅ Загружает как артефакт
11. ✅ (На тег) Создает GitHub Release с AppImage

**Выход:**
- AppImage артефакт (доступен 30 дней)
- GitHub Release (если push на тег)

### 2. **build-windows.yml** - Build Windows EXE + MSI

**Триггеры:**
- Push на ветки: `master`, `main`, `develop`
- Все теги вида `v*` (например, `v0.1.0`)
- Pull Requests на основные ветки

**Что делает:**
1. ✅ Проверяет код (checkout)
2. ✅ Устанавливает Node.js 20 и кеширует зависимости
3. ✅ Устанавливает Rust stable toolchain (x86_64-pc-windows-msvc)
4. ✅ Проверяет наличие MSVC компилятора (cl.exe)
5. ✅ Кеширует Rust артефакты для ускорения
6. ✅ Устанавливает npm зависимости
7. ✅ Собирает фронтенд (Svelte)
8. ✅ Собирает Rust/Tauri приложение с MSVC
9. ✅ Создает Windows bundle (EXE + MSI инсталлятор)
10. ✅ Загружает артефакты
11. ✅ (На тег) Создает GitHub Release с EXE и MSI

**Выход:**
- EXE артефакт (доступен 30 дней)
- MSI инсталлятор артефакт (доступен 30 дней)
- GitHub Release (если push на тег)

**Среда:**
- `windows-latest` — автоматически установлены Visual Studio Build Tools, MSVC, link.exe
- Node.js 20 LTS
- Rust stable toolchain

**Пример:**
```bash
# Триггер сборку
git push origin master

# Или создать релиз
git tag v0.1.0
git push origin v0.1.0
```

### 2. **lint.yml** - Lint & Type Check

**Триггеры:**
- Push на основные ветки
- Все Pull Requests

**Что делает:**
1. ✅ Проверяет TypeScript/Svelte типы (`npm run check`)
2. ✅ Запускает Rust clippy (анализатор)
3. ✅ Проверяет код стиль Rust (`cargo fmt`)
4. ✅ Компилирует Rust проект

**Назначение:** Убедиться что код соответствует стандартам качества перед мерджем

### 3. **release.yml** - Draft Release

**Триггеры:**
- Только на теги вида `v*`

**Что делает:**
1. ✅ Создает GitHub Release
2. ✅ Добавляет описание из CHANGELOG.md (если есть)
3. ✅ Отмечает как prerelease если в теге есть `alpha`, `beta`, `rc`
4. ✅ Подготавливает инструкции для скачивания

**Пример Release:**
```
Currency Converter v0.1.0

## Changes
- Added 50+ currencies
- Implemented TTL cache (5 minutes)
- Improved UI/UX

## Downloads
- Linux AppImage: currency-converter-v0.1.0-x86_64.AppImage
- Windows Installer: Coming soon...
```

## Как использовать

### 1. Обычный коммит (запустит build-linux + lint)

```bash
git add .
git commit -m "feat: add new currencies"
git push origin master
```

GitHub Actions автоматически:
- ✅ Проверит код (lint)
- ✅ Соберет Linux AppImage
- ✅ Загрузит как артефакт

### 2. Создать релиз (запустит все workflows + release)

```bash
# Обновить версию в package.json
vim package.json
# Обновить версию в src-tauri/Cargo.toml
vim src-tauri/Cargo.toml

# Создать тег
git tag v0.2.0 -m "Release v0.2.0"

# Push
git push origin v0.2.0
```

GitHub Actions:
1. Соберет Linux AppImage
2. Создаст GitHub Release
3. Загрузит AppImage как asset релиза

### 3. Prerelease (alpha/beta/rc)

```bash
git tag v0.2.0-beta.1 -m "Beta release"
git push origin v0.2.0-beta.1
```

Release будет помечен как **Pre-release** ⚠️

## Артефакты

### Linux AppImage
- **Расположение:** `src-tauri/target/release/bundle/appimage/`
- **Имя:** `currency-converter-vX.X.X-x86_64.AppImage`
- **Размер:** ~70-100 MB (в зависимости от версии)
- **Хранение:** 30 дней в GitHub Actions

### GitHub Releases
- **URL:** `https://github.com/CubicArnament/tauri-currency-converter/releases`
- **Скачивание:** Прямой линк на AppImage
- **Статус:** Public доступ

## Системные зависимости (автоматически устанавливаются)

### Linux

Для Linux сборки используются:
- `clang` / `clang++` - компиляторы
- `lld` - линкер
- `libgtk-3-dev` - GTK UI библиотека
- `libwebkit2gtk-4.1-dev` - WebKit браузер движок
- `libappindicator3-dev` - система трея
- `librsvg2-dev` - SVG рендеринг
- `patchelf` - утилита для ELF файлов

### Windows

Для Windows сборки на `windows-latest` уже установлены:
- **Visual Studio Build Tools 2022+** с C++ support
- **MSVC компилятор** (cl.exe)
- **Linker** (link.exe)
- **Windows SDK**

Все необходимое уже есть, не требуется дополнительная установка!

## Кеширование

### npm cache
- Кеширует `node_modules/`
- Восстанавливается если `package-lock.json` не изменился

### Rust cache
- Кеширует `target/` директорию
- Значительно ускоряет повторные сборки
- Экономит ~5 минут на каждой сборке

## Времена сборки

| Этап | Первая сборка | Со включенным кешем |
|------|---------------|---------------------|
| Установка зависимостей | ~3-5 мин | ~1 мин |
| Сборка фронтенда | ~2-3 мин | ~1 мин |
| Сборка Rust (Linux) | ~8-10 мин | ~3-5 мин |
| Сборка Rust (Windows) | ~10-15 мин | ~5-8 мин |
| Создание AppImage | ~2-3 мин | ~2-3 мин |
| Создание EXE + MSI | ~3-5 мин | ~3-5 мин |
| **Всего Linux** | **~15-21 мин** | **~7-10 мин** |
| **Всего Windows** | **~18-26 мин** | **~9-12 мин** |

## Мониторинг

### GitHub Actions Dashboard
1. Перейти на https://github.com/CubicArnament/tauri-currency-converter
2. Вкладка **"Actions"**
3. Выбрать нужный workflow

### Статусы
- ✅ **Success** - успешная сборка/тест
- ❌ **Failed** - ошибка в сборке/тесте
- ⏭️ **Skipped** - workflow пропущен
- ⏳ **In progress** - выполняется сейчас

### Логи
- Кликнуть на run → выбрать job → смотреть логи каждого шага

## Troubleshooting

### Build failed: "clang not found"
**Решение:** Автоматически устанавливается в workflow, проверьте логи

### AppImage not found
**Решение:** 
- Проверьте что `npm run build` работает локально
- Проверьте что `cargo build --release` завершается успешно

### Release assets not uploaded
**Решение:**
- Убедитесь что используется правильный тег формат (`v*`)
- Проверьте что workflow `build-linux.yml` успешно завершился

### Кеш не работает
**Решение:**
- Кеш сбрасывается автоматически каждые 7 дней неиспользования
- Или при изменении `package-lock.json` / `Cargo.lock`

## Будущее расширения

- [ ] Windows сборка (MSVC)
- [ ] macOS сборка
- [ ] Автоматическое обновление релиза
- [ ] Код сигнинг для AppImage
- [ ] Нотаризация для macOS
- [ ] Загрузка на альтернативные хранилища (AUR, Snap Store)

## Полезные команды

### Проверить теги
```bash
git tag -l
```

### Создать/обновить теги
```bash
git tag -d v0.1.0           # Удалить локальный тег
git push origin --delete v0.1.0  # Удалить удаленный тег
git tag v0.1.0              # Создать новый тег
git push origin v0.1.0      # Push тег
```

### Скачать AppImage из релиза
```bash
# Через GitHub CLI
gh release download v0.1.0 -p "*x86_64.AppImage"

# Или вручную с GitHub Actions artifacts
```

## Контакты для вопросов

Если у вас возникнут проблемы:
1. Проверьте логи в GitHub Actions
2. Смотрите раздел "Troubleshooting" выше
3. Откройте Issue с подробным описанием ошибки

---

**Последнее обновление:** November 16, 2025
