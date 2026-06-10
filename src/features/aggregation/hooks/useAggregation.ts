import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores/toastStore';
import { aggregationApi, type AggregationPageData } from '../api/aggregationApi';

export const aggregationKeys = {
  all: ['aggregation'] as const,
  pageData: () => [...aggregationKeys.all, 'page-data'] as const,
  supplyReceiving: () => [...aggregationKeys.all, 'supply-receiving'] as const,
  aggregationQueue: () => [...aggregationKeys.all, 'aggregation-queue'] as const,
  readyToShip: () => [...aggregationKeys.all, 'ready-to-ship'] as const,
  throughput: () => [...aggregationKeys.all, 'throughput'] as const,
};

export function useAggregationPage() {
  return useQuery<AggregationPageData>({
    queryKey: aggregationKeys.pageData(),
    queryFn: () => aggregationApi.getPageData(),
    staleTime: 30_000,
  });
}

export function useConfirmReceipt() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (supplyId: number) => aggregationApi.confirmReceipt(supplyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aggregationKeys.pageData() });
      addToast('success', 'Receipt confirmed successfully');
    },
    onError: () => {
      addToast('error', 'Failed to confirm receipt');
    },
  });
}

export function useStartProcessing() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ orderId, assignee }: { orderId: number; assignee: string }) =>
      aggregationApi.startProcessing(orderId, assignee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aggregationKeys.pageData() });
      addToast('success', 'Order is now being processed');
    },
    onError: () => {
      addToast('error', 'Failed to start processing');
    },
  });
}

export function useMarkPacked() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (orderId: number) => aggregationApi.markPacked(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aggregationKeys.pageData() });
      addToast('success', 'Order packed successfully');
    },
    onError: () => {
      addToast('error', 'Failed to mark as packed');
    },
  });
}

export function usePassQualityCheck() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (orderId: number) => aggregationApi.passQualityCheck(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aggregationKeys.pageData() });
      addToast('success', 'Quality check passed — order ready to ship');
    },
    onError: () => {
      addToast('error', 'Quality check failed');
    },
  });
}

export function useAssignToTrip() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ itemId, tripId, tripName }: { itemId: number; tripId: number; tripName: string }) =>
      aggregationApi.assignToTrip(itemId, tripId, tripName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aggregationKeys.pageData() });
      addToast('success', 'Order assigned to trip successfully');
    },
    onError: () => {
      addToast('error', 'Failed to assign to trip');
    },
  });
}
