import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

export interface WarehouseZone {
  id: number;
  name: string;
}

export interface WarehouseManager {
  id: number;
  fullName: string;
}

export interface WarehouseFormData {
  code: string;
  name: string;
  nameAr?: string;
  zoneId: number;
  address?: string;
  managerUserId?: number | null;
  capacity?: number;
  isActive?: boolean;
  workingHours?: Record<string, string> | null;
  zoneIds?: number[];
  latitude?: number | null;
  longitude?: number | null;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  nameAr: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  workingHours: Record<string, string> | null;
  isActive: boolean;
  zone: WarehouseZone | null;
  manager: WarehouseManager | null;
  zones: WarehouseZone[];
  createdAt: string;
}

interface BackendWarehouseZone {
  id: number;
  name: string;
}

interface BackendWarehouseManager {
  id: number;
  full_name: string;
}

interface BackendWarehouse {
  id: number;
  code: string;
  name: string;
  name_ar: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  capacity: number | null;
  working_hours: Record<string, string> | null;
  is_active: boolean;
  zone: BackendWarehouseZone | null;
  manager: BackendWarehouseManager | null;
  zones: BackendWarehouseZone[];
  created_at: string;
}

interface BackendListResponse {
  warehouses: BackendWarehouse[];
  meta: { current_page: number; last_page: number; total: number };
}

export interface WarehouseListPageData {
  data: Warehouse[];
  meta: { currentPage: number; lastPage: number; perPage: number; total: number };
}

function mapWarehouse(bw: BackendWarehouse): Warehouse {
  return {
    id: bw.id,
    code: bw.code,
    name: bw.name,
    nameAr: bw.name_ar || '',
    address: bw.address || '',
    latitude: bw.latitude ? parseFloat(bw.latitude) : null,
    longitude: bw.longitude ? parseFloat(bw.longitude) : null,
    capacity: bw.capacity || 0,
    workingHours: bw.working_hours || null,
    isActive: bw.is_active,
    zone: bw.zone ? { id: bw.zone.id, name: bw.zone.name } : null,
    manager: bw.manager ? { id: bw.manager.id, fullName: bw.manager.full_name } : null,
    zones: (bw.zones || []).map((z) => ({ id: z.id, name: z.name })),
    createdAt: bw.created_at,
  };
}

export const warehousesApi = {
  getAll: async (params?: { search?: string; page?: number; perPage?: number }): Promise<WarehouseListPageData> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);
    queryParams.set('page', String(params?.page ?? 1));
    queryParams.set('per_page', String(params?.perPage ?? 15));
    const qs = queryParams.toString();
    const response = await apiClient.get<ApiResponse<BackendListResponse>>(`/api/v1/admin/warehouses${qs ? '?' + qs : ''}`);
    const data = response.data.data;
    return {
      data: data.warehouses.map(mapWarehouse),
      meta: {
        currentPage: data.meta.current_page ?? 1,
        lastPage: data.meta.last_page ?? 1,
        perPage: params?.perPage ?? 15,
        total: data.meta.total ?? 0,
      },
    };
  },

  getById: async (id: number): Promise<Warehouse> => {
    const response = await apiClient.get<ApiResponse<BackendWarehouse>>(`/api/v1/admin/warehouses/${id}`);
    return mapWarehouse(response.data.data);
  },

  create: async (form: WarehouseFormData): Promise<Warehouse> => {
    const response = await apiClient.post<ApiResponse<BackendWarehouse>>('/api/v1/admin/warehouses', {
      code: form.code,
      name: form.name,
      name_ar: form.nameAr || undefined,
      zone_id: form.zoneId,
      address: form.address || undefined,
      manager_user_id: form.managerUserId || undefined,
      capacity: form.capacity || undefined,
      is_active: form.isActive ?? true,
      working_hours: form.workingHours || undefined,
      zone_ids: form.zoneIds || [],
      latitude: form.latitude ?? undefined,
      longitude: form.longitude ?? undefined,
    });
    return mapWarehouse(response.data.data);
  },

  update: async (id: number, form: Partial<WarehouseFormData>): Promise<Warehouse> => {
    const body: Record<string, unknown> = {};
    if (form.code !== undefined) body.code = form.code;
    if (form.name !== undefined) body.name = form.name;
    if (form.nameAr !== undefined) body.name_ar = form.nameAr || null;
    if (form.zoneId !== undefined) body.zone_id = form.zoneId;
    if (form.address !== undefined) body.address = form.address || null;
    if (form.managerUserId !== undefined) body.manager_user_id = form.managerUserId || null;
    if (form.capacity !== undefined) body.capacity = form.capacity || null;
    if (form.isActive !== undefined) body.is_active = form.isActive;
    if (form.workingHours !== undefined) body.working_hours = form.workingHours;
    if (form.zoneIds !== undefined) body.zone_ids = form.zoneIds;
    if (form.latitude !== undefined) body.latitude = form.latitude;
    if (form.longitude !== undefined) body.longitude = form.longitude;
    const response = await apiClient.put<ApiResponse<BackendWarehouse>>(`/api/v1/admin/warehouses/${id}`, body);
    return mapWarehouse(response.data.data);
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/warehouses/${id}`);
  },
};
