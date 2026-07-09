import { apiClient } from '@/lib/axios';
import { unwrap } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/types/common';

export interface Category {
  id: number;
  nameAr: string;
  nameEn: string | null;
  image: string | null;
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
  productsCount: number;
  parent?: { id: number; name_ar: string } | null;
  children?: Category[];
}

interface BackendCategory {
  id: number;
  name_ar: string;
  name_en: string | null;
  image: string | null;
  parent_id: number | null;
  sort_order: number;
  is_active: boolean;
  products_count: number;
  parent?: { id: number; name_ar: string } | null;
  children?: BackendCategory[];
}

function mapBackendCategory(c: BackendCategory): Category {
  return {
    id: c.id,
    nameAr: c.name_ar,
    nameEn: c.name_en,
    image: c.image,
    parentId: c.parent_id,
    sortOrder: c.sort_order,
    isActive: c.is_active,
    productsCount: c.products_count,
    parent: c.parent,
    children: c.children?.map(mapBackendCategory),
  };
}

function buildFormData(data: Record<string, any>): FormData {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof File) {
      fd.append(key, value);
    } else {
      fd.append(key, String(value));
    }
  });
  return fd;
}

export const categoriesApi = {
  list: async (): Promise<{ categories: Category[]; meta: any }> => {
    const response = await apiClient.get<ApiResponse<{ categories: BackendCategory[]; meta: any }>>('/api/v1/admin/categories');
    const data = response.data.data;
    return {
      categories: data.categories.map(mapBackendCategory),
      meta: data.meta,
    };
  },

  get: async (id: number): Promise<Category> => {
    const response = await apiClient.get<ApiResponse<BackendCategory>>(`/api/v1/admin/categories/${id}`);
    return mapBackendCategory(response.data.data);
  },

  create: async (data: { name_ar: string; name_en?: string; parent_id?: number | null; image?: File; sort_order?: number; is_active?: boolean }): Promise<Category> => {
    const formData = buildFormData(data);
    const response = await apiClient.post<ApiResponse<BackendCategory>>('/api/v1/admin/categories', formData, { headers: { 'Content-Type': undefined } });
    return mapBackendCategory(response.data.data);
  },

  update: async (id: number, data: { name_ar?: string; name_en?: string; parent_id?: number | null; image?: File | null; sort_order?: number; is_active?: boolean }): Promise<Category> => {
    const formData = buildFormData({ _method: 'PUT', ...data, image: data.image ?? undefined });
    const response = await apiClient.post<ApiResponse<BackendCategory>>(`/api/v1/admin/categories/${id}`, formData, { headers: { 'Content-Type': undefined } });
    return mapBackendCategory(response.data.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/categories/${id}`);
  },
};