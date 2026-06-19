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

// ── Dummy Data ──

const DUMMY_DRIVERS: Driver[] = [
  { id: 1, name: 'Hassan Ali', phone: '+966501234001', email: 'hassan@example.com', vehicleType: 'Van', vehiclePlate: 'ABC-1234', zoneName: 'Riyadh North', isAvailable: false, totalTrips: 45, totalOrders: 320, rating: 4.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, name: 'Omar Farouk', phone: '+966501234002', email: 'omar@example.com', vehicleType: 'Truck', vehiclePlate: 'XYZ-5678', zoneName: 'Riyadh South', isAvailable: false, totalTrips: 38, totalOrders: 290, rating: 4.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 3, name: 'Khaled Ahmed', phone: '+966501234003', email: 'khaled@example.com', vehicleType: 'Van', vehiclePlate: 'DEF-9012', zoneName: 'Jeddah Central', isAvailable: true, totalTrips: 52, totalOrders: 410, rating: 4.9, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 4, name: 'Majid Sultan', phone: '+966501234004', email: 'majid@example.com', vehicleType: 'Truck', vehiclePlate: 'GHI-3456', zoneName: 'Dammam East', isAvailable: true, totalTrips: 27, totalOrders: 195, rating: 4.2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 5, name: 'Sami Walid', phone: '+966501234005', email: 'sami@example.com', vehicleType: 'Van', vehiclePlate: 'JKL-7890', zoneName: 'Mecca North', isAvailable: true, totalTrips: 19, totalOrders: 140, rating: 4.0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 6, name: 'Faisal Omar', phone: '+966501234006', email: 'faisal@example.com', vehicleType: 'Van', vehiclePlate: 'MNO-1234', zoneName: 'Riyadh North', isAvailable: true, totalTrips: 12, totalOrders: 85, rating: 3.8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 7, name: 'Nasser Al-Ghamdi', phone: '+966501234007', email: 'nasser@example.com', vehicleType: 'Motorcycle', vehiclePlate: 'PQR-5678', zoneName: 'Jeddah Central', isAvailable: false, totalTrips: 8, totalOrders: 42, rating: 3.5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

function getDummyPageData(): DriversPageData {
  const available = DUMMY_DRIVERS.filter((d) => d.isAvailable).length;
  const onTrip = DUMMY_DRIVERS.length - available;
  return {
    stats: { total: DUMMY_DRIVERS.length, available, onTrip: onTrip > 0 ? Math.ceil(onTrip * 0.6) : 0, inactive: onTrip > 0 ? Math.floor(onTrip * 0.4) : 0 },
    drivers: DUMMY_DRIVERS,
  };
}

export const driversApi = {
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
      return getDummyPageData();
    }
  },

  /** Toggle driver availability — backend uses PUT /drivers/{id}/availability */
  toggleAvailability: async (id: number): Promise<Driver> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendDriver>>(`/api/v1/admin/drivers/${id}/availability`);
      return mapBackendDriver(response.data.data);
    } catch {
      const driver = DUMMY_DRIVERS.find((d) => d.id === id);
      if (!driver) throw new Error('Driver not found');
      return { ...driver, isAvailable: !driver.isAvailable, updatedAt: new Date().toISOString() };
    }
  },
};

export type DriversApi = typeof driversApi;
