import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

/** A product_colors link. Its id is the link id used by color-size generation. */
export interface ProductColor {
  id: number;
  globalColorId: number;
  code: string | null;
  nameAr: string | null;
  nameEn: string | null;
  hex: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductColorInput {
  globalColorId: number;
  image?: File | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductColorUpdateInput {
  sortOrder?: number;
  isActive?: boolean;
}

interface BackendProductColor {
  id: number;
  global_color_id?: number;
  color_id?: number;
  code?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
  hex?: string | null;
  image_url?: string | null;
  image?: string | null;
  sort_order?: number;
  is_active?: boolean;
  color?: {
    id: number;
    code?: string | null;
    name_ar?: string | null;
    name_en?: string | null;
    hex?: string | null;
  } | null;
}

function mapProductColor(link: BackendProductColor): ProductColor {
  const globalColorId = link.global_color_id ?? link.color?.id ?? link.color_id;
  if (globalColorId == null) {
    throw new Error('Product color response is missing the global color reference');
  }
  return {
    id: link.id,
    globalColorId,
    code: link.code ?? link.color?.code ?? null,
    nameAr: link.name_ar ?? link.color?.name_ar ?? null,
    nameEn: link.name_en ?? link.color?.name_en ?? null,
    hex: link.hex ?? link.color?.hex ?? null,
    imageUrl: link.image_url ?? link.image ?? null,
    sortOrder: link.sort_order ?? 0,
    isActive: link.is_active ?? true,
  };
}

function createFormData(input: ProductColorInput): FormData {
  const data = new FormData();
  // Linking uses colors.id (GlobalColor.id), not product_colors.id.
  data.append('color_id', String(input.globalColorId));
  data.append('sort_order', String(input.sortOrder));
  data.append('is_active', input.isActive ? '1' : '0');
  if (input.image) data.append('image', input.image);
  return data;
}

export const productColorsApi = {
  list: async (productId: number): Promise<ProductColor[]> => {
    const response = await apiClient.get<ApiResponse<{ colors?: BackendProductColor[]; product_colors?: BackendProductColor[] } | BackendProductColor[]>>(
      `/api/v1/admin/products/${productId}/colors`
    );
    const data = response.data.data;
    const links = Array.isArray(data) ? data : data?.product_colors ?? data?.colors ?? [];
    return links.map(mapProductColor);
  },

  link: async (productId: number, input: ProductColorInput): Promise<ProductColor> => {
    const response = await apiClient.post<ApiResponse<BackendProductColor>>(
      `/api/v1/admin/products/${productId}/colors`,
      createFormData(input),
      { headers: { 'Content-Type': undefined } }
    );
    return mapProductColor(response.data.data);
  },

  update: async (productId: number, linkId: number, input: ProductColorUpdateInput): Promise<ProductColor> => {
    const response = await apiClient.put<ApiResponse<BackendProductColor>>(
      `/api/v1/admin/products/${productId}/colors/${linkId}`,
      {
        sort_order: input.sortOrder,
        is_active: input.isActive,
      }
    );
    return mapProductColor(response.data.data);
  },

  uploadImage: async (productId: number, linkId: number, image: File): Promise<ProductColor> => {
    const data = new FormData();
    data.append('image', image);
    const response = await apiClient.post<ApiResponse<BackendProductColor>>(
      `/api/v1/admin/products/${productId}/colors/${linkId}/image`,
      data,
      { headers: { 'Content-Type': undefined } }
    );
    return mapProductColor(response.data.data);
  },

  toggle: async (productId: number, linkId: number): Promise<ProductColor> => {
    const response = await apiClient.post<ApiResponse<BackendProductColor>>(
      `/api/v1/admin/products/${productId}/colors/${linkId}/toggle`
    );
    return mapProductColor(response.data.data);
  },

  delete: async (productId: number, linkId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/products/${productId}/colors/${linkId}`);
  },
};
