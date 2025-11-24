# TypeScript Quick Reference

## Core Types

```typescript
// Branded types - type-safe identifiers
type CurrencyCode = string & { readonly __brand: 'CurrencyCode' };
type ConversionResult = string & { readonly __brand: 'ConversionResult' };

// Request/Response interfaces
interface ConversionRequest {
  readonly baseCurrency: CurrencyCode;
  readonly targetCurrency: CurrencyCode;
  readonly amount: string;
}

// API Dictionary
type CurrenciesMap = Record<CurrencyCode, string>;
```

## Common Operations

### 1. Create a Currency Code
```typescript
import { castToCurrencyCode } from '../lib/types';

const code = castToCurrencyCode('USD'); // ✅ Valid
const invalid = castToCurrencyCode('INVALID'); // ❌ Throws error
```

### 2. Call Rust API Safely
```typescript
import { convertCurrency } from '../lib/rust-api';
import type { ConversionRequest, ConversionResult } from '../lib/types';

const request: ConversionRequest = {
  baseCurrency: castToCurrencyCode('USD'),
  targetCurrency: castToCurrencyCode('EUR'),
  amount: '100.50'
};

const result: ConversionResult = await convertCurrency(request);
const amount = Number(result); // Safe conversion
```

### 3. Get Currency List
```typescript
import { getCurrencies } from '../lib/rust-api';
import type { CurrenciesMap } from '../lib/types';

const currencies: CurrenciesMap = await getCurrencies();
// currencies['USD'] = 'United States Dollar'
// currencies['EUR'] = 'Euro'
```

### 4. Validate Unknown Data
```typescript
import { TypeGuards } from '../lib/types';

const data = someUnknownValue;

if (TypeGuards.isCurrencyCode(data)) {
  // data is now CurrencyCode
  console.log(`Valid currency: ${data}`);
}

if (TypeGuards.isDecimalString(data)) {
  // data is now ConversionResult
  console.log(`Valid amount: ${Number(data)}`);
}
```

### 5. Type-Safe Form Handling
```typescript
import { castToCurrencyCode } from '../lib/types';
import { convertCurrency } from '../lib/rust-api';

async function handleConvert(formData: FormData) {
  try {
    const result = await convertCurrency({
      baseCurrency: castToCurrencyCode(formData.get('from')),
      targetCurrency: castToCurrencyCode(formData.get('to')),
      amount: formData.get('amount')?.toString() ?? '0'
    });
    
    console.log('Result:', result);
  } catch (error) {
    console.error('Conversion failed:', error);
  }
}
```

## Type Guards

| Function | Usage |
|----------|-------|
| `isCurrencyCode(value)` | Check if string is valid currency code |
| `isDecimalString(value)` | Check if string is valid Decimal |
| `isCurrenciesMap(value)` | Check if object is currencies dictionary |

## Type Casting Functions

| Function | Input | Output | Throws |
|----------|-------|--------|--------|
| `castToCurrencyCode(s)` | `string` | `CurrencyCode` | Invalid format |
| `castToConversionResult(s)` | `string` | `ConversionResult` | Not a number |

## Svelte Component Template

```typescript
<script lang="ts">
  import { onMount } from 'svelte';
  import { convertCurrency, getCurrencies } from '../lib/rust-api';
  import type { CurrencyCode, CurrenciesMap } from '../lib/types';
  import { castToCurrencyCode } from '../lib/types';

  // Typed state
  let amount: number = $state(1);
  let from: CurrencyCode = $state(castToCurrencyCode('USD'));
  let to: CurrencyCode = $state(castToCurrencyCode('EUR'));
  let currencies: CurrenciesMap = $state({});
  let result: string = $state('');

  // Typed function
  async function convert(): Promise<void> {
    try {
      const converted = await convertCurrency({
        baseCurrency: from,
        targetCurrency: to,
        amount: amount.toString()
      });
      result = `${amount} ${from} = ${Number(converted)} ${to}`;
    } catch (error) {
      result = `Error: ${error}`;
    }
  }

  onMount(async () => {
    try {
      currencies = await getCurrencies();
    } catch (error) {
      console.error('Failed to load currencies:', error);
    }
  });
</script>

<input type="number" bind:value={amount} />
<select bind:value={from}>
  {#each Object.entries(currencies) as [code, name]}
    <option value={code}>{code} - {name}</option>
  {/each}
</select>
<button onclick={convert}>Convert</button>
<p>{result}</p>
```

