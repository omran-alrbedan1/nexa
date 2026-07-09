import { useCurrencyStore, CURRENCY_META } from '@/stores/currencyStore';

export function useFormatPrice() {
  const selectedCurrency = useCurrencyStore(s => s.selectedCurrency);
  const formatPrice = useCurrencyStore(s => s.formatPrice);
  return formatPrice || ((amount: number) => {
    const symbol = CURRENCY_META[selectedCurrency]?.symbol ?? '$';
    return `${symbol}${amount.toFixed(2)}`;
  });
}
