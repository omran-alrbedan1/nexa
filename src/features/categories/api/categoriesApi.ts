import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

export interface Category {
  id: number;
  nameAr: string;
  nameEn: string | null;
  nameHe: string | null;
  nameRu: string | null;
  image: string | null;
  parentId: number | null;
  sectionId: number | null;
  slug: string | null;
  sortOrder: number;
  isActive: boolean;
  showOnHome: boolean;
  productsCount: number;
  parent?: { id: number; name_ar: string } | null;
  children?: Category[];
}

interface BackendCategory {
  id: number;
  name_ar: string;
  name_en: string | null;
  name_he: string | null;
  name_ru: string | null;
  image: string | null;
  parent_id: number | null;
  section_id: number | null;
  slug: string | null;
  sort_order: number;
  is_active: boolean;
  show_on_home: boolean;
  products_count: number;
  parent?: { id: number; name_ar: string } | null;
  children?: BackendCategory[];
}

function mapBackendCategory(c: BackendCategory): Category {
  return {
    id: c.id,
    nameAr: c.name_ar,
    nameEn: c.name_en,
    nameHe: c.name_he ?? null,
    nameRu: c.name_ru ?? null,
    image: c.image,
    parentId: c.parent_id,
    sectionId: c.section_id ?? null,
    slug: c.slug ?? null,
    sortOrder: c.sort_order,
    isActive: c.is_active,
    showOnHome: c.show_on_home ?? true,
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
    } else if (typeof value === 'boolean') {
      fd.append(key, value ? '1' : '0');
    } else {
      fd.append(key, String(value));
    }
  });
  return fd;
}

export interface CategoriesPageData {
  categories: Category[];
  meta: { currentPage: number; lastPage: number; perPage: number; total: number };
}

interface BackendListMeta {
  current_page: number;
  last_page: number;
  total: number;
}

export const categoriesApi = {
  list: async (): Promise<{ categories: Category[]; meta: BackendListMeta }> => {
    const response = await apiClient.get<ApiResponse<{ categories: BackendCategory[]; meta: BackendListMeta }>>('/api/v1/admin/categories');
    const data = response.data.data;
    return {
      categories: data.categories.map(mapBackendCategory),
      meta: data.meta,
    };
  },

  getPageData: async (params: { page?: number; search?: string; show_on_home?: number } = {}): Promise<CategoriesPageData> => {
    const response = await apiClient.get<ApiResponse<{ categories: BackendCategory[]; meta: BackendListMeta }>>('/api/v1/admin/categories', {
      params: {
        page: params.page ?? 1,
        per_page: 15,
        search: params.search || undefined,
        show_on_home: params.show_on_home,
      },
    });
    const data = response.data.data;
    const meta = data.meta || {};
    return {
      categories: data.categories.map(mapBackendCategory),
      meta: {
        currentPage: meta.current_page ?? 1,
        lastPage: meta.last_page ?? 1,
        perPage: 15,
        total: meta.total ?? data.categories.length,
      },
    };
  },

  get: async (id: number): Promise<Category> => {
    const response = await apiClient.get<ApiResponse<BackendCategory>>(`/api/v1/admin/categories/${id}`);
    return mapBackendCategory(response.data.data);
  },

  create: async (data: { name_ar: string; name_en?: string; name_he?: string; name_ru?: string; parent_id?: number | null; section_id?: number | null; slug?: string | null; image?: File; sort_order?: number; is_active?: boolean; show_on_home?: boolean }): Promise<Category> => {
    const formData = buildFormData(data);
    const response = await apiClient.post<ApiResponse<BackendCategory>>('/api/v1/admin/categories', formData, { headers: { 'Content-Type': undefined } });
    return mapBackendCategory(response.data.data);
  },

  update: async (id: number, data: { name_ar?: string; name_en?: string; name_he?: string; name_ru?: string; parent_id?: number | null; section_id?: number | null; slug?: string | null; image?: File | null; sort_order?: number; is_active?: boolean; show_on_home?: boolean }): Promise<Category> => {
    const { image, ...rest } = data;
    const formData = buildFormData({ _method: 'PUT', ...rest });
    if (image === null) {
      formData.append('image', '');
    } else if (image instanceof File) {
      formData.append('image', image);
    }
    const response = await apiClient.post<ApiResponse<BackendCategory>>(`/api/v1/admin/categories/${id}`, formData, { headers: { 'Content-Type': undefined } });
    return mapBackendCategory(response.data.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/categories/${id}`);
  },
};