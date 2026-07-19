import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi, type DriversPageData, type DriverApprovalStatus } from '../api/driversApi';
import { useToastStore } from '@/stores/toastStore';

export const driverKeys = {
  all: ['drivers'] as const,
  pageData: (filters?: { approval_status?: DriverApprovalStatus }) => [...driverKeys.all, 'page-data', filters ?? {}] as const,
  detail: (id: number) => [...driverKeys.all, 'detail', id] as const,
};

export function useDriversPage(filters?: { approval_status?: DriverApprovalStatus }) {
  return useQuery<DriversPageData>({
    queryKey: driverKeys.pageData(filters),
    queryFn: () => driversApi.getPageData(filters),
    staleTime: 30_000,
  });
}

export function useToggleDriverAvailability() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => driversApi.toggleAvailability(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
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
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => driversApi.rejectDriver(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
      addToast('success', 'Driver rejected');
    },
    onError: () => addToast('error', 'Failed to reject driver'),
  });
}
