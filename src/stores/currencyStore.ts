import { create } from 'zustand';

export type CurrencyCode = 'USD' | 'ILS' | 'AED';

export interface ExchangeRates {
  USD: number;
  ILS: number;
  AED: number;
}

export const CURRENCY_META: Record<CurrencyCode, { symbol: string; label: string; locale: string }> = {
  USD: { symbol: '$', label: 'US Dollar', locale: 'en-US' },
  ILS: { symbol: '₪', label: 'Shekel', locale: 'he-IL' },
  AED: { symbol: 'د.إ', label: 'Dirham', locale: 'ar-AE' },
};

const STORAGE_KEY_CURRENCY = 'nexa_currency';
const STORAGE_KEY_RATES = 'nexa_exchange_rates';

const DEFAULT_RATES: ExchangeRates = {
  USD: 3.75,
  ILS: 1.027,
  AED: 1.022,
};

function loadCurrency(): CurrencyCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CURRENCY);
    if (stored && ['USD', 'ILS', 'AED'].includes(stored)) return stored as CurrencyCode;
  } catch {
    // ignore
  }
  return 'USD';
}

function loadRates(): ExchangeRates {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_RATES);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.USD && parsed.ILS && parsed.AED) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_RATES;
}

interface CurrencyState {
  selectedCurrency: CurrencyCode;
  exchangeRates: ExchangeRates;
  setCurrency: (code: CurrencyCode) => void;
  setExchangeRates: (rates: ExchangeRates) => void;
  formatPrice: (amount: number, showSymbol?: boolean) => string;
  formatPriceSimple: (amount: number) => string;
  fromBaseUnits: (amount: number, targetCurrency?: CurrencyCode) => number;
  toBaseUnits: (amount: number, sourceCurrency?: CurrencyCode) => number;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  selectedCurrency: loadCurrency(),
  exchangeRates: loadRates(),

  setCurrency: (code) => {
    localStorage.setItem(STORAGE_KEY_CURRENCY, code);
    set({ selectedCurrency: code });
  },

  setExchangeRates: (rates) => {
    localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(rates));
    set({ exchangeRates: rates });
  },

  fromBaseUnits: (amount, targetCurrency) => {
    const { selectedCurrency, exchangeRates } = get();
    const currency = targetCurrency || selectedCurrency;
    return amount / exchangeRates[currency];
  },

  toBaseUnits: (amount, sourceCurrency) => {
    const { selectedCurrency, exchangeRates } = get();
    const currency = sourceCurrency || selectedCurrency;
    return amount * exchangeRates[currency];
  },

  formatPrice: (amount, showSymbol = true) => {
    const { selectedCurrency, exchangeRates } = get();
    const converted = amount / exchangeRates[selectedCurrency];
    const locale = CURRENCY_META[selectedCurrency].locale;
    return new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: selectedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  },

  formatPriceSimple: (amount) => {
    const { selectedCurrency, exchangeRates } = get();
    const converted = amount / exchangeRates[selectedCurrency];
    const symbol = CURRENCY_META[selectedCurrency].symbol;
    return `${symbol}${converted.toFixed(2)}`;
  },
}));
