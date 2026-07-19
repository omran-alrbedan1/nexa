// ============================================================
// Operations API Service
// ============================================================
// Backend - ✅ BUILT:
//   GET    /api/v1/admin/orders (OrderController@index)
//   GET    /api/v1/admin/orders/{id} (OrderController@show)
//   PUT    /api/v1/admin/orders/{id}/status (OrderController@updateStatus)
//   GET    /api/v1/admin/special-orders (SpecialOrderController@index)
//   GET    /api/v1/admin/support-tickets (SupportTicketController@index)
//   POST   /api/v1/admin/support-tickets/{id}/assign (SupportTicketController@assign)
//   PUT    /api/v1/admin/support-tickets/{id}/status (SupportTicketController@updateStatus)
//   GET    /api/v1/admin/customers (CustomerController@index)
// ============================================================

import { apiClient } from '@/lib/axios';
import { unwrap } from '@/lib/apiHelpers';
import { ORDER_STATUS_FRONTEND_TO_BACKEND } from '@/lib/enumMappers';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import type { OrderType, OrderStatus, PaymentMethod, PaymentStatus } from '@/types/marketplace';
import { formatPrice } from '@/utils/currency';

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface OperationsOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  type: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: string;
  itemCount: number;
  total: number;
  regionName: string;
  supplierName: string | null;
  notes: string | null;
  scheduledDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialRequest {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  requestDetails: string;
  estimatedBudget: number | null;
  status: 'pending_management' | 'pending_pricing' | 'pending_customer_approval' | 'priced' | 'approved' | 'rejected' | 'cancelled';
  assignedTo: string | null;
  priceQuote: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSummary {
  id: number;
  name: string;
  phone: string;
  email: string;
  regionName: string;
  clusterName: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Complaint {
  id: number;
  ticketNumber: string;
  customerId: number;
  customerName: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string | null;
  relatedOrderNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OperationsStats {
  newOrdersToday: number;
  pendingSpecials: number;
  pendingPricing: number;
  pendingCustomerApproval: number;
  activeComplaints: number;
  ordersInProgress: number;
  deliveredToday: number;
  failedDeliveries: number;
}

export interface OperationsPageData {
  stats: OperationsStats;
  recentOrders: OperationsOrder[];
  specialRequests: SpecialRequest[];
  complaints: Complaint[];
}

// ── Query params ──

export interface OrderListParams {
  status?: OrderStatus;
  type?: OrderType;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

export interface SpecialRequestParams {
  status?: string;
  page?: number;
  perPage?: number;
}

// ── Backend Raw Types (matches GET /api/v1/admin/orders response) ──

interface BackendOrderCustomer {
  id: number;
  name: string;
  phone: string;
}

interface BackendOrderSupplier {
  id: number;
  business_name: string;
}

interface BackendOrderWarehouse {
  id: number;
  name: string;
}

interface BackendOrder {
  id: number;
  order_number: string;
  order_type: string;
  status: string;
  payment_status: string;
  total: string;
  subtotal?: string;
  delivery_fee?: string;
  created_at: string;
  delivery_scheduled_at: string | null;
  notes: string | null;
  customer: BackendOrderCustomer | null;
  supplier: BackendOrderSupplier | null;
  warehouse: BackendOrderWarehouse | null;
  updated_at?: string;
}

interface BackendTicket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  customer: { id: number; full_name: string } | null;
  assigned_to: { id: number; full_name: string } | null;
  customer_id: number;
  order_number: string | null;
  created_at: string;
  updated_at: string;
}

interface BackendSpecialOrderForMapping {
  id: number;
  customer_id: number;
  reference_number: string;
  status: string;
  customer_notes: string;
  internal_notes: string;
  estimated_budget: number | null;
  customer: { id: number; full_name: string; phone: string } | null;
  assigned_to_user: { id: number; full_name: string } | null;
  assigned_supplier: { id: number; business_name: string } | null;
  created_at: string;
  updated_at: string;
}

interface BackendOrdersResponse {
  orders: BackendOrder[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

// ── Mapping: BackendOrder → frontend OperationsOrder ──

function mapBackendOrderStatus(status: string): OrderStatus {
  const map: Record<string, OrderStatus> = {
    'NEW': 'new',
    'PENDING_ADMIN': 'pending_management',
    'PENDING_PRICING': 'pending_pricing',
    'PENDING_CUSTOMER': 'pending_customer_approval',
    'CONFIRMED': 'confirmed',
    'PAID': 'paid',
    'IN_SUPPLY': 'pending_supply',
    'IN_AGGREGATION': 'pending_aggregation',
    'READY_TO_SHIP': 'ready_to_ship',
    'OUT_FOR_DELIVERY': 'out_for_delivery',
    'DELIVERED': 'delivered',
    'FAILED_DELIVERY': 'failed_delivery',
    'CANCELLED': 'cancelled',
    'POSTPONED': 'postponed',
  };
  return map[status] || (status.toLowerCase() as OrderStatus);
}

function mapBackendOrderType(type: string): OrderType {
  const map: Record<string, OrderType> = {
    'REGULAR': 'regular',
    'SPECIAL': 'special',
    'SEASONAL': 'seasonal',
  };
  return map[type] || 'regular';
}

function mapBackendPaymentStatus(status: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    'pending': 'pending',
    'cod_pending': 'pending',
    'paid': 'paid',
    'failed': 'failed',
    'refunded': 'refunded',
  };
  return map[status] || 'pending';
}

function mapBackendSpecialOrderStatus(status: string): SpecialRequest['status'] {
  const map: Record<string, SpecialRequest['status']> = {
    'pending_admin': 'pending_management',
    'pending_pricing': 'pending_pricing',
    'pending_customer': 'pending_customer_approval',
    'approved': 'approved',
    'rejected': 'rejected',
    'cancelled': 'cancelled',
  };
  return map[status] || 'pending_management';
}

function mapBackendOrder(bo: BackendOrder): OperationsOrder {
  return {
    id: bo.id,
    orderNumber: bo.order_number,
    customerId: bo.customer?.id || 0,
    customerName: bo.customer?.name || 'Unknown',
    customerPhone: bo.customer?.phone || '',
    type: mapBackendOrderType(bo.order_type),
    status: mapBackendOrderStatus(bo.status),
    paymentStatus: mapBackendPaymentStatus(bo.payment_status),
    paymentMethod: 'cash_on_delivery', // default — not in this response
    items: '',
    itemCount: 0,
    total: parseFloat(bo.total) || 0,
    regionName: bo.warehouse?.name || '',
    supplierName: bo.supplier?.business_name || null,
    notes: bo.notes,
    scheduledDate: bo.delivery_scheduled_at || '',
    createdAt: bo.created_at,
    updatedAt: bo.updated_at || bo.created_at,
  };
}



// ──────────────────────────────────────────────
// API Methods
// ──────────────────────────────────────────────

export const operationsApi = {
  /** Fetch all operations page data */
  getPageData: async (): Promise<OperationsPageData> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendOrdersResponse>>('/api/v1/admin/orders?per_page=20');
      const backendData = response.data.data;
      const orders = backendData.orders.map(mapBackendOrder);
      const newOrders = orders.filter((o) => o.status === 'new' || o.status === 'pending_management').length;
      return {
        stats: {
          newOrdersToday: newOrders,
          pendingSpecials: orders.filter((o) => o.type === 'special' && (o.status === 'pending_management' || o.status === 'pending_pricing')).length,
          pendingPricing: orders.filter((o) => o.status === 'pending_pricing').length,
          pendingCustomerApproval: orders.filter((o) => o.status === 'pending_customer_approval').length,
          activeComplaints: 0, // not available from backend yet
          ordersInProgress: orders.filter((o) => !['delivered', 'cancelled', 'failed_delivery', 'refunded'].includes(o.status)).length,
          deliveredToday: orders.filter((o) => o.status === 'delivered').length,
          failedDeliveries: orders.filter((o) => o.status === 'failed_delivery').length,
        },
        recentOrders: orders.slice(0, 8),
        specialRequests: [],
        complaints: [],
      };
    } catch {
      return {
        stats: { newOrdersToday: 0, pendingSpecials: 0, pendingPricing: 0, pendingCustomerApproval: 0, activeComplaints: 0, ordersInProgress: 0, deliveredToday: 0, failedDeliveries: 0 },
        recentOrders: [],
        specialRequests: [],
        complaints: [],
      };
    }
  },

  /** Fetch orders with optional filters */
  getOrders: async (params?: OrderListParams): Promise<PaginatedResponse<OperationsOrder>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.set('status', ORDER_STATUS_FRONTEND_TO_BACKEND[params.status] ?? params.status.toUpperCase());
      if (params?.perPage) queryParams.set('per_page', String(params.perPage));
      if (params?.page) queryParams.set('page', String(params.page));
      const qs = queryParams.toString();
      const response = await apiClient.get<ApiResponse<BackendOrdersResponse>>(`/api/v1/admin/orders${qs ? '?' + qs : ''}`);
      const backendData = response.data.data;
      const orders = backendData.orders.map(mapBackendOrder);
      return {
        data: orders,
        meta: {
          currentPage: backendData.meta.current_page,
          lastPage: backendData.meta.last_page,
          perPage: params?.perPage || 20,
          total: backendData.meta.total,
        },
      };
    } catch {
      return { data: [], meta: { currentPage: 1, lastPage: 1, perPage: 20, total: 0 } };
    }
  },

  /** Get special requests from backend */
  getSpecialRequests: async (_params?: SpecialRequestParams): Promise<PaginatedResponse<SpecialRequest>> => {
    try {
      const params = new URLSearchParams();
      if (_params?.status) params.set('status', _params.status);
      if (_params?.page) params.set('page', String(_params.page));
      if (_params?.perPage) params.set('per_page', String(_params.perPage));
      const qs = params.toString();
      const response = await apiClient.get<ApiResponse<{ special_orders: BackendSpecialOrder[] }>>(`/api/v1/admin/special-orders${qs ? '?' + qs : ''}`);
      const backendData = response.data.data;
      // Map backend special orders to frontend format
      const items: SpecialRequest[] = (backendData.special_orders || []).map((so: BackendSpecialOrderForMapping) => ({
        id: so.id,
        orderNumber: so.reference_number || `SPO-${so.id}`,
        customerId: so.customer_id || 0,
        customerName: so.customer?.full_name || 'Unknown',
        customerPhone: so.customer?.phone || '',
        requestDetails: so.customer_notes || '',
        estimatedBudget: so.estimated_budget !== undefined ? Number(so.estimated_budget) : null,
        status: mapBackendSpecialOrderStatus(so.status),
        assignedTo: so.assigned_to_user?.full_name || (so.assigned_supplier?.business_name ?? null),
        priceQuote: null,
        notes: so.internal_notes || '',
        createdAt: so.created_at,
        updatedAt: so.updated_at || so.created_at,
      }));
      return {
        data: items,
        meta: { currentPage: 1, lastPage: 1, perPage: 20, total: items.length },
      };
    } catch {
      return { data: [], meta: { currentPage: 1, lastPage: 1, perPage: 20, total: 0 } };
    }
  },

  // ── Mutations ──

  /** Update order status (connects to real backend) */
  updateOrderStatus: async (orderId: number, newStatus: OrderStatus): Promise<OperationsOrder> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendOrder>>(`/api/v1/admin/orders/${orderId}/status`, { status: ORDER_STATUS_FRONTEND_TO_BACKEND[newStatus] ?? newStatus.toUpperCase() });
      return mapBackendOrder(response.data.data);
    } catch {
      throw new Error('Failed to update order status');
    }
  },

  /** Assign a special request for pricing — backend uses POST /special-orders/{id}/assign-staff */
  assignForPricing: async (requestId: number, assignedTo: string, staffUserId?: number): Promise<SpecialRequest> => {
    try {
      const response = await apiClient.post<ApiResponse<Record<string, unknown>>>(`/api/v1/admin/special-orders/${requestId}/assign-staff`, {
        staff_user_id: staffUserId || 1,
      });
      const data = unwrap(response.data);
      return {
        id: data.id,
        orderNumber: data.reference_number || `SPO-${data.id}`,
        customerId: data.customer_id || 0,
        customerName: data.customer?.full_name || 'Unknown',
        customerPhone: data.customer?.phone || '',
        requestDetails: data.customer_notes || '',
        estimatedBudget: data.estimated_budget !== undefined ? Number(data.estimated_budget) : null,
        status: mapBackendSpecialOrderStatus(data.status),
        assignedTo,
        priceQuote: null,
        notes: data.internal_notes || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at || data.created_at,
      };
    } catch {
      throw new Error('Failed to assign request for pricing');
    }
  },

  /** Approve a special order (mark as ready for fulfillment) */
  approveSpecialOrder: async (requestId: number): Promise<SpecialRequest> => {
    try {
      const response = await apiClient.post<ApiResponse<Record<string, unknown>>>(`/api/v1/admin/special-orders/${requestId}/approve`);
      const data = unwrap(response.data);
      return {
        id: data.id || requestId,
        orderNumber: data.reference_number || `SPO-${data.id || requestId}`,
        customerId: data.customer?.id || data.customer_id || 0,
        customerName: data.customer?.full_name || data.customer?.name || 'Unknown',
        customerPhone: data.customer?.phone || '',
        requestDetails: data.customer_notes || '',
        estimatedBudget: data.estimated_budget !== undefined ? Number(data.estimated_budget) : null,
        status: 'approved',
        assignedTo: data.assigned_to_user?.full_name || data.assigned_to || null,
        priceQuote: null,
        notes: data.internal_notes || '',
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || data.created_at || new Date().toISOString(),
      };
    } catch {
      throw new Error('Failed to approve special order');
    }
  },

  /** Reject a special order with reason */
  rejectSpecialOrder: async (requestId: number, reason?: string): Promise<SpecialRequest> => {
    try {
      const response = await apiClient.post<ApiResponse<Record<string, unknown>>>(`/api/v1/admin/special-orders/${requestId}/reject`, { reason: reason || '' });
      const data = unwrap(response.data);
      return {
        id: data.id || requestId,
        orderNumber: data.reference_number || `SPO-${data.id || requestId}`,
        customerId: data.customer?.id || data.customer_id || 0,
        customerName: data.customer?.full_name || data.customer?.name || 'Unknown',
        customerPhone: data.customer?.phone || '',
        requestDetails: data.customer_notes || '',
        estimatedBudget: data.estimated_budget !== undefined ? Number(data.estimated_budget) : null,
        status: 'rejected',
        assignedTo: data.assigned_to_user?.full_name || data.assigned_to || null,
        priceQuote: null,
        notes: data.internal_notes || '',
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || data.created_at || new Date().toISOString(),
      };
    } catch {
      throw new Error('Failed to reject special order');
    }
  },

  /** Convert a special order to a regular order */
  convertToOrder: async (requestId: number): Promise<SpecialRequest> => {
    try {
      const response = await apiClient.post<ApiResponse<Record<string, unknown>>>(`/api/v1/admin/special-orders/${requestId}/convert-to-order`);
      const data = unwrap(response.data);
      return {
        id: data.id || requestId,
        orderNumber: data.reference_number || `SPO-${data.id || requestId}`,
        customerId: data.customer?.id || data.customer_id || 0,
        customerName: data.customer?.full_name || data.customer?.name || 'Unknown',
        customerPhone: data.customer?.phone || '',
        requestDetails: data.customer_notes || '',
        estimatedBudget: data.estimated_budget !== undefined ? Number(data.estimated_budget) : null,
        status: 'approved',
        assignedTo: data.assigned_to_user?.full_name || data.assigned_to || null,
        priceQuote: null,
        notes: data.internal_notes || '',
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || data.created_at || new Date().toISOString(),
      };
    } catch {
      throw new Error('Failed to convert special order');
    }
  },

  /** Submit a price quote — backend uses PUT /special-orders/{id}/notes to store pricing */
  submitPriceQuote: async (requestId: number, price: number, notes: string): Promise<SpecialRequest> => {
    try {
      const pricingNotes = `Price Quote: ${formatPrice(price)}. ${notes ? notes : ''}`;
      const response = await apiClient.put<ApiResponse<Record<string, unknown>>>(`/api/v1/admin/special-orders/${requestId}/notes`, {
        notes: pricingNotes,
      });
      const data = unwrap(response.data);
      // Backend may return just updated fields or full object — handle both
      return {
        id: data.id || requestId,
        orderNumber: data.reference_number || `SPO-${data.id || requestId}`,
        customerId: data.customer?.id || data.customer_id || 0,
        customerName: data.customer?.full_name || data.customer?.name || 'Unknown',
        customerPhone: data.customer?.phone || '',
        requestDetails: data.customer_notes || '',
        estimatedBudget: data.estimated_budget !== undefined ? Number(data.estimated_budget) : null,
        status: 'pending_customer_approval',
        assignedTo: data.assigned_to_user?.full_name || data.assigned_to || null,
        priceQuote: price,
        notes: pricingNotes,
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || data.created_at || new Date().toISOString(),
      };
    } catch {
      throw new Error('Failed to submit price quote');
    }
  },

  /** Fetch support tickets (complaints) from backend */
  getSupportTickets: async (params?: { complaintId?: number; status?: string }): Promise<PaginatedResponse<Complaint>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.set('status', params.status);
      const qs = queryParams.toString();
      const response = await apiClient.get<ApiResponse<{ tickets: BackendTicket[] }>>(`/api/v1/admin/support-tickets${qs ? '?' + qs : ''}`);
      const tickets = response.data.data.tickets || [];
      const items: Complaint[] = tickets.map((t: BackendTicket) => ({
        id: t.id,
        ticketNumber: t.ticket_number || `TKT-${t.id}`,
        customerId: t.customer_id || 0,
        customerName: t.customer?.full_name || 'Unknown',
        subject: t.subject || '',
        description: t.description || '',
        status: t.status || 'open',
        priority: t.priority || 'medium',
        assignedTo: t.assigned_to?.full_name || null,
        relatedOrderNumber: t.order_number || null,
        createdAt: t.created_at,
        updatedAt: t.updated_at || t.created_at,
      }));
      return {
        data: items,
        meta: { currentPage: 1, lastPage: 1, perPage: 20, total: items.length },
      };
    } catch {
      return { data: [], meta: { currentPage: 1, lastPage: 1, perPage: 20, total: 0 } };
    }
  },

  /** Assign a complaint — backend uses POST /support-tickets/{id}/assign */
  assignComplaint: async (complaintId: number, assignedTo: string): Promise<Complaint> => {
    try {
      const response = await apiClient.post<ApiResponse<Record<string, unknown>>>(`/api/v1/admin/support-tickets/${complaintId}/assign`, { staff_id: 1 });
      const ticket = response.data.data;
      return {
        id: ticket.id,
        ticketNumber: ticket.ticket_number || `TKT-${ticket.id}`,
        customerId: ticket.customer_id || 0,
        customerName: ticket.customer?.full_name || 'Unknown',
        subject: ticket.subject || '',
        description: ticket.description || '',
        status: 'in_progress',
        priority: ticket.priority || 'medium',
        assignedTo,
        relatedOrderNumber: null,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at || ticket.created_at,
      };
    } catch {
      throw new Error('Failed to assign complaint');
    }
  },

  /** Resolve a complaint — backend uses PUT /support-tickets/{id}/status with status=resolved */
  resolveComplaint: async (complaintId: number): Promise<Complaint> => {
    try {
      const response = await apiClient.put<ApiResponse<Record<string, unknown>>>(`/api/v1/admin/support-tickets/${complaintId}/status`, { status: 'resolved' });
      const ticket = response.data.data;
      return {
        id: ticket.id,
        ticketNumber: ticket.ticket_number || `TKT-${ticket.id}`,
        customerId: ticket.customer_id || 0,
        customerName: ticket.customer?.full_name || 'Unknown',
        subject: ticket.subject || '',
        description: ticket.description || '',
        status: 'resolved',
        priority: ticket.priority || 'medium',
        assignedTo: null,
        relatedOrderNumber: null,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at || ticket.created_at,
      };
    } catch {
      throw new Error('Failed to resolve complaint');
    }
  },
};

export type OperationsApi = typeof operationsApi;
