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

export interface Driver {
  id: number;
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehiclePlate: string;
  licenseNumber: string;
  applicationNumber: string;
  approvalStatus: string;
  zoneName: string;
  isAvailable: boolean;
  totalTrips: number;
  totalOrders: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface DriversPageData {
  stats: {
    total: number;
    available: number;
    onTrip: number;
    inactive: number;
  };
  drivers: Driver[];
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
    approvalStatus: d.approval_status || 'pending',
    zoneName: d.zone?.name || '',
    isAvailable: d.is_available ?? false,
    totalTrips: 0,
    totalOrders: 0,
    rating: 0,
    createdAt: d.created_at || new Date().toISOString(),
    updatedAt: d.created_at || new Date().toISOString(),
  };
}

export const driversApi = {
  /** Fetch single driver */
  getDriver: async (id: number): Promise<Driver> => {
    const response = await apiClient.get<ApiResponse<BackendDriver>>(`/api/v1/admin/drivers/${id}`);
    return mapBackendDriver(response.data.data);
  },

  /** Fetch all drivers */
  getPageData: async (): Promise<DriversPageData> => {
    const response = await apiClient.get<ApiResponse<BackendDriversResponse>>('/api/v1/admin/drivers');
    const backendData = response.data.data;
    const drivers = backendData.drivers.map(mapBackendDriver);
    return {
      stats: {
        total: drivers.length,
        available: drivers.filter((d) => d.isAvailable).length,
        onTrip: drivers.filter((d) => !d.isAvailable).length,
        inactive: 0,
      },
      drivers,
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

  /** Toggle driver availability — backend uses PUT /drivers/{id}/availability */
  toggleAvailability: async (id: number): Promise<Driver> => {
    const response = await apiClient.put<ApiResponse<BackendDriver>>(`/api/v1/admin/drivers/${id}/availability`);
    return mapBackendDriver(response.data.data);
  },
};

export type DriversApi = typeof driversApi;
