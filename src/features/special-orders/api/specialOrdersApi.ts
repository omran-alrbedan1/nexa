import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

// ── Domain Types ──

export type SpecialOrderStatus =
  | 'pending_admin'
  | 'pending_pricing'
  | 'pending_customer'
  | 'priced'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface SpecialOrderItem {
  id: number;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  customerNote: string;
}

export interface PriceQuote {
  id: number;
  quoteNumber: string;
  status: string;
  total: number;
  adminApproved: boolean;
}

export interface SpecialOrder {
  id: number;
  referenceNumber: string;
  status: SpecialOrderStatus;
  customerNotes: string;
  internalNotes: string;
  rejectionReason: string | null;
  customer: { id: number; fullName: string; phone: string } | null;
  assignedSupplier: { id: number; businessName: string; phone: string } | null;
  items: SpecialOrderItem[];
  priceQuotes: PriceQuote[];
  createdAt: string;
  updatedAt: string;
}

export interface SpecialOrderSummary {
  id: number;
  referenceNumber: string;
  status: SpecialOrderStatus;
  customerName: string;
  customerPhone: string;
  customerNotes: string;
  estimatedBudget: number | null;
  assignedToName: string | null;
  itemCount: number;
  createdAt: string;
}

// ── Backend Raw Types ──

interface BackendPriceQuote {
  id: number;
  quote_number: string;
  status: string;
  total: string;
  admin_approved: boolean;
}

interface BackendItem {
  id: number;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  customer_note: string;
}

interface BackendSpecialOrder {
  id: number;
  reference_number: string;
  status: string;
  customer_notes: string;
  internal_notes: string;
  rejection_reason: string | null;
  customer: { id: number; full_name: string; phone: string } | null;
  assigned_supplier: { id: number; business_name: string; user?: { phone: string } } | null;
  items: BackendItem[];
  price_quotes: BackendPriceQuote[];
  created_at: string;
  updated_at: string;
}

interface BackendListResponse {
  special_orders: BackendSpecialOrder[];
  meta: { current_page: number; last_page: number; total: number };
}

// ── Mapping ──

function mapStatus(status: string): SpecialOrderStatus {
  const map: Record<string, SpecialOrderStatus> = {
    pending_admin: 'pending_admin',
    pending_pricing: 'pending_pricing',
    pending_customer: 'pending_customer',
    priced: 'priced',
    approved: 'approved',
    rejected: 'rejected',
    cancelled: 'cancelled',
  };
  return map[status] || 'pending_admin';
}

function mapItem(bi: BackendItem): SpecialOrderItem {
  return {
    id: bi.id,
    name: bi.name,
    description: bi.description,
    quantity: bi.quantity,
    unit: bi.unit,
    customerNote: bi.customer_note,
  };
}

function mapQuote(bq: BackendPriceQuote): PriceQuote {
  return {
    id: bq.id,
    quoteNumber: bq.quote_number,
    status: bq.status,
    total: parseFloat(bq.total) || 0,
    adminApproved: bq.admin_approved,
  };
}

function mapDetail(bo: BackendSpecialOrder): SpecialOrder {
  return {
    id: bo.id,
    referenceNumber: bo.reference_number,
    status: mapStatus(bo.status),
    customerNotes: bo.customer_notes || '',
    internalNotes: bo.internal_notes || '',
    rejectionReason: bo.rejection_reason,
    customer: bo.customer ? { id: bo.customer.id, fullName: bo.customer.full_name, phone: bo.customer.phone } : null,
    assignedSupplier: bo.assigned_supplier ? { id: bo.assigned_supplier.id, businessName: bo.assigned_supplier.business_name, phone: (bo.assigned_supplier.user?.phone) || '' } : null,
    items: (bo.items || []).map(mapItem),
    priceQuotes: (bo.price_quotes || []).map(mapQuote),
    createdAt: bo.created_at,
    updatedAt: bo.updated_at || bo.created_at,
  };
}

