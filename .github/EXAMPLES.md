# Examples & Use Cases

Практические примеры использования CI/CD pipeline Currency Converter.

## 1. Локальная разработка + Push на GitHub

### Сценарий: Добавили новую функцию

```bash
# Работаете локально
echo "новый код" >> src/routes/+page.svelte

# Коммитьте изменения
git add .
git commit -m "feat: улучшена UI валют списка"

# Push на GitHub
git push origin master
```

**Что произойдет на GitHub:**
1. ✅ `build-linux.yml` соберет Linux AppImage (~7-10 мин)
2. ✅ `lint.yml` проверит код качество (~2-3 мин)
3. ✅ AppImage загружается как артефакт (30 дней хранения)

**Результат:** 
- Вы видите статус в Actions
- Коллеги могут скачать AppImage

### Скачивание артефакта

```bash
# Через GitHub CLI
gh release download latest --pattern "*x86_64.AppImage" 2>/dev/null || \
  gh run list --branch master --status completed --limit 1 | \
  awk '{print $1}' | xargs -I {} gh run download {} --pattern "*x86_64.AppImage"

# Или вручную: GitHub → Actions → Выбрать run → Download artifacts
```

---

## 2. Создание релиза для пользователей

### Сценарий: Вы готовы выпустить версию 0.1.0

```bash
# Обновите версии
vim package.json          # "version": "0.1.0"
vim src-tauri/Cargo.toml  # version = "0.1.0"

# Обновите CHANGELOG
vim CHANGELOG.md

# Коммитьте изменения
git add package.json src-tauri/Cargo.toml CHANGELOG.md
git commit -m "chore: bump version to 0.1.0"
git push origin master

# Создайте тег
git tag v0.1.0 -m "Release v0.1.0: Add 50+ currencies, TTL cache"

# Push тага
git push origin v0.1.0
```

**Что произойдет:**
1. ✅ `build-linux.yml` собирает AppImage (~7-10 мин)
2. ✅ `release.yml` создает GitHub Release
3. ✅ AppImage загружается как asset релиза
4. ✅ Release становится доступен для скачивания

**Результат:**
```
GitHub Release v0.1.0
├── Assets
│   └── currency-converter-v0.1.0-x86_64.AppImage
├── Changelog (из CHANGELOG.md)
└── Instructions для установки
```

### Пользователь скачивает релиз

```bash
# Ссылка на релиз
https://github.com/CubicArnament/tauri-currency-converter/releases/tag/v0.1.0

# Или скачать через CLI
curl -L -O "https://github.com/CubicArnament/tauri-currency-converter/releases/download/v0.1.0/currency-converter-v0.1.0-x86_64.AppImage"

chmod +x currency-converter-v0.1.0-x86_64.AppImage
./currency-converter-v0.1.0-x86_64.AppImage
```

---

## 3. Prerelease (alpha/beta/rc)

### Сценарий: Хотите поделиться beta версией для тестирования

```bash
git tag v0.2.0-beta.1 -m "Beta: new features for testing"
git push origin v0.2.0-beta.1
```

**Результат:**
- Release помечен как **Pre-release** ⚠️
- Не показывается как "Latest Release"
- Идеально для раннего тестирования

---

## 4. Pull Request Workflow

### Сценарий: Коллега добавил новую функцию

```bash
# Коллега создал PR
# На GitHub → New Pull Request

# GitHub Actions автоматически запускает pr-checks.yml
# Проверяет:
# ✓ TypeScript/Svelte типы
# ✓ Rust clippy + fmt
# ✓ Компиляция
# ✓ Сборка фронтенда

# Результаты отображаются в PR:
# "All checks have passed ✓"
# или
# "Some checks failed ✗"
```

**Если тесты провалились:**
```bash
# Коллега видит ошибку в PR
# Исправляет локально
git commit -m "fix: resolve type error"
git push origin feature-branch
# PR автоматически обновляется и re-runs checks
```

---

## 5. Мониторинг CI/CD

### Я хочу увидеть статус сборок

```bash
# Открыть GitHub Actions
https://github.com/CubicArnament/tauri-currency-converter/actions

# Или через CLI
gh run list --branch master --status completed --limit 10

# Или для PR
gh pr view <PR_NUMBER> --json statusCheckRollup
```

### Скачать логи

```bash
# Через GitHub CLI
gh run view <RUN_ID> --log

# Или вручную: GitHub → Actions → Run → Job → Expand steps
```

---

## 6. Troubleshooting CI/CD

### Сборка не начинается

```bash
# Проверьте что тег правильный
git tag -l | grep v0

# Переstage и push заново
git push origin --force v0.1.0
```

### AppImage не найден в релизе

```bash
# Проверьте логи build-linux.yml
# GitHub → Actions → build-linux.yml run → Выбрать job

# Убедитесь что npm run build завершился успешно
npm run build  # локально

# Убедитесь что cargo build успешен
cd src-tauri && cargo build --release
```

### GitHub Release не создан

```bash
# Проверьте что запущен release.yml
# GitHub → Actions → release.yml

# Логи должны показать:
# "Creating release v0.1.0"
# "Uploaded asset: currency-converter-v0.1.0-x86_64.AppImage"
```

---

## 7. Интеграция с IDE

### VS Code

```json
{
  "extensions": [
    "GitHub.copilot",           // Copilot
    "GitHub.vscode-pull-request-github-issues"  // PR integration
  ]
}
```

Тогда в VS Code вы можете:
- ✓ Создавать/просматривать PRs
- ✓ Видеть статус Actions
- ✓ Просматривать комментарии

### Git hooks (опционально)

```bash
# Перед push, запустить локальные проверки
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
npm run check || exit 1
cd src-tauri && cargo fmt --check && cargo clippy -- -D warnings || exit 1
EOF

chmod +x .git/hooks/pre-push
```

---

## 8. Масштабирование CI/CD

### Добавить Windows сборку

```yaml
# .github/workflows/build-windows.yml
name: Build Windows
on:
  push:
    branches: [master]
  tags:
    - 'v*'
jobs:
  build-windows:
    runs-on: windows-latest
    # ... аналогично build-linux.yml но с MSVC
```

### Добавить macOS сборку

```yaml
# .github/workflows/build-macos.yml
name: Build macOS
on:
  push:
    branches: [master]
  tags:
    - 'v*'
jobs:
  build-macos:
    runs-on: macos-latest
    # ... аналогично build-linux.yml
```

---

## 9. Статистика и Анализ

### Время сборок

```bash
# Проверить средний time
gh run list --branch master --status completed --limit 100 | \
  awk '{print $NF}' | sort | uniq -c
```

### Успешные vs провальные сборки

```bash
gh run list --branch master --limit 100 | grep COMPLETED | wc -l
gh run list --branch master --limit 100 | grep FAILED | wc -l
```

---

## 10. Лучшие практики

### ✅ DO:
- Коммитьте часто, пушьте регулярно
- Используйте PR для всех изменений
- Пишите хорошие commit messages
- Обновляйте CHANGELOG перед релизом
- Используйте семантическое версионирование (v1.2.3)

### ❌ DON'T:
- Не форсируйте теги (git push --force)
- Не игнорируйте проваленные тесты
- Не делайте огромных коммитов
- Не запускайте release без тестирования
- Не обновляйте версию без плана

---

## Дополнительная информация

- 📖 Полная CI/CD документация: `.github/CI-CD.md`
- 🚀 Release инструкция: `.github/RELEASE.md`
- 📝 Workflow документация: `.github/workflows/README.md`

---

**Последнее обновление:** November 16, 2025
