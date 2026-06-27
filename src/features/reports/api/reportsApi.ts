import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

// ── Backend Response Types ──

export interface OrdersReport {
  period: { from: string; to: string };
  totals: { orders: number; revenue: number; delivered: number; cancelled: number };
  by_status: Record<string, { count: number; revenue: number }>;
  by_type: Record<string, { count: number; revenue: number }>;
  daily: { date: string; count: number; revenue: number }[];
}

export interface RevenueReport {
  period: { from: string; to: string };
  total_revenue: number;
  total_delivery_fees: number;
  orders_delivered: number;
  by_zone: { zone_id: number; zone_name: string; orders: number; revenue: number; delivery_fees: number }[];
}

export interface SupplierReport {
  period: { from: string; to: string };
  suppliers: {
    id: number;
    business_name: string;
    products_count: number;
    orders_count: number;
    revenue: number;
    acceptance_rate: number;
    rating_avg: number;
  }[];
}

// ── Frontend Mapped Types ──

export interface OrdersReportData {
  period: { from: string; to: string };
  totals: { orders: number; revenue: number; delivered: number; cancelled: number };
  byStatus: Record<string, { count: number; revenue: number }>;
  byType: Record<string, { count: number; revenue: number }>;
  daily: { date: string; count: number; revenue: number }[];
}

export interface RevenueReportData {
  period: { from: string; to: string };
  totalRevenue: number;
  totalDeliveryFees: number;
  ordersDelivered: number;
  byZone: { zoneId: number; zoneName: string; orders: number; revenue: number; deliveryFees: number }[];
}

export interface SupplierReportData {
  period: { from: string; to: string };
  suppliers: {
    id: number;
    businessName: string;
    productsCount: number;
    ordersCount: number;
    revenue: number;
    acceptanceRate: number;
    ratingAvg: number;
  }[];
}

// ── Mapping ──

function mapOrdersReport(backend: OrdersReport): OrdersReportData {
  return {
    period: backend.period,
    totals: backend.totals,
    byStatus: backend.by_status,
    byType: backend.by_type,
    daily: backend.daily,
  };
}

function mapRevenueReport(backend: RevenueReport): RevenueReportData {
  return {
    period: backend.period,
    totalRevenue: backend.total_revenue,
    totalDeliveryFees: backend.total_delivery_fees,
    ordersDelivered: backend.orders_delivered,
    byZone: (backend.by_zone || []).map((z) => ({
      zoneId: z.zone_id,
      zoneName: z.zone_name,
      orders: z.orders,
      revenue: z.revenue,
      deliveryFees: z.delivery_fees,
    })),
  };
}

function mapSupplierReport(backend: SupplierReport): SupplierReportData {
  return {
    period: backend.period,
    suppliers: (backend.suppliers || []).map((s) => ({
      id: s.id,
      businessName: s.business_name,
      productsCount: s.products_count,
      ordersCount: s.orders_count,
      revenue: s.revenue,
      acceptanceRate: s.acceptance_rate,
      ratingAvg: Number(s.rating_avg) || 0,
    })),
  };
}

export const reportsApi = {
  getOrdersReport: async (filters?: { from?: string; to?: string; zone_id?: number; supplier_id?: number }): Promise<OrdersReportData> => {
    try {
      const response = await apiClient.get<ApiResponse<OrdersReport>>('/api/v1/admin/reports/orders', { params: filters });
      return mapOrdersReport(response.data.data);
    } catch {
      throw new Error('Failed to load orders report');
    }
  },

  getRevenueReport: async (filters?: { from?: string; to?: string; zone_id?: number }): Promise<RevenueReportData> => {
    try {
      const response = await apiClient.get<ApiResponse<RevenueReport>>('/api/v1/admin/reports/revenue', { params: filters });
      return mapRevenueReport(response.data.data);
    } catch {
      throw new Error('Failed to load revenue report');
    }
  },

  getSuppliersReport: async (filters?: { from?: string; to?: string }): Promise<SupplierReportData> => {
    try {
      const response = await apiClient.get<ApiResponse<SupplierReport>>('/api/v1/admin/reports/suppliers', { params: filters });
      return mapSupplierReport(response.data.data);
    } catch {
      throw new Error('Failed to load suppliers report');
    }
  },
};

export type ReportsApi = typeof reportsApi;
