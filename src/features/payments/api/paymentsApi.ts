// ============================================================
// Payments API Service
// ============================================================
// Backend: GET /api/v1/admin/payments (PaymentController@index)
//          POST /api/v1/admin/payments/{id}/refund (PaymentController@refund)
// ============================================================

import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface PaymentOrderCustomer {
  id: number;
  fullName: string;
}

export interface PaymentOrder {
  id: number;
  orderNumber: string;
  customer?: PaymentOrderCustomer | null;
}

export interface PaymentMethod {
  id: number;
  nameAr: string;
}

export interface PaymentRefund {
  id: number;
  amount: number;
  reason: string;
  status: string;
  processedAt: string;
}

export interface Payment {
  id: number;
  amount: number;
  status: string;
  transactionId: string;
  paidAt: string | null;
  createdAt: string;
  order?: PaymentOrder | null;
  paymentMethod?: PaymentMethod | null;
  refunds?: PaymentRefund[];
}

export interface PaymentsPageData {
  payments: Payment[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

// ── Backend Raw Types ──

interface BackendPaymentOrderCustomer {
  id: number;
  full_name: string;
}

interface BackendPaymentOrder {
  id: number;
  order_number: string;
  customer?: BackendPaymentOrderCustomer | null;
}

interface BackendPaymentMethod {
  id: number;
  name_ar: string;
}

interface BackendPaymentRefund {
  id: number;
  amount: number;
  reason: string;
  status: string;
  processed_at: string;
}

interface BackendPayment {
  id: number;
  amount: number;
  status: string;
  transaction_id: string;
  paid_at: string | null;
  created_at: string;
  order?: BackendPaymentOrder | null;
  payment_method?: BackendPaymentMethod | null;
  refunds?: BackendPaymentRefund[];
}

interface BackendPaymentsResponse {
  payments: BackendPayment[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

// ── Mapping ──

function mapBackendPayment(bp: BackendPayment): Payment {
  return {
    id: bp.id,
    amount: Number(bp.amount) || 0,
    status: bp.status,
    transactionId: bp.transaction_id,
    paidAt: bp.paid_at ?? null,
    createdAt: bp.created_at,
    order: bp.order
      ? {
          id: bp.order.id,
          orderNumber: bp.order.order_number,
          customer: bp.order.customer
            ? { id: bp.order.customer.id, fullName: bp.order.customer.full_name }
            : null,
        }
      : null,
    paymentMethod: bp.payment_method
      ? { id: bp.payment_method.id, nameAr: bp.payment_method.name_ar }
      : null,
    refunds: (bp.refunds || []).map((r) => ({
      id: r.id,
      amount: Number(r.amount) || 0,
      reason: r.reason,
      status: r.status,
      processedAt: r.processed_at,
    })),
  };
}

export const paymentsApi = {
  /** Fetch payments page data (stats + list) */
  getPageData: async (params: { page?: number; status?: string } = {}): Promise<PaymentsPageData> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendPaymentsResponse>>('/api/v1/admin/payments', {
        params: {
          page: params.page ?? 1,
          per_page: 15,
          status: params.status || undefined,
        },
      });
      const backendData = response.data.data;
      const meta = backendData.meta;
      return {
        payments: backendData.payments.map(mapBackendPayment),
        meta: {
          currentPage: meta.current_page ?? 1,
          lastPage: meta.last_page ?? 1,
          perPage: 15,
          total: meta.total ?? backendData.payments.length,
        },
      };
    } catch {
      return {
        payments: [],
        meta: { currentPage: 1, lastPage: 1, perPage: 15, total: 0 },
      };
    }
  },

  /** Refund a payment */
  refund: async (id: number, amount: number, reason: string): Promise<Payment> => {
    const response = await apiClient.post<ApiResponse<BackendPayment>>(`/api/v1/admin/payments/${id}/refund`, { amount, reason });
    return mapBackendPayment(response.data.data);
  },
};

export type PaymentsApi = typeof paymentsApi;
