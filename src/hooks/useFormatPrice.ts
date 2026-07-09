import { useCurrencyStore } from '@/stores/currencyStore';
import { formatPrice } from '@/utils/formatPrice';

export function useFormatPrice() {
  useCurrencyStore(s => s.selectedCurrency);
  return formatPrice;
}
