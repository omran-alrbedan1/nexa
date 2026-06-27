// ============================================================
// Trips API Service
// ============================================================
// Backend tables: trips, trip_orders, trip_status_logs, driver_trip_rejections
// Admin routes: ✅ BUILT (TripController)
//   GET    /api/v1/admin/trips
//   GET    /api/v1/admin/trips/{id}
//   POST   /api/v1/admin/trips
//   PUT    /api/v1/admin/trips/{id}
//   POST   /api/v1/admin/trips/{id}/assign-driver
//   POST   /api/v1/admin/trips/{id}/orders
//   PUT    /api/v1/admin/trips/{id}/status
// ============================================================

import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';
import type { TripStatus } from '@/types/marketplace';

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface TripOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  total: number;
  status: string;
}

export interface DashboardTrip {
  id: number;
  tripNumber: string;
  driverId: number | null;
  driverName: string | null;
  regionName: string;
  clusterName: string;
  status: TripStatus;
  scheduledDate: string;
  timeSlot: string;
  orderCount: number;
  totalValue: number;
  completedOrders: number;
  failedOrders: number;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripsPageData {
  stats: {
    total: number;
    scheduled: number;
    assigned: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    failed: number;
    totalOrders: number;
    totalValue: number;
    avgCompletionRate: number;
  };
  trips: DashboardTrip[];
  availableDrivers: { id: number; name: string; regionName: string; isAvailable: boolean }[];
}

// ── Backend Raw Types (matching DB schema — predicted API response) ──

interface BackendTrip {
  id: number;
  trip_number: string;
  warehouse_id: number;
  driver_id: number | null;
  status: string;
  assignment_type: string;
  planned_date: string;
  departure_time: string | null;
  cutoff_time: string | null;
  expected_arrival: string | null;
  min_orders: number;
  max_capacity: number;
  delivery_fee_override: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  warehouse?: { id: number; name: string; code?: string } | null;
  driver?: { id: number; full_name: string; phone?: string } | null;
  zones?: { id: number; name: string }[];
  trip_orders?: { id: number; order_id: number; delivery_status: string }[];
  trip_orders_count?: number;
  created_at: string;
  updated_at: string;
}

interface BackendTripsResponse {
  trips: BackendTrip[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

interface BackendAvailableDriver {
  id: number;
  full_name: string;
  zone_name: string;
  is_available: boolean;
}

// ── Mapping ──

function mapBackendTripStatus(status: string): TripStatus {
  const map: Record<string, TripStatus> = {
    'scheduled': 'scheduled',
    'assigned': 'assigned',
    'accepted': 'accepted',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'failed': 'failed',
  };
  return map[status] || (status as TripStatus);
}

function mapBackendTrip(bt: BackendTrip): DashboardTrip {
  return {
    id: bt.id,
    tripNumber: bt.trip_number,
    driverId: bt.driver_id || null,
    driverName: bt.driver?.full_name || null,
    regionName: bt.warehouse?.name || '',
    clusterName: '',
    status: mapBackendTripStatus(bt.status),
    scheduledDate: bt.planned_date,
    timeSlot: bt.departure_time ? `${bt.departure_time}-${bt.expected_arrival || ''}` : '',
    orderCount: bt.trip_orders_count || 0,
    totalValue: 0,
    completedOrders: 0,
    failedOrders: 0,
    startedAt: bt.started_at,
    completedAt: bt.completed_at || bt.cancelled_at,
    notes: bt.cancellation_reason,
    createdAt: bt.created_at,
    updatedAt: bt.updated_at,
  };
}

export const tripsApi = {
  /** Fetch all trips page data */
  getPageData: async (): Promise<TripsPageData> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendTripsResponse>>('/api/v1/admin/trips');
      const backendData = response.data.data;
      const trips = backendData.trips.map(mapBackendTrip);
      return {
        stats: {
          total: trips.length,
          scheduled: trips.filter((t) => t.status === 'scheduled').length,
          assigned: trips.filter((t) => t.status === 'assigned').length,
          inProgress: trips.filter((t) => t.status === 'in_progress').length,
          completed: trips.filter((t) => t.status === 'completed').length,
          cancelled: trips.filter((t) => t.status === 'cancelled').length,
          failed: trips.filter((t) => t.status === 'failed').length,
          totalOrders: trips.reduce((s, t) => s + t.orderCount, 0),
          totalValue: trips.reduce((s, t) => s + t.totalValue, 0),
          avgCompletionRate: 0,
        },
        trips,
        availableDrivers: [], // backend doesn't serve this yet
      };
    } catch {
      return { stats: { total: 0, scheduled: 0, assigned: 0, inProgress: 0, completed: 0, cancelled: 0, failed: 0, totalOrders: 0, totalValue: 0, avgCompletionRate: 0 }, trips: [], availableDrivers: [] };
    }
  },

  /** Get single trip details */
  getTrip: async (id: number): Promise<DashboardTrip> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendTrip>>(`/api/v1/admin/trips/${id}`);
      return mapBackendTrip(response.data.data);
    } catch {
      throw new Error('Trip not found');
    }
  },

  /** Assign a driver to a trip */
  assignDriver: async (tripId: number, driverId: number): Promise<DashboardTrip> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendTrip>>(`/api/v1/admin/trips/${tripId}/assign-driver`, { driver_id: driverId });
      return mapBackendTrip(response.data.data);
    } catch {
      throw new Error('Trip not found');
    }
  },

  /** Start a trip — backend uses PUT /trips/{id}/status with status=in_progress */
  startTrip: async (tripId: number): Promise<DashboardTrip> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendTrip>>(`/api/v1/admin/trips/${tripId}/status`, { status: 'in_progress' });
      return mapBackendTrip(response.data.data);
    } catch {
      throw new Error('Trip not found');
    }
  },

  /** Complete a trip — backend uses PUT /trips/{id}/status with status=completed */
  completeTrip: async (tripId: number): Promise<DashboardTrip> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendTrip>>(`/api/v1/admin/trips/${tripId}/status`, { status: 'completed' });
      return mapBackendTrip(response.data.data);
    } catch {
      throw new Error('Trip not found');
    }
  },

  /** Cancel a trip — backend uses PUT /trips/{id}/status with status=cancelled + reason note */
  cancelTrip: async (tripId: number, reason: string): Promise<DashboardTrip> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendTrip>>(`/api/v1/admin/trips/${tripId}/status`, { status: 'cancelled', note: reason });
      return mapBackendTrip(response.data.data);
    } catch {
      throw new Error('Trip not found');
    }
  },

  /** Get available drivers */
  getAvailableDrivers: async (): Promise<{ id: number; name: string; regionName: string; isAvailable: boolean }[]> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendAvailableDriver[]>>('/api/v1/admin/trips/available-drivers');
      const drivers = response.data.data;
      return (Array.isArray(drivers) ? drivers : []).map((d) => ({ id: d.id, name: d.full_name, regionName: d.zone_name, isAvailable: d.is_available }));
    } catch {
      return [];
    }
  },

  /** Create a new trip */
  createTrip: async (data: {
    warehouse_id: number;
    planned_date: string;
    departure_time: string;
    cutoff_time?: string;
    expected_arrival?: string;
    max_capacity?: number;
    min_orders?: number;
    assignment_type?: string;
    delivery_fee_override?: number;
    driver_id?: number;
    order_ids?: number[];
  }): Promise<DashboardTrip> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendTrip>>('/api/v1/admin/trips', data);
      return mapBackendTrip(response.data.data);
    } catch {
      throw new Error('Backend trip creation endpoint not available yet');
    }
  },
};

export type TripsApi = typeof tripsApi;
