# Currency Converter - Development & Build Guide

**Currency Converter** — это кроссплатформенное приложение для конвертации валют, построенное на Tauri (Rust) и SvelteKit (Svelte/JavaScript).

## 📋 Требования для разработки

Для разработки и сборки приложения вам понадобятся:

### Общие требования (все платформы)
- **Node.js 18+** и **npm** — https://nodejs.org/
- **Rust** и **cargo** — установите через https://rustup.rs/

### Windows (MSVC)
- **Visual Studio Build Tools 2022+** с поддержкой C++ — https://visualstudio.microsoft.com/visual-cpp-build-tools/

### Linux (clang)
- **clang** и **clang++**:
  ```bash
  sudo apt update && sudo apt install clang
  ```

## 🚀 Быстрый старт

### 1. Установка зависимостей (один раз)

```bash
npm install
```

Это установит все Node.js и Rust зависимости.

### 2. Запуск dev сервера

**Вариант 1: Dev сервер без Tauri (быстро)**
```bash
npm run dev
```
Откроется приложение на http://localhost:1420 с mock данными (без Tauri бекенда).

**Вариант 2: Dev сервер с Tauri (полноценное приложение)**
```bash
npm run tauri:dev
```
Откроется окно приложения с реальным Tauri бекендом и API конвертацией.

## 🏗️ Сборка для продакшена

### Сборка фронтенда (web version)

```bash
npm run build
```

Статические файлы будут в папке `build/`.

### Сборка для Windows

**Требования:**
- Visual Studio Build Tools 2022+ (MSVC)
- Компилятор `cl.exe` в PATH
  
  **Если `cl.exe` не найден:** откройте "x64 Native Tools Command Prompt for VS" из меню Start

**Шаги сборки:**

1. Убедитесь, что dependencies установлены:
   ```bash
   npm install
   ```

2. Запустите сборку:
   ```bash
   npm run build:windows-msvc
   ```

   или вручную:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/build-windows-msvc.ps1
   ```

**Результаты:**
- Исполняемый файл: `src-tauri/target/release/currency-converter.exe`
- Инсталлятор MSI: `src-tauri/target/release/bundle/msi/`

### Сборка для Linux

**Требования:**
- `clang` и `clang++`:
  ```bash
  sudo apt update && sudo apt install clang
  ```

**Шаги сборки:**

1. Убедитесь, что dependencies установлены:
   ```bash
   npm install
   ```

2. Запустите сборку:
   ```bash
   npm run build:linux-clang
   ```

   или вручную:
   ```bash
   bash scripts/build-linux-clang.sh
   ```

**Результаты:**
- AppImage (portable): `src-tauri/target/release/bundle/appimage/currency-converter.AppImage`
- Бинарник: `src-tauri/target/release/currency-converter`

## 📁 Структура проекта

```
src/
  routes/
    +page.svelte          # Главный компонент приложения
    +page.css             # Стили
    +layout.js            # SvelteKit layout

src-tauri/
  src/
    lib.rs                # Tauri команды (get_currencies, convert_currency)
    main.rs               # Entry point
  Cargo.toml              # Rust зависимости

scripts/
  build-windows-msvc.ps1  # Скрипт сборки для Windows
  build-linux-clang.sh    # Скрипт сборки для Linux

