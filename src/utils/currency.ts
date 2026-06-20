/**
 * Currency formatting utilities.
 */

interface FormatPriceOptions {
  currency?: string;
  locale?: 'en' | 'ar';
  showSymbol?: boolean;
}

/**
 * NEXA operates in Saudi Arabia. All prices are in SAR (Saudi Riyal).
 * The backend stores prices as decimal numbers. This utility formats them
 * consistently across the entire app.
 *
 * Use `formatPrice()` for user-facing displays (adds locale formatting).
 * Use `formatPriceSimple()` for tables and compact views.
 *
 * Reference: Backend config/currency.php defines 'default' => 'SAR'.
 */

export function formatPrice(
  amount: number,
  { currency = 'SAR', locale = 'en', showSymbol = true }: FormatPriceOptions = {}
): string {
  // Use 'en-SA' (English - Saudi Arabia) which naturally formats as "SAR 1,234.56"
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    style: showSymbol ? 'currency' : 'decimal',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return formatted;
}

/**
 * Compact format for tables/cards.
 * Uses `toFixed(2)` (no thousand separators) to match the existing convention
 * used across 70+ places in the app. Change this to toLocaleString if/when
 * all price displays are migrated to use this shared function.
 */
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
