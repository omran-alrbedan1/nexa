// ============================================================
// Regions API Service
// ============================================================
// Backend tables: delivery_zones, provinces, clusters, delivery_slots, zone_working_days
// Admin routes: NOT YET BUILT in backend
// Predicted routes:
//   GET    /api/v1/admin/zones
//   GET    /api/v1/admin/zones/{id}
//   POST   /api/v1/admin/zones/{id}/toggle
//   PUT    /api/v1/admin/zones/{id}/delivery-fee
// ============================================================

import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface TimeSlot {
  id: number;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  maxOrders: number;
  isActive: boolean;
}

export interface Region {
  id: number;
  name: string;
  nameAr: string;
  deliveryFee: number;
  minimumOrder: number;
  freeDeliveryThreshold: number | null;
  isActive: boolean;
  clusters: Cluster[];
  timeSlots: TimeSlot[];
  totalOrders: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cluster {
  id: number;
  name: string;
  nameAr: string;
  regionId: number;
  isActive: boolean;
}

export interface RegionsPageData {
  stats: {
    totalRegions: number;
    activeRegions: number;
    totalClusters: number;
    totalOrders: number;
    totalRevenue: number;
    avgDeliveryFee: number;
  };
  regions: Region[];
}

// ── Backend Raw Types (matching delivery_zones table — predicted API) ──

interface BackendDeliveryZone {
  id: number;
  code: string;
  name_ar: string;
  name_en: string | null;
  province_id: number;
  is_active: boolean;
  default_warehouse_id: number | null;
  province?: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

interface BackendZonesResponse {
  zones: BackendDeliveryZone[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

// ── Mapping ──

function mapBackendZone(z: BackendDeliveryZone): Region {
  return {
    id: z.id,
    name: z.name_ar || z.name_en || '', // Arabic first for Saudi app
    nameAr: z.name_ar,
    deliveryFee: 0,
    minimumOrder: 0,
    freeDeliveryThreshold: null,
    isActive: z.is_active,
    clusters: [],
    timeSlots: [],
    totalOrders: 0,
    totalRevenue: 0,
    createdAt: z.created_at,
    updatedAt: z.updated_at,
  };
}

export const regionsApi = {
  /** Fetch all regions page data */
  getPageData: async (): Promise<RegionsPageData> => {
    const response = await apiClient.get<ApiResponse<BackendZonesResponse>>('/api/v1/admin/zones');
    const backendData = response.data.data;
    const regions = backendData.zones.map(mapBackendZone);
    return {
      stats: {
        totalRegions: regions.length,
        activeRegions: regions.filter((r) => r.isActive).length,
        totalClusters: 0,
        totalOrders: 0,
        totalRevenue: 0,
        avgDeliveryFee: 0,
      },
      regions,
    };
  },

  /** Get single region */
  getRegion: async (id: number): Promise<Region> => {
    const response = await apiClient.get<ApiResponse<BackendDeliveryZone>>(`/api/v1/admin/zones/${id}`);
    return mapBackendZone(response.data.data);
  },

  /** Toggle region active status */
  toggleActive: async (id: number): Promise<Region> => {
    const response = await apiClient.post<ApiResponse<BackendDeliveryZone>>(`/api/v1/admin/zones/${id}/toggle`);
    return mapBackendZone(response.data.data);
  },

  /** Update delivery fee — backend uses PUT /zones/{id}/delivery-fees (plural) */
  updateDeliveryFee: async (id: number, deliveryFee: number): Promise<Region> => {
    const response = await apiClient.put<ApiResponse<BackendDeliveryZone>>(`/api/v1/admin/zones/${id}/delivery-fees`, { fees: [{ warehouse_id: 0, fee: deliveryFee }] });
    return mapBackendZone(response.data.data);
  },

  /** Update zone working days — backend uses PUT /zones/{id}/working-days */
  updateWorkingDays: async (id: number, days: { day_of_week: number; is_working: boolean }[]): Promise<void> => {
    await apiClient.put(`/api/v1/admin/zones/${id}/working-days`, { days });
  },

  /** Create a new zone */
  createZone: async (data: { name_ar: string; name_en?: string; code?: string }): Promise<Region> => {
    const response = await apiClient.post<ApiResponse<BackendDeliveryZone>>('/api/v1/admin/zones', data);
    return mapBackendZone(response.data.data);
  },

  /** Update an existing zone */
  updateZone: async (id: number, data: { name_ar?: string; name_en?: string; code?: string }): Promise<Region> => {
    const response = await apiClient.put<ApiResponse<BackendDeliveryZone>>(`/api/v1/admin/zones/${id}`, data);
    return mapBackendZone(response.data.data);
  },

  // ── Clusters ──

  getClusters: async (): Promise<BackendCluster[]> => {
    const response = await apiClient.get<ApiResponse<{ clusters: BackendCluster[]; meta: Record<string, unknown> }>>('/api/v1/admin/clusters');
    return response.data.data?.clusters || [];
  },

  createCluster: async (data: { zone_id: number; name_ar: string; name_en?: string; code?: string }): Promise<Record<string, unknown>> => {
    const response = await apiClient.post('/api/v1/admin/clusters', data);
    return response.data;
  },

  updateCluster: async (id: number, data: { name_ar?: string; name_en?: string; code?: string; is_active?: boolean }): Promise<Record<string, unknown>> => {
    const response = await apiClient.put(`/api/v1/admin/clusters/${id}`, data);
    return response.data;
  },

  deleteCluster: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/clusters/${id}`);
  },

  // ── Delivery Slots ──

  getDeliverySlots: async (): Promise<BackendDeliverySlot[]> => {
    const response = await apiClient.get<ApiResponse<{ delivery_slots: BackendDeliverySlot[]; meta: Record<string, unknown> }>>('/api/v1/admin/delivery-slots');
    return response.data.data?.delivery_slots || [];
  },

  createDeliverySlot: async (data: { zone_id: number; trip_date: string; departure_time: string; cutoff_time: string; max_capacity: number; delivery_fee: number }): Promise<Record<string, unknown>> => {
    const response = await apiClient.post('/api/v1/admin/delivery-slots', data);
    return response.data;
  },

  updateDeliverySlot: async (id: number, data: { max_capacity?: number; delivery_fee?: number; is_available?: boolean }): Promise<Record<string, unknown>> => {
    const response = await apiClient.put(`/api/v1/admin/delivery-slots/${id}`, data);
    return response.data;
  },
};

// ── Raw backend types for clusters and slots ──

interface BackendCluster {
  id: number;
  name_ar: string;
  name_en: string | null;
  code: string;
  is_active: boolean;
  zone?: { id: number; name: string } | null;
  created_at: string;
}

interface BackendDeliverySlot {
  id: number;
  trip_date: string;
  departure_time: string;
  cutoff_time: string;
  max_capacity: number;
  booked_count: number;
  remaining_capacity: number;
  delivery_fee: number;
  is_available: boolean;
  warehouse?: { id: number; name: string } | null;
  zone?: { id: number; name_ar: string } | null;
}

export type RegionsApi = typeof regionsApi;
