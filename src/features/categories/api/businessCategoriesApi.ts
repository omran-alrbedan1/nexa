import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

export interface BusinessCategory {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string | null;
  nameHe: string | null;
  nameRu: string | null;
  isActive: boolean;
  sortOrder: number;
  suppliersCount: number;
  createdAt: string;
  updatedAt: string;
}

interface BackendBusinessCategory {
  id: number;
  code: string;
  name_ar: string;
  name_en: string | null;
  name_he: string | null;
  name_ru: string | null;
  is_active: boolean;
  sort_order: number;
  suppliers_count: number;
  created_at: string;
  updated_at: string;
}

function mapBackendBusinessCategory(c: BackendBusinessCategory): BusinessCategory {
  return {
    id: c.id,
    code: c.code,
    nameAr: c.name_ar,
    nameEn: c.name_en,
    nameHe: c.name_he ?? null,
    nameRu: c.name_ru ?? null,
    isActive: c.is_active,
    sortOrder: c.sort_order,
    suppliersCount: c.suppliers_count,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface BusinessCategoriesPageData {
  businessCategories: BusinessCategory[];
  meta: { currentPage: number; lastPage: number; perPage: number; total: number };
}

interface BackendListMeta {
  current_page: number;
  last_page: number;
  total: number;
}

export const businessCategoriesApi = {
  list: async (): Promise<{ businessCategories: BusinessCategory[]; meta: BackendListMeta }> => {
    const response = await apiClient.get<ApiResponse<{ categories: BackendBusinessCategory[]; meta: BackendListMeta }>>('/api/v1/admin/business-categories');
    const data = response.data.data;
    return {
      businessCategories: data.categories.map(mapBackendBusinessCategory),
      meta: data.meta,
    };
  },

  getPageData: async (params: { page?: number; search?: string } = {}): Promise<BusinessCategoriesPageData> => {
    const response = await apiClient.get<ApiResponse<{ categories: BackendBusinessCategory[]; meta: BackendListMeta }>>('/api/v1/admin/business-categories', {
      params: {
        page: params.page ?? 1,
        per_page: 15,
        search: params.search || undefined,
      },
    });
    const data = response.data.data;
    const meta = data.meta || {};
    return {
      businessCategories: data.categories.map(mapBackendBusinessCategory),
      meta: {
        currentPage: meta.current_page ?? 1,
        lastPage: meta.last_page ?? 1,
        perPage: 15,
        total: meta.total ?? data.categories.length,
      },
    };
  },

  get: async (id: number): Promise<BusinessCategory> => {
    const response = await apiClient.get<ApiResponse<BackendBusinessCategory>>(`/api/v1/admin/business-categories/${id}`);
    return mapBackendBusinessCategory(response.data.data);
  },

  create: async (data: { code: string; name_ar: string; name_en?: string; name_he?: string; name_ru?: string; sort_order?: number; is_active?: boolean }): Promise<BusinessCategory> => {
    const response = await apiClient.post<ApiResponse<BackendBusinessCategory>>('/api/v1/admin/business-categories', data);
    return mapBackendBusinessCategory(response.data.data);
  },

  update: async (id: number, data: { code?: string; name_ar?: string; name_en?: string; name_he?: string; name_ru?: string; sort_order?: number; is_active?: boolean }): Promise<BusinessCategory> => {
    const response = await apiClient.put<ApiResponse<BackendBusinessCategory>>(`/api/v1/admin/business-categories/${id}`, data);
    return mapBackendBusinessCategory(response.data.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/business-categories/${id}`);
  },
};
