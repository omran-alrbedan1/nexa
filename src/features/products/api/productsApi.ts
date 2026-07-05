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
import { unwrap } from '@/lib/apiHelpers';
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
  description: string;
  descriptionAr: string;
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
}

interface BackendProductsResponse {
  products: BackendProduct[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

// ── Mapping: BackendProduct → frontend DashboardProduct ──

function mapBackendProduct(bp: BackendProduct): DashboardProduct {
  return {
    id: bp.id,
    name: bp.name_ar, // backend has only Arabic name, use it for both
    nameAr: bp.name_ar,
    description: '', // not available from backend
    descriptionAr: '', // not available from backend
    price: parseFloat(bp.price) || 0,
    unit: bp.unit || 'piece',
    imageUrl: bp.primary_image || null,
    categoryId: bp.category?.id || 0,
    categoryName: bp.category?.name || 'Uncategorized',
    supplierId: bp.supplier?.id || null,
    supplierName: bp.supplier?.business_name || null,
    source: 'supplier', // default — not available from backend
    isAvailable: bp.is_active,
    stockQuantity: Number(bp.stock_quantity),
    totalOrders: 0, // not available from backend
    createdAt: bp.updated_at, // backend has no created_at on products
    updatedAt: bp.updated_at,
  };
}

export const productsApi = {
  /** Fetch all products page data (stats + categories + products) */
  getPageData: async (): Promise<ProductsPageData> => {
      const [productsRes, categoriesRes] = await Promise.all([
        apiClient.get<ApiResponse<BackendProductsResponse>>('/api/v1/admin/products'),
        apiClient.get<ApiResponse<ProductCategory[]>>('/api/v1/admin/categories').catch(() => null),
      ]);
      const backendData = productsRes.data.data; // { products: [...], meta: {...} }
      const products = backendData.products.map(mapBackendProduct);
      const categories = categoriesRes ? unwrap(categoriesRes.data) : [];
      const available = products.filter((p) => p.isAvailable).length;
      const outOfStock = products.filter((p) => p.stockQuantity === 0 && p.isAvailable).length;
      const supplierIds = new Set(products.filter((p) => p.supplierId).map((p) => p.supplierId));
      const prices = products.map((p) => p.price);
      const avgPrice = prices.length > 0
        ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100
        : 0;
      return {
        stats: {
          totalProducts: products.length,
          available,
          outOfStock,
          categories: categories.length,
          suppliers: supplierIds.size,
          avgPrice,
        },
        categories,
        products,
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
          perPage: 20,
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
  createProduct: async (data: Partial<DashboardProduct>): Promise<DashboardProduct> => {
      const response = await apiClient.post<ApiResponse<BackendProduct>>('/api/v1/admin/products', data);
      return mapBackendProduct(response.data.data);
  },

  /** Update product */
  updateProduct: async (id: number, data: Partial<DashboardProduct>): Promise<DashboardProduct> => {
      const response = await apiClient.put<ApiResponse<BackendProduct>>(`/api/v1/admin/products/${id}`, data);
      return mapBackendProduct(response.data.data);
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

export type ProductsApi = typeof productsApi;
