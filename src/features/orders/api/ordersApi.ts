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
import { mapFromBackend, mapPaymentMethod, ORDER_STATUS_BACKEND_TO_FRONTEND, ORDER_TYPE_BACKEND_TO_FRONTEND, PAYMENT_STATUS_BACKEND_TO_FRONTEND } from '@/lib/enumMappers';
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

export interface OrderSpecialOrderRef {
  id: number;
  referenceNumber: string;
  status: string;
}

export interface OrderPriceQuoteRef {
  id: number;
  quoteNumber: string;
  status: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
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
  specialOrder: OrderSpecialOrderRef | null;
  priceQuote: OrderPriceQuoteRef | null;
  trip: { id: number; driverLocation?: { latitude: number; longitude: number; updatedAt: string } | null } | null;
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
  dateFrom?: string;
  dateTo?: string;
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

interface BackendSpecialOrderRef {
  id: number;
  reference_number: string;
  status: string;
}

interface BackendPriceQuoteRef {
  id: number;
  quote_number: string;
  status: string;
  total: string;
  subtotal: string;
  delivery_fee: string;
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
  special_order: BackendSpecialOrderRef | null;
  price_quote: BackendPriceQuoteRef | null;
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
// Uses centralized mappers from @/lib/enumMappers

function mapBackendOrderToSummary(bo: BackendOrder): OrderSummary {
  return {
    id: bo.id,
    orderNumber: bo.order_number,
    customerId: bo.customer?.id || 0,
    customerName: bo.customer?.name || 'Unknown',
    customerPhone: bo.customer?.phone || '',
    type: mapFromBackend(bo.order_type, ORDER_TYPE_BACKEND_TO_FRONTEND) as OrderType,
    status: mapFromBackend(bo.status, ORDER_STATUS_BACKEND_TO_FRONTEND) as OrderStatus,
    paymentStatus: mapFromBackend(bo.payment_status, PAYMENT_STATUS_BACKEND_TO_FRONTEND) as PaymentStatus,
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
    orderType: mapFromBackend(bo.order_type, ORDER_TYPE_BACKEND_TO_FRONTEND) as OrderType,
    status: mapFromBackend(bo.status, ORDER_STATUS_BACKEND_TO_FRONTEND) as OrderStatus,
    paymentStatus: mapFromBackend(bo.payment_status, PAYMENT_STATUS_BACKEND_TO_FRONTEND) as PaymentStatus,
    paymentMethod: mapPaymentMethod(bo.payments?.[0]?.method || '') as PaymentMethod,
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
    specialOrder: bo.special_order ? {
      id: bo.special_order.id,
      referenceNumber: bo.special_order.reference_number,
      status: bo.special_order.status,
    } : null,
    priceQuote: bo.price_quote ? {
      id: bo.price_quote.id,
      quoteNumber: bo.price_quote.quote_number,
      status: bo.price_quote.status,
      total: parseFloat(bo.price_quote.total),
      subtotal: parseFloat(bo.price_quote.subtotal),
      deliveryFee: parseFloat(bo.price_quote.delivery_fee),
    } : null,
    trip: (bo as Record<string, unknown>).trip
      ? {
          id: ((bo as Record<string, unknown>).trip as Record<string, unknown>).id as number,
          driverLocation: ((bo as Record<string, unknown>).trip as Record<string, unknown>).driver_location
            ? {
                latitude: (((bo as Record<string, unknown>).trip as Record<string, unknown>).driver_location as Record<string, unknown>).latitude as number,
                longitude: (((bo as Record<string, unknown>).trip as Record<string, unknown>).driver_location as Record<string, unknown>).longitude as number,
                updatedAt: (((bo as Record<string, unknown>).trip as Record<string, unknown>).driver_location as Record<string, unknown>).updated_at as string,
              }
            : null,
        }
      : null,
    createdAt: bo.created_at,
    updatedAt: bo.updated_at || bo.created_at,
  };
}



// ──────────────────────────────────────────────
// API Methods
// ──────────────────────────────────────────────

export const ordersApi = {
  /** Fetch paginated orders list */
  getOrders: async (params?: OrderListParams): Promise<OrdersPageData> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status.toUpperCase());
    if (params?.type) queryParams.set('order_type', params.type.toUpperCase());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.perPage) queryParams.set('per_page', String(params.perPage));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.dateFrom) queryParams.set('from_date', params.dateFrom);
    if (params?.dateTo) queryParams.set('to_date', params.dateTo);
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
  },

  /** Fetch a single order detail */
  getOrderDetail: async (id: number): Promise<OrderDetail> => {
    const response = await apiClient.get<ApiResponse<BackendOrder>>(`/api/v1/admin/orders/${id}`);
    const backendData = unwrap(response.data);
    return mapBackendOrderToDetail(backendData);
  },

  /** Update order status */
  updateOrderStatus: async (orderId: number, newStatus: OrderStatus): Promise<OrderDetail> => {
    const response = await apiClient.put<ApiResponse<BackendOrder>>(`/api/v1/admin/orders/${orderId}/status`, { status: newStatus.toUpperCase() });
    return mapBackendOrderToDetail(unwrap(response.data));
  },

  /** Confirm warehouse receipt */
  confirmWarehouseReceipt: async (orderId: number): Promise<OrderDetail> => {
    const response = await apiClient.post<ApiResponse<BackendOrder>>(`/api/v1/admin/orders/${orderId}/confirm-warehouse-receipt`);
    return mapBackendOrderToDetail(unwrap(response.data));
  },

  /** Reschedule order — uses updateStatus with POSTPONED status + notes for now */
  rescheduleOrder: async (orderId: number, scheduledDate: string, reason: string): Promise<OrderDetail> => {
    const response = await apiClient.put<ApiResponse<BackendOrder>>(`/api/v1/admin/orders/${orderId}/status`, {
      status: 'POSTPONED',
      note: reason,
    });
    return mapBackendOrderToDetail(unwrap(response.data));
  },

  /** Transfer order — placeholder for POST /api/v1/admin/orders/{id}/transfer */
  transferOrder: async (orderId: number, warehouseId: number, reason: string): Promise<OrderDetail> => {
    const response = await apiClient.post<ApiResponse<BackendOrder>>(`/api/v1/admin/orders/${orderId}/transfer`, {
      warehouse_id: warehouseId,
      reason,
    });
    return mapBackendOrderToDetail(unwrap(response.data));
  },
};

export type OrdersApi = typeof ordersApi;
