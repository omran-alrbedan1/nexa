import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

export interface ProductSize {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductSizeInput {
  code: string;
  name_ar: string;
  name_en?: string | null;
  sort_order: number;
  is_active?: boolean;
}

export interface ProductSizeListParams {
  page?: number;
  search?: string;
  is_active?: boolean;
  per_page?: number;
}

export interface ProductSizesPageData {
  sizes: ProductSize[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

interface BackendProductSize {
  id: number;
  code: string;
  name_ar: string;
  name_en: string | null;
  sort_order: number;
  is_active: boolean;
}

interface BackendProductSizesResponse {
  sizes: BackendProductSize[];
  meta: {
    current_page: number;
    last_page: number;
    per_page?: number;
    total: number;
  };
}

function mapProductSize(size: BackendProductSize): ProductSize {
  return {
    id: size.id,
    code: size.code,
    nameAr: size.name_ar,
    nameEn: size.name_en,
    sortOrder: size.sort_order,
    isActive: size.is_active,
  };
}

export const productSizesApi = {
  list: async (params: ProductSizeListParams = {}): Promise<ProductSizesPageData> => {
    const perPage = params.per_page ?? 15;
    const response = await apiClient.get<ApiResponse<BackendProductSizesResponse>>(
      '/api/v1/admin/product-sizes',
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
      sizes: (data.sizes ?? []).map(mapProductSize),
      meta: {
        currentPage: data.meta.current_page,
        lastPage: data.meta.last_page,
        perPage: data.meta.per_page ?? perPage,
        total: data.meta.total,
      },
    };
  },

  create: async (data: ProductSizeInput): Promise<ProductSize> => {
    const response = await apiClient.post<ApiResponse<BackendProductSize>>(
      '/api/v1/admin/product-sizes',
      data
    );
    return mapProductSize(response.data.data);
  },

  update: async (id: number, data: Partial<ProductSizeInput>): Promise<ProductSize> => {
    const response = await apiClient.put<ApiResponse<BackendProductSize>>(
      `/api/v1/admin/product-sizes/${id}`,
      data
    );
    return mapProductSize(response.data.data);
  },

  toggle: async (id: number): Promise<ProductSize> => {
    const response = await apiClient.post<ApiResponse<BackendProductSize>>(
      `/api/v1/admin/product-sizes/${id}/toggle`
    );
    return mapProductSize(response.data.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/product-sizes/${id}`);
  },
};
