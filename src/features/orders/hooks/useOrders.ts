import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ordersApi, type DeliveryType, type DeliveryUrgency, type OrderDetail, type OrdersPageData, type OrderListParams } from '../api/ordersApi';
import { useToastStore } from '@/stores/toastStore';
import { extractErrorMessage } from '@/lib/apiHelpers';

export const ordersKeys = {
  all: ['orders'] as const,
  list: (params?: OrderListParams) => [...ordersKeys.all, 'list', params] as const,
  detail: (id: number) => [...ordersKeys.all, 'detail', id] as const,
};

/** Fetch paginated orders list with optional filters */
export function useOrdersList(params?: OrderListParams) {
  return useQuery<OrdersPageData>({
    queryKey: ordersKeys.list(params),
    queryFn: () => ordersApi.getOrders(params),
    staleTime: 30_000,
  });
}

/** Fetch a single order detail */
export function useOrderDetail(id: number) {
  return useQuery<OrderDetail>({
    queryKey: ordersKeys.detail(id),
    queryFn: () => ordersApi.getOrderDetail(id),
    enabled: id > 0,
    staleTime: 30_000,
    retry: 1,
  });
}

// ── Mutations ──

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: number; newStatus: string }) =>
      ordersApi.updateOrderStatus(orderId, newStatus as Parameters<typeof ordersApi.updateOrderStatus>[1]),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      const label =
        variables.newStatus === 'confirmed'
          ? 'confirmed'
          : variables.newStatus === 'cancelled'
            ? 'cancelled'
            : 'updated';
      addToast('success', t('orders.toast.statusUpdated', { label }));
    },
    onError: (error) => {
      addToast('error', extractErrorMessage(error));
    },
  });
}

export function useConfirmWarehouseReceipt() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (orderId: number) => ordersApi.confirmWarehouseReceipt(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      queryClient.invalidateQueries({ queryKey: ['aggregation'] });
      addToast('success', t('orders.toast.receiptConfirmed'));
    },
    onError: (error) => {
      addToast('error', extractErrorMessage(error));
    },
  });
}

export function useRescheduleOrder() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ orderId, scheduledDate, reason }: { orderId: number; scheduledDate: string; reason: string }) =>
      ordersApi.rescheduleOrder(orderId, scheduledDate, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      addToast('success', t('orders.toast.orderRescheduled'));
    },
    onError: (error) => {
      addToast('error', extractErrorMessage(error));
    },
  });
}

export function useUpdateDeliveryType() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ orderId, deliveryType }: { orderId: number; deliveryType: DeliveryType }) =>
      ordersApi.updateDeliveryType(orderId, deliveryType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      addToast('success', t('orders.toast.deliveryTypeUpdated'));
    },
    onError: (error) => {
      addToast('error', extractErrorMessage(error));
    },
  });
}

export function useUpdateDeliveryUrgency() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ orderId, deliveryUrgency }: { orderId: number; deliveryUrgency: DeliveryUrgency }) =>
      ordersApi.updateDeliveryUrgency(orderId, deliveryUrgency),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      const label = variables.deliveryUrgency === 'fast' ? t('orders.detail.urgencyFast') : t('orders.detail.urgencyScheduled');
      addToast('success', t('orders.toast.deliveryUrgencyUpdated', { label }));
    },
    onError: (error) => {
      addToast('error', extractErrorMessage(error));
    },
  });
}

export function useTransferOrder() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ orderId, warehouseId, reason }: { orderId: number; warehouseId: number; reason: string }) =>
      ordersApi.transferOrder(orderId, warehouseId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      addToast('success', t('orders.toast.orderTransferred'));
    },
    onError: (error) => {
      addToast('error', extractErrorMessage(error));
    },
  });
}