package.json              # Node.js зависимости и скрипты
Cargo.toml               # Cargo workspace
```

## 🔧 npm Скрипты

| Скрипт | Описание | Платформа |
|--------|---------|-----------|
| `npm run dev` | Dev сервер SvelteKit | Все |
| `npm run tauri:dev` | Dev приложение с Tauri | Все |
| `npm run build` | Сборка фронтенда | Все |
| `npm run tauri:build` | Сборка Tauri (текущая платформа) | Все |
| `npm run build:windows-msvc` | Сборка для Windows (MSVC) | Windows |
| `npm run build:linux-clang` | Сборка для Linux (clang) | Linux |
| `npm run check` | Проверка типов TypeScript/Svelte | Все |
| `npm run check:watch` | Проверка типов в режиме watch | Все |

## 🌍 Поддерживаемые валюты (50+)

**Основные:** USD, EUR, GBP, JPY, CHF

**Азия-Тихий океан:** CNY, INR, SGD, HKD, AUD, NZD, THB, MYR, IDR

**Америки:** CAD, MXN, BRL, ARS, CLP

**Европа:** SEK, NOK, DKK, PLN, CZK, HUF, RON

**Африка & Ближний Восток:** ZAR, SAR, AED, TRY

**Страны СНГ:** RUB, KZT, UAH, BYN, AMD, GEL, UZS, KGS, TJS

## 💾 Кеширование данных

### Фронтенд (localStorage)
- Хранит последние 200 конверсий в браузер-памяти
- Кеш автоматически сохраняется в `localStorage`
- Помечаются как "(cached)" в результатах

### Бекенд (Rust) - **TTL 5 минут**
- Глобальный кеш в памяти с автоматическим истечением
- Ключ: `BASE_CURRENCY|TARGET_CURRENCY|AMOUNT`
- Автоматически очищает устаревшие записи каждые 5 минут
- Уменьшает нагрузку на API и ускоряет повторные запросы

## 🎨 Темы

Приложение поддерживает светлую и темную тему:
- Переключатель в верхнем правом углу
- Тема сохраняется в `localStorage`
- CSS переменные в `:root` и `.theme-dark`

## 🔄 API Интеграция

Используется **exchangerate-api.com** (бесплатный, без авторизации):
- Endpoint: `https://api.exchangerate-api.com/v4/latest/{CURRENCY}`
- Поддерживает все 50+ валют
- Без лимитов для dev/personal use
- Результаты кешируются на бекенде на 5 минут

## ⚙️ Особенности архитектуры

### Фронтенд (Svelte)
- Реактивное состояние через `$state` runes
- Debounce 200ms при вводе
- Условный invoke Tauri с fallback для dev режима
- localStorage для кеша и темы

### Бекенд (Rust/Tauri)
- Асинхронные команды Tauri
- Встроенный кеш с TTL 5 минут (lazy_static)
- Обработка ошибок с `Result<T, String>`
- Поддержка Windows, Linux, macOS

## 🐛 Отладка

### Dev режим без Tauri

```bash
npm run dev
```

Удобно для разработки фронтенда. Использует mock данные:
- 50+ популярных валют
- Фиксированный курс конвертации (1 USD ≈ 0.92 EUR)

### Консоль и логи

В браузере (F12) видны все ошибки и логи:
```javascript
console.warn('Tauri not available, using fallback currencies');
console.error('convertFrom error', e);
```

### Сборка с отладкой (debug mode)

```bash
# Windows или Linux
cd src-tauri && cargo build
```

Бинарник будет в `src-tauri/target/debug/`.

## 📝 Типичные проблемы

### ❌ "npm install failed" (Windows)
- Убедитесь, что Node.js и npm установлены: `node -v && npm -v`
- Очистите npm кеш: `npm cache clean --force`
- Перезагрузите компьютер

### ❌ "cl.exe not found" (Windows)
- Установите Visual Studio Build Tools с C++ поддержкой
- Откройте "x64 Native Tools Command Prompt for VS" и запустите сборку оттуда
- Проверьте PATH: `where cl`

### ❌ "clang not found" (Linux)
```bash
sudo apt update
sudo apt install clang build-essential
```

### ❌ "cargo not found"
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### ❌ Tauri dev выдает ошибки на Windows
- Закройте все окна приложения
- Удалите `src-tauri/target/debug/`
- Запустите `npm run tauri:dev` снова

### ❌ Frontend не обновляется при dev

```bash
# Очистьте Vite кеш
rm -rf node_modules/.vite .svelte-kit
npm run dev
```

## 📚 Дополнительные ресурсы

- **Tauri документация:** https://tauri.app/
- **SvelteKit:** https://kit.svelte.dev/
- **Rust:** https://www.rust-lang.org/
- **Vite:** https://vitejs.dev/

## 📄 Лицензия

MIT
