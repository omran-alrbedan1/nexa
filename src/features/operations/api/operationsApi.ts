// ============================================================
// Operations API Service
// ============================================================
// Backend: GET /api/v1/admin/orders (OrderController@index)
//         GET /api/v1/admin/orders/{id} (OrderController@show)
//         PUT /api/v1/admin/orders/{id}/status (OrderController@updateStatus)
//
// Predicted (not yet built in backend):
//         GET /api/v1/admin/special-requests
//         GET /api/v1/admin/complaints
//         GET /api/v1/admin/customers
// ============================================================

import { apiClient } from '@/lib/axios';
import { unwrap } from '@/lib/apiHelpers';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import type { OrderType, OrderStatus, PaymentMethod, PaymentStatus } from '@/types/marketplace';

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
// Dummy Data
// ──────────────────────────────────────────────

const now = new Date();
const today = now.toISOString().split('T')[0];

const DUMMY_ORDERS: OperationsOrder[] = [
  { id: 1, orderNumber: 'ORD-2025-101', customerId: 101, customerName: 'Ahmed Ali', customerPhone: '+966501234101', type: 'regular', status: 'new', paymentStatus: 'pending', paymentMethod: 'cash_on_delivery', items: 'Fresh Milk 2L×2, Brown Eggs 12pk, Labneh 500g', itemCount: 3, total: 89.50, regionName: 'Riyadh North', supplierName: 'Dairy Best Ltd.', notes: null, scheduledDate: `${today}T10:00:00Z`, createdAt: `${today}T08:15:00Z`, updatedAt: `${today}T08:15:00Z` },
  { id: 2, orderNumber: 'ORD-2025-102', customerId: 102, customerName: 'Sara Khalid', customerPhone: '+966501234102', type: 'special', status: 'pending_pricing', paymentStatus: 'pending', paymentMethod: 'cash_on_delivery', items: 'Organic honey 5kg, Premium dates box', itemCount: 2, total: 0, regionName: 'Riyadh South', supplierName: null, notes: 'Requested gift wrapping', scheduledDate: '', createdAt: `${today}T07:30:00Z`, updatedAt: `${today}T07:30:00Z` },
  { id: 3, orderNumber: 'ORD-2025-103', customerId: 103, customerName: 'Mohamed Noor', customerPhone: '+966501234103', type: 'regular', status: 'confirmed', paymentStatus: 'paid', paymentMethod: 'card_online', items: 'Chicken Breast 2kg, Beef Cubes 1kg', itemCount: 2, total: 145.00, regionName: 'Jeddah Central', supplierName: 'Premium Meats', notes: 'Cut into small pieces', scheduledDate: `${today}T14:00:00Z`, createdAt: `${today}T06:45:00Z`, updatedAt: `${today}T07:00:00Z` },
  { id: 4, orderNumber: 'ORD-2025-104', customerId: 104, customerName: 'Nora Hassan', customerPhone: '+966501234104', type: 'seasonal', status: 'pending_supply', paymentStatus: 'paid', paymentMethod: 'card_online', items: 'Seasonal fruit basket (large)', itemCount: 1, total: 320.00, regionName: 'Riyadh North', supplierName: 'Fresh Farm Co.', notes: 'Deliver before noon', scheduledDate: `${today}T09:00:00Z`, createdAt: `${today}Y06:00:00Z`, updatedAt: `${today}T06:30:00Z` },
  { id: 5, orderNumber: 'ORD-2025-105', customerId: 105, customerName: 'Faisal Omar', customerPhone: '+966501234105', type: 'regular', status: 'delivered', paymentStatus: 'paid', paymentMethod: 'cash_on_delivery', items: 'Whole Wheat Bread 5 loaves, Organic Eggs 2×12pk', itemCount: 2, total: 78.00, regionName: 'Dammam East', supplierName: 'Golden Grains', notes: null, scheduledDate: `${today}T08:00:00Z`, createdAt: `${today}Y05:30:00Z`, updatedAt: `${today}T08:45:00Z` },
  { id: 6, orderNumber: 'ORD-2025-106', customerId: 106, customerName: 'Layla Ibrahim', customerPhone: '+966501234106', type: 'special', status: 'pending_management', paymentStatus: 'pending', paymentMethod: 'cash_on_delivery', items: 'Imported cheese selection (3 types)', itemCount: 1, total: 0, regionName: 'Jeddah Central', supplierName: null, notes: 'Preferably French cheeses', scheduledDate: '', createdAt: `${today}T09:00:00Z`, updatedAt: `${today}T09:00:00Z` },
  { id: 7, orderNumber: 'ORD-2025-107', customerId: 107, customerName: 'Khalid Salem', customerPhone: '+966501234107', type: 'regular', status: 'new', paymentStatus: 'pending', paymentMethod: 'cash_on_delivery', items: 'Fresh seafood platter for 10', itemCount: 1, total: 450.00, regionName: 'Mecca North', supplierName: 'Premium Meats', notes: 'Call before delivery', scheduledDate: `${today}T16:00:00Z`, createdAt: `${today}T09:30:00Z`, updatedAt: `${today}T09:30:00Z` },
  { id: 8, orderNumber: 'ORD-2025-108', customerId: 108, customerName: 'Majid Sultan', customerPhone: '+966501234108', type: 'regular', status: 'failed_delivery', paymentStatus: 'pending', paymentMethod: 'cash_on_delivery', items: 'Organic vegetables box, Fresh herbs bundle', itemCount: 2, total: 95.00, regionName: 'Riyadh South', supplierName: 'Fresh Farm Co.', notes: 'Customer not home, reschedule requested', scheduledDate: `${today}T11:00:00Z`, createdAt: `${today}Y04:00:00Z`, updatedAt: `${today}T11:30:00Z` },
];

