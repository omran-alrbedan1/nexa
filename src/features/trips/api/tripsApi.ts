// ============================================================
// Trips API Service
// ============================================================
// Backend routes: ✅ BUILT (TripController + Pickup/Closure)
//   GET    /api/v1/admin/trips
//   GET    /api/v1/admin/trips/{id}
//   POST   /api/v1/admin/trips
//   PUT    /api/v1/admin/trips/{id}
//   POST   /api/v1/admin/trips/{id}/assign-driver
//   POST   /api/v1/admin/trips/{id}/orders
//   PUT    /api/v1/admin/trips/{id}/status
//   POST   /api/v1/admin/trips/{id}/pickup/start
//   POST   /api/v1/admin/trips/{id}/pickup/confirm
//   POST   /api/v1/admin/trips/{id}/closure/advance
//   POST   /api/v1/admin/trips/{id}/closure/close
//   POST   /api/v1/admin/trips/{id}/bump-manifest
//   GET    /api/v1/admin/trips/{id}/pickup/issues
//   POST   /api/v1/admin/trips/{id}/pickup/issues/{issue}/resolve
//   GET    /api/v1/admin/trips/{id}/cod-handovers
//   POST   /api/v1/admin/trips/{id}/cod-handovers/{handover}/confirm
// ============================================================

import { apiClient } from '@/lib/axios';
import { mapFromBackend, TRIP_STATUS_BACKEND_TO_FRONTEND } from '@/lib/enumMappers';
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

export interface TripOrderDetail {
  id: number;
  orderId: number;
  orderNumber: string;
  status: string;
  deliveryStatus: string;
  customerName: string | null;
  total: number;
}

