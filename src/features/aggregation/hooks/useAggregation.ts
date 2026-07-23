import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toastStore';
import { aggregationApi, type AggregationPageData } from '../api/aggregationApi';

export const aggregationKeys = {
  all: ['aggregation'] as const,
  pageData: (warehouseId?: number) => [...aggregationKeys.all, 'page-data', warehouseId] as const,
  supplyReceiving: () => [...aggregationKeys.all, 'supply-receiving'] as const,
  aggregationQueue: () => [...aggregationKeys.all, 'aggregation-queue'] as const,
  readyToShip: () => [...aggregationKeys.all, 'ready-to-ship'] as const,
  throughput: () => [...aggregationKeys.all, 'throughput'] as const,
};

export function useAggregationPage(warehouseId?: number) {
  return useQuery<AggregationPageData>({
    queryKey: aggregationKeys.pageData(warehouseId),
    queryFn: () => aggregationApi.getPageData(warehouseId),
    staleTime: 30_000,
  });
}

export function useConfirmReceipt() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (supplyId: number) => aggregationApi.confirmReceipt(supplyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aggregationKeys.pageData() });
      addToast('success', t('aggregation.toast.receiptConfirmed'));
    },
    onError: () => {
      addToast('error', t('aggregation.toast.receiptConfirmFailed'));
    },
  });
}

export function useStartProcessing() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ orderId, assignee }: { orderId: number; assignee: string }) =>
      aggregationApi.startProcessing(orderId, assignee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aggregationKeys.pageData() });
      addToast('success', t('aggregation.toast.processingStarted'));
    },
    onError: () => {
      addToast('error', t('aggregation.toast.processingStartFailed'));
    },
  });
}

export function useMarkPacked() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (orderId: number) => aggregationApi.markPacked(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aggregationKeys.pageData() });
      addToast('success', t('aggregation.toast.packed'));
    },
    onError: () => {
      addToast('error', t('aggregation.toast.packFailed'));
    },
  });
}

export function usePassQualityCheck() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (orderId: number) => aggregationApi.passQualityCheck(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aggregationKeys.pageData() });
      addToast('success', t('aggregation.toast.qualityPassed'));
    },
    onError: () => {
      addToast('error', t('aggregation.toast.qualityFailed'));
    },
  });
}

export function useAssignToTrip() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ itemId, tripId, tripName }: { itemId: number; tripId: number; tripName: string }) =>
      aggregationApi.assignToTrip(itemId, tripId, tripName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aggregationKeys.pageData() });
      addToast('success', t('aggregation.toast.assignedToTrip'));
    },
    onError: () => {
      addToast('error', t('aggregation.toast.assignToTripFailed'));
    },
  });
}
