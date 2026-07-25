import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => driversApi.toggleAvailability(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
      addToast('success', data.isAvailable ? t('drivers.toast.markedAvailable') : t('drivers.toast.markedUnavailable'));
    },
    onError: () => addToast('error', t('drivers.toast.statusUpdateFailed')),
  });
}

export function useApproveDriver() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => driversApi.approveDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
      addToast('success', t('drivers.toast.approved'));
    },
    onError: () => addToast('error', t('drivers.toast.approveFailed')),
  });
}

export function useRejectDriver() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => driversApi.rejectDriver(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
      addToast('success', t('drivers.toast.rejected'));
    },
    onError: () => addToast('error', t('drivers.toast.rejectFailed')),
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: {
      first_name: string;
      last_name?: string;
      phone: string;
      email?: string;
      vehicle_type?: string;
      vehicle_plate?: string;
      license_number?: string;
      zone_id?: number;
      address_line1?: string;
    }) => driversApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driverKeys.all });
      addToast('success', t('drivers.toast.created'));
    },
    onError: () => addToast('error', t('drivers.toast.createFailed')),
  });
}
