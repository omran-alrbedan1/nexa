import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores/toastStore';
import { deliverySlotsApi, type DeliverySlotsPageData } from '../api/deliverySlotsApi';

export const deliverySlotKeys = {
  all: ['delivery-slots'] as const,
  pageData: () => [...deliverySlotKeys.all, 'page-data'] as const,
};

export function useDeliverySlotsPage() {
  return useQuery<DeliverySlotsPageData>({
    queryKey: deliverySlotKeys.pageData(),
    queryFn: () => deliverySlotsApi.getPageData(),
    staleTime: 30_000,
  });
}

export function useCreateDeliverySlot() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: Parameters<typeof deliverySlotsApi.createSlot>[0]) =>
      deliverySlotsApi.createSlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliverySlotKeys.pageData() });
      addToast('success', 'Delivery slot created');
    },
    onError: () => addToast('error', 'Failed to create delivery slot'),
  });
}

export function useUpdateDeliverySlot() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof deliverySlotsApi.updateSlot>[1] }) =>
      deliverySlotsApi.updateSlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliverySlotKeys.pageData() });
      addToast('success', 'Delivery slot updated');
    },
    onError: () => addToast('error', 'Failed to update delivery slot'),
  });
}
