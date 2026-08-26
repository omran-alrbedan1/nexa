import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { extractErrorMessage } from '@/lib/apiHelpers';
import { useToastStore } from '@/stores/toastStore';
import { productKeys } from './useProductsAdmin';
import { colorSizeVariantsApi, type GenerateColorSizeVariantsInput } from '../api/colorSizeVariantsApi';

export const colorSizeVariantKeys = {
  all: (productId: number) => ['products', productId, 'color-size-variants'] as const,
};

function generateErrorKey(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null;
  const data = (error as { response?: { data?: { error_code?: string; code?: string } } }).response?.data;
  const code = data?.error_code ?? data?.code;
  return code && ['colors_required', 'invalid_sizes', 'invalid_color', 'variant_type_required'].includes(code)
    ? `colorSize.errors.${code}`
    : null;
}

export function useColorSizeVariants(productId: number, enabled = true) {
  return useQuery({
    queryKey: colorSizeVariantKeys.all(productId),
    queryFn: () => colorSizeVariantsApi.list(productId),
    enabled: enabled && productId > 0,
  });
}

export function useGenerateColorSizeVariants(productId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: (input: GenerateColorSizeVariantsInput) => colorSizeVariantsApi.generate(productId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: colorSizeVariantKeys.all(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      addToast('success', t('colorSize.toast.generated'));
    },
    onError: (error) => {
      const key = generateErrorKey(error);
      addToast('error', key ? t(key) : extractErrorMessage(error));
    },
  });
}
