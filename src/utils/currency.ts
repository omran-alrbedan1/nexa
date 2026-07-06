import { useCurrencyStore } from '@/stores/currencyStore';

export function formatPrice(
  amount: number,
  showSymbol: boolean = true
): string {
  const state = useCurrencyStore.getState();
  return state.formatPrice(amount, showSymbol);
}

export function formatPriceSimple(amount: number): string {
  const state = useCurrencyStore.getState();
  return state.formatPriceSimple(amount);
}

export function calculateSubtotal(items: Array<{ unitPrice: number; quantity: number }>): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function calculateTotal(
  subtotal: number,
  deliveryFee: number,
  discount: number = 0
): number {
  return Math.max(0, subtotal + deliveryFee - discount);
}
