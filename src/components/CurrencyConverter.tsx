import React, { useState, useEffect, useCallback } from 'react';
import { getCurrencies, convertCurrency, getAppVersion } from '../lib/rust-api';
import type {
  ConversionRequest,
  CurrenciesMap,
  CurrencyCode,
  ConversionResult,
} from '../lib/types';
import { castToCurrencyCode } from '../lib/types';
import { SunIcon, MoonIcon, SettingsIcon, SwapIcon } from './icons';
import Settings from './Settings';

const DEBOUNCE_MS = 200;
const CACHE_STORAGE_KEY = 'currency_conv_cache_v1';
const CACHE_MAX_ENTRIES = 200;

const CurrencyConverter: React.FC = () => {
  const [amountFrom, setAmountFrom] = useState<number>(1);
  const [amountTo, setAmountTo] = useState<number>(0);
  const [currencyFrom, setCurrencyFrom] = useState<CurrencyCode>(castToCurrencyCode('USD'));
  const [currencyTo, setCurrencyTo] = useState<CurrencyCode>(castToCurrencyCode('EUR'));
  const [currencies, setCurrencies] = useState<CurrenciesMap>({});
  const [result, setResult] = useState<string>('');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [usedCache, setUsedCache] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [appVersion, setAppVersion] = useState<string>('');

  // Загрузка версии приложения из Rust
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const version = await getAppVersion();
        setAppVersion(version);
      } catch (error) {
        console.warn('Could not fetch app version from Rust:', error);
        // В случае ошибки используем версию из package.json
        try {
          const packageJsonResponse = await fetch('/package.json');
          if (packageJsonResponse.ok) {
            const packageJson = await packageJsonResponse.json();
            setAppVersion(packageJson.version || '2.0.0');
            return;
          }
        } catch (packageError) {
          console.warn('Could not fetch version from package.json:', packageError);
        }
        // Fallback
        setAppVersion('2.0.0');
      }
    };

    fetchVersion();
  }, []);

  const conversionCache = React.useRef<Map<string, number>>(new Map());

  // Загрузка данных при монтировании
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Загрузка валют из Rust
        try {
          const currenciesData = await getCurrencies();
          setCurrencies(currenciesData);
        } catch (error) {
          console.error('Failed to load currencies from Rust:', error);
          // Резервный вариант для разработки без Tauri
          setCurrencies({
            USD: 'United States Dollar',
            EUR: 'Euro',
            GBP: 'British Pound',
            JPY: 'Japanese Yen',
            CHF: 'Swiss Franc',
          } as CurrenciesMap);
        }

        // Загрузка кэша из localStorage
        try {
          const raw = localStorage.getItem(CACHE_STORAGE_KEY);
          if (raw) {
            const entries = JSON.parse(raw) as [string, number][];
            if (Array.isArray(entries)) {
              entries.slice(-CACHE_MAX_ENTRIES).forEach(([k, v]) => {
                if (typeof k === 'string' && typeof v === 'number') {
                  conversionCache.current.set(k, v);
                }
              });
            }
          }
        } catch (error) {
          console.warn('Failed to load cache from localStorage:', error);
        }

        // Загрузка предпочтений темы
        try {
          const savedTheme = localStorage.getItem('theme');
          if (savedTheme === 'dark' || savedTheme === 'light') {
            setTheme(savedTheme as 'light' | 'dark');
          }
        } catch {
          // Без вывода ошибки для темы
        }

        applyTheme();
        scheduleConvertFrom();
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initializeApp();
  }, []);

  // Применение темы
  useEffect(() => {
    applyTheme();
  }, [theme]);

  const applyTheme = useCallback(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    // Удаляем темную тему
    html.classList.remove('theme-dark');
    // Добавляем темную тему только если выбрана темная
    if (theme === 'dark') {
      html.classList.add('theme-dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Без вывода ошибки
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const persistCache = useCallback(() => {
    try {
      const entries: [string, number][] = Array.from(conversionCache.current.entries()).slice(
        -CACHE_MAX_ENTRIES
      );
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  }, []);

  const formatNumber = useCallback((n: number | string): string => {
    try {
      return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(Number(n));
    } catch {
      return String(n);
    }
  }, []);

  let convertTimeout: NodeJS.Timeout | null = null;
  let lastEdited: 'from' | 'to' = 'from';

  const scheduleConvertFrom = useCallback(() => {
    lastEdited = 'from';
    if (convertTimeout) clearTimeout(convertTimeout);
    convertTimeout = setTimeout(() => {
      void convertFrom();
    }, DEBOUNCE_MS);
  }, [amountFrom, currencyFrom, currencyTo]);

  const scheduleConvertTo = useCallback(() => {
    lastEdited = 'to';
    if (convertTimeout) clearTimeout(convertTimeout);
    convertTimeout = setTimeout(() => {
      void convertTo();
    }, DEBOUNCE_MS);
  }, [amountTo, currencyFrom, currencyTo]);

  const convertFrom = useCallback(async () => {
    if (amountFrom == null || !currencyFrom || !currencyTo) return;
    if (currencyFrom === currencyTo) {
      setAmountTo(amountFrom);
      setResult(
        `${formatNumber(amountFrom)} ${currencyFrom} = ${formatNumber(amountFrom)} ${currencyTo}`
      );
      return;
    }

    const cacheKey = `${currencyFrom}|${currencyTo}|${Number(amountFrom).toFixed(6)}`;

    if (conversionCache.current.has(cacheKey)) {
      const cached = conversionCache.current.get(cacheKey);
      if (cached !== undefined) {
        setAmountTo(cached);
        setResult(
          `${formatNumber(amountFrom)} ${currencyFrom} = ${formatNumber(cached)} ${currencyTo} (cached)`
        );
        setUsedCache(true);
        return;
      }
    }

    setUsedCache(false);
    setIsConverting(true);

    try {
      const request: ConversionRequest = {
        baseCurrency: currencyFrom,
        targetCurrency: currencyTo,
        amount: amountFrom.toString(),
      };

      const converted: ConversionResult = await convertCurrency(request);
      const convertedValue = Number(converted);
      setAmountTo(convertedValue);
      conversionCache.current.set(cacheKey, convertedValue);
      persistCache();
      setResult(
        `${formatNumber(amountFrom)} ${currencyFrom} = ${formatNumber(convertedValue)} ${currencyTo}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Conversion error:', message);
      setResult(`Error: ${message}`);
    } finally {
      setIsConverting(false);
    }
  }, [amountFrom, currencyFrom, currencyTo, formatNumber, persistCache]);

  const convertTo = useCallback(async () => {
    if (amountTo == null || !currencyFrom || !currencyTo) return;
    if (currencyFrom === currencyTo) {
      setAmountFrom(amountTo);
      setResult(
        `${formatNumber(amountTo)} ${currencyFrom} = ${formatNumber(amountTo)} ${currencyTo}`
      );
      return;
    }

    const cacheKey = `${currencyTo}|${currencyFrom}|${Number(amountTo).toFixed(6)}`;

    if (conversionCache.current.has(cacheKey)) {
      const cached = conversionCache.current.get(cacheKey);
      if (cached !== undefined) {
        setAmountFrom(cached);
        setResult(
          `${formatNumber(cached)} ${currencyFrom} = ${formatNumber(amountTo)} ${currencyTo} (cached)`
        );
        setUsedCache(true);
        return;
      }
    }

    setUsedCache(false);
    setIsConverting(true);

    try {
      const request: ConversionRequest = {
        baseCurrency: currencyTo,
        targetCurrency: currencyFrom,
        amount: amountTo.toString(),
      };

      const converted: ConversionResult = await convertCurrency(request);
      const convertedValue = Number(converted);
      setAmountFrom(convertedValue);
      conversionCache.current.set(cacheKey, convertedValue);
      persistCache();
      setResult(
        `${formatNumber(convertedValue)} ${currencyFrom} = ${formatNumber(amountTo)} ${currencyTo}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Conversion error:', message);
      setResult(`Error: ${message}`);
    } finally {
      setIsConverting(false);
    }
  }, [amountTo, currencyFrom, currencyTo, formatNumber, persistCache]);

  const handleCurrencyChange = useCallback(() => {
    setUsedCache(false);
    if (lastEdited === 'from') {
      scheduleConvertFrom();
    } else {
      scheduleConvertTo();
    }
  }, [scheduleConvertFrom, scheduleConvertTo]);

  const handleAmountChange = useCallback(
    (source: 'from' | 'to') => {
      setUsedCache(false);
      if (source === 'from') {
        scheduleConvertFrom();
      } else {
        scheduleConvertTo();
      }
    },
    [scheduleConvertFrom, scheduleConvertTo]
  );

  const swapCurrencies = useCallback(() => {
    const tmp = currencyFrom;
    setCurrencyFrom(currencyTo);
    setCurrencyTo(tmp);

    if (lastEdited === 'from') {
      scheduleConvertFrom();
    } else {
      scheduleConvertTo();
    }
  }, [currencyFrom, currencyTo, scheduleConvertFrom, scheduleConvertTo]);

  return (
    <main className="container">
      <div className="header">
        <h1>Currency Converter</h1>
        <div className="controls">
          <button className="icon-btn" aria-label="Toggle theme" onClick={toggleTheme}>
            {theme === 'dark' ? <SunIcon size={24} /> : <MoonIcon size={24} />}
          </button>
          <button className="icon-btn" aria-label="Settings" onClick={() => setShowSettings(true)}>
            <SettingsIcon size={24} />
          </button>
        </div>
      </div>

      <div className="converter">
        <div className="input-group">
          <label htmlFor="from-amount">Amount</label>
          <input
            id="from-amount"
            type="number"
            value={amountFrom}
            onChange={e => {
              const value = parseFloat(e.target.value) || 0;
              setAmountFrom(value);
              handleAmountChange('from');
            }}
          />
          <select
            value={currencyFrom}
            onChange={e => {
              setCurrencyFrom(castToCurrencyCode(e.target.value));
              handleCurrencyChange();
            }}
          >
            {Object.entries(currencies).map(([code, name]) => (
              <option key={code} value={code}>
                {code} - {name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="swap-icon"
          aria-label="Swap currencies"
          onClick={swapCurrencies}
        >
          <SwapIcon size={24} />
        </button>

        <div className="input-group">
          <label htmlFor="to-amount">Converted to</label>
          <input
            id="to-amount"
            type="number"
            value={amountTo}
            onChange={e => {
              const value = parseFloat(e.target.value) || 0;
              setAmountTo(value);
              handleAmountChange('to');
            }}
          />
          <select
            value={currencyTo}
            onChange={e => {
              setCurrencyTo(castToCurrencyCode(e.target.value));
              handleCurrencyChange();
            }}
          >
            {Object.entries(currencies).map(([code, name]) => (
              <option key={code} value={code}>
                {code} - {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="result-wrapper">
        <div className="result-row">
          {isConverting && <span className="spinner" aria-hidden="true"></span>}
          <p className="result">{result}</p>
          {usedCache && <span className="cache-badge">cached</span>}
        </div>
      </div>

      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        appVersion={appVersion}
      />
    </main>
  );
};

export default CurrencyConverter;
