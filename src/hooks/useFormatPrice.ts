import { useCurrencyStore } from '@/stores/currencyStore';

export function useFormatPrice() {
  useCurrencyStore(s => s.selectedCurrency);
  const formatPrice = useCurrencyStore(s => s.formatPrice);
  return formatPrice;
}
