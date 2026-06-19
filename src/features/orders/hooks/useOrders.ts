import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, type OrderDetail, type OrdersPageData, type OrderListParams } from '../api/ordersApi';
import { useToastStore } from '@/stores/toastStore';

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
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: number; newStatus: string }) =>
      ordersApi.updateOrderStatus(orderId, newStatus as any),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      const label =
        variables.newStatus === 'confirmed'
          ? 'confirmed'
          : variables.newStatus === 'cancelled'
            ? 'cancelled'
            : 'updated';
      addToast('success', `Order ${label} successfully`);
    },
    onError: () => {
      addToast('error', 'Failed to update order status');
    },
  });
}

export function useConfirmWarehouseReceipt() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (orderId: number) => ordersApi.confirmWarehouseReceipt(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      addToast('success', 'Warehouse receipt confirmed');
    },
    onError: () => {
      addToast('error', 'Failed to confirm warehouse receipt');
    },
  });
}
