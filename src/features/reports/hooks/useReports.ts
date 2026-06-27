import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reportsApi';

export const reportKeys = {
  all: ['reports'] as const,
  orders: (filters?: Record<string, unknown>) => [...reportKeys.all, 'orders', filters] as const,
  revenue: (filters?: Record<string, unknown>) => [...reportKeys.all, 'revenue', filters] as const,
  suppliers: (filters?: Record<string, unknown>) => [...reportKeys.all, 'suppliers', filters] as const,
};

export function useOrdersReport(filters?: { from?: string; to?: string; zone_id?: number; supplier_id?: number }) {
  return useQuery({
    queryKey: reportKeys.orders(filters),
    queryFn: () => reportsApi.getOrdersReport(filters),
    staleTime: 60_000,
  });
}

export function useRevenueReport(filters?: { from?: string; to?: string; zone_id?: number }) {
  return useQuery({
    queryKey: reportKeys.revenue(filters),
    queryFn: () => reportsApi.getRevenueReport(filters),
    staleTime: 60_000,
  });
}

export function useSuppliersReport(filters?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: reportKeys.suppliers(filters),
    queryFn: () => reportsApi.getSuppliersReport(filters),
    staleTime: 60_000,
  });
}
