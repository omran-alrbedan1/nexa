import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toastStore';
import { tripsApi, type TripsPageData } from '../api/tripsApi';

export const tripKeys = {
  all: ['trips'] as const,
  pageData: () => [...tripKeys.all, 'page-data'] as const,
  list: () => [...tripKeys.all, 'list'] as const,
  detail: (id: number) => [...tripKeys.all, 'detail', id] as const,
  pickupIssues: (tripId: number) => [...tripKeys.all, 'pickup-issues', tripId] as const,
  codHandovers: (tripId: number) => [...tripKeys.all, 'cod-handovers', tripId] as const,
};

export function useTripsPage(params: { page?: number; status?: string; search?: string; warehouseId?: number; driverId?: number; fromDate?: string; toDate?: string } = {}) {
  return useQuery<TripsPageData>({
    queryKey: [...tripKeys.pageData(), params],
    queryFn: () => tripsApi.getPageData(params),
    staleTime: 30_000,
  });
}

export function useTripDetail(tripId: number) {
  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: () => tripsApi.getTrip(tripId),
    enabled: tripId > 0,
    staleTime: 30_000,
    retry: 1,
  });
}

function invalidateTripQueries(queryClient: ReturnType<typeof useQueryClient>, tripId: number) {
  queryClient.invalidateQueries({ queryKey: tripKeys.pageData() });
  queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ tripId, driverId }: { tripId: number; driverId: number }) =>
      tripsApi.assignDriver(tripId, driverId),
    onSuccess: (_data, { tripId }) => {
      invalidateTripQueries(queryClient, tripId);
      queryClient.invalidateQueries({ queryKey: [...tripKeys.all, 'available-drivers'] });
      addToast('success', t('trips.toast.driverAssigned'));
    },
    onError: () => addToast('error', t('trips.toast.driverAssignFailed')),
  });
}

export function useStartTrip() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (tripId: number) => tripsApi.startTrip(tripId),
    onSuccess: (_data, tripId) => {
      invalidateTripQueries(queryClient, tripId);
      addToast('success', t('trips.toast.tripStarted'));
    },
    onError: () => addToast('error', t('trips.toast.tripStartFailed')),
  });
}

export function useCompleteTrip() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (tripId: number) => tripsApi.completeTrip(tripId),
    onSuccess: (_data, tripId) => {
      invalidateTripQueries(queryClient, tripId);
      addToast('success', t('trips.toast.tripCompleted'));
    },
    onError: () => addToast('error', t('trips.toast.tripCompleteFailed')),
  });
}

export function useBumpManifest() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (tripId: number) => tripsApi.bumpManifest(tripId),
    onSuccess: (_data, tripId) => {
      invalidateTripQueries(queryClient, tripId);
      addToast('success', t('trips.toast.manifestBumped'));
    },
    onError: () => addToast('error', t('trips.toast.manifestBumpFailed')),
  });
}

export function useResolvePickupIssue() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ tripId, issueId }: { tripId: number; issueId: number }) =>
      tripsApi.resolvePickupIssue(tripId, issueId),
    onSuccess: (_data, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.pickupIssues(tripId) });
      invalidateTripQueries(queryClient, tripId);
      addToast('success', t('trips.toast.issueResolved'));
    },
    onError: () => addToast('error', t('trips.toast.issueResolveFailed')),
  });
}

export function useConfirmCodHandover() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ tripId, handoverId }: { tripId: number; handoverId: number }) =>
      tripsApi.confirmCodHandover(tripId, handoverId),
    onSuccess: (_data, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.codHandovers(tripId) });
      invalidateTripQueries(queryClient, tripId);
      addToast('success', t('trips.toast.handoverConfirmed'));
    },
    onError: () => addToast('error', t('trips.toast.handoverConfirmFailed')),
  });
}
