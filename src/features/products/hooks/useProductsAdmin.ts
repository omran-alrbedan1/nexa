import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores/toastStore';
import { productsApi, type ProductsPageData } from '../api/productsApi';

export const productKeys = {
  all: ['products'] as const,
  pageData: () => [...productKeys.all, 'page-data'] as const,
  list: () => [...productKeys.all, 'list'] as const,
  detail: (id: number) => [...productKeys.all, 'detail', id] as const,
};

export function useProductsPage() {
  return useQuery<ProductsPageData>({
    queryKey: productKeys.pageData(),
    queryFn: () => productsApi.getPageData(),
    staleTime: 30_000,
  });
}

export function useToggleProductAvailability() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => productsApi.toggleAvailability(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productKeys.pageData() });
      addToast('success', data.isAvailable ? 'Product enabled' : 'Product disabled');
    },
    onError: () => addToast('error', 'Failed to update product'),
  });
}
