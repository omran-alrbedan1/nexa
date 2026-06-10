import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores/toastStore';
import { regionsApi, type RegionsPageData } from '../api/regionsApi';

export const regionKeys = {
  all: ['regions'] as const,
  pageData: () => [...regionKeys.all, 'page-data'] as const,
  detail: (id: number) => [...regionKeys.all, 'detail', id] as const,
};

export function useRegionsPage() {
  return useQuery<RegionsPageData>({
    queryKey: regionKeys.pageData(),
    queryFn: () => regionsApi.getPageData(),
    staleTime: 30_000,
  });
}

export function useToggleRegionActive() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => regionsApi.toggleActive(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
      addToast('success', data.isActive ? 'Region enabled' : 'Region disabled');
    },
    onError: () => addToast('error', 'Failed to toggle region'),
  });
}

export function useUpdateDeliveryFee() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, deliveryFee }: { id: number; deliveryFee: number }) =>
      regionsApi.updateDeliveryFee(id, deliveryFee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.pageData() });
      addToast('success', 'Delivery fee updated');
    },
    onError: () => addToast('error', 'Failed to update delivery fee'),
  });
}
