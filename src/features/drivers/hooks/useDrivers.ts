import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi, type DriversPageData } from '../api/driversApi';
import { useToastStore } from '@/stores/toastStore';

export const driverKeys = {
  all: ['drivers'] as const,
  pageData: () => [...driverKeys.all, 'page-data'] as const,
};

export function useDriversPage() {
  return useQuery<DriversPageData>({
    queryKey: driverKeys.pageData(),
    queryFn: () => driversApi.getPageData(),
    staleTime: 30_000,
  });
}

export function useToggleDriverAvailability() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => driversApi.toggleAvailability(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: driverKeys.pageData() });
      addToast('success', data.isAvailable ? 'Driver marked available' : 'Driver marked unavailable');
    },
    onError: () => addToast('error', 'Failed to update driver status'),
  });
}

export function useApproveDriver() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => driversApi.approveDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
      addToast('success', 'Driver approved');
    },
    onError: () => addToast('error', 'Failed to approve driver'),
  });
}

export function useRejectDriver() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => driversApi.rejectDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
      addToast('success', 'Driver rejected');
    },
    onError: () => addToast('error', 'Failed to reject driver'),
  });
}
