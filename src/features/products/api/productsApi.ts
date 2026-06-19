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

// ── Dummy Data (fallback) ──

const DUMMY_CATEGORIES: ProductCategory[] = [
  { id: 1, name: 'Vegetables', nameAr: 'خضروات', parentId: null, children: [
    { id: 11, name: 'Leafy Greens', nameAr: 'خضار ورقية', parentId: 1 },
    { id: 12, name: 'Root Vegetables', nameAr: 'خضار جذرية', parentId: 1 },
    { id: 13, name: 'Tomatoes & Peppers', nameAr: 'طماطم وفلفل', parentId: 1 },
  ]},
  { id: 2, name: 'Fruits', nameAr: 'فواكه', parentId: null, children: [
    { id: 21, name: 'Citrus', nameAr: 'حمضيات', parentId: 2 },
    { id: 22, name: 'Tropical', nameAr: 'استوائية', parentId: 2 },
  ]},
  { id: 3, name: 'Dairy', nameAr: 'ألبان', parentId: null },
  { id: 4, name: 'Meat & Poultry', nameAr: 'لحوم ودواجن', parentId: null },
  { id: 5, name: 'Bakery', nameAr: 'مخبوزات', parentId: null },
  { id: 6, name: 'Seafood', nameAr: 'مأكولات بحرية', parentId: null },
];

const now = new Date();

const DUMMY_PRODUCTS: DashboardProduct[] = [
  { id: 1, name: 'Fresh Tomatoes (1kg)', nameAr: 'طماطم طازجة (1 كجم)', description: 'Ripe red tomatoes, perfect for cooking', descriptionAr: 'طماطم حمراء ناضجة، مثالية للطهي', price: 8.50, unit: 'kg', imageUrl: null, categoryId: 13, categoryName: 'Tomatoes & Peppers', supplierId: 1, supplierName: 'Fresh Farm Co.', source: 'supplier', isAvailable: true, stockQuantity: 200, totalOrders: 156, createdAt: now.toISOString(), updatedAt: now.toISOString() },
  { id: 2, name: 'Brown Eggs (12pk)', nameAr: 'بيض بلدي (12 حبة)', description: 'Free-range brown eggs', descriptionAr: 'بيض بلدي من دجاج حر', price: 18.00, unit: 'pack', imageUrl: null, categoryId: 3, categoryName: 'Dairy', supplierId: 2, supplierName: 'Dairy Best Ltd.', source: 'supplier', isAvailable: true, stockQuantity: 500, totalOrders: 234, createdAt: now.toISOString(), updatedAt: now.toISOString() },
  { id: 3, name: 'Whole Wheat Bread', nameAr: 'خبز أسمر', description: 'Freshly baked whole wheat loaf', descriptionAr: 'خبز أسمر طازج', price: 6.00, unit: 'loaf', imageUrl: null, categoryId: 5, categoryName: 'Bakery', supplierId: 3, supplierName: 'Golden Grains', source: 'supplier', isAvailable: true, stockQuantity: 150, totalOrders: 189, createdAt: now.toISOString(), updatedAt: now.toISOString() },
  { id: 4, name: 'Chicken Breast (1kg)', nameAr: 'صدر دجاج (1 كجم)', description: 'Boneless skinless chicken breast', descriptionAr: 'صدر دجاج بدون عظم ولا جلد', price: 32.00, unit: 'kg', imageUrl: null, categoryId: 4, categoryName: 'Meat & Poultry', supplierId: 4, supplierName: 'Premium Meats', source: 'supplier', isAvailable: true, stockQuantity: 80, totalOrders: 145, createdAt: now.toISOString(), updatedAt: now.toISOString() },
  { id: 5, name: 'Fresh Strawberries (500g)', nameAr: 'فراولة طازجة (500 جم)', description: 'Sweet and juicy strawberries', descriptionAr: 'فراولة حلوة وعصيرية', price: 22.00, unit: 'pack', imageUrl: null, categoryId: 22, categoryName: 'Tropical', supplierId: 1, supplierName: 'Fresh Farm Co.', source: 'seasonal', isAvailable: true, stockQuantity: 0, totalOrders: 67, createdAt: now.toISOString(), updatedAt: now.toISOString() },
  { id: 6, name: 'Labneh (500g)', nameAr: 'لبنة (500 جم)', description: 'Creamy strained yogurt cheese', descriptionAr: 'جبن زبادي كريمي مصفى', price: 14.00, unit: 'tub', imageUrl: null, categoryId: 3, categoryName: 'Dairy', supplierId: 2, supplierName: 'Dairy Best Ltd.', source: 'internal', isAvailable: true, stockQuantity: 300, totalOrders: 198, createdAt: now.toISOString(), updatedAt: now.toISOString() },
  { id: 7, name: 'Organic Honey (500g)', nameAr: 'عسل عضوي (500 جم)', description: 'Pure organic wildflower honey', descriptionAr: 'عسل زهور برية عضوي نقي', price: 65.00, unit: 'jar', imageUrl: null, categoryId: 5, categoryName: 'Bakery', supplierId: null, supplierName: null, source: 'internal', isAvailable: true, stockQuantity: 45, totalOrders: 34, createdAt: now.toISOString(), updatedAt: now.toISOString() },
  { id: 8, name: 'Salmon Fillet (400g)', nameAr: 'فيليه سلمون (400 جم)', description: 'Fresh Atlantic salmon fillet', descriptionAr: 'فيليه سلمون أطلسي طازج', price: 55.00, unit: 'piece', imageUrl: null, categoryId: 6, categoryName: 'Seafood', supplierId: 6, supplierName: 'Seafood Express', source: 'supplier', isAvailable: false, stockQuantity: 0, totalOrders: 23, createdAt: now.toISOString(), updatedAt: now.toISOString() },
];

