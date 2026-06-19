// ============================================================
// Orders API Service
// ============================================================
// Backend:
//   GET /api/v1/admin/orders          (OrderController@index)
//   GET /api/v1/admin/orders/{id}     (OrderController@show)
//   PUT /api/v1/admin/orders/{id}/status (OrderController@updateStatus)
//   POST /api/v1/admin/orders/{id}/confirm-warehouse-receipt
// ============================================================

import { apiClient } from '@/lib/axios';
import { unwrap } from '@/lib/apiHelpers';
import type { PaginatedResponse, ApiResponse } from '@/types/common';
import type { OrderType, OrderStatus, PaymentMethod, PaymentStatus } from '@/types/marketplace';

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface StatusLog {
  fromStatus: string | null;
  toStatus: string;
  timestamp: string;
  actor: string;
}

export interface OrderPayment {
  amount: number;
  status: string;
  method: string;
}

export interface OrderDetail {
  id: number;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  total: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  supplierId: number | null;
  supplierName: string | null;
  warehouseName: string | null;
  deliveryAddress: string;
  deliveryZone: string;
  customerNotes: string | null;
  internalNotes: string | null;
  scheduledDate: string | null;
  items: OrderItem[];
  timeline: StatusLog[];
  payments: OrderPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  type: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  itemCount: number;
  total: number;
  regionName: string;
  supplierName: string | null;
  scheduledDate: string | null;
  createdAt: string;
}

export interface OrdersStats {
  total: number;
  new: number;
  confirmed: number;
  inProgress: number;
  delivered: number;
  failed: number;
}

