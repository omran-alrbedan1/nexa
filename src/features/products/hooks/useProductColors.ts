import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { extractErrorMessage } from '@/lib/apiHelpers';
import { useToastStore } from '@/stores/toastStore';
import { productKeys } from './useProductsAdmin';
import { colorSizeVariantKeys } from './useColorSizeVariants';
import { colorSizeVariantsApi } from '../api/colorSizeVariantsApi';
import {
  productColorsApi,
  type ProductColorInput,
  type ProductColorUpdateInput,
} from '../api/productColorsApi';

export const productColorKeys = {
  all: (productId: number) => ['products', productId, 'product-colors'] as const,
};

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined;
  const data = (error as { response?: { data?: { error_code?: string; code?: string } } }).response?.data;
  return data?.error_code ?? data?.code;
}

function useProductColorFeedback() {
  const { t } = useTranslation();
  const addToast = useToastStore((state) => state.addToast);
  const showError = (error: unknown) => {
    const code = errorCode(error);
    const key = code && ['invalid_color', 'color_already_linked', 'color_in_use'].includes(code)
      ? `colorSize.errors.${code}`
      : null;
    addToast('error', key ? t(key) : extractErrorMessage(error));
  };
  return { t, addToast, showError };
}

export function useProductColors(productId: number, enabled = true) {
  return useQuery({
    queryKey: productColorKeys.all(productId),
    queryFn: () => productColorsApi.list(productId),
    enabled: enabled && productId > 0,
  });
}

function useInvalidateProductColors(productId: number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: productColorKeys.all(productId) });
    queryClient.invalidateQueries({ queryKey: colorSizeVariantKeys.all(productId) });
  };
}

export function useLinkProductColor(productId: number) {
  const invalidate = useInvalidateProductColors(productId);
  const { t, addToast, showError } = useProductColorFeedback();
  return useMutation({
    mutationFn: (input: ProductColorInput) => productColorsApi.link(productId, input),
    onSuccess: () => { invalidate(); addToast('success', t('colorSize.toast.colorLinked')); },
    onError: showError,
  });
}

export function useUpdateProductColor(productId: number) {
  const invalidate = useInvalidateProductColors(productId);
  const { t, addToast, showError } = useProductColorFeedback();
  return useMutation({
    mutationFn: ({ linkId, input }: { linkId: number; input: ProductColorUpdateInput }) => productColorsApi.update(productId, linkId, input),
    onSuccess: () => { invalidate(); addToast('success', t('colorSize.toast.colorUpdated')); },
    onError: showError,
  });
}

export function useUploadProductColorImage(productId: number) {
  const invalidate = useInvalidateProductColors(productId);
  const { t, addToast, showError } = useProductColorFeedback();
  return useMutation({
    mutationFn: ({ linkId, image }: { linkId: number; image: File }) => productColorsApi.uploadImage(productId, linkId, image),
    onSuccess: () => { invalidate(); addToast('success', t('colorSize.toast.imageUpdated')); },
    onError: showError,
  });
}

export function useToggleProductColor(productId: number) {
  const invalidate = useInvalidateProductColors(productId);
  const { t, addToast, showError } = useProductColorFeedback();
  return useMutation({
    mutationFn: (linkId: number) => productColorsApi.toggle(productId, linkId),
    onSuccess: () => { invalidate(); addToast('success', t('colorSize.toast.colorToggled')); },
    onError: showError,
  });
}

export function useDeleteProductColor(productId: number) {
  const invalidate = useInvalidateProductColors(productId);
  const { t, addToast, showError } = useProductColorFeedback();
  return useMutation({
    mutationFn: (linkId: number) => productColorsApi.delete(productId, linkId),
    onSuccess: () => { invalidate(); addToast('success', t('colorSize.toast.colorDeleted')); },
    onError: showError,
  });
}

export function useEnableColorSize(productId: number) {
  const queryClient = useQueryClient();
  const { t, addToast, showError } = useProductColorFeedback();
  return useMutation({
    mutationFn: () => colorSizeVariantsApi.enable(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      queryClient.invalidateQueries({ queryKey: productColorKeys.all(productId) });
      addToast('success', t('colorSize.toast.enabled'));
    },
    onError: showError,
  });
}

export function useDisableColorSize(productId: number) {
  const queryClient = useQueryClient();
  const { t, addToast, showError } = useProductColorFeedback();
  return useMutation({
    mutationFn: () => colorSizeVariantsApi.disable(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      addToast('success', t('colorSize.toast.disabled'));
    },
    onError: showError,
  });
}
