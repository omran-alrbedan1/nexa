import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

export interface ColorSizeGenerateItem {
  /** product_colors.id, never colors.id. */
  color_id: number;
  size_ids: number[];
}

export interface GenerateColorSizeVariantsInput {
  items: ColorSizeGenerateItem[];
  price: number;
  stock_quantity: number;
  is_active: boolean;
}

export interface ColorSizeVariant {
  id: number;
  colorId: number;
  sizeId: number;
  price: number;
  stockQuantity: number;
  isActive: boolean;
  sku: string | null;
  colorLabel: string | null;
  sizeLabel: string | null;
}

interface BackendColorSizeVariant {
  id: number;
  color_id: number;
  size_id: number;
  price: string | number;
  stock_quantity: number;
  is_active: boolean;
  sku?: string | null;
  color?: { code?: string | null; name_ar?: string | null; name_en?: string | null } | null;
  size?: { code?: string | null; name_ar?: string | null; name_en?: string | null } | null;
}

function mapVariant(variant: BackendColorSizeVariant): ColorSizeVariant {
  return {
    id: variant.id,
    colorId: variant.color_id,
    sizeId: variant.size_id,
    price: Number(variant.price),
    stockQuantity: Number(variant.stock_quantity),
    isActive: variant.is_active,
    sku: variant.sku ?? null,
    colorLabel: variant.color?.code ?? variant.color?.name_en ?? variant.color?.name_ar ?? null,
    sizeLabel: variant.size?.code ?? variant.size?.name_en ?? variant.size?.name_ar ?? null,
  };
}

function unwrapVariants(data: { variants?: BackendColorSizeVariant[] } | BackendColorSizeVariant[]): ColorSizeVariant[] {
  const variants = Array.isArray(data) ? data : data?.variants ?? [];
  return variants.map(mapVariant);
}

export const colorSizeVariantsApi = {
  enable: async (productId: number): Promise<void> => {
    await apiClient.post(`/api/v1/admin/products/${productId}/color-size/enable`);
  },

  disable: async (productId: number): Promise<void> => {
    await apiClient.post(`/api/v1/admin/products/${productId}/color-size/disable`);
  },

  list: async (productId: number): Promise<ColorSizeVariant[]> => {
    const response = await apiClient.get<ApiResponse<{ variants?: BackendColorSizeVariant[] } | BackendColorSizeVariant[]>>(
      `/api/v1/admin/products/${productId}/color-size/variants`
    );
    return unwrapVariants(response.data.data);
  },

  generate: async (productId: number, input: GenerateColorSizeVariantsInput): Promise<void> => {
    await apiClient.post(
      `/api/v1/admin/products/${productId}/color-size/generate`,
      input
    );
  },
};
