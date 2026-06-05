import { useQuery } from '@tanstack/react-query';
import { productsApi, type CategoryData } from '../api/productsApi';

export const categoryKeys = {
  all: ['categories'] as const,
};

export function useCategories() {
  return useQuery<CategoryData[]>({
    queryKey: categoryKeys.all,
    queryFn: () => productsApi.getCategories(),
    staleTime: 120_000, // categories change infrequently
  });
}
