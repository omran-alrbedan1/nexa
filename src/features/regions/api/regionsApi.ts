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

// ── Dummy Data ──

const now = new Date();

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: 1, dayOfWeek: 0, dayName: 'Sunday', startTime: '08:00', endTime: '12:00', maxOrders: 20, isActive: true },
  { id: 2, dayOfWeek: 0, dayName: 'Sunday', startTime: '14:00', endTime: '18:00', maxOrders: 15, isActive: true },
  { id: 3, dayOfWeek: 1, dayName: 'Monday', startTime: '08:00', endTime: '12:00', maxOrders: 20, isActive: true },
  { id: 4, dayOfWeek: 1, dayName: 'Monday', startTime: '14:00', endTime: '18:00', maxOrders: 15, isActive: true },
  { id: 5, dayOfWeek: 2, dayName: 'Tuesday', startTime: '08:00', endTime: '12:00', maxOrders: 20, isActive: true },
  { id: 6, dayOfWeek: 2, dayName: 'Tuesday', startTime: '14:00', endTime: '18:00', maxOrders: 15, isActive: true },
  { id: 7, dayOfWeek: 3, dayName: 'Wednesday', startTime: '08:00', endTime: '12:00', maxOrders: 20, isActive: true },
  { id: 8, dayOfWeek: 3, dayName: 'Wednesday', startTime: '14:00', endTime: '18:00', maxOrders: 15, isActive: true },
  { id: 9, dayOfWeek: 4, dayName: 'Thursday', startTime: '08:00', endTime: '12:00', maxOrders: 25, isActive: true },
  { id: 10, dayOfWeek: 4, dayName: 'Thursday', startTime: '14:00', endTime: '18:00', maxOrders: 20, isActive: true },
];

const DUMMY_REGIONS: Region[] = [
  {
    id: 1, name: 'Riyadh North', nameAr: 'شمال الرياض', deliveryFee: 15, minimumOrder: 50,
    freeDeliveryThreshold: 200, isActive: true,
    clusters: [
      { id: 1, name: 'Al-Olaya', nameAr: 'العليا', regionId: 1, isActive: true },
      { id: 2, name: 'Al-Malaz', nameAr: 'الملز', regionId: 1, isActive: true },
      { id: 3, name: 'King Fahd District', nameAr: 'حي الملك فهد', regionId: 1, isActive: true },
    ],
    timeSlots: DEFAULT_TIME_SLOTS, totalOrders: 98, totalRevenue: 48500,
    createdAt: now.toISOString(), updatedAt: now.toISOString(),
  },
  {
    id: 2, name: 'Riyadh South', nameAr: 'جنوب الرياض', deliveryFee: 12, minimumOrder: 50,
    freeDeliveryThreshold: 150, isActive: true,
    clusters: [
      { id: 4, name: 'Al-Batha', nameAr: 'البطحاء', regionId: 2, isActive: true },
      { id: 5, name: 'Al-Shifa', nameAr: 'الشفاء', regionId: 2, isActive: true },
    ],
    timeSlots: DEFAULT_TIME_SLOTS, totalOrders: 38, totalRevenue: 18200,
    createdAt: now.toISOString(), updatedAt: now.toISOString(),
  },
  {
    id: 3, name: 'Jeddah Central', nameAr: 'وسط جدة', deliveryFee: 18, minimumOrder: 75,
    freeDeliveryThreshold: 250, isActive: true,
    clusters: [
      { id: 6, name: 'Al-Salamah', nameAr: 'السلامة', regionId: 3, isActive: true },
      { id: 7, name: 'Al-Mohammadiya', nameAr: 'المحمدية', regionId: 3, isActive: true },
    ],
    timeSlots: DEFAULT_TIME_SLOTS.map((ts) => ({ ...ts, id: ts.id + 20 })),
    totalOrders: 76, totalRevenue: 37200,
    createdAt: now.toISOString(), updatedAt: now.toISOString(),
  },
  {
    id: 4, name: 'Dammam East', nameAr: 'شرق الدمام', deliveryFee: 10, minimumOrder: 40,
    freeDeliveryThreshold: 120, isActive: true,
    clusters: [
      { id: 8, name: 'Al-Dammam Downtown', nameAr: 'وسط الدمام', regionId: 4, isActive: true },
      { id: 9, name: 'Al-Aziziyah', nameAr: 'العزيزية', regionId: 4, isActive: false },
    ],
    timeSlots: DEFAULT_TIME_SLOTS.map((ts) => ({ ...ts, id: ts.id + 40 })),
    totalOrders: 54, totalRevenue: 28100,
    createdAt: now.toISOString(), updatedAt: now.toISOString(),
  },
  {
    id: 5, name: 'Mecca North', nameAr: 'شمال مكة', deliveryFee: 20, minimumOrder: 80,
    freeDeliveryThreshold: 300, isActive: false,
    clusters: [
      { id: 10, name: 'Al-Aziziyah', nameAr: 'العزيزية', regionId: 5, isActive: true },
    ],
    timeSlots: DEFAULT_TIME_SLOTS.map((ts) => ({ ...ts, id: ts.id + 60 })),
    totalOrders: 42, totalRevenue: 19500,
    createdAt: now.toISOString(), updatedAt: now.toISOString(),
  },
];

const DUMMY_STATS = {
  totalRegions: 5, activeRegions: 4, totalClusters: 10,
  totalOrders: 308, totalRevenue: 151500, avgDeliveryFee: 15,
};

function getDummyPageData(): RegionsPageData {
  return { stats: DUMMY_STATS, regions: DUMMY_REGIONS };
}

export const regionsApi = {
  /** Fetch all regions page data */
  getPageData: async (): Promise<RegionsPageData> => {
    try {
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
    } catch {
      return getDummyPageData();
    }
  },

  /** Get single region */
  getRegion: async (id: number): Promise<Region> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendDeliveryZone>>(`/api/v1/admin/zones/${id}`);
      return mapBackendZone(response.data.data);
    } catch {
      const region = DUMMY_REGIONS.find((r) => r.id === id);
      if (!region) throw new Error('Region not found');
      return region;
    }
  },

  /** Toggle region active status */
  toggleActive: async (id: number): Promise<Region> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendDeliveryZone>>(`/api/v1/admin/zones/${id}/toggle`);
      return mapBackendZone(response.data.data);
    } catch {
      const region = DUMMY_REGIONS.find((r) => r.id === id);
      if (!region) throw new Error('Region not found');
      return { ...region, isActive: !region.isActive, updatedAt: new Date().toISOString() };
    }
  },

  /** Update delivery fee — backend uses PUT /zones/{id}/delivery-fees (plural) */
  updateDeliveryFee: async (id: number, deliveryFee: number): Promise<Region> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendDeliveryZone>>(`/api/v1/admin/zones/${id}/delivery-fees`, { fees: [{ warehouse_id: 0, fee: deliveryFee }] });
      return mapBackendZone(response.data.data);
    } catch {
      const region = DUMMY_REGIONS.find((r) => r.id === id);
      if (!region) throw new Error('Region not found');
      return { ...region, deliveryFee, updatedAt: new Date().toISOString() };
    }
  },

  /** Update zone working days — backend uses PUT /zones/{id}/working-days */
  updateWorkingDays: async (id: number, days: { day_of_week: number; is_working: boolean }[]): Promise<void> => {
    try {
      await apiClient.put(`/api/v1/admin/zones/${id}/working-days`, { days });
    } catch {
      // Dummy fallback — just resolve
      return;
    }
  },
};

export type RegionsApi = typeof regionsApi;
