// ============================================================
// Trips API Service
// ============================================================
// Backend tables: trips, trip_orders, trip_status_logs, driver_trip_rejections
// Admin routes: NOT YET BUILT in backend
// Predicted routes (matching existing controller pattern):
//   GET    /api/v1/admin/trips
//   GET    /api/v1/admin/trips/{id}
//   POST   /api/v1/admin/trips/{id}/assign-driver
//   POST   /api/v1/admin/trips/{id}/start
//   POST   /api/v1/admin/trips/{id}/complete
//   GET    /api/v1/admin/trips/available-drivers
// ============================================================

import { apiClient } from '@/lib/axios';
import { unwrap } from '@/lib/apiHelpers';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
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
  trip_code: string;
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
  warehouse?: { id: number; name: string } | null;
  driver?: { id: number; full_name: string } | null;
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
    tripNumber: bt.trip_code,
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

// ── Dummy Data ──

const now = new Date();
const today = now.toISOString().split('T')[0];

const DUMMY_TRIPS: DashboardTrip[] = [
  { id: 1, tripNumber: 'TRP-2025-001', driverId: 1, driverName: 'Hassan Ali', regionName: 'Riyadh North', clusterName: 'Al-Olaya', status: 'in_progress', scheduledDate: today, timeSlot: '08:00-12:00', orderCount: 8, totalValue: 1240, completedOrders: 4, failedOrders: 0, startedAt: `${today}T08:15:00Z`, completedAt: null, notes: null, createdAt: `${today}T06:00:00Z`, updatedAt: `${today}T08:15:00Z` },
  { id: 2, tripNumber: 'TRP-2025-002', driverId: 2, driverName: 'Omar Farouk', regionName: 'Riyadh South', clusterName: 'Al-Batha', status: 'in_progress', scheduledDate: today, timeSlot: '08:00-12:00', orderCount: 6, totalValue: 890, completedOrders: 2, failedOrders: 1, startedAt: `${today}T08:30:00Z`, completedAt: null, notes: 'One customer not home', createdAt: `${today}T06:00:00Z`, updatedAt: `${today}T08:30:00Z` },
  { id: 3, tripNumber: 'TRP-2025-003', driverId: 3, driverName: 'Khaled Ahmed', regionName: 'Jeddah Central', clusterName: 'Al-Salamah', status: 'completed', scheduledDate: today, timeSlot: '08:00-12:00', orderCount: 7, totalValue: 1560, completedOrders: 7, failedOrders: 0, startedAt: `${today}T08:00:00Z`, completedAt: `${today}T11:45:00Z`, notes: null, createdAt: `${today}T06:00:00Z`, updatedAt: `${today}T11:45:00Z` },
  { id: 4, tripNumber: 'TRP-2025-004', driverId: null, driverName: null, regionName: 'Riyadh North', clusterName: 'Al-Malaz', status: 'scheduled', scheduledDate: today, timeSlot: '14:00-18:00', orderCount: 9, totalValue: 1340, completedOrders: 0, failedOrders: 0, startedAt: null, completedAt: null, notes: 'Need to assign driver', createdAt: `${today}T06:00:00Z`, updatedAt: `${today}T06:00:00Z` },
  { id: 5, tripNumber: 'TRP-2025-005', driverId: 4, driverName: 'Majid Sultan', regionName: 'Dammam East', clusterName: 'Al-Dammam Downtown', status: 'assigned', scheduledDate: today, timeSlot: '14:00-18:00', orderCount: 5, totalValue: 670, completedOrders: 0, failedOrders: 0, startedAt: null, completedAt: null, notes: null, createdAt: `${today}T06:00:00Z`, updatedAt: `${today}T08:00:00Z` },
  { id: 6, tripNumber: 'TRP-2025-006', driverId: null, driverName: null, regionName: 'Mecca North', clusterName: 'Al-Aziziyah', status: 'scheduled', scheduledDate: today, timeSlot: '14:00-18:00', orderCount: 4, totalValue: 520, completedOrders: 0, failedOrders: 0, startedAt: null, completedAt: null, notes: 'Region inactive — check', createdAt: `${today}T06:00:00Z`, updatedAt: `${today}T06:00:00Z` },
  { id: 7, tripNumber: 'TRP-2025-007', driverId: 1, driverName: 'Hassan Ali', regionName: 'Riyadh North', clusterName: 'King Fahd District', status: 'cancelled', scheduledDate: today, timeSlot: '08:00-12:00', orderCount: 3, totalValue: 450, completedOrders: 0, failedOrders: 0, startedAt: null, completedAt: null, notes: 'Driver unavailable — trip cancelled', createdAt: `${today}T05:00:00Z`, updatedAt: `${today}T07:00:00Z` },
];

