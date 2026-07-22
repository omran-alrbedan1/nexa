import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toastStore';
import { operationsApi, type OperationsPageData } from '../api/operationsApi';

export const operationsKeys = {
  all: ['operations'] as const,
  pageData: () => [...operationsKeys.all, 'page-data'] as const,
  orders: () => [...operationsKeys.all, 'orders'] as const,
  specialRequests: () => [...operationsKeys.all, 'special-requests'] as const,
  complaints: () => [...operationsKeys.all, 'complaints'] as const,
};

/** Fetch all operations page data (stats, recent orders, specials, complaints) */
export function useOperationsPage() {
  return useQuery<OperationsPageData>({
    queryKey: operationsKeys.pageData(),
    queryFn: () => operationsApi.getPageData(),
    staleTime: 30_000,
  });
}

// ── Order Mutations ──

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: number; newStatus: string }) =>
      operationsApi.updateOrderStatus(orderId, newStatus as Parameters<typeof operationsApi.updateOrderStatus>[1]),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.pageData() });
      const label =
        variables.newStatus === 'confirmed'
          ? 'confirmed'
          : variables.newStatus === 'cancelled'
            ? 'cancelled'
            : 'updated';
      addToast('success', t('operations.toast.orderStatusUpdated', { label }));
    },
    onError: () => {
      addToast('error', t('operations.toast.orderStatusUpdateFailed'));
    },
  });
}

// ── Special Request Mutations ──

export function useAssignForPricing() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ requestId, assignedTo }: { requestId: number; assignedTo: string }) =>
      operationsApi.assignForPricing(requestId, assignedTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.pageData() });
      addToast('success', t('operations.toast.requestAssigned'));
    },
    onError: () => {
      addToast('error', t('operations.toast.requestAssignFailed'));
    },
  });
}

export function useSubmitPriceQuote() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ requestId, price, notes }: { requestId: number; price: number; notes: string }) =>
      operationsApi.submitPriceQuote(requestId, price, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.pageData() });
      addToast('success', t('operations.toast.priceQuoteSubmitted'));
    },
    onError: () => {
      addToast('error', t('operations.toast.priceQuoteSubmitFailed'));
    },
  });
}

export function useApproveSpecialOrder() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (requestId: number) => operationsApi.approveSpecialOrder(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.pageData() });
      addToast('success', t('operations.toast.specialApproved'));
    },
    onError: () => {
      addToast('error', t('operations.toast.specialApproveFailed'));
    },
  });
}

export function useRejectSpecialOrder() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (requestId: number) => operationsApi.rejectSpecialOrder(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.pageData() });
      addToast('success', t('operations.toast.specialRejected'));
    },
    onError: () => {
      addToast('error', t('operations.toast.specialRejectFailed'));
    },
  });
}

export function useConvertToOrder() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (requestId: number) => operationsApi.convertToOrder(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.pageData() });
      addToast('success', t('operations.toast.specialConverted'));
    },
    onError: () => {
      addToast('error', t('operations.toast.specialConvertFailed'));
    },
  });
}

// ── Complaint Mutations ──

export function useAssignComplaint() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ complaintId, assignedTo }: { complaintId: number; assignedTo: string }) =>
      operationsApi.assignComplaint(complaintId, assignedTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.pageData() });
      addToast('success', t('operations.toast.complaintAssigned'));
    },
    onError: () => {
      addToast('error', t('operations.toast.complaintAssignFailed'));
    },
  });
}

export function useResolveComplaint() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (complaintId: number) => operationsApi.resolveComplaint(complaintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsKeys.pageData() });
      addToast('success', t('operations.toast.complaintResolved'));
    },
    onError: () => {
      addToast('error', t('operations.toast.complaintResolveFailed'));
    },
  });
}
