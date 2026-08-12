// ============================================================
// Product Units API Service
// ============================================================
// Backend: GET/POST /api/v1/admin/units (ProductUnitController)
//          PUT /api/v1/admin/units/{id}
//          POST /api/v1/admin/units/{id}/toggle
//          DELETE /api/v1/admin/units/{id}
// ============================================================

import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

export interface ProductUnit {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string | null;
  nameHe: string | null;
  nameRu: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
}

interface BackendUnit {
  id: number;
  code: string;
  name_ar: string;
  name_en: string | null;
  name_he: string | null;
  name_ru: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

function mapBackendUnit(u: BackendUnit): ProductUnit {
  return {
    id: u.id,
    code: u.code,
    nameAr: u.name_ar,
    nameEn: u.name_en,
    nameHe: u.name_he,
    nameRu: u.name_ru,
    isActive: u.is_active,
    sortOrder: u.sort_order,
    createdAt: u.created_at,
  };
}

export interface UnitsPageData {
  units: ProductUnit[];
  meta: { currentPage: number; lastPage: number; total: number };
}

export interface UnitInput {
  code: string;
  name_ar: string;
  name_en?: string | null;
  name_he?: string | null;
  name_ru?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export const unitsApi = {
  list: async (params: { page?: number; search?: string } = {}): Promise<UnitsPageData> => {
    const response = await apiClient.get<ApiResponse<{ units: BackendUnit[]; meta: { current_page: number; last_page: number; total: number } }>>('/api/v1/admin/units', {
      params: {
        page: params.page ?? 1,
        per_page: 50,
        search: params.search || undefined,
      },
    });
    const data = response.data.data;
    const meta = data.meta || {};
    return {
      units: (data.units ?? []).map(mapBackendUnit),
      meta: {
        currentPage: meta.current_page ?? 1,
        lastPage: meta.last_page ?? 1,
        total: meta.total ?? data.units?.length ?? 0,
      },
    };
  },

  create: async (data: UnitInput): Promise<ProductUnit> => {
    const response = await apiClient.post<ApiResponse<BackendUnit>>('/api/v1/admin/units', data);
    return mapBackendUnit(response.data.data);
  },

  update: async (id: number, data: Partial<UnitInput>): Promise<ProductUnit> => {
    const response = await apiClient.put<ApiResponse<BackendUnit>>(`/api/v1/admin/units/${id}`, data);
    return mapBackendUnit(response.data.data);
  },

  toggle: async (id: number): Promise<ProductUnit> => {
    const response = await apiClient.post<ApiResponse<BackendUnit>>(`/api/v1/admin/units/${id}/toggle`);
    return mapBackendUnit(response.data.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/units/${id}`);
  },
};
