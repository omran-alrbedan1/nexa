import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { extractErrorMessage } from '@/lib/apiHelpers';
import { useToastStore } from '@/stores/toastStore';
import {
  productSizesApi,
  type ProductSizeInput,
  type ProductSizeListParams,
} from '../api/productSizesApi';

export const productSizeKeys = {
  all: ['product-sizes'] as const,
  lists: () => [...productSizeKeys.all, 'list'] as const,
  list: (params: ProductSizeListParams) => [...productSizeKeys.lists(), params] as const,
};

function isSizeInUseError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('response' in error)) return false;
  const response = (error as { response?: { data?: Record<string, unknown> } }).response;
  const data = response?.data;
  return data?.error_code === 'size_in_use' || data?.code === 'size_in_use' || data?.error === 'size_in_use' || data?.message === 'size_in_use';
}

export function useProductSizes(params: ProductSizeListParams) {
  return useQuery({
    queryKey: productSizeKeys.list(params),
    queryFn: () => productSizesApi.list(params),
    staleTime: 30_000,
  });
}

function useProductSizeMutationToast() {
  const { t } = useTranslation();
  const addToast = useToastStore((state) => state.addToast);
  return { t, addToast };
}

export function useCreateProductSize() {
  const queryClient = useQueryClient();
  const { t, addToast } = useProductSizeMutationToast();
  return useMutation({
    mutationFn: (data: ProductSizeInput) => productSizesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productSizeKeys.all });
      addToast('success', t('productSizes.toast.created'));
    },
    onError: (error) => addToast('error', extractErrorMessage(error)),
  });
}

export function useUpdateProductSize() {
  const queryClient = useQueryClient();
  const { t, addToast } = useProductSizeMutationToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductSizeInput> }) =>
      productSizesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productSizeKeys.all });
      addToast('success', t('productSizes.toast.updated'));
    },
    onError: (error) => addToast('error', extractErrorMessage(error)),
  });
}

export function useToggleProductSize() {
  const queryClient = useQueryClient();
  const { t, addToast } = useProductSizeMutationToast();
  return useMutation({
    mutationFn: (id: number) => productSizesApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productSizeKeys.all });
      addToast('success', t('productSizes.toast.toggled'));
    },
    onError: (error) => addToast('error', extractErrorMessage(error)),
  });
}

export function useDeleteProductSize() {
  const queryClient = useQueryClient();
  const { t, addToast } = useProductSizeMutationToast();
  return useMutation({
    mutationFn: (id: number) => productSizesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productSizeKeys.all });
      addToast('success', t('productSizes.toast.deleted'));
    },
    onError: (error) => {
      addToast(
        'error',
        isSizeInUseError(error) ? t('productSizes.errors.sizeInUse') : extractErrorMessage(error)
      );
    },
  });
}