const DUMMY_SPECIAL_REQUESTS: SpecialRequest[] = [
  { id: 1, orderNumber: 'ORD-2025-102', customerId: 102, customerName: 'Sara Khalid', customerPhone: '+966501234102', requestDetails: 'Looking for organic honey 5kg + premium dates gift box. Need it for a corporate client gift.', estimatedBudget: 500, status: 'pending_pricing', assignedTo: null, priceQuote: null, notes: '', createdAt: `${today}T07:30:00Z`, updatedAt: `${today}T07:30:00Z` },
  { id: 2, orderNumber: 'ORD-2025-106', customerId: 106, customerName: 'Layla Ibrahim', customerPhone: '+966501234106', requestDetails: 'Need imported cheese selection — Brie, Camembert, and aged Gouda. Approximately 500g each.', estimatedBudget: 350, status: 'pending_management', assignedTo: null, priceQuote: null, notes: 'Customer prefers French cheeses', createdAt: `${today}T09:00:00Z`, updatedAt: `${today}T09:00:00Z` },
  { id: 3, orderNumber: 'ORD-2025-109', customerId: 109, customerName: 'Amal Hassan', customerPhone: '+966501234109', requestDetails: 'Looking for gluten-free baking mix, almond flour 2kg, and organic coconut oil.', estimatedBudget: 250, status: 'pending_customer_approval', assignedTo: 'Operations Staff', priceQuote: 275.00, notes: 'Quote sent. Waiting for customer response.', createdAt: `${today}Y06:00:00Z`, updatedAt: `${today}T08:00:00Z` },
  { id: 4, orderNumber: 'ORD-2025-110', customerId: 110, customerName: 'Omar Farooq', customerPhone: '+966501234110', requestDetails: 'Need a large quantity of fresh strawberries (20 punnets) for a catering event this weekend.', estimatedBudget: 600, status: 'pending_pricing', assignedTo: null, priceQuote: null, notes: 'Urgent — event is Saturday', createdAt: `${today}T08:30:00Z`, updatedAt: `${today}T08:30:00Z` },
];

const DUMMY_COMPLAINTS: Complaint[] = [
  { id: 1, ticketNumber: 'TKT-2025-001', customerId: 108, customerName: 'Majid Sultan', subject: 'Delivery not received', description: 'Order ORD-2025-108 was marked as failed delivery. Customer claims they were home.', status: 'open', priority: 'high', assignedTo: null, relatedOrderNumber: 'ORD-2025-108', createdAt: `${today}T11:45:00Z`, updatedAt: `${today}T11:45:00Z` },
  { id: 2, ticketNumber: 'TKT-2025-002', customerId: 111, customerName: 'Huda Ahmed', subject: 'Wrong item received', description: 'Received chicken instead of beef in my order. Need replacement.', status: 'in_progress', priority: 'medium', assignedTo: 'Operations Staff', relatedOrderNumber: 'ORD-2025-111', createdAt: `${today}Y01:00:00Z`, updatedAt: `${today}T08:00:00Z` },
  { id: 3, ticketNumber: 'TKT-2025-003', customerId: 112, customerName: 'Sami Walid', subject: 'Delivery delay', description: 'Order was supposed to arrive yesterday. Still not received.', status: 'open', priority: 'urgent', assignedTo: null, relatedOrderNumber: 'ORD-2025-112', createdAt: `${today}T06:00:00Z`, updatedAt: `${today}T06:00:00Z` },
];

