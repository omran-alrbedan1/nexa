// ============================================================
// Drivers API Service
// ============================================================
// Backend table: driver_profiles
// Admin routes: ✅ BUILT (DriverController)
//   GET    /api/v1/admin/drivers
//   GET    /api/v1/admin/drivers/pending-approvals
//   GET    /api/v1/admin/drivers/{id}
//   POST   /api/v1/admin/drivers/{id}/approve
//   POST   /api/v1/admin/drivers/{id}/reject
//   PUT    /api/v1/admin/drivers/{id}/availability
// ============================================================

import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

// ── Domain Types ──

export type DriverApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface DriverTripOrder {
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
}

export interface DriverTrip {
  id: number;
  trip_number: string;
  status: string;
  planned_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  orders_count: number;
  trip_orders: DriverTripOrder[];
}

export interface Driver {
  id: number;
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehiclePlate: string;
  licenseNumber: string;
  applicationNumber: string;
  approvalStatus: DriverApprovalStatus;
  zoneName: string;
  isAvailable: boolean;
  userStatus: string;
  totalTrips: number;
  totalOrders: number;
  rating: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
  recentTrips: DriverTrip[];
}

export interface DriversPageData {
  stats: {
    total: number;
    available: number;
    onTrip: number;
    inactive: number;
    pendingApproval: number;
  };
  drivers: Driver[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

// ── Backend Raw Types (matching DriverResource from backend) ──

interface BackendDriverDocument {
  id: number;
  type: string;
  file_path: string | null;
  status: string;
  uploaded_at: string;
}

interface BackendDriverUser {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  status: string;
  avatar: string | null;
  documents?: BackendDriverDocument[];
}

interface BackendDriverZone {
  id: number;
  name: string;
}

interface BackendDriverTimelineEntry {
  code: string;
  label: string;
  status: string;
  occurred_at: string | null;
}

interface BackendDriverTripOrder {
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
}

interface BackendDriverTrip {
  id: number;
  trip_number: string;
  status: string;
  planned_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  orders_count: number;
  trip_orders: BackendDriverTripOrder[];
}

interface BackendDriver {
  id: number;
  application_number: string | null;
  license_number: string | null;
  vehicle_type: string;
  vehicle_plate: string;
  is_available: boolean;
  approval_status: string;
  approved_at: string | null;
  rejection_reason: string | null;
  birthdate: string | null;
  iban_display: string | null;
  country_code: string | null;
  city_id: number | null;
  service_region_id: number | null;
  address_line1: string | null;
  address_line2: string | null;
  latitude: number | null;
  longitude: number | null;
  submitted_at: string | null;
  review_min_hours: number | null;
  review_max_hours: number | null;
  total_trips: number;
  completed_trips: number;
  rating_avg: number | null;
  total_revenue: number;
  recent_trips: BackendDriverTrip[];
  user?: BackendDriverUser | null;
  zone?: BackendDriverZone | null;
  timeline?: BackendDriverTimelineEntry[];
  created_at: string | null;
}

interface BackendDriversResponse {
  drivers: BackendDriver[];
  meta: { current_page: number; last_page: number; total: number };
}

// ── Mapping ──

function mapApprovalStatus(raw: string): DriverApprovalStatus {
  if (raw === 'approved') return 'approved';
  if (raw === 'rejected') return 'rejected';
  return 'pending';
}

function mapBackendDriver(d: BackendDriver): Driver {
  return {
    id: d.id,
    name: d.user?.full_name || 'Unknown',
    phone: d.user?.phone || '',
    email: d.user?.email || '',
    vehicleType: d.vehicle_type || '',
    vehiclePlate: d.vehicle_plate || '',
    licenseNumber: d.license_number || '',
    applicationNumber: d.application_number || '',
    approvalStatus: mapApprovalStatus(d.approval_status),
    zoneName: d.zone?.name || '',
    isAvailable: d.is_available ?? false,
    userStatus: d.user?.status || 'active',
    totalTrips: d.total_trips || 0,
    totalOrders: d.completed_trips || 0,
    rating: d.rating_avg || 0,
    totalRevenue: d.total_revenue || 0,
    createdAt: d.created_at || new Date().toISOString(),
    updatedAt: d.created_at || new Date().toISOString(),
    recentTrips: (d.recent_trips || []).map((t) => ({
      id: t.id,
      trip_number: t.trip_number,
      status: t.status,
      planned_date: t.planned_date,
      started_at: t.started_at,
      completed_at: t.completed_at,
      orders_count: t.orders_count,
      trip_orders: (t.trip_orders || []).map((to) => ({
        id: to.id,
        sequence: to.sequence,
        delivery_status: to.delivery_status,
        order: to.order,
      })),
    })),
  };
}

export const driversApi = {
  /** Fetch single driver */
  getDriver: async (id: number): Promise<Driver> => {
    const response = await apiClient.get<ApiResponse<BackendDriver>>(`/api/v1/admin/drivers/${id}`);
    return mapBackendDriver(response.data.data);
  },

  /** Fetch all drivers (optional filters) */
  getPageData: async (filters?: { approval_status?: DriverApprovalStatus; search?: string; page?: number }): Promise<DriversPageData> => {
    const response = await apiClient.get<ApiResponse<BackendDriversResponse>>('/api/v1/admin/drivers', {
      params: {
        page: filters?.page ?? 1,
        per_page: 15,
        approval_status: filters?.approval_status || undefined,
        search: filters?.search || undefined,
      },
    });
    const backendData = response.data.data;
    const drivers = backendData.drivers.map(mapBackendDriver);
    const meta = backendData.meta;
    return {
      stats: {
        total: meta.total ?? drivers.length,
        available: drivers.filter((d) => d.isAvailable).length,
        onTrip: drivers.filter((d) => !d.isAvailable).length,
        inactive: 0,
        pendingApproval: drivers.filter((d) => d.approvalStatus === 'pending').length,
      },
      drivers,
      meta: {
        currentPage: meta.current_page ?? 1,
        lastPage: meta.last_page ?? 1,
        perPage: 15,
        total: meta.total ?? drivers.length,
      },
    };
  },

  /** Fetch pending-approval drivers */
  getPendingApprovals: async (): Promise<Driver[]> => {
    const response = await apiClient.get<ApiResponse<{ drivers: BackendDriver[] }>>('/api/v1/admin/drivers/pending-approvals');
    return (response.data.data?.drivers ?? []).map(mapBackendDriver);
  },

  /** Approve a pending driver */
  approveDriver: async (id: number): Promise<Driver> => {
    const response = await apiClient.post<ApiResponse<BackendDriver>>(`/api/v1/admin/drivers/${id}/approve`);
    return mapBackendDriver(response.data.data);
  },

  /** Reject a pending driver */
  rejectDriver: async (id: number, reason?: string): Promise<Driver> => {
    const response = await apiClient.post<ApiResponse<BackendDriver>>(`/api/v1/admin/drivers/${id}/reject`, { reason: reason || '' });
    return mapBackendDriver(response.data.data);
  },

  /** Create a new driver */
  create: async (data: {
    first_name: string;
    last_name?: string;
    phone: string;
    email?: string;
    vehicle_type?: string;
    vehicle_plate?: string;
    license_number?: string;
    zone_id?: number;
    address_line1?: string;
  }): Promise<Driver> => {
    const response = await apiClient.post<ApiResponse<BackendDriver>>('/api/v1/admin/drivers', data);
    return mapBackendDriver(response.data.data);
  },

  /** Toggle driver availability — backend uses PUT /drivers/{id}/availability */
  toggleAvailability: async (id: number): Promise<Driver> => {
    const response = await apiClient.put<ApiResponse<BackendDriver>>(`/api/v1/admin/drivers/${id}/availability`);
    return mapBackendDriver(response.data.data);
  },
};

export type DriversApi = typeof driversApi;
