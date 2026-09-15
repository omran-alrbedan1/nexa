// ============================================================
// Customers API Service
// ============================================================
// Backend: GET /api/v1/admin/customers (CustomerController@index)
//          GET /api/v1/admin/customers/{id} (CustomerController@show)
//          GET /api/v1/admin/customers/{id}/orders (CustomerController@orders)
//          PUT /api/v1/admin/customers/{id}/status (CustomerController@updateStatus)
//          PUT /api/v1/admin/customers/{id}/notes (CustomerController@updateNotes)
// ============================================================

import { apiClient } from '@/lib/axios';

import type { PaginatedResponse, ApiResponse } from '@/types/common';

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export type CustomerStatus = 'active' | 'inactive' | 'suspended' | 'blocked';

export interface CustomerAddress {
  id: number;
  label: string;
  addressDetails: string;
  isDefault: boolean;
  zone?: { id: number; nameAr: string } | null;
}

export interface Customer {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  status: CustomerStatus;
  deletionRequested: boolean;
  deletionRequestedAt: string | null;
  deletionScheduledAt: string | null;
  ratingAvg: number;
  ordersCount: number;
  internalNotes: string;
  createdAt: string;
  addresses: CustomerAddress[];
  defaultZone?: { id: number; nameAr: string } | null;
  totalPurchases: number; // computed from orders data
}

export interface CustomersPageData {
  stats: {
    total: number;
    active: number;
    suspended: number;
    blocked: number;
    avgRating: number;
    totalOrders: number;
  };
  customers: Customer[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

// ── Backend Raw Types ──

interface BackendAddress {
  id: number;
  label: string;
  address_details: string;
  is_default: boolean;
  zone?: { id: number; name_ar: string } | null;
}

interface BackendUser {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  status: string;
  deletion_requested?: boolean;
  deletion_requested_at?: string | null;
  deletion_scheduled_at?: string | null;
  addresses?: BackendAddress[];
}

interface BackendCustomer {
  id: number;
  internal_notes: string;
  rating_avg: number | null;
  orders_count: number;
  created_at: string;
  user?: BackendUser | null;
  default_zone?: { id: number; name_ar: string } | null;
}

interface BackendCustomersResponse {
  customers: BackendCustomer[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

// ── Mapping ──

function mapStatus(status: string): CustomerStatus {
  switch (status) {
    case 'active': return 'active';
    case 'inactive': return 'inactive';
    case 'suspended': return 'suspended';
    case 'blocked': return 'blocked';
    default: return 'inactive';
  }
}

function mapAddress(ba: BackendAddress): CustomerAddress {
  return {
    id: ba.id,
    label: ba.label,
    addressDetails: ba.address_details,
    isDefault: ba.is_default,
    zone: ba.zone ? { id: ba.zone.id, nameAr: ba.zone.name_ar } : null,
  };
}

function mapBackendCustomer(bc: BackendCustomer): Customer {
  return {
    id: bc.id,
    fullName: bc.user?.full_name || '',
    phone: bc.user?.phone || '',
    email: bc.user?.email || '',
    status: mapStatus(bc.user?.status || 'inactive'),
    deletionRequested: bc.user?.deletion_requested ?? false,
    deletionRequestedAt: bc.user?.deletion_requested_at ?? null,
    deletionScheduledAt: bc.user?.deletion_scheduled_at ?? null,
    ratingAvg: Number(bc.rating_avg ?? 0),
    ordersCount: Number(bc.orders_count ?? 0),
    internalNotes: bc.internal_notes || '',
    createdAt: bc.created_at,
    addresses: bc.user?.addresses?.map(mapAddress) || [],
    defaultZone: bc.default_zone ? { id: bc.default_zone.id, nameAr: bc.default_zone.name_ar } : null,
    totalPurchases: 0,
  };
}

/** Create a new customer */
export interface CreateCustomerData {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  password?: string;
  zoneId?: number;
}

export const customersApi = {
  /** Create a new customer */
  createCustomer: async (data: CreateCustomerData): Promise<Customer> => {
    const response = await apiClient.post<ApiResponse<BackendCustomer>>('/api/v1/admin/customers', {
      first_name: data.firstName,
      last_name: data.lastName || null,
      phone: data.phone,
      email: data.email || null,
      password: data.password || undefined,
      zone_id: data.zoneId || undefined,
    });
    return mapBackendCustomer(response.data.data);
  },

  /** Fetch all customers page data (stats + list) */
  getPageData: async (params: { page?: number; search?: string; status?: string; zoneId?: number } = {}): Promise<CustomersPageData> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendCustomersResponse>>('/api/v1/admin/customers', {
        params: {
          page: params.page ?? 1,
          per_page: 15,
          search: params.search || undefined,
          status: params.status || undefined,
          zone_id: params.zoneId || undefined,
        },
      });
      const backendData = response.data.data;
      const customers = backendData.customers.map(mapBackendCustomer);
      const active = customers.filter((c) => c.status === 'active').length;
      const suspended = customers.filter((c) => c.status === 'suspended').length;
      const blocked = customers.filter((c) => c.status === 'blocked').length;
      const ratings = customers.filter((c) => c.ratingAvg > 0);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, c) => sum + c.ratingAvg, 0) / ratings.length
        : 0;
      const meta = backendData.meta;
      return {
        stats: {
          total: meta.total ?? customers.length,
          active,
          suspended,
          blocked,
          avgRating: Math.round(avgRating * 10) / 10,
          totalOrders: customers.reduce((sum, c) => sum + c.ordersCount, 0),
        },
        customers,
        meta: {
          currentPage: meta.current_page ?? 1,
          lastPage: meta.last_page ?? 1,
          perPage: 15,
          total: meta.total ?? customers.length,
        },
      };
    } catch {
      return {
        stats: { total: 0, active: 0, suspended: 0, blocked: 0, avgRating: 0, totalOrders: 0 },
        customers: [],
        meta: { currentPage: 1, lastPage: 1, perPage: 15, total: 0 },
      };
    }
  },

