/**
 * Strict type definitions for Rust API responses
 * These types ensure that data from Rust is handled safely in TypeScript
 */

/**
 * Result of currency conversion from Rust
 * Rust returns precise Decimal values as strings to preserve accuracy
 */
export type ConversionResult = string & { readonly __brand: 'ConversionResult' };

/**
 * Currency code (3-letter ISO code like USD, EUR, etc.)
 */
export type CurrencyCode = string & { readonly __brand: 'CurrencyCode' };

/**
 * Conversion request parameters sent to Rust
 */
export interface ConversionRequest {
  readonly baseCurrency: CurrencyCode;
  readonly targetCurrency: CurrencyCode;
  readonly amount: string;
}

/**
 * Currency dictionary from Rust
 * Maps currency codes to human-readable names
 */
export type CurrenciesMap = Record<CurrencyCode, string>;

/**
 * Rust API command results
 */
export namespace RustAPI {
  export interface GetCurrenciesResult {
    [key: string]: string;
  }

  export interface ConvertCurrencyResult extends String {
    // Result is a string representation of Decimal
  }
}

/**
 * Type guards and validators
 */
export const TypeGuards = {
  /**
   * Validates that a value is a non-empty string (currency code)
   */
  isCurrencyCode(value: unknown): value is CurrencyCode {
    return typeof value === 'string' && value.length === 3 && /^[A-Z]{3}$/.test(value);
  },

  /**
   * Validates that a value is a valid decimal string (from Rust)
   */
  isDecimalString(value: unknown): value is ConversionResult {
    return (
      typeof value === 'string' &&
      value.length > 0 &&
      !isNaN(parseFloat(value))
    );
  },

  /**
   * Validates that currencies map has expected structure
   */
  isCurrenciesMap(value: unknown): value is CurrenciesMap {
    if (typeof value !== 'object' || value === null) return false;
    const map = value as Record<string, unknown>;
    return Object.keys(map).length > 0 &&
      Object.entries(map).every(
        ([code, name]) =>
          typeof code === 'string' &&
          /^[A-Z]{3}$/.test(code) &&
          typeof name === 'string'
      );
  }
};

/**
 * Casts a string to ConversionResult after validation
 */
export function castToConversionResult(value: string): ConversionResult {
  if (!TypeGuards.isDecimalString(value)) {
    throw new Error(`Invalid decimal string: ${value}`);
  }
  return value as ConversionResult;
}

/**
 * Casts a string to CurrencyCode after validation
 */
export function castToCurrencyCode(value: string): CurrencyCode {
  if (!TypeGuards.isCurrencyCode(value)) {
    throw new Error(`Invalid currency code: ${value}`);
  }
  return value as CurrencyCode;
}
