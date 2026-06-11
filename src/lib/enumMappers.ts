/**
 * Enum mapping utilities.
 *
 * The backend returns UPPERCASE_SNAKE_CASE enum values.
 * The frontend uses lowercase_snake_case convention.
 *
 * These mappers handle bidirectional conversion so both systems
 * can communicate without TypeScript errors.
 */

// ──────────────────────────────────────────────
// Status Enums
// ──────────────────────────────────────────────

export const ORDER_STATUS_BACKEND_TO_FRONTEND: Record<string, string> = {
  NEW: 'new',
  PENDING_ADMIN: 'pending_management',
  PENDING_PRICING: 'pending_pricing',
  PENDING_CUSTOMER_APPROVAL: 'pending_customer_approval',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
  PENDING_SUPPLY: 'pending_supply',
  PENDING_AGGREGATION: 'pending_aggregation',
  READY_TO_SHIP: 'ready_to_ship',
  READY_TO_DELIVER: 'ready_to_deliver',
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

export const TRIP_STATUS_BACKEND_TO_FRONTEND: Record<string, string> = {
  SCHEDULED: 'scheduled',
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
};

export const TRIP_STATUS_FRONTEND_TO_BACKEND: Record<string, string> = {};
for (const [backend, frontend] of Object.entries(TRIP_STATUS_BACKEND_TO_FRONTEND)) {
  TRIP_STATUS_FRONTEND_TO_BACKEND[frontend] = backend;
}

export const ORDER_TYPE_BACKEND_TO_FRONTEND: Record<string, string> = {
  REGULAR: 'regular',
  SPECIAL: 'special',
  SEASONAL: 'seasonal',
};

export const ORDER_TYPE_FRONTEND_TO_BACKEND: Record<string, string> = {};
for (const [backend, frontend] of Object.entries(ORDER_TYPE_BACKEND_TO_FRONTEND)) {
  ORDER_TYPE_FRONTEND_TO_BACKEND[frontend] = backend;
}

export const PAYMENT_STATUS_BACKEND_TO_FRONTEND: Record<string, string> = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const USER_TYPE_BACKEND_TO_FRONTEND: Record<string, string> = {
  CUSTOMER: 'customer',
  SUPPLIER: 'supplier',
  DRIVER: 'driver',
  STAFF: 'staff',
};

export const SUPPLIER_STATUS_BACKEND_TO_FRONTEND: Record<string, string> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING_APPROVAL: 'pending_approval',
};

export const CAMPAIGN_STATUS_BACKEND_TO_FRONTEND: Record<string, string> = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  ENDED: 'ended',
  CANCELLED: 'cancelled',
};

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
