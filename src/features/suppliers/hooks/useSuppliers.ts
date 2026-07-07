import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores/toastStore';
import { suppliersApi, type SuppliersPageData } from '../api/suppliersApi';
import type { DashboardProduct } from '@/features/products/api/productsApi';

export const supplierKeys = {
  all: ['suppliers'] as const,
  pageData: () => [...supplierKeys.all, 'page-data'] as const,
  list: () => [...supplierKeys.all, 'list'] as const,
  detail: (id: number) => [...supplierKeys.all, 'detail', id] as const,
  products: (id: number) => [...supplierKeys.all, 'products', id] as const,
};

export function useSuppliersPage() {
  return useQuery<SuppliersPageData>({
    queryKey: supplierKeys.pageData(),
    queryFn: () => suppliersApi.getPageData(),
    staleTime: 30_000,
  });
}

/** Fetch products belonging to a supplier */
export function useSupplierProducts(supplierId: number) {
  return useQuery<DashboardProduct[]>({
    queryKey: supplierKeys.products(supplierId),
    queryFn: () => suppliersApi.getSupplierProducts(supplierId),
    enabled: supplierId > 0,
    staleTime: 30_000,
  });
}

export function useApproveSupplier() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => suppliersApi.approveSupplier(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.pageData() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(id) });
      addToast('success', 'Supplier approved successfully');
    },
    onError: () => addToast('error', 'Failed to approve supplier'),
  });
}

export function useSuspendSupplier() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => suppliersApi.suspendSupplier(id, reason),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.pageData() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(id) });
      addToast('success', 'Supplier suspended');
    },
    onError: () => addToast('error', 'Failed to suspend supplier'),
  });
}
