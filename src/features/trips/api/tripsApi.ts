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
  parentOrderId: number | null;
  status: string;
  deliveryStatus: string;
  customerName: string | null;
  total: number;
}

export type TripType = 'delivery' | 'supplier_pickup';

export interface TripStop {
  id: number;
  sequence: number;
  status: 'pending' | 'arrived' | 'collected';
  arrivedAt: string | null;
  collectedAt: string | null;
  supplier: {
    id: number;
    businessName: string;
    phone: string | null;
    latitude: string | null;
    longitude: string | null;
    address?: string | null;
    zoneId?: number | null;
  } | null;
  orders: {
    id: number;
    orderId: number;
    orderNumber: string | null;
    deliveryStatus: string | null;
    customerName: string | null;
  }[];
}

export interface PickupOrderGroup {
  supplier: {
    id: number;
    businessName: string;
    latitude: string | null;
    longitude: string | null;
    zoneId: number | null;
  };
  orders: {
    id: number;
    orderNumber: string;
    customerName: string | null;
    total: number;
    itemsCount: number;
    readyForPickupAt: string | null;
  }[];
}

interface BackendPickupOrderGroup {
  supplier: {
    id: number;
    business_name: string;
    latitude: string | null;
    longitude: string | null;
    zone_id: number | null;
  };
  orders: {
    id: number;
    order_number: string;
    customer_name: string | null;
    total: number | string;
    items_count: number;
    ready_for_pickup_at: string | null;
  }[];
}

export interface DashboardTrip {
  id: number;
  tripNumber: string;
  type: TripType;
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
  stops: TripStop[];
  supplierNames: string[];
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
  availableDrivers: { id: number; name: string; regionName: string; isAvailable: boolean; phone?: string | null }[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

// ── Backend Raw Types (matching DB schema — predicted API response) ──

interface BackendTrip {
  id: number;
  trip_number: string;
  type: TripType | null;
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
      parent_order_id: number | null;
      status: string;
      total: number | null;
      customer: { id: number; full_name: string } | null;
    } | null;
  }[];
  trip_orders_count?: number;
  stops?: {
    id: number;
    sequence: number;
    status: string;
    arrived_at: string | null;
    collected_at: string | null;
    supplier: {
      id: number;
      business_name: string;
      phone: string | null;
      latitude: string | null;
      longitude: string | null;
      address?: string | null;
      zone_id?: number | null;
    } | null;
    orders: {
      id: number;
      order_id: number;
      order_number: string | null;
      delivery_status: string | null;
      customer_name: string | null;
    }[];
  }[];
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
  phone?: string | null;
}

export interface DriverAvailabilityResult {
  available: boolean;
  reason: string | null;
  existing_trip: {
    id: number;
    trip_number: string;
    type: string | null;
    status: string | null;
    planned_date: string | null;
  } | null;
}

// ── Pickup Issue Types ──

export interface PickupIssue {
  id: number;
  trip_order_id: number | null;
  order_number: string | null;
  issue_type: string;
  note: string | null;
  resolution_state: string;
  reported_by: string | null;
  reported_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
}

interface BackendPickupIssue {
  id: number;
  trip_order_id: number | null;
  order_number: string | null;
  issue_type: string;
  note: string | null;
  resolution_state: string;
  reported_by: string | null;
  reported_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
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
    parentOrderId: to.order?.parent_order_id ?? null,
    status: to.order?.status ?? '',
    deliveryStatus: to.delivery_status,
    customerName: to.order?.customer?.full_name ?? null,
    total: parseFloat(String(to.order?.total ?? '')) || 0,
  }));
  const completed = tripOrders.filter((o) => o.deliveryStatus === 'delivered').length;
  const failed = tripOrders.filter((o) => o.deliveryStatus === 'failed').length;

  const stops: TripStop[] = (bt.stops || []).map((s) => ({
    id: s.id,
    sequence: s.sequence,
    status: (s.status as TripStop['status']) || 'pending',
    arrivedAt: s.arrived_at,
    collectedAt: s.collected_at,
    supplier: s.supplier
      ? {
          id: s.supplier.id,
          businessName: s.supplier.business_name,
          phone: s.supplier.phone,
          latitude: s.supplier.latitude,
          longitude: s.supplier.longitude,
          address: s.supplier.address,
          zoneId: s.supplier.zone_id,
        }
      : null,
    orders: (s.orders || []).map((o) => ({
      id: o.id,
      orderId: o.order_id,
      orderNumber: o.order_number,
      deliveryStatus: o.delivery_status,
      customerName: o.customer_name,
    })),
  }));

  return {
    id: bt.id,
    tripNumber: bt.trip_number,
    type: bt.type ?? 'delivery',
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
    stops,
    supplierNames: [...new Set(stops.map((s) => s.supplier?.businessName).filter((n): n is string => !!n))],
  };
}