## Error Handling Patterns

### Pattern 1: Try-Catch
```typescript
try {
  const result = await convertCurrency(request);
  console.log(result);
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`Failed: ${msg}`);
}
```

### Pattern 2: Promise Chain
```typescript
convertCurrency(request)
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

### Pattern 3: Result Type
```typescript
type Result<T> = 
  | { ok: true; value: T }
  | { ok: false; error: string };

async function safeConvert(req): Promise<Result<ConversionResult>> {
  try {
    const value = await convertCurrency(req);
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
```

## Strict Mode Rules

These are enabled in `tsconfig.json`:

| Rule | What It Prevents |
|------|------------------|
| `strict: true` | All of the below |
| `noImplicitAny` | Variables with unknown types |
| `strictNullChecks` | Using null/undefined unsafely |
| `strictFunctionTypes` | Loose function parameter types |
| `strictBindCallApply` | Wrong usage of bind/call/apply |
| `noUncheckedIndexedAccess` | Array access without bounds check |

## Commands

```bash
# Type checking
npm run check           # One-time check
npm run check:watch    # Watch mode

# Building
npm run build          # Build frontend
cargo build            # Build Rust
npm run tauri:build    # Build app

# Development
npm run tauri:dev      # Run development
npm run dev            # Dev server only
```

## Common Errors & Solutions

### Error: Property does not exist on type
```typescript
// ❌ Error
const code: CurrencyCode = 'USD';

// ✅ Solution
const code = castToCurrencyCode('USD');
```

### Error: Cannot assign to readonly
```typescript
// ❌ Error (readonly)
const req: ConversionRequest = { ... };
req.amount = '200'; // Can't modify

// ✅ Solution
const req: ConversionRequest = {
  ...oldReq,
  amount: '200'
};
```

### Error: String is not ConversionResult
```typescript
// ❌ Error
const result: ConversionResult = '100.50';

// ✅ Solution
const result: ConversionResult = castToConversionResult('100.50');
```

## Best Practices

1. **Always use type-safe constructors**
   ```typescript
   ✅ const code = castToCurrencyCode('USD');
   ❌ const code = 'USD' as CurrencyCode; // Don't do this
   ```

2. **Validate before casting**
   ```typescript
   ✅ if (TypeGuards.isCurrencyCode(value)) { /* use value */ }
   ❌ // Don't skip validation
   ```

3. **Use descriptive type names**
   ```typescript
   ✅ type CurrencyCode = string & { readonly __brand: 'CurrencyCode' };
   ❌ type Currency = string; // Too vague
   ```

4. **Handle errors explicitly**
   ```typescript
   ✅ const result = await convertCurrency(req).catch(e => console.error(e));
   ❌ const result = await convertCurrency(req); // Crash on error
   ```

5. **Use const for immutability**
   ```typescript
   ✅ const currencies: CurrenciesMap = { ... };
   ❌ let currencies = { ... }; // Can be accidentally modified
   ```

## Resources

- **TypeScript**: https://www.typescriptlang.org/docs/
- **Tauri**: https://tauri.app/develop/calling-rust/
- **Svelte with TypeScript**: https://svelte.dev/docs/typescript
- **Type Guards**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

---

**Quick Start**: Import from `../lib/rust-api` for API calls and `../lib/types` for type definitions. Use `castTo*` functions to create branded types from external data. Always validate before casting!
