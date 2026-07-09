import { useCurrencyStore, CURRENCY_META } from '@/stores/currencyStore';

export function useFormatPrice() {
  useCurrencyStore(s => s.selectedCurrency);
  return formatPrice;
}

function formatPrice(amount: number, showSymbol = true): string {
  try {
    const { selectedCurrency, exchangeRates } = useCurrencyStore.getState();
    const converted = amount / exchangeRates[selectedCurrency];
    const locale = CURRENCY_META[selectedCurrency].locale;
    return new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: selectedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  } catch {
    const { selectedCurrency } = useCurrencyStore.getState();
    const symbol = CURRENCY_META[selectedCurrency]?.symbol ?? '$';
    return `${symbol}${amount.toFixed(2)}`;
  }
}
