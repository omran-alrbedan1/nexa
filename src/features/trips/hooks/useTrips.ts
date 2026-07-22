import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toastStore';
import { tripsApi, type TripsPageData } from '../api/tripsApi';

export const tripKeys = {
  all: ['trips'] as const,
  pageData: () => [...tripKeys.all, 'page-data'] as const,
  list: () => [...tripKeys.all, 'list'] as const,
};

export function useTripsPage() {
  return useQuery<TripsPageData>({
    queryKey: tripKeys.pageData(),
    queryFn: () => tripsApi.getPageData(),
    staleTime: 30_000,
  });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ tripId, driverId }: { tripId: number; driverId: number }) =>
      tripsApi.assignDriver(tripId, driverId),
    onSuccess: (_data, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.pageData() });
      queryClient.invalidateQueries({ queryKey: [...tripKeys.all, 'detail', tripId] });
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
      queryClient.invalidateQueries({ queryKey: tripKeys.pageData() });
      queryClient.invalidateQueries({ queryKey: [...tripKeys.all, 'detail', tripId] });
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
      queryClient.invalidateQueries({ queryKey: tripKeys.pageData() });
      queryClient.invalidateQueries({ queryKey: [...tripKeys.all, 'detail', tripId] });
      addToast('success', t('trips.toast.tripCompleted'));
    },
    onError: () => addToast('error', t('trips.toast.tripCompleteFailed')),
  });
}
