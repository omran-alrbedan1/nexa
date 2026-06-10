// ============================================================
// Operations API Service
// ============================================================
// PDF Reference: §9.3 (موظف العمليات / Operations Employee)
// Responsibilities: order review, status updates, special requests,
// pricing, customer communication, complaint management
// ============================================================

import type { PaginatedResponse } from '@/types/common';
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

// ──────────────────────────────────────────────
// Simulated async delay
// ──────────────────────────────────────────────

function delay(ms = 350): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────
// API Methods
// ──────────────────────────────────────────────

export const operationsApi = {
  /** Fetch all operations page data */
  getPageData: async (): Promise<OperationsPageData> => {
    await delay();
    return {
      stats: DUMMY_STATS,
      recentOrders: DUMMY_ORDERS,
      specialRequests: DUMMY_SPECIAL_REQUESTS,
      complaints: DUMMY_COMPLAINTS,
    };
  },

  /** Fetch orders with optional filters */
  getOrders: async (_params?: OrderListParams): Promise<PaginatedResponse<OperationsOrder>> => {
    await delay();
    let filtered = [...DUMMY_ORDERS];
    if (_params?.status) filtered = filtered.filter((o) => o.status === _params.status);
    if (_params?.type) filtered = filtered.filter((o) => o.type === _params.type);
    if (_params?.search) {
      const q = _params.search.toLowerCase();
      filtered = filtered.filter(
        (o) => o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)
      );
    }
    return {
      data: filtered,
      meta: { currentPage: 1, lastPage: 1, perPage: 20, total: filtered.length },
    };
  },

  /** Get special requests */
  getSpecialRequests: async (_params?: SpecialRequestParams): Promise<PaginatedResponse<SpecialRequest>> => {
    await delay(300);
    let filtered = [...DUMMY_SPECIAL_REQUESTS];
    if (_params?.status) filtered = filtered.filter((r) => r.status === _params.status);
    return {
      data: filtered,
      meta: { currentPage: 1, lastPage: 1, perPage: 20, total: filtered.length },
    };
  },

  // ── Mutations ──

  /** Update order status (e.g., confirm, cancel, reschedule) */
  updateOrderStatus: async (orderId: number, newStatus: OrderStatus): Promise<OperationsOrder> => {
    await delay(500);
    const order = DUMMY_ORDERS.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    const statusMessages: Record<string, string> = {
      confirmed: 'Order confirmed',
      cancelled: 'Order cancelled',
      postponed: 'Order postponed',
    };
    return { ...order, status: newStatus, updatedAt: new Date().toISOString(), notes: statusMessages[newStatus] || null };
  },

  /** Assign a special request to current user for pricing */
  assignForPricing: async (requestId: number, assignedTo: string): Promise<SpecialRequest> => {
    await delay(400);
    const request = DUMMY_SPECIAL_REQUESTS.find((r) => r.id === requestId);
    if (!request) throw new Error('Request not found');
    return { ...request, status: 'pending_pricing', assignedTo, updatedAt: new Date().toISOString() };
  },

  /** Submit a price quote for a special request */
  submitPriceQuote: async (requestId: number, price: number, notes: string): Promise<SpecialRequest> => {
    await delay(500);
    const request = DUMMY_SPECIAL_REQUESTS.find((r) => r.id === requestId);
    if (!request) throw new Error('Request not found');
    return {
      ...request,
      status: 'pending_customer_approval',
      priceQuote: price,
      notes: notes || request.notes,
      updatedAt: new Date().toISOString(),
    };
  },

  /** Assign a complaint to self */
  assignComplaint: async (complaintId: number, assignedTo: string): Promise<Complaint> => {
    await delay(400);
    const complaint = DUMMY_COMPLAINTS.find((c) => c.id === complaintId);
    if (!complaint) throw new Error('Complaint not found');
    return { ...complaint, status: 'in_progress', assignedTo, updatedAt: new Date().toISOString() };
  },

  /** Resolve a complaint */
  resolveComplaint: async (complaintId: number): Promise<Complaint> => {
    await delay(500);
    const complaint = DUMMY_COMPLAINTS.find((c) => c.id === complaintId);
    if (!complaint) throw new Error('Complaint not found');
    return { ...complaint, status: 'resolved', updatedAt: new Date().toISOString() };
  },
};

export type OperationsApi = typeof operationsApi;
