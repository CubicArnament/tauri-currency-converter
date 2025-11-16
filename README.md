# 💱 Currency Converter

<div align="center">

[![Build Linux](https://github.com/CubicArnament/tauri-currency-converter/actions/workflows/build-linux.yml/badge.svg?branch=master)](https://github.com/CubicArnament/tauri-currency-converter/actions/workflows/build-linux.yml)
[![Build Windows](https://github.com/CubicArnament/tauri-currency-converter/actions/workflows/build-windows.yml/badge.svg?branch=master)](https://github.com/CubicArnament/tauri-currency-converter/actions/workflows/build-windows.yml)
[![Lint & Type Check](https://github.com/CubicArnament/tauri-currency-converter/actions/workflows/lint.yml/badge.svg?branch=master)](https://github.com/CubicArnament/tauri-currency-converter/actions/workflows/lint.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE.md)

**Современное кроссплатформенное приложение для конвертации валют**

Построено на **Tauri** (Rust) и **SvelteKit** (Svelte)

[🚀 Быстрый старт](#-быстрый-старт) • [📦 Скачать](#-скачать) • [🛠 Разработка](#-разработка) • [📝 API](#-api)

</div>

---

## ✨ Возможности

| Функция | Описание |
|---------|---------|
| 🔄 **Двусторонняя конвертация** | Вводите в любое поле, результат обновляется в реальном времени |
| 🌍 **50+ валют** | Основные мировые, азиатские, американские, европейские и страны СНГ |
| ⚡ **Умный кеш** | Бекенд (5 мин TTL), фронтенд (200 последних конверсий) |
| 🌓 **Светлая/темная тема** | Автоматическое переключение с сохранением |
| 📡 **Работает без интернета** | Dev режим с mock данными |
| 💻 **Кроссплатформенность** | Windows (`.exe`, `.msi`), Linux (`AppImage`), macOS |
| ⚙️ **Быстрая разработка** | Debounce 200ms, реактивный Svelte, async Rust |
| 🎨 **Красивый UI** | Логотипы валют, спинер загрузки, индикатор кеша |

---

## 🚀 Быстрый старт

### Требования

- **Node.js 18+** и **npm**
- **Rust** и **cargo**

### Установка и запуск

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/CubicArnament/tauri-currency-converter.git
cd tauri-currency-converter

# 2. Установите зависимости
npm install

# 3. Запустите dev сервер
npm run dev

# 4. Или с Tauri бекендом (полное приложение)
npm run tauri:dev
```

Приложение откроется на **http://localhost:1420**.

---

## 📦 Скачать

### Готовые сборки

Скачайте последнюю версию для вашей платформы:

| Платформа | Формат | Ссылка |
|-----------|--------|--------|
| **Windows** | `.exe` | [GitHub Releases](https://github.com/CubicArnament/tauri-currency-converter/releases) |
| **Windows** | `.msi` | [GitHub Releases](https://github.com/CubicArnament/tauri-currency-converter/releases) |
| **Linux** | `AppImage` | [GitHub Releases](https://github.com/CubicArnament/tauri-currency-converter/releases) |

### Установка на Linux

```bash
# Скачайте AppImage
chmod +x currency-converter-v*.AppImage
./currency-converter-v*.AppImage
```

### Установка на Windows

Запустите `.exe` или `.msi` инсталлятор напрямую.

---

## 🌍 Поддерживаемые валюты

<details>
<summary><b>Нажмите для развертывания (50+ валют)</b></summary>

| Регион | Валюты |
|--------|--------|
| **Основные (5)** | USD, EUR, GBP, JPY, CHF |
| **Азия-Тихий океан (9)** | CNY, INR, SGD, HKD, AUD, NZD, THB, MYR, IDR |
| **Америки (5)** | CAD, MXN, BRL, ARS, CLP |
| **Европа (7)** | SEK, NOK, DKK, PLN, CZK, HUF, RON |
| **Африка & Ближний Восток (4)** | ZAR, SAR, AED, TRY |
| **Страны СНГ (9)** | RUB, KZT, UAH, BYN, AMD, GEL, UZS, KGS, TJS |

</details>

---

## 📦 Сборка

### Для Windows

```bash
npm run build:windows-msvc
```

**Результат:**
- `src-tauri/target/release/currency-converter.exe` — портативный exe
- `src-tauri/target/release/bundle/msi/currency-converter.msi` — инсталлятор

### Для Linux

```bash
npm run build:linux-clang
```

**Результат:** `src-tauri/target/release/bundle/appimage/currency-converter.AppImage`

### Для веба

```bash
npm run build
```

**Результат:** Статические файлы в `./build/`

---

## 💾 Кеширование

| Тип | Место | TTL | Размер | Статус |
|-----|-------|-----|--------|--------|
| **Бекенд** | Rust в памяти | 5 минут | до 1000 записей | Автоматический |
| **Фронтенд** | localStorage | нет | до 200 конверсий | Ручное очищение |

Кеш автоматически отмечается как **`(cached)`** в результатах.

---

## 🛠 Разработка

### Структура проекта

```
tauri-currency-converter/
├── src/                       # SvelteKit фронтенд
│   ├── routes/
│   │   ├── +layout.svelte     # Главный layout
│   │   ├── +page.svelte       # Главная страница
│   │   └── +page.css          # Стили
│   └── app.css                # Глобальные стили
│
├── src-tauri/                 # Tauri/Rust бекенд
│   ├── src/
│   │   ├── lib.rs             # API команды
│   │   └── main.rs            # Entry point
│   ├── Cargo.toml             # Rust зависимости
│   └── tauri.conf.json        # Tauri конфиг
│
├── scripts/                   # Скрипты сборки
│   ├── build-windows-msvc.ps1
│   └── build-linux-clang.sh
│
├── .github/workflows/         # CI/CD пайплайн��
│   ├── build-linux.yml        # Linux сборка
│   ├── build-windows.yml      # Windows сборка
│   ├── lint.yml               # Линтинг и проверки
│   ├── pr-checks.yml          # PR проверки
│   └── release.yml            # Релиз
│
└── package.json               # Node.js зависимости
```

### Скрипты разработки

```bash
npm run dev              # Dev сервер SvelteKit (http://localhost:1420)
npm run tauri:dev        # Dev приложение с Tauri (полное)
npm run build            # Сборка фронтенда
npm run check            # Проверка типов TypeScript/Svelte
npm run check:watch      # Проверка типов (watch mode)
npm run lint             # Линтинг кода
npm run format           # Форматирование кода
```

### Инструкции для разработки

Полные инструкции по разработке и сборке для Windows и Linux см. в [`DEVELOPMENT.md`](./DEVELOPMENT.md).

---

## 🔧 Технологический стек

<div align="center">

| Слой | Технология | Версия |
|------|-----------|--------|
| **Фронтенд** | SvelteKit, Svelte 5, Vite, TypeScript | Latest |
| **Бекенд** | Tauri 2, Rust, async/await | Latest |
| **API** | exchangerate-api.com | v4 |
| **UI** | CSS переменные, responsive design | — |
| **Сборка** | npm, cargo, GitHub Actions | — |

</div>

---

## 🎨 Особенности реализации

### ⚡ Реактивность

- Двусторонний binding между полями ввода
- Debounce 200ms для уменьшения API запросов
- Мгновенное обновление при переключении валют

### 🚀 Производительность

- Встроенный кеш Rust с TTL 5 минут
- localStorage кеш на фронтенде (200 последних конверсий)
- Минимизированные CSS и JavaScript
- Lazy loading компонентов

### 👥 User Experience

- Красивый спинер при загрузке
- Индикатор `(cached)` для кешированных результатов
- Переключение светлой/темной темы
- Форматирование чисел с `Intl.NumberFormat`
- Валидация ввода в реальном времени

---

## 📝 API

### Бекенд команды (Rust/Tauri)

```rust
// Получить список доступных валют с названиями
#[tauri::command]
async fn get_currencies() -> Result<HashMap<String, String>, String>

// Конвертировать валюту с кешированием
#[tauri::command]
async fn convert_currency(
    base_currency: String,
    target_currency: String,
    amount: f64
) -> Result<f64, String>
```

### Внешний API

**exchangerate-api.com v4:**
```
GET https://api.exchangerate-api.com/v4/latest/{CURRENCY}

Response:
{
  "rates": {
    "USD": 1.0,
    "EUR": 0.92,
    ...
  }
}
```

---

## 🐛 Отладка

### "Tauri not available" в dev режиме

Это нормально! Приложение использует mock данные:
- 50+ валют
- Фиксированный курс: 1 USD ≈ 0.92 EUR

Используйте `npm run tauri:dev` для полного приложения с реальным API.

### Решение проблем

Подробнее см. в [`DEVELOPMENT.md`](./DEVELOPMENT.md#-типичные-проблемы).

---

## ⚙️ CI/CD Pipeline

Проект использует **GitHub Actions** для автоматической сборки и релизов:

### Workflows

| Workflow | Триггер | Платформа | Результат | Релиз |
|----------|---------|-----------|-----------|-------|
| **build-linux** | Push / PR / Tag | Linux | AppImage (30 дн) | ✓ На tag |
| **build-windows** | Push / PR / Tag | Windows | EXE + MSI (30 дн) | ✗ Только artifact |
| **lint** | Push / PR | — | Код качество | — |
| **pr-checks** | Pull Request | — | Полные проверки | — |
| **release** | Tag `v*` | — | GitHub Release | ✓ На tag |

### Быстрый пример

```bash
# Автоматическая сборка Linux + Windows (артефакты)
git push origin master

# Создать релиз (сборка + GitHub Release с AppImage/EXE/MSI)
git tag v0.1.0
git push origin v0.1.0
```

**Статусы и артефакты:** https://github.com/CubicArnament/tauri-currency-converter/actions

---

## 📄 Лицензия

**MIT** — используйте свободно в коммерческих и личных проектах.

Подробнее см. [`LICENSE.md`](./LICENSE.md)

---

## 🔗 П��лезные ссылки

- 📚 [Tauri документация](https://tauri.app/)
- 🎨 [SvelteKit](https://kit.svelte.dev/)
- 💱 [exchangerate-api](https://www.exchangerate-api.com/)
- 🦀 [Rust](https://www.rust-lang.org/)
- 🔄 [CI/CD Workflows](./.github/workflows/)
- 📖 [Разработка](./DEVELOPMENT.md)
- 📋 [Changelog](./CHANGELOG.md)

---

<div align="center">

### Создано с ❤️ на Rust, Svelte и Tauri

**[⬆ Вернуться в начало](#-currency-converter)**

</div>
