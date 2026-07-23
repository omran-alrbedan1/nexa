// ─── Multi-currency version (commented out) ──────────────────────────
// import { useCurrencyStore, CURRENCY_META } from '@/stores/currencyStore';
//
// export function useFormatPrice() {
//   useCurrencyStore(s => s.selectedCurrency);
//   return formatPrice;
// }
//
// function formatPrice(amount: number, showSymbol = true): string {
//   try {
//     const { selectedCurrency, exchangeRates } = useCurrencyStore.getState();
//     const converted = amount / exchangeRates[selectedCurrency];
//     const locale = CURRENCY_META[selectedCurrency].locale;
//     return new Intl.NumberFormat(locale, {
//       style: showSymbol ? 'currency' : 'decimal',
//       currency: selectedCurrency,
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(converted);
//   } catch {
//     const { selectedCurrency } = useCurrencyStore.getState();
//     const symbol = CURRENCY_META[selectedCurrency]?.symbol ?? '$';
//     return `${symbol}${amount.toFixed(2)}`;
//   }
// }
// ─── End multi-currency ─────────────────────────────────────────────

import { useCurrencyStore, CURRENCY_CODE, CURRENCY_LOCALE, CURRENCY_SYMBOL } from '@/stores/currencyStore';

export function useFormatPrice() {
  return formatPrice;
}

function formatPrice(amount: number, showSymbol = true): string {
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: CURRENCY_CODE,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${CURRENCY_SYMBOL}${amount.toFixed(2)}`;
  }
}
