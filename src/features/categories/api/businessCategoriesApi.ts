import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

export interface BusinessCategory {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string | null;
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

export const businessCategoriesApi = {
  list: async (): Promise<{ businessCategories: BusinessCategory[]; meta: any }> => {
    const response = await apiClient.get<ApiResponse<{ categories: BackendBusinessCategory[]; meta: any }>>('/api/v1/admin/business-categories');
    const data = response.data.data;
    return {
      businessCategories: data.categories.map(mapBackendBusinessCategory),
      meta: data.meta,
    };
  },

  get: async (id: number): Promise<BusinessCategory> => {
    const response = await apiClient.get<ApiResponse<BackendBusinessCategory>>(`/api/v1/admin/business-categories/${id}`);
    return mapBackendBusinessCategory(response.data.data);
  },

  create: async (data: { code: string; name_ar: string; name_en?: string; sort_order?: number; is_active?: boolean }): Promise<BusinessCategory> => {
    const response = await apiClient.post<ApiResponse<BackendBusinessCategory>>('/api/v1/admin/business-categories', data);
    return mapBackendBusinessCategory(response.data.data);
  },

  update: async (id: number, data: { code?: string; name_ar?: string; name_en?: string; sort_order?: number; is_active?: boolean }): Promise<BusinessCategory> => {
    const response = await apiClient.put<ApiResponse<BackendBusinessCategory>>(`/api/v1/admin/business-categories/${id}`, data);
    return mapBackendBusinessCategory(response.data.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/business-categories/${id}`);
  },
};
