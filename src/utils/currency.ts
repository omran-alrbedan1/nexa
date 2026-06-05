/**
 * Currency formatting utilities.
 */

interface FormatPriceOptions {
  currency?: string;
  locale?: 'en' | 'ar';
  showSymbol?: boolean;
}

export function formatPrice(
  amount: number,
  { currency = 'SAR', locale = 'en', showSymbol = true }: FormatPriceOptions = {}
): string {
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    style: showSymbol ? 'currency' : 'decimal',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return formatted;
}

export function formatPriceSimple(amount: number): string {
  return `${amount.toFixed(2)} SAR`;
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
