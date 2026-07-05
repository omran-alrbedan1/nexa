/**
 * Enum mapping utilities.
 *
 * The backend returns UPPERCASE_SNAKE_CASE (or lowercase) enum values.
 * The frontend uses lowercase_snake_case convention.
 *
 * These mappers handle bidirectional conversion so both systems
 * can communicate without TypeScript errors.
 *
 * IMPORTANT: The keys in BACKEND maps match what the Laravel backend
 * actually returns — verified against Backend* interface types in each API file.
 */

// ──────────────────────────────────────────────
// Order Status
// ──────────────────────────────────────────────

export const ORDER_STATUS_BACKEND_TO_FRONTEND: Record<string, string> = {
  NEW: 'new',
  PENDING_ADMIN: 'pending_management',
  PENDING_PRICING: 'pending_pricing',
  PENDING_CUSTOMER: 'pending_customer_approval',
  PENDING_CUSTOMER_APPROVAL: 'pending_customer_approval',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
  IN_SUPPLY: 'pending_supply',
  PENDING_SUPPLY: 'pending_supply',
  IN_AGGREGATION: 'pending_aggregation',
  PENDING_AGGREGATION: 'pending_aggregation',
  READY_TO_SHIP: 'ready_to_ship',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  FAILED_DELIVERY: 'failed_delivery',
  CANCELLED: 'cancelled',
  POSTPONED: 'postponed',
  SUSPENDED: 'suspended',
  REFUNDED: 'refunded',
};

export const ORDER_STATUS_FRONTEND_TO_BACKEND: Record<string, string> = {};

for (const [backend, frontend] of Object.entries(ORDER_STATUS_BACKEND_TO_FRONTEND)) {
  ORDER_STATUS_FRONTEND_TO_BACKEND[frontend] = backend;
}

// ──────────────────────────────────────────────
// Trip Status
// ──────────────────────────────────────────────

export const TRIP_STATUS_BACKEND_TO_FRONTEND: Record<string, string> = {
  scheduled: 'scheduled',
  assigned: 'assigned',
  accepted: 'accepted',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
  failed: 'failed',
};

export const TRIP_STATUS_FRONTEND_TO_BACKEND: Record<string, string> = {};
for (const [backend, frontend] of Object.entries(TRIP_STATUS_BACKEND_TO_FRONTEND)) {
  TRIP_STATUS_FRONTEND_TO_BACKEND[frontend] = backend;
}

// ──────────────────────────────────────────────
// Order Type
// ──────────────────────────────────────────────

export const ORDER_TYPE_BACKEND_TO_FRONTEND: Record<string, string> = {
  REGULAR: 'regular',
  SPECIAL: 'special',
  SEASONAL: 'seasonal',
};

export const ORDER_TYPE_FRONTEND_TO_BACKEND: Record<string, string> = {};
for (const [backend, frontend] of Object.entries(ORDER_TYPE_BACKEND_TO_FRONTEND)) {
  ORDER_TYPE_FRONTEND_TO_BACKEND[frontend] = backend;
}

// ──────────────────────────────────────────────
// Payment Status
// ──────────────────────────────────────────────

export const PAYMENT_STATUS_BACKEND_TO_FRONTEND: Record<string, string> = {
  pending: 'pending',
  cod_pending: 'pending',
  paid: 'paid',
  failed: 'failed',
  refunded: 'refunded',
};

export const PAYMENT_STATUS_FRONTEND_TO_BACKEND: Record<string, string> = {};
for (const [backend, frontend] of Object.entries(PAYMENT_STATUS_BACKEND_TO_FRONTEND)) {
  PAYMENT_STATUS_FRONTEND_TO_BACKEND[frontend] = backend;
}

// ──────────────────────────────────────────────
// Payment Method
// ──────────────────────────────────────────────

export function mapPaymentMethod(method: string): string {
  const lower = method.toLowerCase();
  if (lower.includes('cash') || lower.includes('cod')) return 'cash_on_delivery';
  if (lower.includes('card') || lower.includes('online')) return 'card_online';
  if (lower.includes('bank') || lower.includes('transfer')) return 'bank_transfer';
  return 'cash_on_delivery';
}

// ──────────────────────────────────────────────
// Supplier Status
// Backend returns: approved, pending, rejected
// ──────────────────────────────────────────────

export function mapSupplierApprovalStatus(status: string): string {
  switch (status) {
    case 'approved': return 'active';
    case 'pending': return 'pending_approval';
    case 'rejected': return 'suspended';
    default: return 'inactive';
  }
}

// ──────────────────────────────────────────────
// Campaign Status
// Backend returns: draft, scheduled, open, closed, fulfilled, archived
// ──────────────────────────────────────────────

export const CAMPAIGN_STATUS_BACKEND_TO_FRONTEND: Record<string, string> = {
  draft: 'draft',
  scheduled: 'scheduled',
  open: 'active',
  closed: 'ended',
  fulfilled: 'ended',
  archived: 'ended',
};

export const CAMPAIGN_STATUS_FRONTEND_TO_BACKEND: Record<string, string> = {};
for (const [backend, frontend] of Object.entries(CAMPAIGN_STATUS_BACKEND_TO_FRONTEND)) {
  CAMPAIGN_STATUS_FRONTEND_TO_BACKEND[frontend] = backend;
}

// ──────────────────────────────────────────────
// User Type
// ──────────────────────────────────────────────

export const USER_TYPE_BACKEND_TO_FRONTEND: Record<string, string> = {
  CUSTOMER: 'customer',
  SUPPLIER: 'supplier',
  DRIVER: 'driver',
  STAFF: 'staff',
};

// ──────────────────────────────────────────────
// Special Order Status
// ──────────────────────────────────────────────

export const SPECIAL_ORDER_STATUS_BACKEND_TO_FRONTEND: Record<string, string> = {
  PENDING_ADMIN: 'pending_management',
  PENDING_PRICING: 'pending_pricing',
  PENDING_CUSTOMER_APPROVAL: 'pending_customer_approval',
  PRICED: 'priced',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

// ──────────────────────────────────────────────
// Generic mapper helpers
// ──────────────────────────────────────────────

/**
 * Map a backend enum value to frontend convention using the provided map.
 * Returns the mapped value if found, otherwise returns the original value.
 */
export function mapFromBackend<T extends string>(
  value: string,
  mapping: Record<string, T>
): T {
  return mapping[value] ?? (value as unknown as T);
}

/**
 * Map a frontend enum value to backend convention using the provided map.
 * Returns the mapped value if found, otherwise returns the original value as uppercase.
 */
export function mapToBackend<T extends string>(
  value: string,
  mapping: Record<string, T>
): T {
  return mapping[value] ?? (value.toUpperCase().replace(/ /g, '_') as unknown as T);
}

/**
 * Safe mapper that handles null/undefined gracefully.
 */
export function safeMapFromBackend<T extends string>(
  value: string | null | undefined,
  mapping: Record<string, T>,
  fallback: T
): T {
  if (!value) return fallback;
  return mapping[value] ?? fallback;
}
