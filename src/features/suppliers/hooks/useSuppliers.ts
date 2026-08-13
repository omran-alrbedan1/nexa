import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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

export function useSuppliersPage(params: { page?: number; search?: string; approval_status?: string; status?: string } = {}) {
  return useQuery<SuppliersPageData>({
    queryKey: [...supplierKeys.pageData(), params],
    queryFn: () => suppliersApi.getPageData(params),
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
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => suppliersApi.approveSupplier(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.pageData() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(id) });
      addToast('success', t('suppliers.toast.approved'));
    },
    onError: () => addToast('error', t('suppliers.toast.approveFailed')),
  });
}

export function useSuspendSupplier() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => suppliersApi.suspendSupplier(id, reason),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.pageData() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(id) });
      addToast('success', t('suppliers.toast.suspended'));
    },
    onError: () => addToast('error', t('suppliers.toast.suspendFailed')),
  });
}

export function useToggleSupplier() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => suppliersApi.toggleSupplier(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.pageData() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(id) });
      addToast('success', t('suppliers.toast.statusChanged'));
    },
    onError: () => addToast('error', t('suppliers.toast.statusChangeFailed')),
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => suppliersApi.deleteSupplier(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.pageData() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.list() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(id) });
      addToast('success', t('suppliers.toast.deleted'));
    },
    onError: () => addToast('error', t('suppliers.toast.deleteFailed')),
  });
}

export function useTrustedPhones() {
  return useQuery({
    queryKey: [...supplierKeys.all, 'trusted-phones'] as const,
    queryFn: () => suppliersApi.getTrustedPhones(),
    staleTime: 30_000,
  });
}

export function useAddTrustedPhone() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ phone, note }: { phone: string; note?: string }) => suppliersApi.addTrustedPhone(phone, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...supplierKeys.all, 'trusted-phones'] });
      addToast('success', t('suppliers.trusted.toastAdded'));
    },
    onError: () => addToast('error', t('suppliers.trusted.toastAddFailed')),
  });
}

export function useDeleteTrustedPhone() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => suppliersApi.deleteTrustedPhone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...supplierKeys.all, 'trusted-phones'] });
      addToast('success', t('suppliers.trusted.toastRemoved'));
    },
    onError: () => addToast('error', t('suppliers.trusted.toastRemoveFailed')),
  });
}

export function useSupplierCategories(supplierId: number) {
  return useQuery({
    queryKey: [...supplierKeys.detail(supplierId), 'categories'],
    queryFn: () => suppliersApi.getSupplierCategories(supplierId),
    enabled: supplierId > 0,
    staleTime: 30_000,
  });
}

export function useSyncSupplierCategories(supplierId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (categoryIds: number[]) => suppliersApi.syncSupplierCategories(supplierId, categoryIds),
    onSuccess: (_, __, ctx) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(supplierId) });
      queryClient.invalidateQueries({ queryKey: [...supplierKeys.detail(supplierId), 'categories'] });
      addToast('success', t('suppliers.toast.categoriesUpdated', 'Categories updated'));
    },
    onError: () => addToast('error', t('suppliers.toast.categoriesUpdateFailed', 'Failed to update categories')),
  });
}
