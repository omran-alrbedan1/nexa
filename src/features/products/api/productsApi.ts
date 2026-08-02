// ============================================================
// Products API Service (Dashboard version)
// ============================================================
// Backend: GET /api/v1/admin/products (ProductController@index)
//         GET /api/v1/admin/products/pending-approvals (ProductController@pendingApprovals)
//         GET /api/v1/admin/products/{id} (ProductController@show)
//         POST /api/v1/admin/products (ProductController@store)
//         PUT /api/v1/admin/products/{id} (ProductController@update)
//         POST /api/v1/admin/products/{id}/approve (ProductController@approve)
//         POST /api/v1/admin/products/{id}/reject (ProductController@reject)
// ============================================================

import { apiClient } from '@/lib/axios';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import type { ProductSource } from '@/types/marketplace';

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface ProductCategory {
  id: number;
  name: string;
  nameAr: string;
  parentId: number | null;
  children?: ProductCategory[];
}

export interface DashboardProduct {
  id: number;
  name: string;
  nameAr: string;
  nameHe?: string;
  nameRu?: string;
  description: string;
  descriptionAr: string;
  descriptionEn?: string;
  descriptionHe?: string;
  descriptionRu?: string;
  price: number;
  unit: string;
  imageUrl: string | null;
  categoryId: number;
  categoryName: string;
  supplierId: number | null;
  supplierName: string | null;
  source: ProductSource;
  isAvailable: boolean;
  stockQuantity: number;
  totalOrders: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsPageData {
  stats: {
    totalProducts: number;
    available: number;
    outOfStock: number;
    categories: number;
    suppliers: number;
    avgPrice: number;
  };
  categories: ProductCategory[];
  products: DashboardProduct[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

// ── Backend Raw Types (matches GET /api/v1/admin/products response) ──

interface BackendProductSupplier {
  id: number;
  business_name: string;
}

interface BackendProductCategory {
  id: number;
  name: string;
}

interface BackendProduct {
  id: number;
  sku: string;
  name_ar: string;
  name_en?: string | null;
  name_he?: string | null;
  name_ru?: string | null;
  description?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  description_he?: string | null;
  description_ru?: string | null;
  product_type?: string | null;
  campaign_id?: number | null;
  price: string;
  unit: string;
  stock_quantity: number;
  approval_status: string;
  rejection_reason: string | null;
  is_active: boolean;
  primary_image: string | null;
  updated_at: string;
  supplier: BackendProductSupplier | null;
  category: BackendProductCategory | null;
  variants?: ProductVariant[];
}

interface BackendCategory {
  id: number;
  name_ar: string;
  name_en: string | null;
  image: string | null;
  sort_order: number;
  is_active: boolean;
  products_count: number;
  parent: { id: number; name_ar: string } | null;
  children?: BackendCategory[];
}

interface BackendProductsResponse {
  products: BackendProduct[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

// ── Mapping functions ──

function mapBackendCategory(bc: BackendCategory): ProductCategory {
  return {
    id: bc.id,
    name: bc.name_en || bc.name_ar,
    nameAr: bc.name_ar,
    parentId: bc.parent?.id ?? null,
    children: bc.children?.map(mapBackendCategory),
  };
}

// ── Mapping: BackendProduct → frontend DashboardProduct ──

function mapBackendProduct(bp: BackendProduct): DashboardProduct {
  return {
    id: bp.id,
    name: bp.name_en || bp.name_ar,
    nameAr: bp.name_ar,
    nameHe: bp.name_he ?? undefined,
    nameRu: bp.name_ru ?? undefined,
    description: bp.description ?? '',
    descriptionAr: bp.description_ar ?? '',
    descriptionEn: bp.description_en ?? '',
    descriptionHe: bp.description_he ?? '',
    descriptionRu: bp.description_ru ?? '',
    price: parseFloat(bp.price) || 0,
    unit: bp.unit || 'piece',
    imageUrl: bp.primary_image || null,
    categoryId: bp.category?.id || 0,
    categoryName: bp.category?.name || 'Uncategorized',
    supplierId: bp.supplier?.id || null,
    supplierName: bp.supplier?.business_name || null,
    source: (bp.product_type as ProductSource) || 'supplier',
    isAvailable: bp.is_active,
    stockQuantity: Number(bp.stock_quantity),
    totalOrders: 0, // not available from backend
    createdAt: bp.updated_at, // backend has no created_at on products
    updatedAt: bp.updated_at,
  };
}

// ── Backend field name mapping ──
// Frontend uses camelCase, backend expects snake_case

const PRODUCT_FIELD_MAP: Record<string, string> = {
  name: 'name_en',
  nameAr: 'name_ar',
  nameHe: 'name_he',
  nameRu: 'name_ru',
  description: 'description',
  descriptionAr: 'description_ar',
  descriptionEn: 'description_en',
  descriptionHe: 'description_he',
  descriptionRu: 'description_ru',
  price: 'price',
  unit: 'unit',
  stockQuantity: 'stock_quantity',
  categoryId: 'category_id',
  supplierId: 'supplier_id',
  campaignId: 'campaign_id',
  source: 'product_type',
};

function toBackendFields(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    const backendKey = PRODUCT_FIELD_MAP[key] || key;
    if (backendKey === 'image') continue;
    result[backendKey] = value;
  }
  return result;
}

function buildProductFormData(data: Record<string, any>): FormData {
  const fd = new FormData();
  const append = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (value instanceof File) {
      fd.append(key, value);
    } else if (typeof value === 'boolean') {
      fd.append(key, value ? '1' : '0');
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          Object.entries(item).forEach(([subKey, subValue]) => append(`${key}[${index}][${subKey}]`, subValue));
        } else {
          append(`${key}[${index}]`, item);
        }
      });
    } else {
      fd.append(key, String(value));
    }
  };
  for (const [key, value] of Object.entries(data)) {
    append(key, value);
  }
  return fd;
}