export interface OrdersPageData {
  stats: OrdersStats;
  orders: OrderSummary[];
  pagination?: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

// ── Query params ──

export interface OrderListParams {
  status?: OrderStatus;
  type?: OrderType;
  search?: string;
  page?: number;
  perPage?: number;
}

// ── Backend Raw Types ──

interface BackendCustomer {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

interface BackendSupplier {
  id: number;
  business_name: string;
}

interface BackendWarehouse {
  id: number;
  name: string;
}

interface BackendItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

interface BackendStatusLog {
  from_status?: string | null;
  to_status: string;
  timestamp: string;
  actor: string;
}

interface BackendPayment {
  amount: string;
  status: string;
  method: string;
}

interface BackendDeliveryAddress {
  label: string;
  zone_name: string;
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
  tax_amount?: string;
  created_at: string;
  updated_at?: string;
  delivery_scheduled_at: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  customer: BackendCustomer | null;
  supplier: BackendSupplier | null;
  warehouse: BackendWarehouse | null;
  delivery_address: BackendDeliveryAddress | null;
  items?: BackendItem[];
  status_logs?: BackendStatusLog[];
  payments?: BackendPayment[];
}

interface BackendOrdersResponse {
  orders: BackendOrder[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

// ── Mapping Functions ──

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

function mapBackendPaymentMethod(method: string): PaymentMethod {
  if (method.includes('نقد') || method.toLowerCase().includes('cash') || method.toLowerCase().includes('cod')) return 'cash_on_delivery';
  if (method.toLowerCase().includes('card') || method.toLowerCase().includes('online')) return 'card_online';
  if (method.toLowerCase().includes('bank') || method.toLowerCase().includes('تحويل')) return 'bank_transfer';
  return 'cash_on_delivery';
}

function mapBackendOrderToSummary(bo: BackendOrder): OrderSummary {
  return {
    id: bo.id,
    orderNumber: bo.order_number,
    customerId: bo.customer?.id || 0,
    customerName: bo.customer?.name || 'Unknown',
    customerPhone: bo.customer?.phone || '',
    type: mapBackendOrderType(bo.order_type),
    status: mapBackendOrderStatus(bo.status),
    paymentStatus: mapBackendPaymentStatus(bo.payment_status),
    itemCount: bo.items?.length || 0,
    total: parseFloat(bo.total) || 0,
    regionName: bo.warehouse?.name || bo.delivery_address?.zone_name || '',
    supplierName: bo.supplier?.business_name || null,
    scheduledDate: bo.delivery_scheduled_at,
    createdAt: bo.created_at,
  };
}

function mapBackendOrderToDetail(bo: BackendOrder): OrderDetail {
  return {
    id: bo.id,
    orderNumber: bo.order_number,
    orderType: mapBackendOrderType(bo.order_type),
    status: mapBackendOrderStatus(bo.status),
    paymentStatus: mapBackendPaymentStatus(bo.payment_status),
    paymentMethod: mapBackendPaymentMethod(bo.payments?.[0]?.method || ''),
    subtotal: parseFloat(bo.subtotal || '0') || 0,
    deliveryFee: parseFloat(bo.delivery_fee || '0') || 0,
    taxAmount: parseFloat(bo.tax_amount || '0') || 0,
    total: parseFloat(bo.total) || 0,
    customerId: bo.customer?.id || 0,
    customerName: bo.customer?.name || 'Unknown',
    customerPhone: bo.customer?.phone || '',
    customerEmail: bo.customer?.email || null,
    supplierId: bo.supplier?.id || null,
    supplierName: bo.supplier?.business_name || null,
    warehouseName: bo.warehouse?.name || null,
    deliveryAddress: bo.delivery_address?.label || '',
    deliveryZone: bo.delivery_address?.zone_name || '',
    customerNotes: bo.customer_notes,
    internalNotes: bo.internal_notes,
    scheduledDate: bo.delivery_scheduled_at,
    items: (bo.items || []).map((i) => ({
      id: i.id,
      productName: i.product_name,
      quantity: i.quantity,
      unitPrice: parseFloat(i.unit_price) || 0,
      totalPrice: parseFloat(i.total_price) || 0,
    })),
    timeline: (bo.status_logs || []).map((l) => ({
      fromStatus: l.from_status || null,
      toStatus: l.to_status,
      timestamp: l.timestamp,
      actor: l.actor,
    })),
    payments: (bo.payments || []).map((p) => ({
      amount: parseFloat(p.amount) || 0,
      status: p.status,
      method: p.method,
    })),
    createdAt: bo.created_at,
    updatedAt: bo.updated_at || bo.created_at,
  };
}

// ── Dummy Data ──

const now = new Date();
const today = now.toISOString().split('T')[0];
const makeDate = (hours: number, mins: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, mins).toISOString();

const DUMMY_ORDER_SUMMARIES: OrderSummary[] = [
  { id: 1, orderNumber: 'ORD-2025-101', customerId: 101, customerName: 'Ahmed Ali', customerPhone: '+966501234101', type: 'regular', status: 'new', paymentStatus: 'pending', itemCount: 3, total: 89.50, regionName: 'Riyadh North', supplierName: 'Dairy Best Ltd.', scheduledDate: `${today}T10:00:00Z`, createdAt: makeDate(8, 15) },
  { id: 2, orderNumber: 'ORD-2025-102', customerId: 102, customerName: 'Sara Khalid', customerPhone: '+966501234102', type: 'special', status: 'pending_pricing', paymentStatus: 'pending', itemCount: 2, total: 0, regionName: 'Riyadh South', supplierName: null, scheduledDate: null, createdAt: makeDate(7, 30) },
  { id: 3, orderNumber: 'ORD-2025-103', customerId: 103, customerName: 'Mohamed Noor', customerPhone: '+966501234103', type: 'regular', status: 'confirmed', paymentStatus: 'paid', itemCount: 2, total: 145.00, regionName: 'Jeddah Central', supplierName: 'Premium Meats', scheduledDate: `${today}T14:00:00Z`, createdAt: makeDate(6, 45) },
  { id: 4, orderNumber: 'ORD-2025-104', customerId: 104, customerName: 'Nora Hassan', customerPhone: '+966501234104', type: 'seasonal', status: 'pending_supply', paymentStatus: 'paid', itemCount: 1, total: 320.00, regionName: 'Riyadh North', supplierName: 'Fresh Farm Co.', scheduledDate: `${today}T09:00:00Z`, createdAt: makeDate(6, 0) },
  { id: 5, orderNumber: 'ORD-2025-105', customerId: 105, customerName: 'Faisal Omar', customerPhone: '+966501234105', type: 'regular', status: 'delivered', paymentStatus: 'paid', itemCount: 2, total: 78.00, regionName: 'Dammam East', supplierName: 'Golden Grains', scheduledDate: `${today}T08:00:00Z`, createdAt: makeDate(5, 30) },
  { id: 6, orderNumber: 'ORD-2025-106', customerId: 106, customerName: 'Layla Ibrahim', customerPhone: '+966501234106', type: 'special', status: 'pending_management', paymentStatus: 'pending', itemCount: 1, total: 0, regionName: 'Jeddah Central', supplierName: null, scheduledDate: null, createdAt: makeDate(9, 0) },
  { id: 7, orderNumber: 'ORD-2025-107', customerId: 107, customerName: 'Khalid Salem', customerPhone: '+966501234107', type: 'regular', status: 'new', paymentStatus: 'pending', itemCount: 1, total: 450.00, regionName: 'Mecca North', supplierName: 'Premium Meats', scheduledDate: `${today}T16:00:00Z`, createdAt: makeDate(9, 30) },
  { id: 8, orderNumber: 'ORD-2025-108', customerId: 108, customerName: 'Majid Sultan', customerPhone: '+966501234108', type: 'regular', status: 'failed_delivery', paymentStatus: 'pending', itemCount: 2, total: 95.00, regionName: 'Riyadh South', supplierName: 'Fresh Farm Co.', scheduledDate: `${today}T11:00:00Z`, createdAt: makeDate(4, 0) },
];

const DUMMY_ORDER_DETAILS: Record<number, OrderDetail> = {
  1: {
    id: 1, orderNumber: 'ORD-2025-101', orderType: 'regular', status: 'new', paymentStatus: 'pending', paymentMethod: 'cash_on_delivery',
    subtotal: 72.00, deliveryFee: 17.50, taxAmount: 0, total: 89.50,
    customerId: 101, customerName: 'Ahmed Ali', customerPhone: '+966501234101', customerEmail: 'ahmed@example.com',
    supplierId: 1, supplierName: 'Dairy Best Ltd.', warehouseName: 'Riyadh Main Warehouse',
    deliveryAddress: 'Home', deliveryZone: 'Riyadh North',
    customerNotes: 'Please deliver in the morning', internalNotes: null,
    scheduledDate: `${today}T10:00:00Z`,
    items: [
      { id: 1, productName: 'Fresh Milk 2L', quantity: 2, unitPrice: 12.00, totalPrice: 24.00 },
      { id: 2, productName: 'Brown Eggs 12pk', quantity: 1, unitPrice: 18.00, totalPrice: 18.00 },
      { id: 3, productName: 'Labneh 500g', quantity: 3, unitPrice: 10.00, totalPrice: 30.00 },
    ],
    timeline: [
      { fromStatus: null, toStatus: 'NEW', timestamp: makeDate(8, 15), actor: 'Ahmed Ali' },
    ],
    payments: [{ amount: 89.50, status: 'pending', method: 'Cash on Delivery' }],
    createdAt: makeDate(8, 15), updatedAt: makeDate(8, 15),
  },
  2: {
    id: 2, orderNumber: 'ORD-2025-102', orderType: 'special', status: 'pending_pricing', paymentStatus: 'pending', paymentMethod: 'cash_on_delivery',
    subtotal: 0, deliveryFee: 0, taxAmount: 0, total: 0,
    customerId: 102, customerName: 'Sara Khalid', customerPhone: '+966501234102', customerEmail: 'sara@example.com',
    supplierId: null, supplierName: null, warehouseName: null,
    deliveryAddress: 'Work', deliveryZone: 'Riyadh South',
    customerNotes: 'Gift wrapping requested', internalNotes: 'Waiting for supplier quote',
    scheduledDate: null,
    items: [
      { id: 1, productName: 'Organic Honey 5kg', quantity: 1, unitPrice: 0, totalPrice: 0 },
      { id: 2, productName: 'Premium Dates Box', quantity: 1, unitPrice: 0, totalPrice: 0 },
    ],
    timeline: [
      { fromStatus: null, toStatus: 'PENDING_ADMIN', timestamp: makeDate(7, 30), actor: 'Sara Khalid' },
      { fromStatus: 'PENDING_ADMIN', toStatus: 'PENDING_PRICING', timestamp: makeDate(8, 0), actor: 'Staff' },
    ],
    payments: [],
    createdAt: makeDate(7, 30), updatedAt: makeDate(8, 0),
  },
  3: {
    id: 3, orderNumber: 'ORD-2025-103', orderType: 'regular', status: 'confirmed', paymentStatus: 'paid', paymentMethod: 'card_online',
    subtotal: 120.00, deliveryFee: 25.00, taxAmount: 0, total: 145.00,
    customerId: 103, customerName: 'Mohamed Noor', customerPhone: '+966501234103', customerEmail: 'mohamed@example.com',
    supplierId: 2, supplierName: 'Premium Meats', warehouseName: 'Jeddah Central Warehouse',
    deliveryAddress: 'Home', deliveryZone: 'Jeddah Central',
    customerNotes: 'Cut into small pieces', internalNotes: null,
    scheduledDate: `${today}T14:00:00Z`,
    items: [
      { id: 1, productName: 'Chicken Breast 2kg', quantity: 1, unitPrice: 65.00, totalPrice: 65.00 },
      { id: 2, productName: 'Beef Cubes 1kg', quantity: 1, unitPrice: 55.00, totalPrice: 55.00 },
    ],
    timeline: [
      { fromStatus: null, toStatus: 'NEW', timestamp: makeDate(6, 45), actor: 'Mohamed Noor' },
      { fromStatus: 'NEW', toStatus: 'CONFIRMED', timestamp: makeDate(7, 0), actor: 'System' },
      { fromStatus: 'CONFIRMED', toStatus: 'PAID', timestamp: makeDate(7, 5), actor: 'System' },
    ],
    payments: [{ amount: 145.00, status: 'paid', method: 'Card Online' }],
    createdAt: makeDate(6, 45), updatedAt: makeDate(7, 5),
  },
};

const DUMMY_STATS: OrdersStats = {
  total: 8, new: 2, confirmed: 1, inProgress: 3, delivered: 1, failed: 1,
};

// ──────────────────────────────────────────────
// API Methods
// ──────────────────────────────────────────────

export const ordersApi = {
  /** Fetch paginated orders list */
  getOrders: async (params?: OrderListParams): Promise<OrdersPageData> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.set('status', params.status.toUpperCase());
      if (params?.type) queryParams.set('order_type', params.type.toUpperCase());
      if (params?.search) queryParams.set('search', params.search);
      if (params?.perPage) queryParams.set('per_page', String(params.perPage));
      if (params?.page) queryParams.set('page', String(params.page));
      const qs = queryParams.toString();
      const response = await apiClient.get<ApiResponse<BackendOrdersResponse>>(`/api/v1/admin/orders${qs ? '?' + qs : ''}`);
      const backendData = unwrap(response.data);
      const orders = backendData.orders.map(mapBackendOrderToSummary);
      const inProgress = orders.filter((o) => !['delivered', 'cancelled', 'failed_delivery'].includes(o.status));
      return {
        stats: {
          total: backendData.meta.total,
          new: orders.filter((o) => o.status === 'new' || o.status === 'pending_management').length,
          confirmed: orders.filter((o) => o.status === 'confirmed').length,
          inProgress: inProgress.length,
          delivered: orders.filter((o) => o.status === 'delivered').length,
          failed: orders.filter((o) => o.status === 'failed_delivery' || o.status === 'cancelled').length,
        },
        orders,
        pagination: {
          currentPage: backendData.meta.current_page,
          lastPage: backendData.meta.last_page,
          perPage: 20,
          total: backendData.meta.total,
        },
      };
    } catch {
      let filtered = [...DUMMY_ORDER_SUMMARIES];
      if (params?.status) filtered = filtered.filter((o) => o.status === params.status);
      if (params?.type) filtered = filtered.filter((o) => o.type === params.type);
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter((o) => o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q));
      }
      return {
        stats: DUMMY_STATS,
        orders: filtered,
        pagination: { currentPage: 1, lastPage: 1, perPage: 20, total: filtered.length },
      };
    }
  },

