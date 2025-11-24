<script lang="ts">
  import { onMount } from 'svelte';
  import { getCurrencies, convertCurrency } from '../lib/rust-api';
  import type { ConversionRequest, CurrenciesMap, CurrencyCode, ConversionResult } from '../lib/types';
  import { castToCurrencyCode } from '../lib/types';
  import './+page.css';

  let amountFrom: number = $state(1);
  let amountTo: number = $state(0);
  let currencyFrom: CurrencyCode = $state(castToCurrencyCode('USD'));
  let currencyTo: CurrencyCode = $state(castToCurrencyCode('EUR'));
  let currencies: CurrenciesMap = $state({});
  let result: string = $state('');
  let isConverting: boolean = $state(false);
  let usedCache: boolean = $state(false);
  let theme: 'light' | 'dark' = $state('light');

  const DEBOUNCE_MS = 200;
  const conversionCache: Map<string, number> = new Map();
  const CACHE_STORAGE_KEY = 'currency_conv_cache_v1';
  const CACHE_MAX_ENTRIES = 200;

  let convertTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastEdited: 'from' | 'to' = 'from';

  onMount(async () => {
    try {
      // Load currencies from Rust
      try {
        currencies = await getCurrencies();
      } catch (error) {
        console.error('Failed to load currencies from Rust:', error);
        // Fallback for dev without Tauri
        currencies = {
          USD: 'United States Dollar',
          EUR: 'Euro',
          GBP: 'British Pound',
          JPY: 'Japanese Yen',
          CHF: 'Swiss Franc'
        } as CurrenciesMap;
      }

      // Load local cache from localStorage
      try {
        const raw = localStorage.getItem(CACHE_STORAGE_KEY);
        if (raw) {
          const entries = JSON.parse(raw) as [string, number][];
          if (Array.isArray(entries)) {
            entries.slice(-CACHE_MAX_ENTRIES).forEach(([k, v]) => {
              if (typeof k === 'string' && typeof v === 'number') {
                conversionCache.set(k, v);
              }
            });
          }
        }
      } catch (error) {
        console.warn('Failed to load cache from localStorage:', error);
      }

      // Load theme preference
      try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          theme = savedTheme;
        }
      } catch (error) {
        // Silent fail for theme
      }

      applyTheme();
      scheduleConvertFrom();
    } catch (error) {
      console.error('Initialization error:', error);
    }
  });

  function scheduleConvertFrom(): void {
    lastEdited = 'from';
    if (convertTimeout) clearTimeout(convertTimeout);
    convertTimeout = setTimeout(() => {
      void convertFrom();
    }, DEBOUNCE_MS);
  }

  function scheduleConvertTo(): void {
    lastEdited = 'to';
    if (convertTimeout) clearTimeout(convertTimeout);
    convertTimeout = setTimeout(() => {
      void convertTo();
    }, DEBOUNCE_MS);
  }

  /**
   * Convert from base currency, keeping source amount fixed
   */
  async function convertFrom(): Promise<void> {
    if (amountFrom == null || !currencyFrom || !currencyTo) return;
    if (currencyFrom === currencyTo) {
      amountTo = amountFrom;
      result = `${amountFrom} ${currencyFrom} = ${amountTo} ${currencyTo}`;
      return;
    }

    const cacheKey = `${currencyFrom}|${currencyTo}|${Number(amountFrom).toFixed(6)}`;
    
    if (conversionCache.has(cacheKey)) {
      const cached = conversionCache.get(cacheKey);
      if (cached !== undefined) {
        amountTo = cached;
        result = `${formatNumber(amountFrom)} ${currencyFrom} = ${formatNumber(amountTo)} ${currencyTo} (cached)`;
        usedCache = true;
        return;
      }
    }

    usedCache = false;
    isConverting = true;

    try {
      const request: ConversionRequest = {
        baseCurrency: currencyFrom,
        targetCurrency: currencyTo,
        amount: amountFrom.toString()
      };

      const converted: ConversionResult = await convertCurrency(request);
      amountTo = Number(converted);
      conversionCache.set(cacheKey, amountTo);
      persistCache();
      result = `${formatNumber(amountFrom)} ${currencyFrom} = ${formatNumber(amountTo)} ${currencyTo}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Conversion error:', message);
      result = `Error: ${message}`;
    } finally {
      isConverting = false;
    }
  }

  /**
   * Convert to target currency, keeping target amount fixed
   */
  async function convertTo(): Promise<void> {
    if (amountTo == null || !currencyFrom || !currencyTo) return;
    if (currencyFrom === currencyTo) {
      amountFrom = amountTo;
      result = `${amountFrom} ${currencyFrom} = ${amountTo} ${currencyTo}`;
      return;
    }

    const cacheKey = `${currencyTo}|${currencyFrom}|${Number(amountTo).toFixed(6)}`;
    
    if (conversionCache.has(cacheKey)) {
      const cached = conversionCache.get(cacheKey);
      if (cached !== undefined) {
        amountFrom = cached;
        result = `${formatNumber(amountFrom)} ${currencyFrom} = ${formatNumber(amountTo)} ${currencyTo} (cached)`;
        usedCache = true;
        return;
      }
    }

    usedCache = false;
    isConverting = true;

    try {
      const request: ConversionRequest = {
        baseCurrency: currencyTo,
        targetCurrency: currencyFrom,
        amount: amountTo.toString()
      };

      const converted: ConversionResult = await convertCurrency(request);
      amountFrom = Number(converted);
      conversionCache.set(cacheKey, amountFrom);
      persistCache();
      result = `${formatNumber(amountFrom)} ${currencyFrom} = ${formatNumber(amountTo)} ${currencyTo}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Conversion error:', message);
      result = `Error: ${message}`;
    } finally {
      isConverting = false;
    }
  }

  function persistCache(): void {
    try {
      const entries: [string, number][] = Array.from(conversionCache.entries()).slice(-CACHE_MAX_ENTRIES);
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  }

  function applyTheme(): void {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.classList.remove('theme-dark');
    if (theme === 'dark') {
      html.classList.add('theme-dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      // Silent fail
    }
  }

  function toggleTheme(): void {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme();
  }

  $effect.pre(() => {
    applyTheme();
  });

  /**
   * Format number for display with localization
   */
  function formatNumber(n: number | string): string {
    try {
      return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(Number(n));
    } catch (error) {
      return String(n);
    }
  }

  /**
   * Handle currency selection change
   */
  function handleCurrencyChange(): void {
    usedCache = false;
    if (lastEdited === 'from') {
      scheduleConvertFrom();
    } else {
      scheduleConvertTo();
    }
  }

  /**
   * Handle amount input change
   */
  function handleAmountChange(source: 'from' | 'to'): void {
    usedCache = false;
    if (source === 'from') {
      scheduleConvertFrom();
    } else {
      scheduleConvertTo();
    }
  }

  /**
   * Swap currencies
   */
  function swapCurrencies(): void {
    const tmp = currencyFrom;
    currencyFrom = currencyTo;
    currencyTo = tmp;
    if (lastEdited === 'from') {
      scheduleConvertFrom();
    } else {
      scheduleConvertTo();
    }
  }
</script>

<main class="container">
  <div class="header">
    <h1>Currency Converter</h1>
    <div class="theme-toggle">
      <button class="icon-btn" aria-label="Toggle theme" onclick={toggleTheme}>
        {#if theme === 'dark'}
          <img src="/icons/sun.svg" alt="light" />
        {:else}
          <img src="/icons/moon.svg" alt="dark" />
        {/if}
      </button>
    </div>
  </div>

  <div class="converter">
    <div class="input-group">
      <label for="from-amount">Amount</label>
      <input
        id="from-amount"
        type="number"
        bind:value={amountFrom}
        oninput={() => {
          amountFrom = amountFrom || 0;
          handleAmountChange('from');
        }}
      />
      <select bind:value={currencyFrom} onchange={handleCurrencyChange}>
        {#each Object.entries(currencies) as [code, name]}
          <option value={code}>{code} - {name}</option>
        {/each}
      </select>
    </div>

    <button
      type="button"
      class="swap-icon"
      aria-label="Swap currencies"
      onclick={swapCurrencies}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h18m-7.5-14L21 6.5m0 0L16.5 11M21 6.5H3" />
      </svg>
    </button>

    <div class="input-group">
      <label for="to-amount">Converted to</label>
      <input
        id="to-amount"
        type="number"
        bind:value={amountTo}
        oninput={() => {
          amountTo = amountTo || 0;
          handleAmountChange('to');
        }}
      />
      <select bind:value={currencyTo} onchange={handleCurrencyChange}>
        {#each Object.entries(currencies) as [code, name]}
          <option value={code}>{code} - {name}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="result-wrapper">
    <div class="result-row">
      {#if isConverting}<span class="spinner" aria-hidden="true"></span>{/if}
      <p class="result">{result}</p>
      {#if usedCache}<span class="cache-badge">cached</span>{/if}
    </div>
  </div>
</main>
