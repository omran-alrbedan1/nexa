import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface ProvinceCountry {
  id: number;
  name_ar: string;
  name_en: string | null;
  name_he: string | null;
  name_ru: string | null;
  code: string;
}

export interface Province {
  id: number;
  country_id: number;
  name_ar: string;
  name_en: string | null;
  name_he: string | null;
  name_ru: string | null;
  is_active: boolean;
  country: ProvinceCountry | null;
  zones_count: number;
  created_at: string;
}

// ── Backend Raw Types ──

interface BackendProvince {
  id: number;
  country_id: number;
  name_ar: string;
  name_en: string | null;
  name_he: string | null;
  name_ru: string | null;
  is_active: boolean;
  country: ProvinceCountry | null;
  zones_count: number;
  created_at: string;
}

interface BackendProvincesResponse {
  provinces: BackendProvince[];
  meta: { current_page: number; last_page: number; total: number };
}

export interface ProvincesPageData {
  data: Province[];
  meta: { currentPage: number; lastPage: number; perPage: number; total: number };
}

// ── Mapping ──

function mapBackendProvince(bp: BackendProvince): Province {
  return {
    id: bp.id,
    country_id: bp.country_id,
    name_ar: bp.name_ar,
    name_en: bp.name_en,
    is_active: bp.is_active,
    country: bp.country ? {
      ...bp.country,
      name_he: bp.country.name_he ?? null,
      name_ru: bp.country.name_ru ?? null,
    } : null,
    name_he: bp.name_he ?? null,
    name_ru: bp.name_ru ?? null,
    zones_count: bp.zones_count,
    created_at: bp.created_at,
  };
}

export const provincesApi = {
  /** Fetch provinces with optional filters */
  getAll: async (params?: { country_id?: number; search?: string; page?: number; perPage?: number }): Promise<ProvincesPageData> => {
    const queryParams = new URLSearchParams();
    if (params?.country_id) queryParams.set('country_id', String(params.country_id));
    if (params?.search) queryParams.set('search', params.search);
    queryParams.set('page', String(params?.page ?? 1));
    queryParams.set('per_page', String(params?.perPage ?? 15));
    const qs = queryParams.toString();
    const response = await apiClient.get<ApiResponse<BackendProvincesResponse>>(`/api/v1/admin/provinces${qs ? '?' + qs : ''}`);
    const data = response.data.data;
    return {
      data: data.provinces.map(mapBackendProvince),
      meta: {
        currentPage: data.meta.current_page ?? 1,
        lastPage: data.meta.last_page ?? 1,
        perPage: params?.perPage ?? 15,
        total: data.meta.total ?? 0,
      },
    };
  },

  /** Get single province */
  getById: async (id: number): Promise<Province> => {
    const response = await apiClient.get<ApiResponse<BackendProvince>>(`/api/v1/admin/provinces/${id}`);
    return mapBackendProvince(response.data.data);
  },

  /** Create a new province */
  create: async (data: { country_id: number; name_ar: string; name_en?: string; name_he?: string; name_ru?: string; is_active?: boolean }): Promise<Province> => {
    const response = await apiClient.post<ApiResponse<BackendProvince>>('/api/v1/admin/provinces', data);
    return mapBackendProvince(response.data.data);
  },

  /** Update a province */
  update: async (id: number, data: { name_ar?: string; name_en?: string; name_he?: string; name_ru?: string; is_active?: boolean }): Promise<Province> => {
    const response = await apiClient.put<ApiResponse<BackendProvince>>(`/api/v1/admin/provinces/${id}`, data);
    return mapBackendProvince(response.data.data);
  },

  /** Toggle province active status */
  toggleActive: async (id: number): Promise<Province> => {
    const response = await apiClient.post<ApiResponse<BackendProvince>>(`/api/v1/admin/provinces/${id}/toggle`);
    return mapBackendProvince(response.data.data);
  },

  /** Delete a province */
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/provinces/${id}`);
  },
};

export type ProvincesApi = typeof provincesApi;
