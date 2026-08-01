import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toastStore';
import { productsApi, type ProductsPageData } from '../api/productsApi';

export const productKeys = {
  all: ['products'] as const,
  pageData: () => [...productKeys.all, 'page-data'] as const,
  list: () => [...productKeys.all, 'list'] as const,
  detail: (id: number) => [...productKeys.all, 'detail', id] as const,
};

export function useProductsPage(params: { page?: number; search?: string } = {}) {
  return useQuery<ProductsPageData>({
    queryKey: [...productKeys.pageData(), params],
    queryFn: () => productsApi.getPageData(params),
    staleTime: 30_000,
  });
}

export function useToggleProductAvailability() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => productsApi.toggleAvailability(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productKeys.pageData() });
      addToast('success', data.isAvailable ? t('products.toast.enabled') : t('products.toast.disabled'));
    },
    onError: () => addToast('error', t('products.toast.updateFailed')),
  });
}

export function useApproveProduct() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => productsApi.approveProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.pageData() });
      queryClient.invalidateQueries({ queryKey: ['products', 'pending-approvals'] });
      addToast('success', t('products.toast.approved'));
    },
    onError: () => addToast('error', t('products.toast.approveFailed')),
  });
}

export function useRejectProduct() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => productsApi.rejectProduct(id, 'Rejected by admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.pageData() });
      queryClient.invalidateQueries({ queryKey: ['products', 'pending-approvals'] });
      addToast('success', t('products.toast.rejected'));
    },
    onError: () => addToast('error', t('products.toast.rejectFailed')),
  });
}
