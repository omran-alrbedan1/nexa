import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

/** Platform-wide color master data. This is not a product_colors link record. */
export interface GlobalColor {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string | null;
  hex: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface GlobalColorInput {
  code: string;
  name_ar: string;
  name_en?: string | null;
  hex?: string | null;
  sort_order: number;
  is_active?: boolean;
}

export interface GlobalColorListParams {
  page?: number;
  search?: string;
  is_active?: boolean;
  per_page?: number;
}

export interface GlobalColorsPageData {
  colors: GlobalColor[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

interface BackendGlobalColor {
  id: number;
  code: string;
  name_ar: string;
  name_en?: string | null;
  hex?: string | null;
  sort_order: number;
  is_active: boolean;
}

interface BackendGlobalColorsResponse {
  colors: BackendGlobalColor[];
  meta: {
    current_page: number;
    last_page: number;
    per_page?: number;
    total: number;
  };
}

function mapGlobalColor(color: BackendGlobalColor): GlobalColor {
  return {
    id: color.id,
    code: color.code,
    nameAr: color.name_ar,
    nameEn: color.name_en ?? null,
    hex: color.hex ?? null,
    sortOrder: color.sort_order,
    isActive: color.is_active,
  };
}

export const colorsApi = {
  list: async (params: GlobalColorListParams = {}): Promise<GlobalColorsPageData> => {
    const perPage = params.per_page ?? 15;
    const response = await apiClient.get<ApiResponse<BackendGlobalColorsResponse>>(
      '/api/v1/admin/colors',
      {
        params: {
          page: params.page ?? 1,
          search: params.search || undefined,
          is_active: params.is_active,
          per_page: perPage,
        },
      }
    );
    const data = response.data.data;
    return {
      colors: (data.colors ?? []).map(mapGlobalColor),
      meta: {
        currentPage: data.meta.current_page,
        lastPage: data.meta.last_page,
        perPage: data.meta.per_page ?? perPage,
        total: data.meta.total,
      },
    };
  },

  create: async (data: GlobalColorInput): Promise<GlobalColor> => {
    const response = await apiClient.post<ApiResponse<BackendGlobalColor>>('/api/v1/admin/colors', data);
    return mapGlobalColor(response.data.data);
  },

  update: async (id: number, data: Partial<GlobalColorInput>): Promise<GlobalColor> => {
    const response = await apiClient.put<ApiResponse<BackendGlobalColor>>(`/api/v1/admin/colors/${id}`, data);
    return mapGlobalColor(response.data.data);
  },

  toggle: async (id: number): Promise<GlobalColor> => {
    const response = await apiClient.post<ApiResponse<BackendGlobalColor>>(`/api/v1/admin/colors/${id}/toggle`);
    return mapGlobalColor(response.data.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/colors/${id}`);
  },
};
