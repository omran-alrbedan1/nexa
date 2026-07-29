import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toastStore';
import { productVariantsApi, type VariantFormData } from '../api/productsApi';

export const variantKeys = {
  all: (productId: number) => ['products', productId, 'variants'] as const,
};

export function useProductVariants(productId: number) {
  return useQuery({
    queryKey: variantKeys.all(productId),
    queryFn: () => productVariantsApi.list(productId),
    staleTime: 30_000,
    enabled: productId > 0,
  });
}

export function useCreateProductVariant(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (data: VariantFormData) => productVariantsApi.create(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantKeys.all(productId) });
      addToast('success', t('products.variants.created', 'Variant created'));
    },
    onError: () => addToast('error', t('products.variants.createFailed', 'Failed to create variant')),
  });
}

export function useUpdateProductVariant(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<VariantFormData> }) =>
      productVariantsApi.update(productId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantKeys.all(productId) });
      addToast('success', t('products.variants.updated', 'Variant updated'));
    },
    onError: () => addToast('error', t('products.variants.updateFailed', 'Failed to update variant')),
  });
}

export function useToggleProductVariant(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (id: number) => productVariantsApi.toggle(productId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantKeys.all(productId) });
      addToast('success', t('products.variants.toggled', 'Variant status changed'));
    },
    onError: () => addToast('error', t('products.variants.toggleFailed', 'Failed to toggle variant')),
  });
}

export function useDeleteProductVariant(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (id: number) => productVariantsApi.delete(productId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantKeys.all(productId) });
      addToast('success', t('products.variants.deleted', 'Variant deleted'));
    },
    onError: () => addToast('error', t('products.variants.deleteFailed', 'Failed to delete variant')),
  });
}