function mapSummary(bo: BackendSpecialOrder): SpecialOrderSummary {
  return {
    id: bo.id,
    referenceNumber: bo.reference_number,
    status: mapStatus(bo.status),
    customerName: bo.customer?.full_name || 'Unknown',
    customerPhone: bo.customer?.phone || '',
    customerNotes: bo.customer_notes || '',
    estimatedBudget: null,
    assignedToName: bo.assigned_supplier?.business_name || null,
    itemCount: (bo.items || []).length,
    createdAt: bo.created_at,
  };
}

export const specialOrdersApi = {
  /** Fetch paginated special orders list */
  getList: async (params?: { status?: string; page?: number; perPage?: number; search?: string }): Promise<{ data: SpecialOrderSummary[]; total: number }> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.set('status', params.status);
      if (params?.page) queryParams.set('page', String(params.page));
      if (params?.perPage) queryParams.set('per_page', String(params.perPage));
      if (params?.search) queryParams.set('search', params.search);
      const qs = queryParams.toString();
      const response = await apiClient.get<ApiResponse<BackendListResponse>>(`/api/v1/admin/special-orders${qs ? '?' + qs : ''}`);
      const data = response.data.data;
      return {
        data: data.special_orders.map(mapSummary),
        total: data.meta.total,
      };
    } catch {
      return { data: [], total: 0 };
    }
  },

  /** Fetch single special order detail */
  getDetail: async (id: number): Promise<SpecialOrder> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendSpecialOrder>>(`/api/v1/admin/special-orders/${id}`);
      return mapDetail(response.data.data);
    } catch {
      throw new Error('Special order not found');
    }
  },

  /** Assign supplier */
  assignSupplier: async (id: number, supplierId: number): Promise<void> => {
    try {
      await apiClient.post(`/api/v1/admin/special-orders/${id}/assign-supplier`, { supplier_id: supplierId });
    } catch {
      throw new Error('Failed to assign supplier');
    }
  },

  /** Assign staff */
  assignStaff: async (id: number, staffUserId: number): Promise<void> => {
    try {
      await apiClient.post(`/api/v1/admin/special-orders/${id}/assign-staff`, { staff_user_id: staffUserId });
    } catch {
      throw new Error('Failed to assign staff');
    }
  },

  /** Approve special order */
  approve: async (id: number, note?: string): Promise<void> => {
    try {
      await apiClient.post(`/api/v1/admin/special-orders/${id}/approve`, { note: note || '' });
    } catch {
      throw new Error('Failed to approve special order');
    }
  },

  /** Reject special order */
  reject: async (id: number, reason: string): Promise<void> => {
    try {
      await apiClient.post(`/api/v1/admin/special-orders/${id}/reject`, { reason });
    } catch {
      throw new Error('Failed to reject special order');
    }
  },

  /** Update internal notes */
  updateNotes: async (id: number, notes: string): Promise<void> => {
    try {
      await apiClient.put(`/api/v1/admin/special-orders/${id}/notes`, { notes });
    } catch {
      throw new Error('Failed to update notes');
    }
  },

  /** Convert to regular order */
  convertToOrder: async (id: number): Promise<void> => {
    try {
      await apiClient.post(`/api/v1/admin/special-orders/${id}/convert-to-order`);
    } catch {
      throw new Error('Failed to convert special order');
    }
  },

  /** Submit price quote — backend stores pricing in notes via PUT /special-orders/{id}/notes */
  submitPriceQuote: async (id: number, price: number, notes: string): Promise<void> => {
    try {
      const pricingNotes = `Price Quote: SAR ${price}. ${notes ? notes : ''}`;
      await apiClient.put(`/api/v1/admin/special-orders/${id}/notes`, { notes: pricingNotes });
    } catch {
      throw new Error('Failed to submit price quote');
    }
  },
};

export type SpecialOrdersApi = typeof specialOrdersApi;
