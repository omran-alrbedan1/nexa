/**
 * Phone number formatting and validation utilities.
 */

export function formatPhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Saudi Arabia format: +966 5X XXX XXXX
  if (digits.startsWith('966') && digits.length === 12) {
    return `+966 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  // With 0 prefix: 05X XXXXXXX
  if (digits.startsWith('0') && digits.length === 10) {
    return `+966 ${digits.slice(1, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  // 5XXXXXXXX (without prefix)
  if (digits.length === 9) {
    return `+966 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }

  // Fallback: return as-is with spacing every 3 digits
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

export function validatePhone(phone: string): { valid: boolean; error?: string } {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 0) {
    return { valid: false, error: 'Phone number is required' };
  }

  // Accept various formats of Saudi numbers
  const validPatterns = [
    /^9665\d{8}$/,           // +9665XXXXXXXX
    /^05\d{8}$/,             // 05XXXXXXXX
    /^5\d{8}$/,              // 5XXXXXXXX
  ];

  const normalized = digits.startsWith('966')
    ? digits
    : digits.startsWith('0')
      ? `966${digits.slice(1)}`
      : `966${digits}`;

  const isValid = validPatterns.some((p) => p.test(normalized));

  if (!isValid) {
    return { valid: false, error: 'Please enter a valid phone number' };
  }

  return { valid: true };
}
