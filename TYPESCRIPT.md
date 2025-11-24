# TypeScript Migration for Strict Rust API Typing

## Overview

The `nighty-ts` branch now includes **full TypeScript support** for strict typing of all data coming from the Rust backend. This ensures compile-time safety for all Rust API interactions.

## Architecture

### TypeScript Type System

**Branded Types** for extra type safety:
```typescript
export type ConversionResult = string & { readonly __brand: 'ConversionResult' };
export type CurrencyCode = string & { readonly __brand: 'CurrencyCode' };
```

These branded types ensure that strings are only valid when explicitly cast/validated by our API layer.

### Files Created

#### `src/lib/types.ts` - Type Definitions
- **ConversionResult**: Rust Decimal as string (type-safe wrapper)
- **CurrencyCode**: 3-letter ISO currency code (USD, EUR, etc.)
- **ConversionRequest**: Strongly typed request to Rust
- **CurrenciesMap**: Dictionary of currency codes to names
- **TypeGuards**: Runtime validators for all Rust responses
- **Helper functions**: `castToConversionResult()`, `castToCurrencyCode()`

#### `src/lib/rust-api.ts` - Safe API Wrapper
Wraps all Tauri invocations with strict type checking:

```typescript
export async function getCurrencies(): Promise<CurrenciesMap>
export async function convertCurrency(request: ConversionRequest): Promise<ConversionResult>
export async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T>
```

Each function validates the response before returning, ensuring type safety throughout the application.

#### `src/routes/+page.svelte` - Fully Typed Component
Converted from JavaScript to TypeScript:

```typescript
let amountFrom: number = $state(1);
let currencyFrom: CurrencyCode = $state(castToCurrencyCode('USD'));
let currencies: CurrenciesMap = $state({});
```

All state, functions, and event handlers are fully typed with proper TypeScript annotations.

#### `tsconfig.json` - TypeScript Configuration
Strict TypeScript settings:
- `strict: true` - Enables all strict type checking
- `noUncheckedIndexedAccess: true` - Forces bounds checking on arrays
- `noImplicitAny: true` - No implicit any types
- `strictNullChecks: true` - Proper null/undefined handling

## Data Flow

```
Rust (src-tauri/src/lib.rs)
  ↓ [returns String via IPC]
rust-api.ts (Type Guards validation)
  ↓ [casts/validates to branded type]
+page.svelte (Fully typed component)
  ↓ [TypeScript ensures correct usage]
Display UI
```

## Validation

Both build systems pass validation:

✅ **TypeScript**: `npm run check` - **0 errors, 0 warnings**
✅ **Rust**: `cargo check` - **Finished successfully**

## Type Safety Examples

### Before (JavaScript with JSDoc)
```javascript
/** @param {string} cmd */
async function safeInvoke(cmd, args = {}) {
  // Hope the response is correct...
  return await invoke(cmd, args);
}
```

### After (TypeScript)
```typescript
export async function convertCurrency(request: ConversionRequest): Promise<ConversionResult> {
  const result = await invoke<unknown>('convert_currency', {
    baseCurrency: request.baseCurrency,
    targetCurrency: request.targetCurrency,
    amount: request.amount
  });

  // Runtime validation + TypeScript type checking
  if (typeof result !== 'string') {
    throw new Error(`Expected string result from Rust, got ${typeof result}`);
  }

  return castToConversionResult(result);
}
```

## Why This Approach?

1. **Branded Types**: Prevent mixing similar types (e.g., CurrencyCode vs random string)
2. **Type Guards**: Runtime validation ensures Rust API changes are caught
3. **Single Source of Truth**: All API contracts in `rust-api.ts`
4. **Fallback Support**: Dev mode without Tauri still works with typed fallbacks
5. **Strict Mode**: TypeScript strict settings catch edge cases early

## Development

### Type Checking
```bash
npm run check        # One-time check
npm run check:watch  # Watch mode
```

### Building
```bash
npm run build        # Build frontend
cargo build          # Build Rust backend
npm run tauri:build  # Build complete app
```

## Version
- App Version: **2.0.0-nightly.1**
- TypeScript: ~5.6.2
- Rust Decimal: 1.36 (for precise currency math)
- Tauri: ^2

## Future Improvements
- [ ] Generate TypeScript types from Rust via tauri type generation
- [ ] Add OpenAPI/GraphQL schema for Rust API
- [ ] Shared types between Rust and TypeScript via serde-ts-rs
