# Nightly Branch (nighty-ts)

Это нестабильная ветка разработки для экспериментов и новых возможностей.

## v2.0.0-nightly.1

### Архитектура приложения

Tauri приложение с разделением ответственности:

```
┌─────────────────────────────────┐
│  JavaScript/Svelte (UI Layer)   │  ← Красивая картинка в окне
│  с JSDoc типизацией             │  ← Защита от JS ошибок типов
└──────────────┬──────────────────┘
               │ Tauri IPC
┌──────────────▼──────────────────┐
│  Rust (Business Logic Layer)     │  ← Вся логика и вычисления
│  - API запросы к exchangerate    │  ← Получение курсов валют
│  - Decimal вычисления            │  ← Математика с абсолютной точностью
│  - Кеширование                   │  ← Оптимизация запросов
└─────────────────────────────────┘
```

### Что делает каждый слой

#### JavaScript/Svelte (src/routes/+page.svelte)
- 🎨 **Отображение UI** - красивый интерфейс в окне
- 🖱️ **Обработка пользовательского ввода** - клики, ввод чисел, выбор валют
- 💾 **Локальное кеширование** - сохранение результатов в localStorage
- 🌙 **Тема оформления** - переключение светлой/тёмной темы

**Защита через JSDoc комментарии:**
```javascript
/** @type {Record<string, string>} */
let currencies = $state({});

/**
 * @param {number|string} n
 * @returns {string}
 */
function formatNumber(n) { ... }

/**
 * @param {string} cmd
 * @param {any} args
 * @returns {Promise<any>}
 */
async function safeInvoke(cmd, args = {}) { ... }
```

JS не может нарушить эти типы - IDE и svelte-check не позволят.

#### Rust (src-tauri/src/lib.rs)
- 🔗 **API запросы** - обращение к exchangerate-api.com
- 🧮 **Decimal вычисления** - конвертация с абсолютной точностью
- 💰 **Кеширование на сервере** - 5-минутный TTL на стороне Rust
- 📝 **Возврат результатов** - как строка (не float!)

**Tauri команды:**
```rust
#[tauri::command]
async fn get_currencies() -> Result<HashMap<String, String>, String>

#[tauri::command]
async fn convert_currency(
    base_currency: String,
    target_currency: String,
    amount: String  // ← String, чтобы избежать потери точности
) -> Result<String, String>  // ← Результат как String из Decimal
```

### Почему TypeScript не нужен?

Архитектура уже безопасна:
1. JS код типизирован через **JSDoc** (jsconfig.json включает checkJs)
2. svelte-check проверяет типы перед запуском
3. Rust гарантирует точность через **Decimal**
4. API контракт: JS отправляет строку → Rust парсит → возвращает строку

### Файловая структура

```
src/
├── routes/
│   ├── +page.svelte       # Основной компонент (JS + JSDoc типы)
│   └── +page.css          # Стили
└── app.html

src-tauri/src/
└── lib.rs                 # Rust логика (все вычисления)
```

### Технические детали

**Rust изменения:**
- Зависимость: `rust_decimal = "1.36"` для точных вычислений
- `get_currencies()` возвращает словарь всех доступных валют
- `convert_currency()` делает запрос к API и вычисляет через Decimal

**JS защита:**
- `jsconfig.json` с `checkJs: true` включает проверку типов
- JSDoc комментарии определяют типы переменных и функций
- `svelte-check` валидирует типы перед запуском

### Преимущества архитектуры

✅ **Безопасность типов** - JS не может передать неправильный тип в Rust
✅ **Точность вычислений** - Rust Decimal гарантирует корректность
✅ **Разделение ответственности** - каждый слой делает свою работу
✅ **Красивый UI** - JavaScript/Svelte могут делать красивую картинку
✅ **Производительность** - кеширование и оптимизация на Rust стороне
✅ **Простота** - не нужны сложные конфигурации TypeScript

### Как это работает в реальности

1. Пользователь вводит сумму в UI
2. JS вызывает `safeInvoke('convert_currency', {...})`
3. Tauri отправляет JSON в Rust через IPC
4. Rust парсит JSON, делает запрос к API exchangerate.com
5. Rust парсит курс в Decimal и вычисляет результат
6. Rust возвращает результат как **строку** (не float!)
7. JS парсит строку в число и отображает красиво

### Версионирование

- `package.json`: `2.0.0-nightly.1`
- `tauri.conf.json`: `2.0.0-nightly.1`
- `Cargo.toml`: `0.1.0`

### Release теги

Для создания release используйте теги вида:
```
v2.0.0-nightly.1
v2.0.0-nightly.2
...
```

GitHub распознает pre-release версии по суффиксу.

### Проверки

✅ `npm run check` - JSDoc типизация в порядке
✅ `cargo check` - Rust код компилируется
✅ `npm run dev` - Vite dev сервер работает


