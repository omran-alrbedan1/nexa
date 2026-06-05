import { useQuery } from '@tanstack/react-query';
import { productsApi, type ProductData } from '../api/productsApi';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params?: { categoryId?: number; search?: string }) =>
    [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};

export function useProducts(params?: { categoryId?: number; search?: string }) {
  return useQuery<ProductData[]>({
    queryKey: productKeys.list(params),
    queryFn: () => productsApi.list(params),
    staleTime: 60_000,
  });
}

export function useProduct(id: number | undefined) {
  return useQuery<ProductData | null>({
    queryKey: productKeys.detail(id!),
    queryFn: () => productsApi.getById(id!),
    enabled: !!id,
  });
}
