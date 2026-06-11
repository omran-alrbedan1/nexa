// ============================================================
// Suppliers API Service
// ============================================================
// Backend: GET /api/v1/admin/suppliers (SupplierController@index)
//         GET /api/v1/admin/suppliers/{id} (SupplierController@show)
//         POST /api/v1/admin/suppliers (SupplierController@store)
//         PUT /api/v1/admin/suppliers/{id} (SupplierController@update)
//         POST /api/v1/admin/suppliers/{id}/approve (SupplierController@approve)
//         POST /api/v1/admin/suppliers/{id}/suspend (SupplierController@suspend)
// ============================================================

import { apiClient } from '@/lib/axios';
import { unwrap } from '@/lib/apiHelpers';
import type { PaginatedResponse, ApiResponse } from '@/types/common';

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
    name: bs.business_name,
    nameAr: '', // not available from backend
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

// ── Dummy Data ──

const now = new Date();

const DUMMY_SUPPLIERS: Supplier[] = [
  {
    id: 1, name: 'Fresh Farm Co.', nameAr: 'المزرعة الطازجة', email: 'contact@freshfarm.com',
    phone: '+966501234001', commercialRegister: 'CR-2025-001', taxNumber: 'TX-3001',
    status: 'active', paymentTerms: 'net_30', commissionRate: 12, rating: 4.5,
    totalOrders: 48, totalRevenue: 124500, acceptanceRate: 94,
    categories: ['Vegetables', 'Fruits', 'Herbs'], regions: ['Riyadh North', 'Riyadh South'],
    contactPerson: 'Ahmed Al-Mutairi', contactPhone: '+966501234111', address: 'Riyadh, Industrial Zone',
    notes: 'Preferred supplier for organic produce', createdAt: now.toISOString(), updatedAt: now.toISOString(),
  },
  {
    id: 2, name: 'Dairy Best Ltd.', nameAr: 'الألبان الأفضل', email: 'info@dairybest.com',
    phone: '+966501234002', commercialRegister: 'CR-2025-002', taxNumber: 'TX-3002',
    status: 'active', paymentTerms: 'net_15', commissionRate: 10, rating: 4.8,
    totalOrders: 36, totalRevenue: 89000, acceptanceRate: 97,
    categories: ['Dairy', 'Eggs', 'Cheese'], regions: ['Riyadh North', 'Jeddah Central'],
    contactPerson: 'Khalid Al-Otaibi', contactPhone: '+966501234222', address: 'Jeddah, Industrial Area',
    notes: 'Exclusive dairy supplier', createdAt: now.toISOString(), updatedAt: now.toISOString(),
  },
  {
    id: 3, name: 'Golden Grains', nameAr: 'الحبوب الذهبية', email: 'orders@goldengrains.com',
    phone: '+966501234003', commercialRegister: 'CR-2025-003', taxNumber: 'TX-3003',
    status: 'active', paymentTerms: 'net_30', commissionRate: 8, rating: 4.2,
    totalOrders: 29, totalRevenue: 67000, acceptanceRate: 91,
    categories: ['Bakery', 'Grains', 'Flour'], regions: ['Dammam East', 'Riyadh North'],
    contactPerson: 'Sami Al-Shammari', contactPhone: '+966501234333', address: 'Dammam, Industrial City',
    notes: '', createdAt: now.toISOString(), updatedAt: now.toISOString(),
  },
  {
    id: 4, name: 'Premium Meats', nameAr: 'اللحوم الممتازة', email: 'sales@premiummeats.com',
    phone: '+966501234004', commercialRegister: 'CR-2025-004', taxNumber: 'TX-3004',
    status: 'active', paymentTerms: 'net_15', commissionRate: 15, rating: 4.0,
    totalOrders: 22, totalRevenue: 156000, acceptanceRate: 86,
    categories: ['Meat', 'Poultry', 'Seafood'], regions: ['Jeddah Central', 'Mecca North'],
    contactPerson: 'Nasser Al-Ghamdi', contactPhone: '+966501234444', address: 'Mecca, Industrial Area',
    notes: 'High-value items, requires special handling', createdAt: now.toISOString(), updatedAt: now.toISOString(),
  },
  {
    id: 5, name: 'Organic Valley', nameAr: 'الوادي العضوي', email: 'info@organicvalley.com',
    phone: '+966501234005', commercialRegister: 'CR-2025-005', taxNumber: 'TX-3005',
    status: 'pending_approval', paymentTerms: 'net_45', commissionRate: 10, rating: 0,
    totalOrders: 0, totalRevenue: 0, acceptanceRate: 100,
    categories: ['Organic', 'Health', 'Supplements'], regions: ['Riyadh North'],
    contactPerson: 'Huda Al-Zahrani', contactPhone: '+966501234555', address: 'Riyadh, Al-Olaya',
    notes: 'New supplier — pending contract review', createdAt: now.toISOString(), updatedAt: now.toISOString(),
  },
  {
    id: 6, name: 'Seafood Express', nameAr: 'المأكولات البحرية السريعة', email: 'catch@seafoodexpress.com',
    phone: '+966501234006', commercialRegister: 'CR-2025-006', taxNumber: 'TX-3006',
    status: 'suspended', paymentTerms: 'prepaid', commissionRate: 18, rating: 2.5,
    totalOrders: 8, totalRevenue: 45000, acceptanceRate: 62,
    categories: ['Seafood', 'Fish'], regions: ['Dammam East'],
    contactPerson: 'Fahad Al-Dossary', contactPhone: '+966501234666', address: 'Dammam, Fishing Port',
    notes: 'Suspended due to quality issues — under review', createdAt: now.toISOString(), updatedAt: now.toISOString(),
  },
];

