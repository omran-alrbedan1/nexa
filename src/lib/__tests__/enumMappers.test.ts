import { describe, it, expect } from 'vitest';
import {
  mapFromBackend,
  mapToBackend,
  safeMapFromBackend,
  ORDER_STATUS_BACKEND_TO_FRONTEND,
  ORDER_STATUS_FRONTEND_TO_BACKEND,
  TRIP_STATUS_BACKEND_TO_FRONTEND,
} from '../enumMappers';

describe('mapFromBackend', () => {
  it('maps known UPPERCASE backend value to frontend', () => {
    expect(mapFromBackend('NEW', ORDER_STATUS_BACKEND_TO_FRONTEND)).toBe('new');
    expect(mapFromBackend('CONFIRMED', ORDER_STATUS_BACKEND_TO_FRONTEND)).toBe('confirmed');
    expect(mapFromBackend('in_progress', TRIP_STATUS_BACKEND_TO_FRONTEND)).toBe('in_progress');
  });

  it('returns the input value when no mapping exists', () => {
    expect(mapFromBackend('UNKNOWN_STATUS', ORDER_STATUS_BACKEND_TO_FRONTEND)).toBe('UNKNOWN_STATUS');
  });

  it('handles null gracefully', () => {
    expect(mapFromBackend(null as unknown as string, ORDER_STATUS_BACKEND_TO_FRONTEND)).toBeNull();
  });

  it('handles undefined gracefully', () => {
    expect(mapFromBackend(undefined as unknown as string, ORDER_STATUS_BACKEND_TO_FRONTEND)).toBeUndefined();
  });
});

describe('mapToBackend', () => {
  it('maps known frontend value to UPPERCASE backend', () => {
    expect(mapToBackend('new', ORDER_STATUS_FRONTEND_TO_BACKEND)).toBe('NEW');
    expect(mapToBackend('confirmed', ORDER_STATUS_FRONTEND_TO_BACKEND)).toBe('CONFIRMED');
  });

  it('uppercases unknown frontend values as fallback', () => {
    expect(mapToBackend('unknown_status', ORDER_STATUS_FRONTEND_TO_BACKEND)).toBe('UNKNOWN_STATUS');
  });
});

describe('safeMapFromBackend', () => {
  it('returns mapped value for known UPPERCASE status', () => {
    expect(safeMapFromBackend('NEW', ORDER_STATUS_BACKEND_TO_FRONTEND, 'draft')).toBe('new');
  });

  it('returns fallback for unknown status', () => {
    expect(safeMapFromBackend('BOGUS_STATUS', ORDER_STATUS_BACKEND_TO_FRONTEND, 'draft')).toBe('draft');
  });

  it('returns fallback for null', () => {
    expect(safeMapFromBackend(null, ORDER_STATUS_BACKEND_TO_FRONTEND, 'draft')).toBe('draft');
  });
});

describe('ORDER_STATUS_BACKEND_TO_FRONTEND', () => {
  it('maps all expected backend order statuses', () => {
    const backendStatuses = [
      'NEW', 'PENDING_ADMIN', 'PENDING_PRICING', 'PENDING_CUSTOMER',
      'CONFIRMED', 'PAID', 'IN_SUPPLY', 'IN_AGGREGATION',
      'READY_TO_SHIP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY',
      'CANCELLED', 'POSTPONED', 'REFUNDED',
    ];
    for (const status of backendStatuses) {
      expect(ORDER_STATUS_BACKEND_TO_FRONTEND).toHaveProperty(status);
    }
  });

  it('round-trips any frontend value back to an UPPERCASE backend value', () => {
    for (const frontend of Object.values(ORDER_STATUS_BACKEND_TO_FRONTEND)) {
      const back = ORDER_STATUS_FRONTEND_TO_BACKEND[frontend];
      expect(back).toBeDefined();
      expect(back).toEqual(back.toUpperCase());
      expect(ORDER_STATUS_BACKEND_TO_FRONTEND[back]).toBe(frontend);
    }
  });
});