  /** Fetch a single order detail */
  getOrderDetail: async (id: number): Promise<OrderDetail> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendOrder>>(`/api/v1/admin/orders/${id}`);
      const backendData = unwrap(response.data);
      return mapBackendOrderToDetail(backendData);
    } catch {
      const dummy = DUMMY_ORDER_DETAILS[id];
      if (dummy) return dummy;
      throw new Error(`Order #${id} not found`);
    }
  },

  /** Update order status */
  updateOrderStatus: async (orderId: number, newStatus: OrderStatus): Promise<OrderDetail> => {
    try {
      const response = await apiClient.put<ApiResponse<BackendOrder>>(`/api/v1/admin/orders/${orderId}/status`, { status: newStatus.toUpperCase() });
      return mapBackendOrderToDetail(unwrap(response.data));
    } catch {
      const dummy = DUMMY_ORDER_DETAILS[orderId];
      if (!dummy) throw new Error('Order not found');
      return { ...dummy, status: newStatus, updatedAt: new Date().toISOString() };
    }
  },

  /** Confirm warehouse receipt */
  confirmWarehouseReceipt: async (orderId: number): Promise<OrderDetail> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendOrder>>(`/api/v1/admin/orders/${orderId}/confirm-warehouse-receipt`);
      return mapBackendOrderToDetail(unwrap(response.data));
    } catch {
      const dummy = DUMMY_ORDER_DETAILS[orderId];
      if (!dummy) throw new Error('Order not found');
      return { ...dummy, status: 'pending_aggregation', updatedAt: new Date().toISOString() };
    }
  },
};

export type OrdersApi = typeof ordersApi;
