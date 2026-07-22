import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, supplierId }: { id: number; supplierId: number }) => specialOrdersApi.assignSupplier(id, supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialOrderKeys.all });
      addToast('success', t('specialOrders.toast.supplierAssigned'));
    },
    onError: () => addToast('error', t('specialOrders.toast.supplierAssignFailed')),
  });
}

export function useAssignStaff() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, staffUserId }: { id: number; staffUserId: number }) => specialOrdersApi.assignStaff(id, staffUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialOrderKeys.all });
      addToast('success', t('specialOrders.toast.staffAssigned'));
    },
    onError: () => addToast('error', t('specialOrders.toast.staffAssignFailed')),
  });
}

export function useApproveSpecialOrder() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) => specialOrdersApi.approve(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialOrderKeys.all });
      addToast('success', t('specialOrders.toast.approved'));
    },
    onError: () => addToast('error', t('specialOrders.toast.approveFailed')),
  });
}

export function useRejectSpecialOrder() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => specialOrdersApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialOrderKeys.all });
      addToast('success', t('specialOrders.toast.rejected'));
    },
    onError: () => addToast('error', t('specialOrders.toast.rejectFailed')),
  });
}

export function useUpdateNotes() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) => specialOrdersApi.updateNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialOrderKeys.all });
      addToast('success', t('specialOrders.toast.notesUpdated'));
    },
    onError: () => addToast('error', t('specialOrders.toast.notesUpdateFailed')),
  });
}

export function useConvertToOrder() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof specialOrdersApi.convertToOrder>[1] }) =>
      specialOrdersApi.convertToOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialOrderKeys.all });
      addToast('success', t('specialOrders.toast.converted'));
    },
    onError: () => addToast('error', t('specialOrders.toast.convertFailed')),
  });
}

export function useCreatePriceQuote() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof specialOrdersApi.createPriceQuote>[1] }) =>
      specialOrdersApi.createPriceQuote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialOrderKeys.all });
      addToast('success', t('specialOrders.toast.priceQuoteCreated'));
    },
    onError: () => addToast('error', t('specialOrders.toast.priceQuoteCreateFailed')),
  });
}

export function useSubmitPriceQuote() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, price, notes }: { id: number; price: number; notes: string }) =>
      specialOrdersApi.submitPriceQuote(id, price, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialOrderKeys.all });
      addToast('success', t('specialOrders.toast.priceQuoteSubmitted'));
    },
    onError: () => addToast('error', t('specialOrders.toast.priceQuoteSubmitFailed')),
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers', 'dropdown'],
    queryFn: () => specialOrdersApi.getSuppliers(),
    staleTime: 60_000,
  });
}
