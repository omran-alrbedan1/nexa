// ============================================================
// Suppliers API Service
// ============================================================
// Backend: GET /api/v1/admin/suppliers (SupplierController@index)
//         GET /api/v1/admin/suppliers/pending-approvals (SupplierController@pendingApprovals)
//         GET /api/v1/admin/suppliers/{id} (SupplierController@show)
//         POST /api/v1/admin/suppliers (SupplierController@store)
//         PUT /api/v1/admin/suppliers/{id} (SupplierController@update)
//         POST /api/v1/admin/suppliers/{id}/approve (SupplierController@approve)
//         POST /api/v1/admin/suppliers/{id}/reject (SupplierController@reject)
// ============================================================

import { apiClient } from '@/lib/axios';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import type { DashboardProduct } from '@/features/products/api/productsApi';

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export type SupplierStatus = 'active' | 'inactive' | 'suspended' | 'pending_approval';
export type SupplierPaymentTerms = 'net_15' | 'net_30' | 'net_45' | 'prepaid';

export interface Supplier {
  id: number;
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  commercialRegister: string;
  taxNumber: string;
  status: SupplierStatus;
  paymentTerms: SupplierPaymentTerms;
  commissionRate: number; // percentage
  rating: number;
  totalOrders: number;
  totalRevenue: number;
  acceptanceRate: number;
  categories: string[];
  regions: string[];
  contactPerson: string;
  contactPhone: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SuppliersPageData {
  stats: {
    total: number;
    active: number;
    pendingApproval: number;
    suspended: number;
    avgRating: number;
    totalOrders: number;
    totalRevenue: number;
  };
  suppliers: Supplier[];
}

// ── Backend Raw Type (matches GET /api/v1/admin/suppliers response) ──

interface BackendSupplierUser {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  status: string;
}

interface BackendSupplierZone {
  id: number;
  name: string;
}

interface BackendSupplier {
  id: number;
  business_name: string;
  address: string;
  created_at: string;
  approval_status: 'approved' | 'pending' | 'rejected';
  acceptance_rate: number;
  rating_avg: number | null;
  products_count: number;
  approved_at: string | null;
  rejection_reason: string | null;
  user: BackendSupplierUser;
  zone: BackendSupplierZone | null;
}

interface BackendSuppliersResponse {
  suppliers: BackendSupplier[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

// ── Backend Product Type (matches ProductResource from GET /suppliers/{id}/products) ──

interface BackendSupplierProduct {
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
  supplier?: { id: number; business_name: string };
  category?: { id: number; name: string };
}

function mapBackendProductToDashboard(bp: BackendSupplierProduct): DashboardProduct {
  return {
    id: bp.id,
    name: bp.name_ar,
    nameAr: bp.name_ar,
    description: '',
    descriptionAr: '',
    price: parseFloat(bp.price) || 0,
    unit: bp.unit || 'piece',
    imageUrl: bp.primary_image || null,
    categoryId: bp.category?.id || 0,
    categoryName: bp.category?.name || 'Uncategorized',
    supplierId: bp.supplier?.id || null,
    supplierName: bp.supplier?.business_name || null,
    source: 'supplier',
    isAvailable: bp.is_active,
    stockQuantity: Number(bp.stock_quantity),
    totalOrders: 0,
    createdAt: bp.updated_at,
    updatedAt: bp.updated_at,
  };
}

// ── Mapping: BackendSupplier → frontend Supplier ──

function mapApprovalStatus(status: string): SupplierStatus {
  switch (status) {
    case 'approved': return 'active';
    case 'pending': return 'pending_approval';
    case 'rejected': return 'suspended';
    default: return 'inactive';
  }
}

function mapBackendSupplier(bs: BackendSupplier): Supplier {
  return {
    id: bs.id,
    name: bs.business_name, // business_name is stored in Arabic for Saudi users
    nameAr: bs.business_name, // use as Arabic name (business names are in Arabic)
    email: bs.user?.email || '',
    phone: bs.user?.phone || '',
    commercialRegister: '', // not available from backend
    taxNumber: '', // not available from backend
    status: mapApprovalStatus(bs.approval_status),
    paymentTerms: 'net_30', // default — not available from backend
    commissionRate: 10, // default — not available from backend
    rating: Number(bs.rating_avg ?? 0),
    totalOrders: Number(bs.products_count),
    totalRevenue: 0, // not available from backend
    acceptanceRate: Number(bs.acceptance_rate),
    categories: [], // not available from backend
    regions: bs.zone ? [bs.zone.name] : [],
    contactPerson: bs.user?.full_name || '',
    contactPhone: bs.user?.phone || '',
    address: bs.address || '',
    notes: bs.rejection_reason || '',
    createdAt: bs.created_at,
    updatedAt: bs.approved_at || bs.created_at,
  };
}

export const suppliersApi = {
  /** Fetch all suppliers page data (stats + list) */
  getPageData: async (): Promise<SuppliersPageData> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendSuppliersResponse>>('/api/v1/admin/suppliers');
      const backendData = response.data.data; // { suppliers: [...], meta: {...} }
      const suppliers = backendData.suppliers.map(mapBackendSupplier);
      const active = suppliers.filter((s) => s.status === 'active').length;
      const pending = suppliers.filter((s) => s.status === 'pending_approval').length;
      const suspended = suppliers.filter((s) => s.status === 'suspended').length;
      const ratings = suppliers.filter((s) => s.rating > 0);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, s) => sum + s.rating, 0) / ratings.length
        : 0;
      return {
        stats: {
          total: suppliers.length,
          active,
          pendingApproval: pending,
          suspended,
          avgRating: Math.round(avgRating * 10) / 10,
          totalOrders: suppliers.reduce((sum, s) => sum + s.totalOrders, 0),
          totalRevenue: suppliers.reduce((sum, s) => sum + s.totalRevenue, 0),
        },
        suppliers,
      };
    } catch {
      return { stats: { total: 0, active: 0, pendingApproval: 0, suspended: 0, avgRating: 0, totalOrders: 0, totalRevenue: 0 }, suppliers: [] };
    }
  },

  /** Get paginated supplier list */
  getSuppliers: async (): Promise<PaginatedResponse<Supplier>> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendSuppliersResponse>>('/api/v1/admin/suppliers');
      const backendData = response.data.data;
      const suppliers = backendData.suppliers.map(mapBackendSupplier);
      return {
        data: suppliers,
        meta: {
          currentPage: backendData.meta.current_page,
          lastPage: backendData.meta.last_page,
          perPage: 20,
          total: backendData.meta.total,
        },
      };
    } catch {
      throw new Error('Failed to fetch suppliers');
    }
  },

  /** Get single supplier */
  getSupplier: async (id: number): Promise<Supplier> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendSupplier>>(`/api/v1/admin/suppliers/${id}`);
      return mapBackendSupplier(response.data.data);
    } catch {
      throw new Error('Supplier not found');
    }
  },

  /** Create a new supplier */
  createSupplier: async (data: Partial<Supplier>): Promise<Supplier> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendSupplier>>('/api/v1/admin/suppliers', data);
      return mapBackendSupplier(response.data.data);
    } catch {
      throw new Error('Failed to create supplier');
    }
  },

  /** Update an existing supplier */
  updateSupplier: async (id: number, data: Partial<Supplier>): Promise<Supplier> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendSupplier>>(`/api/v1/admin/suppliers/${id}`, data);
      return mapBackendSupplier(response.data.data);
    } catch {
      throw new Error('Supplier not found');
    }
  },

  /** Approve a pending supplier */
  approveSupplier: async (id: number): Promise<Supplier> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendSupplier>>(`/api/v1/admin/suppliers/${id}/approve`);
      return mapBackendSupplier(response.data.data);
    } catch {
      throw new Error('Supplier not found');
    }
  },

  /** Fetch pending-approval suppliers (uses dedicated endpoint) */
  getPendingApprovals: async (): Promise<Supplier[]> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendSupplier[]>>('/api/v1/admin/suppliers/pending-approvals');
      return response.data.data.map(mapBackendSupplier);
    } catch {
      return [];
    }
  },

  /** Fetch products belonging to this supplier */
  getSupplierProducts: async (supplierId: number): Promise<DashboardProduct[]> => {
    try {
      const response = await apiClient.get<ApiResponse<{ products: BackendSupplierProduct[]; meta: Record<string, unknown> }>>(`/api/v1/admin/suppliers/${supplierId}/products`);
      const data = response.data.data;
      return (data.products || []).map(mapBackendProductToDashboard);
    } catch {
      return [];
    }
  },

  /** Suspend a supplier */
  suspendSupplier: async (id: number, reason: string): Promise<Supplier> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendSupplier>>(`/api/v1/admin/suppliers/${id}/reject`, { reason });
      return mapBackendSupplier(response.data.data);
    } catch {
      throw new Error('Failed to suspend supplier');
    }
  },
};

export type SuppliersApi = typeof suppliersApi;
