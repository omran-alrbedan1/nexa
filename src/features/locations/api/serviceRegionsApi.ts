import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface ServiceRegion {
  id: number;
  code: string;
  name_ar: string;
  name_en: string | null;
  name_he: string | null;
  name_ru: string | null;
  country_code: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// ── Backend Raw Types ──

interface BackendServiceRegion {
  id: number;
  code: string;
  name_ar: string;
  name_en: string | null;
  name_he: string | null;
  name_ru: string | null;
  country_code: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface BackendServiceRegionsResponse {
  service_regions: BackendServiceRegion[];
  meta: { current_page: number; last_page: number; total: number };
}

export interface ServiceRegionsPageData {
  data: ServiceRegion[];
  meta: { currentPage: number; lastPage: number; perPage: number; total: number };
}

// ── Mapping ──

function mapBackendServiceRegion(br: BackendServiceRegion): ServiceRegion {
  return {
    id: br.id,
    code: br.code,
    name_ar: br.name_ar,
    name_en: br.name_en,
    name_he: br.name_he ?? null,
    name_ru: br.name_ru ?? null,
    country_code: br.country_code,
    display_order: br.display_order,
    is_active: br.is_active,
    created_at: br.created_at,
  };
}

export const serviceRegionsApi = {
  /** Fetch service regions with optional filters */
  getAll: async (params?: { search?: string; page?: number; perPage?: number }): Promise<ServiceRegionsPageData> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);
    queryParams.set('page', String(params?.page ?? 1));
    queryParams.set('per_page', String(params?.perPage ?? 15));
    const qs = queryParams.toString();
    const response = await apiClient.get<ApiResponse<BackendServiceRegionsResponse>>(`/api/v1/admin/service-regions${qs ? '?' + qs : ''}`);
    const data = response.data.data;
    return {
      data: data.service_regions.map(mapBackendServiceRegion),
      meta: {
        currentPage: data.meta.current_page ?? 1,
        lastPage: data.meta.last_page ?? 1,
        perPage: params?.perPage ?? 15,
        total: data.meta.total ?? 0,
      },
    };
  },

  /** Create a new service region */
  create: async (data: { code: string; name_ar: string; name_en?: string; name_he?: string; name_ru?: string; country_code?: string; display_order?: number; is_active?: boolean }): Promise<ServiceRegion> => {
    const response = await apiClient.post<ApiResponse<BackendServiceRegion>>('/api/v1/admin/service-regions', data);
    return mapBackendServiceRegion(response.data.data);
  },

  /** Update a service region */
  update: async (id: number, data: { code?: string; name_ar?: string; name_en?: string; name_he?: string; name_ru?: string; country_code?: string; display_order?: number; is_active?: boolean }): Promise<ServiceRegion> => {
    const response = await apiClient.put<ApiResponse<BackendServiceRegion>>(`/api/v1/admin/service-regions/${id}`, data);
    return mapBackendServiceRegion(response.data.data);
  },

  /** Toggle active status */
  toggleActive: async (id: number): Promise<ServiceRegion> => {
    const response = await apiClient.post<ApiResponse<BackendServiceRegion>>(`/api/v1/admin/service-regions/${id}/toggle`);
    return mapBackendServiceRegion(response.data.data);
  },

  /** Delete a service region */
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/service-regions/${id}`);
  },
};

export type ServiceRegionsApi = typeof serviceRegionsApi;
