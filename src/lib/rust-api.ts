/**
 * Safe wrapper for Tauri Rust API calls with strict typing
 */

import { invoke } from '@tauri-apps/api/core';
import type { ConversionRequest, ConversionResult, CurrenciesMap } from './types';
import { TypeGuards, castToConversionResult } from './types';

/**
 * Get list of supported currencies from Rust
 * @throws {Error} If API call fails
 */
export async function getCurrencies(): Promise<CurrenciesMap> {
  const result = await invoke<unknown>('get_currencies');

  if (!TypeGuards.isCurrenciesMap(result)) {
    throw new Error('Invalid currencies response from Rust');
  }

  return result;
}

/**
 * Convert amount from base currency to target currency using Rust backend
 * Rust handles all precision via rust_decimal::Decimal
 * @param request - Conversion parameters
 * @returns Precise result as decimal string
 * @throws {Error} If conversion fails or validation fails
 */
export async function convertCurrency(request: ConversionRequest): Promise<ConversionResult> {
  const result = await invoke<unknown>('convert_currency', {
    baseCurrency: request.baseCurrency,
    targetCurrency: request.targetCurrency,
    amount: request.amount,
  });

  // Validate and cast to ConversionResult
  if (typeof result !== 'string') {
    throw new Error(`Expected string result from Rust, got ${typeof result}`);
  }

  return castToConversionResult(result);
}

/**
 * Get application version from Rust backend
 * @returns Application version string
 * @throws {Error} If API call fails
 */
export async function getAppVersion(): Promise<string> {
  try {
    const result = await invoke<string>('get_app_version');
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get app version: ${message}`);
  }
}

/**
 * Save custom CSS to file via Rust backend
 * @param cssContent - CSS content to save
 * @throws {Error} If API call fails
 */
export async function saveCustomCss(cssContent: string): Promise<void> {
  try {
    await invoke('save_custom_css', { cssContent });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to save custom CSS: ${message}`);
  }
}

/**
 * Safely invoke any Rust command with error handling
 * @param cmd - Command name
 * @param args - Command arguments
 * @throws {Error} If command execution fails
 */
export async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Rust API error in ${cmd}: ${message}`);
  }
}