export interface DashboardTrip {
  id: number;
  tripNumber: string;
  driverId: number | null;
  driverName: string | null;
  regionName: string;
  clusterName: string;
  status: TripStatus;
  pickupStatus: string | null;
  closureStatus: string | null;
  manifestVersion: number;
  closureVersion: number;
  scheduledDate: string;
  timeSlot: string;
  orderCount: number;
  totalValue: number;
  completedOrders: number;
  failedOrders: number;
  startedAt: string | null;
  completedAt: string | null;
  pickupStartedAt: string | null;
  pickupCompletedAt: string | null;
  closureStartedAt: string | null;
  closureCompletedAt: string | null;
  closedAt: string | null;
  canConfirmPickup: boolean;
  canCloseTrip: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  tripOrders: TripOrderDetail[];
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
    pickupPending: number;
    closurePending: number;
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
  pickup_status: string | null;
  closure_status: string | null;
  manifest_version: number;
  closure_version: number;
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
  pickup_started_at: string | null;
  pickup_completed_at: string | null;
  closure_started_at: string | null;
  closure_completed_at: string | null;
  closed_at: string | null;
  can_confirm_pickup: boolean;
  can_close_trip: boolean;
  warehouse?: { id: number; name: string; code?: string } | null;
  driver?: { id: number; full_name: string; phone?: string } | null;
  zones?: { id: number; name: string }[];
  trip_orders?: {
    id: number;
    sequence: number;
    delivery_status: string;
    order: {
      id: number;
      order_number: string;
      status: string;
      total: number | null;
      customer: { id: number; full_name: string } | null;
    } | null;
  }[];
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

// ── Pickup Issue Types ──

export interface PickupIssue {
  id: number;
  trip_id: number;
  order_id: number | null;
  issue_type: string;
  description: string;
  status: string;
  resolved_at: string | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
  order?: { id: number; order_number: string } | null;
}

// ── COD Handover Types ──

export interface CodHandover {
  id: number;
  trip_id: number;
  driver_id: number;
  amount: number;
  currency: string;
  status: string;
  confirmed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  driver?: { id: number; full_name: string } | null;
}

// ── Mapping ──

function mapBackendTrip(bt: BackendTrip): DashboardTrip {
  const tripOrders: TripOrderDetail[] = (bt.trip_orders || []).map((to) => ({
    id: to.id,
    orderId: to.order?.id ?? 0,
    orderNumber: to.order?.order_number ?? '',
    status: to.order?.status ?? '',
    deliveryStatus: to.delivery_status,
    customerName: to.order?.customer?.full_name ?? null,
    total: parseFloat(String(to.order?.total ?? '')) || 0,
  }));
  const completed = tripOrders.filter((o) => o.deliveryStatus === 'delivered').length;
  const failed = tripOrders.filter((o) => o.deliveryStatus === 'failed').length;

  return {
    id: bt.id,
    tripNumber: bt.trip_number,
    driverId: bt.driver_id || null,
    driverName: bt.driver?.full_name || null,
    regionName: bt.warehouse?.name || '',
    clusterName: '',
    status: mapFromBackend(bt.status, TRIP_STATUS_BACKEND_TO_FRONTEND) as TripStatus,
    pickupStatus: bt.pickup_status,
    closureStatus: bt.closure_status,
    manifestVersion: bt.manifest_version ?? 0,
    closureVersion: bt.closure_version ?? 0,
    scheduledDate: bt.planned_date,
    timeSlot: bt.departure_time ? `${bt.departure_time}-${bt.expected_arrival || ''}` : '',
    orderCount: tripOrders.length,
    totalValue: tripOrders.reduce((s, o) => s + (o.total ?? 0), 0),
    completedOrders: completed,
    failedOrders: failed,
    startedAt: bt.started_at,
    completedAt: bt.completed_at || bt.cancelled_at,
    pickupStartedAt: bt.pickup_started_at,
    pickupCompletedAt: bt.pickup_completed_at,
    closureStartedAt: bt.closure_started_at,
    closureCompletedAt: bt.closure_completed_at,
    closedAt: bt.closed_at,
    canConfirmPickup: bt.can_confirm_pickup ?? false,
    canCloseTrip: bt.can_close_trip ?? false,
    notes: bt.cancellation_reason,
    createdAt: bt.created_at,
    updatedAt: bt.updated_at,
    tripOrders,
  };
}

export const tripsApi = {
  /** Fetch all trips page data */
  getPageData: async (): Promise<TripsPageData> => {
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
        pickupPending: trips.filter((t) => t.status === 'pickup_pending').length,
        closurePending: trips.filter((t) => t.status === 'closure_pending').length,
        totalOrders: trips.reduce((s, t) => s + t.orderCount, 0),
        totalValue: trips.reduce((s, t) => s + t.totalValue, 0),
        avgCompletionRate: 0,
      },
      trips,
      availableDrivers: [], // backend doesn't serve this yet
    };
  },

  /** Get single trip details */
  getTrip: async (id: number): Promise<DashboardTrip> => {
    const response = await apiClient.get<ApiResponse<BackendTrip>>(`/api/v1/admin/trips/${id}`);
    return mapBackendTrip(response.data.data);
  },

  /** Assign a driver to a trip */
  assignDriver: async (tripId: number, driverId: number): Promise<DashboardTrip> => {
    const response = await apiClient.post<ApiResponse<BackendTrip>>(`/api/v1/admin/trips/${tripId}/assign-driver`, { driver_id: driverId });
    return mapBackendTrip(response.data.data);
  },

  /** Start a trip — backend uses PUT /trips/{id}/status with status=in_progress */
  startTrip: async (tripId: number): Promise<DashboardTrip> => {
    const response = await apiClient.put<ApiResponse<BackendTrip>>(`/api/v1/admin/trips/${tripId}/status`, { status: 'in_progress' });
    return mapBackendTrip(response.data.data);
  },

  /** Complete a trip — backend uses PUT /trips/{id}/status with status=completed */
  completeTrip: async (tripId: number): Promise<DashboardTrip> => {
    const response = await apiClient.put<ApiResponse<BackendTrip>>(`/api/v1/admin/trips/${tripId}/status`, { status: 'completed' });
    return mapBackendTrip(response.data.data);
  },

  /** Cancel a trip — backend uses PUT /trips/{id}/status with status=cancelled + reason note */
  cancelTrip: async (tripId: number, reason: string): Promise<DashboardTrip> => {
    const response = await apiClient.put<ApiResponse<BackendTrip>>(`/api/v1/admin/trips/${tripId}/status`, { status: 'cancelled', note: reason });
    return mapBackendTrip(response.data.data);
  },

  /** Get available drivers */
  getAvailableDrivers: async (): Promise<{ id: number; name: string; regionName: string; isAvailable: boolean }[]> => {
    const response = await apiClient.get<ApiResponse<BackendAvailableDriver[]>>('/api/v1/admin/trips/available-drivers');
    const drivers = response.data.data;
    return (Array.isArray(drivers) ? drivers : []).map((d) => ({ id: d.id, name: d.full_name, regionName: d.zone_name, isAvailable: d.is_available }));
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
    const response = await apiClient.post<ApiResponse<BackendTrip>>('/api/v1/admin/trips', data);
    return mapBackendTrip(response.data.data);
  },

  // ── Manifest ──

  /** Bump manifest version */
  bumpManifest: async (tripId: number): Promise<{ manifest_version: number }> => {
    const response = await apiClient.post<ApiResponse<{ manifest_version: number }>>(`/api/v1/admin/trips/${tripId}/bump-manifest`);
    return response.data.data;
  },

  // ── Pickup Issues ──

  /** Get pickup issues for a trip */
  getPickupIssues: async (tripId: number): Promise<PickupIssue[]> => {
    const response = await apiClient.get<ApiResponse<{ issues: PickupIssue[] }>>(`/api/v1/admin/trips/${tripId}/pickup/issues`);
    return response.data.data?.issues ?? [];
  },

  /** Resolve a pickup issue */
  resolvePickupIssue: async (tripId: number, issueId: number, data: { resolution: string; notes?: string }): Promise<PickupIssue> => {
    const response = await apiClient.put<ApiResponse<PickupIssue>>(`/api/v1/admin/trips/${tripId}/pickup-issues/${issueId}/resolve`, data);
    return response.data.data;
  },

  // ── COD Handovers ──

  /** Get COD handovers for a trip */
  getCodHandovers: async (tripId: number): Promise<CodHandover[]> => {
    const response = await apiClient.get<ApiResponse<CodHandover[]>>(`/api/v1/admin/trips/${tripId}/cod-handovers`);
    return response.data.data ?? [];
  },

  /** Confirm a COD handover */
  confirmCodHandover: async (tripId: number, handoverId: number): Promise<CodHandover> => {
    const response = await apiClient.put<ApiResponse<CodHandover>>(`/api/v1/admin/trips/${tripId}/cod-handovers/${handoverId}/confirm`, { confirmed: true });
    return response.data.data;
  },
};

export type TripsApi = typeof tripsApi;
