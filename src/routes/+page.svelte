<script>
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import './+page.css';

  let amountFrom = $state(1);
  let amountTo = $state(0);
  let currencyFrom = $state('USD');
  let currencyTo = $state('EUR');
  let currencies = $state({});
  let result = $state('');
  let isConverting = $state(false);
  let usedCache = $state(false);
  let theme = $state('light');

  const DEBOUNCE_MS = 200;
  const conversionCache = new Map();
  const CACHE_STORAGE_KEY = 'currency_conv_cache_v1';
  const CACHE_MAX_ENTRIES = 200;

  /** @type {ReturnType<typeof setTimeout>|null} */
  let convertTimeout = null;
  let lastEdited = 'from';

  onMount(async () => {
    try {
      // Check if Tauri is available (running in Tauri app)
      // @ts-ignore - Tauri internals not in TypeScript definitions
      if (typeof window !== 'undefined' && window.__TAURI_INTERNALS__) {
        currencies = await invoke('get_currencies');
      } else {
        // Fallback currencies for dev/browser without Tauri
        currencies = {
          USD: 'United States Dollar',
          EUR: 'Euro',
          GBP: 'British Pound',
          JPY: 'Japanese Yen',
          CHF: 'Swiss Franc',
          CNY: 'Chinese Yuan',
          INR: 'Indian Rupee',
          SGD: 'Singapore Dollar',
          HKD: 'Hong Kong Dollar',
          AUD: 'Australian Dollar',
          NZD: 'New Zealand Dollar',
          THB: 'Thai Baht',
          MYR: 'Malaysian Ringgit',
          IDR: 'Indonesian Rupiah',
          CAD: 'Canadian Dollar',
          MXN: 'Mexican Peso',
          BRL: 'Brazilian Real',
          ARS: 'Argentine Peso',
          CLP: 'Chilean Peso',
          SEK: 'Swedish Krona',
          NOK: 'Norwegian Krone',
          DKK: 'Danish Krone',
          PLN: 'Polish Zloty',
          CZK: 'Czech Koruna',
          HUF: 'Hungarian Forint',
          RON: 'Romanian Leu',
          ZAR: 'South African Rand',
          SAR: 'Saudi Arabian Riyal',
          AED: 'United Arab Emirates Dirham',
          TRY: 'Turkish Lira',
          RUB: 'Russian Ruble',
          KZT: 'Kazakhstani Tenge',
          UAH: 'Ukrainian Hryvnia',
          BYN: 'Belarusian Ruble',
          AMD: 'Armenian Dram',
          GEL: 'Georgian Lari',
          UZS: 'Uzbekistani Som',
          KGS: 'Kyrgyzstani Som',
          TJS: 'Tajikistani Somoni'
        };
        console.warn('Tauri not available, using fallback currencies');
      }
      
      try {
        const raw = localStorage.getItem(CACHE_STORAGE_KEY);
        if (raw) {
          const entries = JSON.parse(raw);
          if (Array.isArray(entries)) entries.slice(-CACHE_MAX_ENTRIES).forEach(([k, v]) => conversionCache.set(k, v));
        }
      } catch (e) {
        console.warn('Failed to load cache', e);
      }
      
      try {
        const t = localStorage.getItem('theme');
        if (t === 'dark' || t === 'light') theme = t;
      } catch (e) {}
      
      applyTheme();
      scheduleConvertFrom();
    } catch (e) {
      console.error('init error', e);
    }
  });

  function scheduleConvertFrom() {
    lastEdited = 'from';
    if (convertTimeout) clearTimeout(convertTimeout);
    convertTimeout = setTimeout(() => convertFrom(), DEBOUNCE_MS);
  }

  function scheduleConvertTo() {
    lastEdited = 'to';
    if (convertTimeout) clearTimeout(convertTimeout);
    convertTimeout = setTimeout(() => convertTo(), DEBOUNCE_MS);
  }

  async function convertFrom() {
    if (amountFrom == null || !currencyFrom || !currencyTo) return;
    if (currencyFrom === currencyTo) {
      amountTo = amountFrom;
      result = `${amountFrom} ${currencyFrom} = ${amountTo} ${currencyTo}`;
      return;
    }
    const key = `${currencyFrom}|${currencyTo}|${Number(amountFrom).toFixed(6)}`;
    if (conversionCache.has(key)) {
      amountTo = Number(conversionCache.get(key));
      result = `${formatNumber(amountFrom)} ${currencyFrom} = ${formatNumber(amountTo)} ${currencyTo} (cached)`;
      usedCache = true;
      return;
    }
    usedCache = false;
    isConverting = true;
    try {
      const converted = await safeInvoke('convert_currency', { baseCurrency: currencyFrom, targetCurrency: currencyTo, amount: Number(amountFrom) });
      amountTo = Number(converted);
      conversionCache.set(key, amountTo);
      persistCache();
      result = `${formatNumber(amountFrom)} ${currencyFrom} = ${formatNumber(amountTo)} ${currencyTo}`;
    } catch (e) {
      console.error('convertFrom error', e);
      result = `Error: ${e}`;
    } finally {
      isConverting = false;
    }
  }

  async function convertTo() {
    if (amountTo == null || !currencyFrom || !currencyTo) return;
    if (currencyFrom === currencyTo) {
      amountFrom = amountTo;
      result = `${amountFrom} ${currencyFrom} = ${amountTo} ${currencyTo}`;
      return;
    }
    const key = `${currencyTo}|${currencyFrom}|${Number(amountTo).toFixed(6)}`;
    if (conversionCache.has(key)) {
      amountFrom = Number(conversionCache.get(key));
      result = `${formatNumber(amountFrom)} ${currencyFrom} = ${formatNumber(amountTo)} ${currencyTo} (cached)`;
      usedCache = true;
      return;
    }
    usedCache = false;
    isConverting = true;
    try {
      const converted = await safeInvoke('convert_currency', { baseCurrency: currencyTo, targetCurrency: currencyFrom, amount: Number(amountTo) });
      amountFrom = Number(converted);
      conversionCache.set(key, amountFrom);
      persistCache();
      result = `${formatNumber(amountFrom)} ${currencyFrom} = ${formatNumber(amountTo)} ${currencyTo}`;
    } catch (e) {
      console.error('convertTo error', e);
      result = `Error: ${e}`;
    } finally {
      isConverting = false;
    }
  }

  function persistCache() {
    try {
      const entries = Array.from(conversionCache.entries()).slice(-CACHE_MAX_ENTRIES);
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn('persistCache failed', e);
    }
  }

  function applyTheme() {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    // Remove and add class to ensure it's applied
    html.classList.remove('theme-dark');
    if (theme === 'dark') {
      html.classList.add('theme-dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}
  }

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme();
  }

  // Apply theme on mount and when theme changes
  $effect.pre(() => {
    applyTheme();
  });

  /** @param {number|string} n */
  function formatNumber(n) {
    try {
      return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(Number(n));
    } catch (e) {
      return String(n);
    }
  }

  /**
   * Safely invoke a Tauri command with fallback for dev mode
   * @param {string} cmd - Command name
   * @param {any} args - Command arguments
   * @returns {Promise<any>}
   */
  async function safeInvoke(cmd, args = {}) {
    try {
      // @ts-ignore - Tauri internals
      if (typeof window !== 'undefined' && window.__TAURI_INTERNALS__) {
        return await invoke(cmd, args);
      } else {
        // Fallback mock conversion for dev mode
        if (cmd === 'convert_currency') {
          // Simple mock conversion using a fixed rate
          const mockRate = 0.92; // 1 USD = 0.92 EUR (example)
          return (args.amount * mockRate).toFixed(6);
        }
        throw new Error(`Command "${cmd}" not available (Tauri not loaded)`);
      }
    } catch (e) {
      console.error(`safeInvoke("${cmd}") failed:`, e);
      throw e;
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
      <input id="from-amount" type="number" bind:value={amountFrom} oninput={(e) => { lastEdited = 'from'; const v = (/** @type {HTMLInputElement} */ (e.target)).value; amountFrom = Number(v) || 0; usedCache = false; scheduleConvertFrom(); }} />
      <select bind:value={currencyFrom} onchange={() => { usedCache = false; if (lastEdited === 'from') scheduleConvertFrom(); else scheduleConvertTo(); }}>
        {#each Object.entries(currencies) as [code, name]}
          <option value={code}>{code} - {name}</option>
        {/each}
      </select>
    </div>

    <button type="button" class="swap-icon" aria-label="Swap currencies" onclick={() => { const tmp = currencyFrom; currencyFrom = currencyTo; currencyTo = tmp; if (lastEdited === 'from') scheduleConvertFrom(); else scheduleConvertTo(); }}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h18m-7.5-14L21 6.5m0 0L16.5 11M21 6.5H3" />
      </svg>
    </button>

    <div class="input-group">
      <label for="to-amount">Converted to</label>
      <input id="to-amount" type="number" bind:value={amountTo} oninput={(e) => { lastEdited = 'to'; const v = (/** @type {HTMLInputElement} */ (e.target)).value; amountTo = Number(v) || 0; usedCache = false; scheduleConvertTo(); }} />
      <select bind:value={currencyTo} onchange={() => { usedCache = false; if (lastEdited === 'from') scheduleConvertFrom(); else scheduleConvertTo(); }}>
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
