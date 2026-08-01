import { useQuery } from '@tanstack/react-query';
import { paymentsApi, type PaymentsPageData } from '../api/paymentsApi';

export const paymentKeys = {
  all: ['payments'] as const,
  pageData: () => [...paymentKeys.all, 'page-data'] as const,
};

export function usePaymentsPage(params: { page?: number; status?: string } = {}) {
  return useQuery<PaymentsPageData>({
    queryKey: [...paymentKeys.pageData(), params],
    queryFn: () => paymentsApi.getPageData(params),
    staleTime: 30_000,
  });
}
