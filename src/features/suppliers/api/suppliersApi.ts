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
import { mapSupplierApprovalStatus } from '@/lib/enumMappers';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import { toAbsoluteUrl } from '@/features/products/api/productsApi';
import type { DashboardProduct } from '@/features/products/api/productsApi';

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export type SupplierStatus = 'active' | 'inactive' | 'suspended' | 'pending_approval';
export type SupplierPaymentTerms = 'net_15' | 'net_30' | 'net_45' | 'prepaid';

export interface SupplierDocument {
  id: number;
  type: string;
  filePath: string | null;
  status: string | null;
  expiresAt: string | null;
}

export interface Supplier {
  id: number;
  name: string;
  nameAr: string;
  nameHe: string;
  nameRu: string;
  email: string;
  phone: string;
  commercialRegister: string;
  taxNumber: string;
  status: SupplierStatus;
  approvalStatus: 'approved' | 'pending' | 'rejected';
  userStatus: string;
  isTrusted: boolean;
  trustedPhoneId: number | null;
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
  zoneId: number | null;
  coverImage: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  minimumOrderAmount: number | null;
  notes: string;
  documents: SupplierDocument[];
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
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
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

interface BackendCategoryRef {
  id: number;
  name: string;
}

interface BackendSupplierDocument {
  id: number;
  type: string;
  file_path: string | null;
  status: string | null;
  expires_at: string | null;
}

interface BackendSupplier {
  id: number;
  business_name: string;
  name_ar: string | null;
  name_he: string | null;
  name_ru: string | null;
  is_trusted: boolean;
  trusted_phone_id: number | null;
  address: string;
  cover_image: string | null;
  long_description: string | null;
  short_description: string | null;
  minimum_order_amount: number | null;
  delivery_time_min: number | null;
  delivery_time_max: number | null;
  opening_hours: string | null;
  is_open_now: boolean | null;
  created_at: string;
  approval_status: 'approved' | 'pending' | 'rejected';
  acceptance_rate: number;
  rating_avg: number | null;
  products_count: number;
  commercial_register: string | null;
  tax_number: string | null;
  commission_rate: number;
  total_orders: number;
  total_revenue: number;
  approved_at: string | null;
  rejection_reason: string | null;
  categories: BackendCategoryRef[] | null;
  user: BackendSupplierUser;
  zone: BackendSupplierZone | null;
  documents?: BackendSupplierDocument[] | null;
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
    sku: bp.sku ?? '',
    imageUrl: toAbsoluteUrl(bp.primary_image),
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
    variantType: 'unit',
  };
}

// ── Mapping: BackendSupplier → frontend Supplier ──

function mapBackendSupplier(bs: BackendSupplier): Supplier {
  return {
    id: bs.id,
    name: bs.business_name,
    nameAr: bs.name_ar || bs.business_name,
    nameHe: bs.name_he || '',
    nameRu: bs.name_ru || '',
    email: bs.user?.email || '',
    phone: bs.user?.phone || '',
    commercialRegister: bs.commercial_register || '',
    taxNumber: bs.tax_number || '',
    status: mapSupplierApprovalStatus(bs.approval_status, bs.user?.status) as SupplierStatus,
    approvalStatus: bs.approval_status,
    userStatus: bs.user?.status || '',
    isTrusted: Boolean(bs.is_trusted),
    trustedPhoneId: bs.trusted_phone_id ?? null,
    paymentTerms: 'net_30',
    commissionRate: Number(bs.commission_rate ?? 0),
    rating: Number(bs.rating_avg ?? 0),
    totalOrders: Number(bs.total_orders ?? 0),
    totalRevenue: Number(bs.total_revenue ?? 0),
    acceptanceRate: Number(bs.acceptance_rate),
    categories: bs.categories?.map((c) => c.name) || [],
    regions: bs.zone ? [bs.zone.name] : [],
    contactPerson: bs.user?.full_name || '',
    contactPhone: bs.user?.phone || '',
    address: bs.address || '',
    zoneId: bs.zone?.id ?? null,
    coverImage: toAbsoluteUrl(bs.cover_image ?? null),
    shortDescription: bs.short_description ?? null,
    longDescription: bs.long_description ?? null,
    minimumOrderAmount: bs.minimum_order_amount != null ? Number(bs.minimum_order_amount) : null,
    notes: bs.rejection_reason || '',
    documents: (bs.documents || []).map((d) => ({
      id: d.id,
      type: d.type,
      filePath: toAbsoluteUrl(d.file_path),
      status: d.status,
      expiresAt: d.expires_at,
    })),
    createdAt: bs.created_at,
    updatedAt: bs.approved_at || bs.created_at,
  };
}