export const productsApi = {
  /** Fetch all products page data (stats + categories + products) */
  getPageData: async (params: { page?: number; search?: string } = {}): Promise<ProductsPageData> => {
      const [productsRes, categoriesRes] = await Promise.all([
        apiClient.get<ApiResponse<BackendProductsResponse>>('/api/v1/admin/products', {
          params: {
            page: params.page ?? 1,
            per_page: 15,
            search: params.search || undefined,
          },
        }),
        apiClient.get<ApiResponse<{ categories: BackendCategory[] }>>('/api/v1/admin/categories').catch(() => null),
      ]);
      const backendData = productsRes.data.data; // { products: [...], meta: {...} }
      const products = backendData.products.map(mapBackendProduct);
      const categories = categoriesRes ? (categoriesRes.data.data?.categories ?? []).map(mapBackendCategory) : [];
      const available = products.filter((p) => p.isAvailable).length;
      const outOfStock = products.filter((p) => p.stockQuantity === 0 && p.isAvailable).length;
      const supplierIds = new Set(products.filter((p) => p.supplierId).map((p) => p.supplierId));
      const prices = products.map((p) => p.price);
      const avgPrice = prices.length > 0
        ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100
        : 0;
      const meta = backendData.meta;
      return {
        stats: {
          totalProducts: meta.total ?? products.length,
          available,
          outOfStock,
          categories: categories.length,
          suppliers: supplierIds.size,
          avgPrice,
        },
        categories,
        products,
        meta: {
          currentPage: meta.current_page ?? 1,
          lastPage: meta.last_page ?? 1,
          perPage: 15,
          total: meta.total ?? products.length,
        },
      };
  },

  /** Get paginated product list */
  getProducts: async (): Promise<PaginatedResponse<DashboardProduct>> => {
      const response = await apiClient.get<ApiResponse<BackendProductsResponse>>('/api/v1/admin/products');
      const backendData = response.data.data;
      const products = backendData.products.map(mapBackendProduct);
      return {
        data: products,
        meta: {
          currentPage: backendData.meta.current_page,
          lastPage: backendData.meta.last_page,
          perPage: 15,
          total: backendData.meta.total,
        },
      };
  },

  /** Get single product */
  getProduct: async (id: number): Promise<DashboardProduct> => {
      const response = await apiClient.get<ApiResponse<BackendProduct>>(`/api/v1/admin/products/${id}`);
      return mapBackendProduct(response.data.data);
  },

  /** Create a new product */
  createProduct: async (data: Partial<DashboardProduct> & { image?: File; variants?: ProductVariantInput[] }): Promise<DashboardProduct> => {
      const backendData = toBackendFields(data);
      if (data.image instanceof File) {
        const formData = buildProductFormData(backendData);
        formData.append('image', data.image);
        const response = await apiClient.post<ApiResponse<BackendProduct>>('/api/v1/admin/products', formData, { headers: { 'Content-Type': undefined } });
        return mapBackendProduct(response.data.data);
      }
      const response = await apiClient.post<ApiResponse<BackendProduct>>('/api/v1/admin/products', backendData);
      return mapBackendProduct(response.data.data);
  },

  /** Update product */
  updateProduct: async (id: number, data: Partial<DashboardProduct> & { image?: File; variants?: ProductVariantInput[] }): Promise<DashboardProduct> => {
      const backendData = toBackendFields(data);
      if (data.image instanceof File) {
        const formData = buildProductFormData({ _method: 'PUT', ...backendData });
        formData.append('image', data.image);
        const response = await apiClient.post<ApiResponse<BackendProduct>>(`/api/v1/admin/products/${id}`, formData, { headers: { 'Content-Type': undefined } });
        return mapBackendProduct(response.data.data);
      }
      const response = await apiClient.put<ApiResponse<BackendProduct>>(`/api/v1/admin/products/${id}`, backendData);
      return mapBackendProduct(response.data.data);
  },

  /** Fetch all categories */
  getCategories: async (): Promise<ProductCategory[]> => {
      const response = await apiClient.get<ApiResponse<{ categories: BackendCategory[] }>>('/api/v1/admin/categories');
      const data = response.data.data;
      return (data.categories || []).map(mapBackendCategory);
  },

  /** Fetch suppliers list (for dropdown) */
  getSuppliersList: async (): Promise<Array<{id: number; name: string}>> => {
      const response = await apiClient.get<ApiResponse<{suppliers: Array<{id: number; business_name: string}>}>>('/api/v1/admin/suppliers?per_page=100');
      const data = response.data.data;
      return (data.suppliers || []).map((s) => ({ id: s.id, name: s.business_name }));
  },

  /** Fetch pending-approval products (uses dedicated endpoint) */
  getPendingApprovals: async (): Promise<DashboardProduct[]> => {
      const response = await apiClient.get<ApiResponse<{ products: BackendProduct[] }>>('/api/v1/admin/products/pending-approvals');
      return (response.data.data?.products ?? []).map(mapBackendProduct);
  },

  /** Toggle product availability */
  toggleAvailability: async (id: number): Promise<DashboardProduct> => {
      const response = await apiClient.post<ApiResponse<BackendProduct>>(`/api/v1/admin/products/${id}/toggle`);
      return mapBackendProduct(response.data.data);
  },

  /** Approve a pending product */
  approveProduct: async (id: number): Promise<DashboardProduct> => {
      const response = await apiClient.post<ApiResponse<BackendProduct>>(`/api/v1/admin/products/${id}/approve`);
      return mapBackendProduct(response.data.data);
  },

  /** Reject a pending product with a reason */
  rejectProduct: async (id: number, reason: string): Promise<DashboardProduct> => {
      const response = await apiClient.post<ApiResponse<BackendProduct>>(`/api/v1/admin/products/${id}/reject`, { reason });
      return mapBackendProduct(response.data.data);
  },

  /** Adjust stock level (add or remove units) — backend expects {quantity, type, note?} */
  adjustStock: async (id: number, adjustment: number, reason: string, type: 'add' | 'deduct' = 'add'): Promise<DashboardProduct> => {
      const response = await apiClient.post<ApiResponse<BackendProduct>>(`/api/v1/admin/products/${id}/stock-adjust`, {
        quantity: Math.abs(adjustment),
        type,
        note: reason,
      });
      return mapBackendProduct(response.data.data);
  },
};