const DUMMY_STATS: OperationsStats = {
  newOrdersToday: 3,
  pendingSpecials: 4,
  pendingPricing: 2,
  pendingCustomerApproval: 1,
  activeComplaints: 3,
  ordersInProgress: 12,
  deliveredToday: 47,
  failedDeliveries: 2,
};

function getDummyPageData(): OperationsPageData {
  return { stats: DUMMY_STATS, recentOrders: DUMMY_ORDERS, specialRequests: DUMMY_SPECIAL_REQUESTS, complaints: DUMMY_COMPLAINTS };
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
        // These still use dummy data — no backend routes exist yet
        specialRequests: DUMMY_SPECIAL_REQUESTS,
        complaints: DUMMY_COMPLAINTS,
      };
    } catch {
      return getDummyPageData();
    }
  },

  /** Fetch orders with optional filters */
  getOrders: async (params?: OrderListParams): Promise<PaginatedResponse<OperationsOrder>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.set('status', params.status);
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
      let filtered = [...DUMMY_ORDERS];
      if (params?.status) filtered = filtered.filter((o) => o.status === params.status);
      if (params?.type) filtered = filtered.filter((o) => o.type === params.type);
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter((o) => o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q));
      }
      return { data: filtered, meta: { currentPage: 1, lastPage: 1, perPage: 20, total: filtered.length } };
    }
  },

  /** Get special requests — no backend route yet, dummy fallback */
  getSpecialRequests: async (_params?: SpecialRequestParams): Promise<PaginatedResponse<SpecialRequest>> => {
    await new Promise((r) => setTimeout(r, 300));
    let filtered = [...DUMMY_SPECIAL_REQUESTS];
    if (_params?.status) filtered = filtered.filter((r) => r.status === _params.status);
    return { data: filtered, meta: { currentPage: 1, lastPage: 1, perPage: 20, total: filtered.length } };
  },

  // ── Mutations ──

  /** Update order status (connects to real backend) */
  updateOrderStatus: async (orderId: number, newStatus: OrderStatus): Promise<OperationsOrder> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendOrder>>(`/api/v1/admin/orders/${orderId}/status`, { status: newStatus.toUpperCase() });
      return mapBackendOrder(response.data.data);
    } catch {
      const order = DUMMY_ORDERS.find((o) => o.id === orderId);
      if (!order) throw new Error('Order not found');
      return { ...order, status: newStatus, updatedAt: new Date().toISOString() };
    }
  },

  /** Assign a special request for pricing — no backend route yet, dummy */
  assignForPricing: async (requestId: number, assignedTo: string): Promise<SpecialRequest> => {
    await new Promise((r) => setTimeout(r, 400));
    const request = DUMMY_SPECIAL_REQUESTS.find((r) => r.id === requestId);
    if (!request) throw new Error('Request not found');
    return { ...request, status: 'pending_pricing', assignedTo, updatedAt: new Date().toISOString() };
  },

  /** Submit a price quote — no backend route yet, dummy */
  submitPriceQuote: async (requestId: number, price: number, notes: string): Promise<SpecialRequest> => {
    await new Promise((r) => setTimeout(r, 500));
    const request = DUMMY_SPECIAL_REQUESTS.find((r) => r.id === requestId);
    if (!request) throw new Error('Request not found');
    return { ...request, status: 'pending_customer_approval', priceQuote: price, notes: notes || request.notes, updatedAt: new Date().toISOString() };
  },

  /** Assign a complaint — no backend route yet, dummy */
  assignComplaint: async (complaintId: number, assignedTo: string): Promise<Complaint> => {
    await new Promise((r) => setTimeout(r, 400));
    const complaint = DUMMY_COMPLAINTS.find((c) => c.id === complaintId);
    if (!complaint) throw new Error('Complaint not found');
    return { ...complaint, status: 'in_progress', assignedTo, updatedAt: new Date().toISOString() };
  },

  /** Resolve a complaint — no backend route yet, dummy */
  resolveComplaint: async (complaintId: number): Promise<Complaint> => {
    await new Promise((r) => setTimeout(r, 500));
    const complaint = DUMMY_COMPLAINTS.find((c) => c.id === complaintId);
    if (!complaint) throw new Error('Complaint not found');
    return { ...complaint, status: 'resolved', updatedAt: new Date().toISOString() };
  },
};

export type OperationsApi = typeof operationsApi;
