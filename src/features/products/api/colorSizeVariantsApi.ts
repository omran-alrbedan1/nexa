import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

export interface ColorSizeGenerateItem {
  /** product_colors.id, never colors.id. */
  color_id: number;
  /** Empty array = color-only variant for this color. */
  unit_ids: number[];
}

export interface GenerateColorSizeVariantsInput {
  /** Per linked product-color → chosen units. */
  items?: ColorSizeGenerateItem[];
  /** Same units for all linked colors (omit = color-only for each). */
  unit_ids?: number[];
  price: number;
  stock_quantity: number;
  is_active: boolean;
}

export interface ColorSizeVariant {
  id: number;
  colorId: number;
  unitId: number | null;
  price: number;
  stockQuantity: number;
  isActive: boolean;
  sku: string | null;
  colorLabel: string | null;
  unitLabel: string | null;
}

interface BackendColorSizeVariant {
  id: number;
  color_id: number;
  unit_id: number | null;
  price: string | number;
  stock_quantity: number;
  is_active: boolean;
  sku?: string | null;
  color?: { code?: string | null; name_ar?: string | null; name_en?: string | null } | null;
  unit?: { code?: string | null; name_ar?: string | null; name_en?: string | null } | null;
}

function mapVariant(variant: BackendColorSizeVariant): ColorSizeVariant {
  return {
    id: variant.id,
    colorId: variant.color_id,
    unitId: variant.unit_id ?? null,
    price: Number(variant.price),
    stockQuantity: Number(variant.stock_quantity),
    isActive: variant.is_active,
    sku: variant.sku ?? null,
    colorLabel: variant.color?.code ?? variant.color?.name_en ?? variant.color?.name_ar ?? null,
    unitLabel: variant.unit?.code ?? variant.unit?.name_en ?? variant.unit?.name_ar ?? null,
  };
}

function unwrapVariants(data: { variants?: BackendColorSizeVariant[] } | BackendColorSizeVariant[]): ColorSizeVariant[] {
  const variants = Array.isArray(data) ? data : data?.variants ?? [];
  return variants.map(mapVariant);
}

export interface ColorSizeVariantUpsertRow {
  color_id: number;
  unit_id: number | null;
  price: number;
  stock_quantity: number | null;
  is_active: boolean;
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

  upsert: async (productId: number, variants: ColorSizeVariantUpsertRow[]): Promise<ColorSizeVariant[]> => {
    const response = await apiClient.put<ApiResponse<{ variants?: BackendColorSizeVariant[] }>>(
      `/api/v1/admin/products/${productId}/color-size/variants`,
      { variants }
    );
    return unwrapVariants(response.data.data);
  },
};