// ── Product Variants ──

export interface ProductVariantInput {
  id?: number;
  name_ar: string;
  name_en?: string;
  name_he?: string;
  name_ru?: string;
  sku?: string;
  price: number;
  stock_quantity: number;
  is_active?: boolean;
  _delete?: boolean;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string | null;
  name_ar: string;
  name_en: string | null;
  name_he: string | null;
  name_ru: string | null;
  price: number;
  stock_quantity: number;
  available_stock: number;
  is_active: boolean;
  created_at: string;
}

export type VariantFormData = {
  name_ar: string;
  name_en?: string;
  name_he?: string;
  name_ru?: string;
  sku?: string;
  price: number;
  stock_quantity: number;
  is_active?: boolean;
};

export const productVariantsApi = {
  list: async (productId: number): Promise<ProductVariant[]> => {
    const response = await apiClient.get<ApiResponse<{ variants: ProductVariant[] }>>(`/api/v1/admin/products/${productId}/variants`);
    return response.data.data?.variants ?? [];
  },

  create: async (productId: number, data: VariantFormData): Promise<ProductVariant> => {
    const response = await apiClient.post<ApiResponse<ProductVariant>>(`/api/v1/admin/products/${productId}/variants`, data);
    return response.data.data;
  },

  update: async (productId: number, id: number, data: Partial<VariantFormData>): Promise<ProductVariant> => {
    const response = await apiClient.put<ApiResponse<ProductVariant>>(`/api/v1/admin/products/${productId}/variants/${id}`, data);
    return response.data.data;
  },

  toggle: async (productId: number, id: number): Promise<ProductVariant> => {
    const response = await apiClient.post<ApiResponse<ProductVariant>>(`/api/v1/admin/products/${productId}/variants/${id}/toggle`);
    return response.data.data;
  },

  delete: async (productId: number, id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/products/${productId}/variants/${id}`);
  },
};

export type ProductsApi = typeof productsApi;
