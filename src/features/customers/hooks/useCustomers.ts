import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toastStore';
import { customersApi, type CreateCustomerData, type CustomersPageData, type CustomerStatus } from '../api/customersApi';

export const customerKeys = {
  all: ['customers'] as const,
  pageData: () => [...customerKeys.all, 'page-data'] as const,
  list: () => [...customerKeys.all, 'list'] as const,
  detail: (id: number) => [...customerKeys.all, 'detail', id] as const,
  orders: (id: number) => [...customerKeys.all, 'orders', id] as const,
};

export function useCustomersPage(params: { page?: number; search?: string; status?: string; zoneId?: number } = {}) {
  return useQuery<CustomersPageData>({
    queryKey: [...customerKeys.pageData(), params],
    queryFn: () => customersApi.getPageData(params),
    staleTime: 30_000,
  });
}

export function useCustomerDetail(id: number) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.getCustomer(id),
    enabled: id > 0,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useCustomerOrders(id: number) {
  return useQuery({
    queryKey: customerKeys.orders(id),
    queryFn: () => customersApi.getCustomerOrders(id),
    enabled: id > 0,
    staleTime: 30_000,
  });
}

export function useUpdateCustomerStatus() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: CustomerStatus }) =>
      customersApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.pageData() });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
      addToast('success', t('customers.toast.statusUpdated'));
    },
    onError: () => addToast('error', t('customers.toast.statusUpdateFailed')),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: CreateCustomerData) => customersApi.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.pageData() });
      addToast('success', t('customers.toast.created'));
    },
    onError: () => addToast('error', t('customers.toast.createFailed')),
  });
}

export function useCancelDeletion() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => customersApi.cancelDeletion(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.pageData() });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      addToast('success', t('customers.deletion.cancelSuccess'));
    },
    onError: () => addToast('error', t('customers.deletion.cancelFailed')),
  });
}

export function useUpdateCustomerNotes() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      customersApi.updateNotes(id, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
      addToast('success', t('customers.toast.notesUpdated'));
    },
    onError: () => addToast('error', t('customers.toast.notesUpdateFailed')),
  });
}
