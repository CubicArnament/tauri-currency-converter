# Release Guide

Пошаговая инструкция по созданию новых релизов для Currency Converter.

## 📋 Перед релизом

### 1. Обновите версию

**В `package.json`:**
```bash
vim package.json
# Измените версию в поле "version"
```

**В `src-tauri/Cargo.toml`:**
```bash
vim src-tauri/Cargo.toml
# Измените версию в разделе [package]
```

### 2. Обновите CHANGELOG (опционально)

```bash
vim CHANGELOG.md
```

Формат:
```markdown
## v0.2.0 - 2025-11-16

### Added
- Feature 1
- Feature 2

### Fixed
- Bug fix 1

### Changed
- Change 1
```

### 3. Коммитьте изменения

```bash
git add package.json src-tauri/Cargo.toml CHANGELOG.md
git commit -m "chore: bump version to v0.2.0"
git push origin master
```

## 🚀 Создание релиза

### Создайте тег

```bash
# Обычный релиз
git tag v0.2.0 -m "Release v0.2.0: Add 50+ currencies, TTL cache"

# Или предварительный релиз (alpha/beta/rc)
git tag v0.2.0-beta.1 -m "Beta release"
```

### Push тега

```bash
git push origin v0.2.0
```

## ⚙️ Что происходит дальше

1. **GitHub Actions запускается:**
   - `build-linux.yml` - собирает AppImage
   - `lint.yml` - проверяет код
   - `release.yml` - создает GitHub Release

2. **Время сборки:** ~7-10 минут

3. **Результат:**
   - Linux AppImage загружается как asset релиза
   - Release создается на странице GitHub

## 📥 Скачивание релиза

### Для пользователей

Релизы доступны на странице:
https://github.com/CubicArnament/tauri-currency-converter/releases

### Скачать через GitHub CLI

```bash
gh release download v0.2.0 -p "*x86_64.AppImage"
```

### Скачать через curl

```bash
curl -L -o currency-converter.AppImage \
  "https://github.com/CubicArnament/tauri-currency-converter/releases/download/v0.2.0/currency-converter-v0.2.0-x86_64.AppImage"
chmod +x currency-converter.AppImage
./currency-converter.AppImage
```

## 🔖 Типы релизов

### Обычный релиз (stable)

```bash
git tag v0.2.0
git push origin v0.2.0
```

- ✅ Marked as **Latest Release**
- ✅ Рекомендуется для всех пользователей

### Предварительный релиз (prerelease)

```bash
# Alpha (в разработке)
git tag v0.2.0-alpha.1
git push origin v0.2.0-alpha.1

# Beta (почти готово)
git tag v0.2.0-beta.1
git push origin v0.2.0-beta.1

# Release Candidate (финальная проверка)
git tag v0.2.0-rc.1
git push origin v0.2.0-rc.1
```

- ⚠️ Marked as **Pre-release**
- ⚠️ Не показывается как "Latest Release"
- ⚠️ Рекомендуется для тестирования

## 📊 Мониторинг релиза

### 1. GitHub Actions

Смотрите сборку:
https://github.com/CubicArnament/tauri-currency-converter/actions

### 2. GitHub Releases

Смотрите финальный релиз:
https://github.com/CubicArnament/tauri-currency-converter/releases

### 3. Проверьте AppImage

```bash
# Скачайте и проверьте
curl -L -O "https://github.com/CubicArnament/tauri-currency-converter/releases/download/v0.2.0/currency-converter-v0.2.0-x86_64.AppImage"
chmod +x currency-converter-v0.2.0-x86_64.AppImage
./currency-converter-v0.2.0-x86_64.AppImage
```

## ♻️ Откатить релиз

### Удалить тег

```bash
# Локально
git tag -d v0.2.0

# На GitHub
git push origin --delete v0.2.0
```

### Удалить Release

1. Перейдите на https://github.com/CubicArnament/tauri-currency-converter/releases
2. Найдите релиз
3. Нажмите "Edit" → "Delete this release"

## 🔧 Встроенные скрипты

Нет специальных скриптов для релизинга, используйте git тэги напрямую.

## 📝 Чеклист перед релизом

- [ ] Все фичи завершены и протестированы
- [ ] Обновлена версия в `package.json`
- [ ] Обновлена версия в `src-tauri/Cargo.toml`
- [ ] Обновлен `CHANGELOG.md`
- [ ] Все коммиты закоммичены в master
- [ ] Локальные изменения закоммичены
- [ ] Создан тег с правильным форматом (`v*`)
- [ ] Тег загружен на GitHub
- [ ] GitHub Actions успешно завершился
- [ ] Проверен финальный AppImage

## 🚨 Troubleshooting

###릴리스 assets не загружены
**Проблема:** GitHub Release создан, но нет AppImage

**Решение:**
1. Проверьте логи `build-linux.yml`
2. Убедитесь что тег формата `v*`
3. Перезапустите workflow вручную или создайте новый тег

### Actions не запустился
**Проблема:** Workflow не триггерился

**Решение:**
1. Убедитесь что тег создан правильно: `v0.2.0`
2. Проверьте что push успешен: `git push origin v0.2.0`
3. Посетите https://github.com/CubicArnament/tauri-currency-converter/actions

### AppImage не запускается
**Проблема:** Скачан AppImage но не запускается

**Решение:**
```bash
chmod +x currency-converter-v0.2.0-x86_64.AppImage
./currency-converter-v0.2.0-x86_64.AppImage
# Или двойной клик в файловом менеджере
```

## 📞 Контакты

Вопросы по релизингу?
- Смотрите полную документацию: `.github/CI-CD.md`
- Откройте Issue на GitHub

---

**Последнее обновление:** November 16, 2025