const DUMMY_DRIVERS = [
  { id: 1, name: 'Hassan Ali', regionName: 'Riyadh North', isAvailable: false },
  { id: 2, name: 'Omar Farouk', regionName: 'Riyadh South', isAvailable: false },
  { id: 3, name: 'Khaled Ahmed', regionName: 'Jeddah Central', isAvailable: true },
  { id: 4, name: 'Majid Sultan', regionName: 'Dammam East', isAvailable: true },
  { id: 5, name: 'Sami Walid', regionName: 'Mecca North', isAvailable: true },
  { id: 6, name: 'Faisal Omar', regionName: 'Riyadh North', isAvailable: true },
];

const DUMMY_STATS = {
  total: 7, scheduled: 2, assigned: 1, inProgress: 2, completed: 1, cancelled: 1, failed: 0,
  totalOrders: 42, totalValue: 6670, avgCompletionRate: 85,
};

function getDummyPageData(): TripsPageData {
  return { stats: DUMMY_STATS, trips: DUMMY_TRIPS, availableDrivers: DUMMY_DRIVERS };
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
      return getDummyPageData();
    }
  },

  /** Get single trip details */
  getTrip: async (id: number): Promise<DashboardTrip> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendTrip>>(`/api/v1/admin/trips/${id}`);
      return mapBackendTrip(response.data.data);
    } catch {
      const trip = DUMMY_TRIPS.find((t) => t.id === id);
      if (!trip) throw new Error('Trip not found');
      return trip;
    }
  },

  /** Assign a driver to a trip */
  assignDriver: async (tripId: number, driverId: number, _driverName: string): Promise<DashboardTrip> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendTrip>>(`/api/v1/admin/trips/${tripId}/assign-driver`, { driver_id: driverId });
      return mapBackendTrip(response.data.data);
    } catch {
      const trip = DUMMY_TRIPS.find((t) => t.id === tripId);
      if (!trip) throw new Error('Trip not found');
      const driver = DUMMY_DRIVERS.find((d) => d.id === driverId);
      return { ...trip, driverId, driverName: driver?.name || _driverName, status: 'assigned', updatedAt: new Date().toISOString() };
    }
  },

  /** Start a trip */
  startTrip: async (tripId: number): Promise<DashboardTrip> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendTrip>>(`/api/v1/admin/trips/${tripId}/start`);
      return mapBackendTrip(response.data.data);
    } catch {
      const trip = DUMMY_TRIPS.find((t) => t.id === tripId);
      if (!trip) throw new Error('Trip not found');
      return { ...trip, status: 'in_progress', startedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    }
  },

  /** Complete a trip */
  completeTrip: async (tripId: number): Promise<DashboardTrip> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendTrip>>(`/api/v1/admin/trips/${tripId}/complete`);
      return mapBackendTrip(response.data.data);
    } catch {
      const trip = DUMMY_TRIPS.find((t) => t.id === tripId);
      if (!trip) throw new Error('Trip not found');
      return { ...trip, status: 'completed', completedAt: new Date().toISOString(), completedOrders: trip.orderCount, updatedAt: new Date().toISOString() };
    }
  },

  /** Get available drivers */
  getAvailableDrivers: async (): Promise<{ id: number; name: string; regionName: string; isAvailable: boolean }[]> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendAvailableDriver[]>>('/api/v1/admin/trips/available-drivers');
      const drivers = unwrap(response.data);
      return drivers.map((d) => ({ id: d.id, name: d.full_name, regionName: d.zone_name, isAvailable: d.is_available }));
    } catch {
      return DUMMY_DRIVERS;
    }
  },
};

export type TripsApi = typeof tripsApi;