export const suppliersApi = {
  /** Fetch all suppliers page data (stats + list) */
  getPageData: async (params: { page?: number; search?: string; approval_status?: string; status?: string } = {}): Promise<SuppliersPageData> => {
    const response = await apiClient.get<ApiResponse<BackendSuppliersResponse>>('/api/v1/admin/suppliers', {
      params: {
        page: params.page ?? 1,
        per_page: 15,
        search: params.search || undefined,
        approval_status: params.approval_status || undefined,
        status: params.status || undefined,
      },
    });
    const backendData = response.data.data;
    const suppliers = backendData.suppliers.map(mapBackendSupplier);
    const active = suppliers.filter((s) => s.status === 'active').length;
    const pending = suppliers.filter((s) => s.status === 'pending_approval').length;
    const suspended = suppliers.filter((s) => s.status === 'suspended').length;
    const ratings = suppliers.filter((s) => s.rating > 0);
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, s) => sum + s.rating, 0) / ratings.length
      : 0;
    const meta = backendData.meta;
    return {
      stats: {
        total: meta.total ?? suppliers.length,
        active,
        pendingApproval: pending,
        suspended,
        avgRating: Math.round(avgRating * 10) / 10,
        totalOrders: suppliers.reduce((sum, s) => sum + s.totalOrders, 0),
        totalRevenue: suppliers.reduce((sum, s) => sum + s.totalRevenue, 0),
      },
      suppliers,
      meta: {
        currentPage: meta.current_page ?? 1,
        lastPage: meta.last_page ?? 1,
        perPage: 15,
        total: meta.total ?? suppliers.length,
      },
    };
  },

  /** Get paginated supplier list */
  getSuppliers: async (): Promise<PaginatedResponse<Supplier>> => {
    const response = await apiClient.get<ApiResponse<BackendSuppliersResponse>>('/api/v1/admin/suppliers');
    const backendData = response.data.data;
    const suppliers = backendData.suppliers.map(mapBackendSupplier);
    return {
      data: suppliers,
      meta: {
        currentPage: backendData.meta.current_page,
        lastPage: backendData.meta.last_page,
        perPage: 15,
        total: backendData.meta.total,
      },
    };
  },

  /** Get single supplier */
  getSupplier: async (id: number): Promise<Supplier> => {
    const response = await apiClient.get<ApiResponse<BackendSupplier>>(`/api/v1/admin/suppliers/${id}`);
    return mapBackendSupplier(response.data.data);
  },

  /** Create a new supplier */
  createSupplier: async (data: Partial<Supplier>): Promise<Supplier> => {
    const response = await apiClient.post<ApiResponse<BackendSupplier>>('/api/v1/admin/suppliers', data);
    return mapBackendSupplier(response.data.data);
  },

  /** Fetch allowed registration document types */
  getSupplierDocumentTypes: async (): Promise<Array<{ type: string; label: string }>> => {
    const response = await apiClient.get<ApiResponse<{ document_types: Array<{ type: string; label: string }> }>>('/api/v1/admin/suppliers/document-types');
    return response.data.data?.document_types ?? [];
  },

  /** Upload a registration document for a supplier */
  uploadSupplierDocument: async (supplierId: number, documentType: string, file: File): Promise<SupplierDocument> => {
    const formData = new FormData();
    formData.append('document_type', documentType);
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<SupplierDocument>>(`/api/v1/admin/suppliers/${supplierId}/documents`, formData, { headers: { 'Content-Type': undefined } });
    return response.data.data;
  },

  /** Update an existing supplier (optionally with a cover image file) */
  updateSupplier: async (id: number, data: Partial<Supplier>, file?: File | null): Promise<Supplier> => {
    if (file) {
      const formData = new FormData();
      if (data.name) formData.append('business_name', data.name);
      if (data.nameAr) formData.append('name_ar', data.nameAr);
      if (data.nameHe) formData.append('name_he', data.nameHe);
      if (data.nameRu) formData.append('name_ru', data.nameRu);
      if (data.address) formData.append('address', data.address);
      if (data.zoneId != null) formData.append('zone_id', String(data.zoneId));
      if (data.shortDescription) formData.append('short_description', data.shortDescription);
      if (data.longDescription) formData.append('long_description', data.longDescription);
      if (data.minimumOrderAmount != null) formData.append('minimum_order_amount', String(data.minimumOrderAmount));
      formData.append('store_cover_image', file);
      const response = await apiClient.put<ApiResponse<BackendSupplier>>(`/api/v1/admin/suppliers/${id}`, formData, { headers: { 'Content-Type': undefined } });
      return mapBackendSupplier(response.data.data);
    }

    const response = await apiClient.put<ApiResponse<BackendSupplier>>(`/api/v1/admin/suppliers/${id}`, data);
    return mapBackendSupplier(response.data.data);
  },

  /** Approve a pending supplier */
  approveSupplier: async (id: number): Promise<Supplier> => {
    const response = await apiClient.post<ApiResponse<BackendSupplier>>(`/api/v1/admin/suppliers/${id}/approve`);
    return mapBackendSupplier(response.data.data);
  },

  /** Fetch pending-approval suppliers */
  getPendingApprovals: async (): Promise<Supplier[]> => {
    const response = await apiClient.get<ApiResponse<{ suppliers: BackendSupplier[] }>>('/api/v1/admin/suppliers/pending-approvals');
    return (response.data.data?.suppliers ?? []).map(mapBackendSupplier);
  },

  /** Fetch recent orders for this supplier */
  getSupplierOrders: async (supplierId: number): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<{ orders: any[]; meta: Record<string, unknown> }>>(`/api/v1/admin/suppliers/${supplierId}/orders`);
    const data = response.data.data;
    return (data.orders || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer?.name || 'Unknown',
      total: o.total,
      itemsCount: o.items_count || 0,
      status: o.status,
      createdAt: o.created_at,
    }));
  },

  /** Fetch products belonging to this supplier */
  getSupplierProducts: async (supplierId: number): Promise<DashboardProduct[]> => {
    const response = await apiClient.get<ApiResponse<{ products: BackendSupplierProduct[]; meta: Record<string, unknown> }>>(`/api/v1/admin/suppliers/${supplierId}/products`);
    const data = response.data.data;
    return (data.products || []).map(mapBackendProductToDashboard);
  },

  /** Suspend a supplier */
  suspendSupplier: async (id: number, reason: string): Promise<Supplier> => {
    const response = await apiClient.post<ApiResponse<BackendSupplier>>(`/api/v1/admin/suppliers/${id}/reject`, { reason });
    return mapBackendSupplier(response.data.data);
  },

  /** Toggle supplier between active and suspended (suspend / reactivate) */
  toggleSupplier: async (id: number): Promise<Supplier> => {
    const response = await apiClient.post<ApiResponse<BackendSupplier>>(`/api/v1/admin/suppliers/${id}/toggle`);
    return mapBackendSupplier(response.data.data);
  },

  /** Delete a supplier account (blocked while open orders exist) */
  deleteSupplier: async (id: number): Promise<void> => {
    await apiClient.post(`/api/v1/admin/suppliers/${id}/delete`);
  },

  /** Fetch the trusted supplier phones list */
  getTrustedPhones: async (): Promise<Array<{ id: number; phone: string; note: string | null; created_at: string }>> => {
    const response = await apiClient.get<ApiResponse<{ trusted_phones: Array<{ id: number; phone: string; note: string | null; created_at: string }> }>>('/api/v1/admin/trusted-supplier-phones');
    return response.data.data?.trusted_phones ?? [];
  },

  /** Add a phone to the trusted list */
  addTrustedPhone: async (phone: string, note?: string): Promise<{ id: number; phone: string; note: string | null }> => {
    const response = await apiClient.post<ApiResponse<{ id: number; phone: string; note: string | null }>>('/api/v1/admin/trusted-supplier-phones', { phone, note: note || undefined });
    return response.data.data;
  },

  /** Remove a phone from the trusted list */
  deleteTrustedPhone: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/trusted-supplier-phones/${id}`);
  },

  /** Fetch supplier categories */
  getSupplierCategories: async (supplierId: number): Promise<number[]> => {
    const response = await apiClient.get<ApiResponse<{ category_ids: number[] }>>(`/api/v1/admin/suppliers/${supplierId}/categories`);
    return response.data.data?.category_ids ?? [];
  },

  /** Sync supplier categories */
  syncSupplierCategories: async (supplierId: number, categoryIds: number[]): Promise<Supplier> => {
    const response = await apiClient.post<ApiResponse<BackendSupplier>>(`/api/v1/admin/suppliers/${supplierId}/categories`, { category_ids: categoryIds });
    return mapBackendSupplier(response.data.data);
  },

  /** Fetch all product categories */
  getAllCategories: async (): Promise<Array<{ id: number; name: string }>> => {
    const response = await apiClient.get<ApiResponse<{ categories: Array<{ id: number; name_ar: string; name_en: string | null }> }>>('/api/v1/admin/categories');
    return (response.data.data?.categories || []).map((bc) => ({ id: bc.id, name: bc.name_en || bc.name_ar }));
  },
};

export type SuppliersApi = typeof suppliersApi;
