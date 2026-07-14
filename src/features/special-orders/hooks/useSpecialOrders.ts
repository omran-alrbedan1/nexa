import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores/toastStore';
import { specialOrdersApi } from '../api/specialOrdersApi';

export const specialOrderKeys = {
  all: ['special-orders'] as const,
  list: (filters?: Record<string, unknown>) => [...specialOrderKeys.all, 'list', filters] as const,
  detail: (id: number) => [...specialOrderKeys.all, 'detail', id] as const,
};

// ── Queries ──

export function useSpecialOrdersList(params?: { status?: string; page?: number; search?: string }) {
  return useQuery({
    queryKey: specialOrderKeys.list(params),
    queryFn: () => specialOrdersApi.getList(params),
    staleTime: 30_000,
  });
}

export function useSpecialOrderDetail(id: number) {
  return useQuery({
    queryKey: specialOrderKeys.detail(id),
    queryFn: () => specialOrdersApi.getDetail(id),
    enabled: id > 0,
    staleTime: 30_000,
    retry: 1,
  });
}

// ── Mutations ──

export function useAssignSupplier() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, supplierId }: { id: number; supplierId: number }) => specialOrdersApi.assignSupplier(id, supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialOrderKeys.all });
      addToast('success', 'Supplier assigned');
    },
    onError: () => addToast('error', 'Failed to assign supplier'),
  });
}

export function useAssignStaff() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, staffUserId }: { id: number; staffUserId: number }) => specialOrdersApi.assignStaff(id, staffUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialOrderKeys.all });
      addToast('success', 'Staff assigned');
    },
    onError: () => addToast('error', 'Failed to assign staff'),
  });
}

export function useApproveSpecialOrder() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) => specialOrdersApi.approve(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialOrderKeys.all });
      addToast('success', 'Special order approved');
    },
    onError: () => addToast('error', 'Failed to approve'),
  });
}

export function useRejectSpecialOrder() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => specialOrdersApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialOrderKeys.all });
      addToast('success', 'Special order rejected');
    },
    onError: () => addToast('error', 'Failed to reject'),
  });
}

export function useUpdateNotes() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) => specialOrdersApi.updateNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialOrderKeys.all });
      addToast('success', 'Notes updated');
    },
    onError: () => addToast('error', 'Failed to update notes'),
  });
}

export function useConvertToOrder() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof specialOrdersApi.convertToOrder>[1] }) =>
      specialOrdersApi.convertToOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialOrderKeys.all });
      addToast('success', 'Converted to order');
    },
    onError: () => addToast('error', 'Failed to convert'),
  });
}

export function useCreatePriceQuote() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof specialOrdersApi.createPriceQuote>[1] }) =>
      specialOrdersApi.createPriceQuote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialOrderKeys.all });
      addToast('success', 'Price quote created and sent to customer');
    },
    onError: () => addToast('error', 'Failed to create price quote'),
  });
}

export function useSubmitPriceQuote() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, price, notes }: { id: number; price: number; notes: string }) =>
      specialOrdersApi.submitPriceQuote(id, price, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialOrderKeys.all });
      addToast('success', 'Price quote submitted — awaiting customer approval');
    },
    onError: () => addToast('error', 'Failed to submit price quote'),
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers', 'dropdown'],
    queryFn: () => specialOrdersApi.getSuppliers(),
    staleTime: 60_000,
  });
}
