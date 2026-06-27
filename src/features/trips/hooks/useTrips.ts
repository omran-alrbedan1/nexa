import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ tripId, driverId }: { tripId: number; driverId: number }) =>
      tripsApi.assignDriver(tripId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.pageData() });
      addToast('success', 'Driver assigned to trip');
    },
    onError: () => addToast('error', 'Failed to assign driver'),
  });
}

export function useStartTrip() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (tripId: number) => tripsApi.startTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.pageData() });
      addToast('success', 'Trip started');
    },
    onError: () => addToast('error', 'Failed to start trip'),
  });
}

export function useCompleteTrip() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (tripId: number) => tripsApi.completeTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.pageData() });
      addToast('success', 'Trip completed');
    },
    onError: () => addToast('error', 'Failed to complete trip'),
  });
}