export const tripsApi = {
  /** Fetch all trips page data */
  getPageData: async (params: { page?: number; status?: string; type?: TripType; search?: string; warehouseId?: number; driverId?: number; fromDate?: string; toDate?: string } = {}): Promise<TripsPageData> => {
    const response = await apiClient.get<ApiResponse<BackendTripsResponse>>('/api/v1/admin/trips', {
      params: {
        page: params.page ?? 1,
        per_page: 15,
        status: params.status || undefined,
        type: params.type || undefined,
        search: params.search || undefined,
        warehouse_id: params.warehouseId || undefined,
        driver_id: params.driverId || undefined,
        from_date: params.fromDate || undefined,
        to_date: params.toDate || undefined,
      },
    });
    const backendData = response.data.data;
    const trips = backendData.trips.map(mapBackendTrip);
    const meta = backendData.meta;
    return {
      stats: {
        total: meta.total ?? trips.length,
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
      meta: {
        currentPage: meta.current_page ?? 1,
        lastPage: meta.last_page ?? 1,
        perPage: 15,
        total: meta.total ?? trips.length,
      },
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
  getAvailableDrivers: async (): Promise<{ id: number; name: string; regionName: string; isAvailable: boolean; phone?: string | null }[]> => {
    const response = await apiClient.get<ApiResponse<BackendAvailableDriver[]>>('/api/v1/admin/trips/available-drivers');
    const drivers = response.data.data;
    return (Array.isArray(drivers) ? drivers : []).map((d) => ({ id: d.id, name: d.full_name, regionName: d.zone_name, isAvailable: d.is_available, phone: d.phone || null }));
  },

  /** Check whether a driver is free on a given date (prevents double-booking) */
  checkDriverAvailability: async (driverId: number, plannedDate?: string): Promise<DriverAvailabilityResult> => {
    const response = await apiClient.get<ApiResponse<DriverAvailabilityResult>>('/api/v1/admin/trips/driver-availability', {
      params: {
        driver_id: driverId,
        planned_date: plannedDate || undefined,
      },
    });
    return response.data.data;
  },

  /** List ALL approved drivers (not just currently-available) with per-date booking flags */
  getAllDrivers: async (params: { search?: string; zoneId?: number; plannedDate?: string; excludeTripId?: number } = {}): Promise<{ id: number; name: string; phone: string | null; regionName: string; isAvailable: boolean; bookedTripNumber: string | null }[]> => {
    const response = await apiClient.get<ApiResponse<{ id: number; full_name: string; phone: string | null; zone_name: string; is_available: boolean; booked_trip_number: string | null }[]>>('/api/v1/admin/trips/drivers', {
      params: {
        search: params.search || undefined,
        zone_id: params.zoneId || undefined,
        planned_date: params.plannedDate || undefined,
        exclude_trip_id: params.excludeTripId || undefined,
      },
    });
    const drivers = response.data.data;
    return (Array.isArray(drivers) ? drivers : []).map((d) => ({
      id: d.id,
      name: d.full_name,
      phone: d.phone || null,
      regionName: d.zone_name,
      isAvailable: d.is_available,
      bookedTripNumber: d.booked_trip_number || null,
    }));
  },

  /** Create a new trip */
  createTrip: async (data: {
    type?: TripType;
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
    zone_ids?: number[];
  }): Promise<DashboardTrip> => {
    const response = await apiClient.post<ApiResponse<BackendTrip>>('/api/v1/admin/trips', data);
    return mapBackendTrip(response.data.data);
  },

  /** Optimize stop/order route for a trip */
  optimizeRoute: async (tripId: number): Promise<DashboardTrip> => {
    const response = await apiClient.post<ApiResponse<BackendTrip>>(`/api/v1/admin/trips/${tripId}/optimize-route`);
    return mapBackendTrip(response.data.data);
  },

  /** Remove an order from a trip */
  removeOrderFromTrip: async (tripId: number, orderId: number): Promise<DashboardTrip> => {
    const response = await apiClient.delete<ApiResponse<BackendTrip>>(`/api/v1/admin/trips/${tripId}/orders/${orderId}`);
    return mapBackendTrip(response.data.data);
  },

  /** Get orders ready for supplier pickup, grouped by supplier */
  getPickupOrders: async (params: { warehouseId?: number; supplierId?: number; search?: string } = {}): Promise<PickupOrderGroup[]> => {
    const response = await apiClient.get<ApiResponse<{ suppliers: BackendPickupOrderGroup[] }>>('/api/v1/admin/aggregation/pickup-orders', {
      params: {
        warehouse_id: params.warehouseId || undefined,
        supplier_id: params.supplierId || undefined,
        search: params.search || undefined,
      },
    });
    const groups = response.data.data?.suppliers ?? [];
    return groups.map((g) => ({
      supplier: {
        id: g.supplier.id,
        businessName: g.supplier.business_name,
        latitude: g.supplier.latitude,
        longitude: g.supplier.longitude,
        zoneId: g.supplier.zone_id,
      },
      orders: g.orders.map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        customerName: o.customer_name,
        total: parseFloat(String(o.total ?? '0')) || 0,
        itemsCount: o.items_count ?? 0,
        readyForPickupAt: o.ready_for_pickup_at,
      })),
    }));
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
    const response = await apiClient.get<ApiResponse<{ issues: BackendPickupIssue[] }>>(`/api/v1/admin/trips/${tripId}/pickup/issues`);
    return response.data.data?.issues ?? [];
  },

  /** Resolve a pickup issue */
  resolvePickupIssue: async (tripId: number, issueId: number): Promise<PickupIssue> => {
    const response = await apiClient.put<ApiResponse<BackendPickupIssue>>(`/api/v1/admin/trips/${tripId}/pickup-issues/${issueId}/resolve`, { resolution_state: 'resolved' });
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
