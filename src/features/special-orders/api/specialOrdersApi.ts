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
  | 'cancelled'
  | 'converted';

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
  subtotal: number;
  deliveryFee: number;
  validUntil: string | null;
  customerNotes: string | null;
  customerResponseNote: string | null;
  supplier: { id: number; businessName: string } | null;
  adminApproved: boolean;
  items?: PriceQuoteItem[];
}

export interface PriceQuoteItem {
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface SupplierOption {
  id: number;
  name: string;
}

export interface Negotiation {
  id: number;
  message: string;
  actorType: string;
  user: { id: number; fullName: string } | null;
  createdAt: string;
}

export interface ConvertOrderData {
  warehouse_id: number;
  zone_id: number;
  delivery_fee?: number;
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
  negotiations: Negotiation[];
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

interface BackendPriceQuoteItem {
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: string;
  total: string;
}

interface BackendNegotiation {
  id: number;
  message: string;
  actor_type: string;
  user: { id: number; full_name: string } | null;
  created_at: string;
}

interface BackendPriceQuote {
  id: number;
  quote_number: string;
  status: string;
  total: string;
  subtotal: string;
  delivery_fee: string;
  valid_until: string | null;
  customer_notes: string | null;
  customer_response_note: string | null;
  supplier: { id: number; business_name: string } | null;
  admin_approved: boolean;
  items?: BackendPriceQuoteItem[];
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
  negotiations: BackendNegotiation[];
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
    converted: 'converted',
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

function mapQuoteItem(bqi: BackendPriceQuoteItem): PriceQuoteItem {
  return {
    name: bqi.name,
    description: bqi.description,
    quantity: bqi.quantity,
    unit: bqi.unit,
    unitPrice: parseFloat(bqi.unit_price) || 0,
    total: parseFloat(bqi.total) || 0,
  };
}

function mapNegotiation(bn: BackendNegotiation): Negotiation {
  return {
    id: bn.id,
    message: bn.message,
    actorType: bn.actor_type,
    user: bn.user ? { id: bn.user.id, fullName: bn.user.full_name } : null,
    createdAt: bn.created_at,
  };
}

function mapQuote(bq: BackendPriceQuote): PriceQuote {
  return {
    id: bq.id,
    quoteNumber: bq.quote_number,
    status: bq.status,
    total: parseFloat(bq.total) || 0,
    subtotal: parseFloat(bq.subtotal) || 0,
    deliveryFee: parseFloat(bq.delivery_fee) || 0,
    validUntil: bq.valid_until || null,
    customerNotes: bq.customer_notes || null,
    customerResponseNote: bq.customer_response_note || null,
    supplier: bq.supplier ? { id: bq.supplier.id, businessName: bq.supplier.business_name } : null,
    adminApproved: bq.admin_approved,
    items: (bq.items || []).map(mapQuoteItem),
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
    negotiations: (bo.negotiations || []).map(mapNegotiation),
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
  getList: async (params?: { status?: string; page?: number; perPage?: number; search?: string }): Promise<{ data: SpecialOrderSummary[]; meta: { currentPage: number; lastPage: number; perPage: number; total: number } }> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    queryParams.set('page', String(params?.page ?? 1));
    queryParams.set('per_page', String(params?.perPage ?? 15));
    if (params?.search) queryParams.set('search', params.search);
    const qs = queryParams.toString();
    const response = await apiClient.get<ApiResponse<BackendListResponse>>(`/api/v1/admin/special-orders${qs ? '?' + qs : ''}`);
    const data = response.data.data;
    return {
      data: data.special_orders.map(mapSummary),
      meta: {
        currentPage: data.meta.current_page ?? 1,
        lastPage: data.meta.last_page ?? 1,
        perPage: 15,
        total: data.meta.total ?? 0,
      },
    };
  },

  /** Fetch single special order detail */
  getDetail: async (id: number): Promise<SpecialOrder> => {
    const response = await apiClient.get<ApiResponse<BackendSpecialOrder>>(`/api/v1/admin/special-orders/${id}`);
    return mapDetail(response.data.data);
  },

  /** Assign supplier */
  assignSupplier: async (id: number, supplierId: number): Promise<void> => {
    await apiClient.post(`/api/v1/admin/special-orders/${id}/assign-supplier`, { supplier_id: supplierId });
  },

  /** Assign staff */
  assignStaff: async (id: number, staffUserId: number): Promise<void> => {
    await apiClient.post(`/api/v1/admin/special-orders/${id}/assign-staff`, { staff_user_id: staffUserId });
  },

  /** Approve special order */
  approve: async (id: number, note?: string): Promise<void> => {
    await apiClient.post(`/api/v1/admin/special-orders/${id}/approve`, { note: note || '' });
  },

  /** Reject special order */
  reject: async (id: number, reason: string): Promise<void> => {
    await apiClient.post(`/api/v1/admin/special-orders/${id}/reject`, { reason });
  },

  /** Update internal notes */
  updateNotes: async (id: number, notes: string): Promise<void> => {
    await apiClient.put(`/api/v1/admin/special-orders/${id}/notes`, { internal_notes: notes });
  },

  /** Convert to regular order */
  convertToOrder: async (id: number, data: ConvertOrderData): Promise<void> => {
    await apiClient.post(`/api/v1/admin/special-orders/${id}/convert-to-order`, data);
  },

    /** Fetch suppliers list (for dropdown) */
  getSuppliers: async (): Promise<SupplierOption[]> => {
    const response = await apiClient.get<ApiResponse<{suppliers: Array<{id: number; business_name: string | null}>}>>('/api/v1/admin/suppliers?per_page=100');
    const data = response.data.data;
    return (data.suppliers || []).map((s) => ({ id: s.id, name: s.business_name || '' }));
  },

  /** Create price quote — temporary admin-proxy endpoint until supplier app is ready */
  createPriceQuote: async (id: number, data: {
    items: Array<{ name: string; description?: string; quantity: number; unit: string; unit_price: number }>;
    delivery_fee?: number;
    valid_until?: string;
    customer_notes?: string;
  }): Promise<void> => {
    await apiClient.post(`/api/v1/admin/special-orders/${id}/price-quotes`, data);
  },
};

export type SpecialOrdersApi = typeof specialOrdersApi;