  /** Get single customer */
  getCustomer: async (id: number): Promise<Customer> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendCustomer>>(`/api/v1/admin/customers/${id}`);
      return mapBackendCustomer(response.data.data);
    } catch {
      throw new Error('Customer not found');
    }
  },

  /** Get orders for a customer */
  getCustomerOrders: async (id: number): Promise<PaginatedResponse<any>> => {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/api/v1/admin/customers/${id}/orders`);
      const data = response.data.data;
      return {
        data: data.orders || [],
        meta: data.meta || { currentPage: 1, lastPage: 1, perPage: 20, total: 0 },
      };
    } catch {
      throw new Error('Failed to fetch customer orders');
    }
  },

  /** Update customer status */
  updateStatus: async (id: number, status: CustomerStatus): Promise<Customer> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendCustomer>>(`/api/v1/admin/customers/${id}/status`, { status });
      return mapBackendCustomer(response.data.data);
    } catch {
      throw new Error('Failed to update customer status');
    }
  },

  /** Cancel a pending account-deletion request */
  cancelDeletion: async (id: number): Promise<Customer> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendCustomer>>(`/api/v1/admin/customers/${id}/cancel-deletion`);
      return mapBackendCustomer(response.data.data);
    } catch {
      throw new Error('Failed to cancel deletion request');
    }
  },

  /** Update internal notes */
  updateNotes: async (id: number, notes: string): Promise<Customer> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendCustomer>>(`/api/v1/admin/customers/${id}/notes`, { internal_notes: notes });
      return mapBackendCustomer(response.data.data);
    } catch {
      throw new Error('Failed to update customer notes');
    }
  },
};

export type CustomersApi = typeof customersApi;