const DUMMY_STATS = {
  total: 6, active: 3, pendingApproval: 1, suspended: 1,
  avgRating: 4.0, totalOrders: 143, totalRevenue: 481500,
};

function getDummyPageData(): SuppliersPageData {
  return { stats: DUMMY_STATS, suppliers: DUMMY_SUPPLIERS };
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
      return getDummyPageData();
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
      return { data: DUMMY_SUPPLIERS, meta: { currentPage: 1, lastPage: 1, perPage: 20, total: DUMMY_SUPPLIERS.length } };
    }
  },

  /** Get single supplier */
  getSupplier: async (id: number): Promise<Supplier> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendSupplier>>(`/api/v1/admin/suppliers/${id}`);
      return mapBackendSupplier(response.data.data);
    } catch {
      const supplier = DUMMY_SUPPLIERS.find((s) => s.id === id);
      if (!supplier) throw new Error('Supplier not found');
      return supplier;
    }
  },

  /** Create a new supplier */
  createSupplier: async (data: Partial<Supplier>): Promise<Supplier> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendSupplier>>('/api/v1/admin/suppliers', data);
      return mapBackendSupplier(response.data.data);
    } catch {
      const newSupplier: Supplier = {
        id: DUMMY_SUPPLIERS.length + 1,
        name: data.name || 'New Supplier',
        nameAr: data.nameAr || '',
        email: data.email || '',
        phone: data.phone || '',
        commercialRegister: data.commercialRegister || '',
        taxNumber: data.taxNumber || '',
        status: 'pending_approval',
        paymentTerms: data.paymentTerms || 'net_30',
        commissionRate: data.commissionRate || 10,
        rating: 0,
        totalOrders: 0,
        totalRevenue: 0,
        acceptanceRate: 100,
        categories: data.categories || [],
        regions: data.regions || [],
        contactPerson: data.contactPerson || '',
        contactPhone: data.contactPhone || '',
        address: data.address || '',
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newSupplier;
    }
  },

  /** Update an existing supplier */
  updateSupplier: async (id: number, data: Partial<Supplier>): Promise<Supplier> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendSupplier>>(`/api/v1/admin/suppliers/${id}`, data);
      return mapBackendSupplier(response.data.data);
    } catch {
      const supplier = DUMMY_SUPPLIERS.find((s) => s.id === id);
      if (!supplier) throw new Error('Supplier not found');
      return { ...supplier, ...data, updatedAt: new Date().toISOString() };
    }
  },

  /** Approve a pending supplier */
  approveSupplier: async (id: number): Promise<Supplier> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendSupplier>>(`/api/v1/admin/suppliers/${id}/approve`);
      return mapBackendSupplier(response.data.data);
    } catch {
      const supplier = DUMMY_SUPPLIERS.find((s) => s.id === id);
      if (!supplier) throw new Error('Supplier not found');
      return { ...supplier, status: 'active', updatedAt: new Date().toISOString() };
    }
  },

  /** Suspend a supplier */
  suspendSupplier: async (id: number, reason: string): Promise<Supplier> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendSupplier>>(`/api/v1/admin/suppliers/${id}/suspend`, { reason });
      return mapBackendSupplier(response.data.data);
    } catch {
      const supplier = DUMMY_SUPPLIERS.find((s) => s.id === id);
      if (!supplier) throw new Error('Supplier not found');
      return { ...supplier, status: 'suspended', notes: reason, updatedAt: new Date().toISOString() };
    }
  },
};

export type SuppliersApi = typeof suppliersApi;