const DUMMY_STATS = {
  totalProducts: 8, available: 6, outOfStock: 2, categories: 6, suppliers: 4, avgPrice: 27.56,
};

function getDummyPageData(): ProductsPageData {
  return { stats: DUMMY_STATS, categories: DUMMY_CATEGORIES, products: DUMMY_PRODUCTS };
}

export const productsApi = {
  /** Fetch all products page data (stats + categories + products) */
  getPageData: async (): Promise<ProductsPageData> => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiClient.get<ApiResponse<BackendProductsResponse>>('/api/v1/admin/products'),
        apiClient.get<ApiResponse<ProductCategory[]>>('/api/v1/admin/categories').catch(() => null),
      ]);
      const backendData = productsRes.data.data; // { products: [...], meta: {...} }
      const products = backendData.products.map(mapBackendProduct);
      const categories = categoriesRes ? unwrap(categoriesRes.data) : DUMMY_CATEGORIES;
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
    } catch {
      return getDummyPageData();
    }
  },

  /** Get paginated product list */
  getProducts: async (): Promise<PaginatedResponse<DashboardProduct>> => {
    try {
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
    } catch {
      return { data: DUMMY_PRODUCTS, meta: { currentPage: 1, lastPage: 1, perPage: 20, total: DUMMY_PRODUCTS.length } };
    }
  },

  /** Get single product */
  getProduct: async (id: number): Promise<DashboardProduct> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendProduct>>(`/api/v1/admin/products/${id}`);
      return mapBackendProduct(response.data.data);
    } catch {
      const product = DUMMY_PRODUCTS.find((p) => p.id === id);
      if (!product) throw new Error('Product not found');
      return product;
    }
  },

  /** Create a new product */
  createProduct: async (data: Partial<DashboardProduct>): Promise<DashboardProduct> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendProduct>>('/api/v1/admin/products', data);
      return mapBackendProduct(response.data.data);
    } catch {
      const newProduct: DashboardProduct = {
        id: DUMMY_PRODUCTS.length + 1,
        name: data.name || 'New Product',
        nameAr: data.nameAr || '', description: data.description || '', descriptionAr: data.descriptionAr || '',
        price: data.price || 0, unit: data.unit || 'piece', imageUrl: null,
        categoryId: data.categoryId || 1, categoryName: data.categoryName || 'Uncategorized',
        supplierId: data.supplierId || null, supplierName: data.supplierName || null,
        source: data.source || 'internal', isAvailable: true, stockQuantity: data.stockQuantity || 0,
        totalOrders: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      return newProduct;
    }
  },

  /** Update product */
  updateProduct: async (id: number, data: Partial<DashboardProduct>): Promise<DashboardProduct> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendProduct>>(`/api/v1/admin/products/${id}`, data);
      return mapBackendProduct(response.data.data);
    } catch {
      const product = DUMMY_PRODUCTS.find((p) => p.id === id);
      if (!product) throw new Error('Product not found');
      return { ...product, ...data, updatedAt: new Date().toISOString() };
    }
  },

  /** Fetch pending-approval products (uses dedicated endpoint) */
  getPendingApprovals: async (): Promise<DashboardProduct[]> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendProduct[]>>('/api/v1/admin/products/pending-approvals');
      return response.data.data.map(mapBackendProduct);
    } catch {
      return DUMMY_PRODUCTS.filter((p) => !p.isAvailable);
    }
  },

  /** Toggle product availability */
  toggleAvailability: async (id: number): Promise<DashboardProduct> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendProduct>>(`/api/v1/admin/products/${id}/toggle`);
      return mapBackendProduct(response.data.data);
    } catch {
      const product = DUMMY_PRODUCTS.find((p) => p.id === id);
      if (!product) throw new Error('Product not found');
      return { ...product, isAvailable: !product.isAvailable, updatedAt: new Date().toISOString() };
    }
  },

  /** Adjust stock level (add or remove units) — backend expects {quantity, type, note?} */
  adjustStock: async (id: number, adjustment: number, reason: string, type: 'add' | 'deduct' = 'add'): Promise<DashboardProduct> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendProduct>>(`/api/v1/admin/products/${id}/stock-adjust`, {
        quantity: Math.abs(adjustment),
        type,
        note: reason,
      });
      return mapBackendProduct(response.data.data);
    } catch {
      const product = DUMMY_PRODUCTS.find((p) => p.id === id);
      if (!product) throw new Error('Product not found');
      return {
        ...product,
        stockQuantity: product.stockQuantity + (type === 'add' ? Math.abs(adjustment) : -Math.abs(adjustment)),
        updatedAt: new Date().toISOString(),
      };
    }
  },
};

export type ProductsApi = typeof productsApi;
