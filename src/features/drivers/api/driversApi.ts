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

// ── Backend Raw Types (matching driver_profiles table) ──

interface BackendDriver {
  id: number;
  user_id: number;
  vehicle_type: string;
  vehicle_plate: string;
  delivery_zone_id: number;
  is_available: boolean;
  total_trips: number;
  total_orders: number;
  rating: number;
  user?: { id: number; full_name: string; phone: string; email: string; status: string } | null;
  delivery_zone?: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
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
    vehicleType: d.vehicle_type,
    vehiclePlate: d.vehicle_plate,
    zoneName: d.delivery_zone?.name || '',
    isAvailable: d.is_available,
    totalTrips: d.total_trips || 0,
    totalOrders: d.total_orders || 0,
    rating: d.rating || 0,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}

export const driversApi = {
  /** Fetch single driver */
  getDriver: async (id: number): Promise<Driver> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendDriver>>(`/api/v1/admin/drivers/${id}`);
      return mapBackendDriver(response.data.data);
    } catch {
      throw new Error('Driver not found');
    }
  },

  /** Fetch all drivers */
  getPageData: async (): Promise<DriversPageData> => {
    try {
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
    } catch {
      return { stats: { total: 0, available: 0, onTrip: 0, inactive: 0 }, drivers: [] };
    }
  },

  /** Fetch pending-approval drivers */
  getPendingApprovals: async (): Promise<Driver[]> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendDriver[]>>('/api/v1/admin/drivers/pending-approvals');
      return response.data.data.map(mapBackendDriver);
    } catch {
      return [];
    }
  },

  /** Approve a pending driver */
  approveDriver: async (id: number): Promise<Driver> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendDriver>>(`/api/v1/admin/drivers/${id}/approve`);
      return mapBackendDriver(response.data.data);
    } catch {
      throw new Error('Driver not found');
    }
  },

  /** Reject a pending driver */
  rejectDriver: async (id: number, reason?: string): Promise<Driver> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendDriver>>(`/api/v1/admin/drivers/${id}/reject`, { reason: reason || '' });
      return mapBackendDriver(response.data.data);
    } catch {
      throw new Error('Driver not found');
    }
  },

  /** Toggle driver availability — backend uses PUT /drivers/{id}/availability */
  toggleAvailability: async (id: number): Promise<Driver> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendDriver>>(`/api/v1/admin/drivers/${id}/availability`);
      return mapBackendDriver(response.data.data);
    } catch {
      throw new Error('Driver not found');
    }
  },
};

export type DriversApi = typeof driversApi;
