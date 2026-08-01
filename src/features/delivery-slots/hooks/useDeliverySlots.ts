import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toastStore';
import { deliverySlotsApi, type DeliverySlotsPageData, type WarehouseOption, type ZoneOption } from '../api/deliverySlotsApi';

export const deliverySlotKeys = {
  all: ['delivery-slots'] as const,
  pageData: () => [...deliverySlotKeys.all, 'page-data'] as const,
  warehouses: () => [...deliverySlotKeys.all, 'warehouses'] as const,
  zones: () => [...deliverySlotKeys.all, 'zones'] as const,
};

export function useWarehouses() {
  return useQuery<WarehouseOption[]>({
    queryKey: deliverySlotKeys.warehouses(),
    queryFn: () => deliverySlotsApi.getWarehouses(),
    staleTime: 60_000,
  });
}

export function useZones() {
  return useQuery<ZoneOption[]>({
    queryKey: deliverySlotKeys.zones(),
    queryFn: () => deliverySlotsApi.getZones(),
    staleTime: 60_000,
  });
}

export function useDeliverySlotsPage(params: { page?: number } = {}) {
  return useQuery<DeliverySlotsPageData>({
    queryKey: [...deliverySlotKeys.pageData(), params],
    queryFn: () => deliverySlotsApi.getPageData(params),
    staleTime: 30_000,
  });
}

export function useCreateDeliverySlot() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: Parameters<typeof deliverySlotsApi.createSlot>[0]) =>
      deliverySlotsApi.createSlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliverySlotKeys.pageData() });
      addToast('success', t('deliverySlots.toast.slotCreated'));
    },
    onError: () => addToast('error', t('deliverySlots.toast.slotCreateFailed')),
  });
}

export function useUpdateDeliverySlot() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof deliverySlotsApi.updateSlot>[1] }) =>
      deliverySlotsApi.updateSlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliverySlotKeys.pageData() });
      addToast('success', t('deliverySlots.toast.slotUpdated'));
    },
    onError: () => addToast('error', t('deliverySlots.toast.slotUpdateFailed')),
  });
}
