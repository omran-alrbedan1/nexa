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
import { unwrap } from '@/lib/apiHelpers';
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
    ratingAvg: Number(bc.rating_avg ?? 0),
    ordersCount: Number(bc.orders_count ?? 0),
    internalNotes: bc.internal_notes || '',
    createdAt: bc.created_at,
    addresses: bc.user?.addresses?.map(mapAddress) || [],
    defaultZone: bc.default_zone || null,
    totalPurchases: 0,
  };
}

/** Create a new customer */
interface CreateCustomerData {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  password?: string;
}

export const customersApi = {
  /** Create a new customer */
  createCustomer: async (data: CreateCustomerData): Promise<Customer> => {
    const response = await apiClient.post<ApiResponse<BackendCustomer>>('/api/v1/admin/customers', data);
    return mapBackendCustomer(response.data.data);
  },

  /** Fetch all customers page data (stats + list) */
  getPageData: async (): Promise<CustomersPageData> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendCustomersResponse>>('/api/v1/admin/customers');
      const backendData = response.data.data;
      const customers = backendData.customers.map(mapBackendCustomer);
      const active = customers.filter((c) => c.status === 'active').length;
      const suspended = customers.filter((c) => c.status === 'suspended').length;
      const blocked = customers.filter((c) => c.status === 'blocked').length;
      const ratings = customers.filter((c) => c.ratingAvg > 0);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, c) => sum + c.ratingAvg, 0) / ratings.length
        : 0;
      return {
        stats: {
          total: customers.length,
          active,
          suspended,
          blocked,
          avgRating: Math.round(avgRating * 10) / 10,
          totalOrders: customers.reduce((sum, c) => sum + c.ordersCount, 0),
        },
        customers,
      };
    } catch {
      return {
        stats: { total: 0, active: 0, suspended: 0, blocked: 0, avgRating: 0, totalOrders: 0 },
        customers: [],
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
