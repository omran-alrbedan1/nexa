import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toastStore';
import { serviceRegionsApi, type ServiceRegion } from '../api/serviceRegionsApi';

export const serviceRegionKeys = {
  all: ['service-regions'] as const,
  list: (params?: Record<string, unknown>) => ['service-regions', 'list', params] as const,
};

export function useServiceRegionsList(params?: { search?: string; page?: number }) {
  return useQuery<{ data: ServiceRegion[]; total: number }>({
    queryKey: serviceRegionKeys.list(params),
    queryFn: () => serviceRegionsApi.getAll(params),
    staleTime: 30_000,
  });
}

export function useCreateServiceRegion() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: { code: string; name_ar: string; name_en?: string; country_code?: string; display_order?: number; is_active?: boolean }) =>
      serviceRegionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceRegionKeys.all });
      addToast('success', t('locations.serviceRegions.toast.created'));
    },
    onError: () => addToast('error', t('locations.serviceRegions.toast.createFailed')),
  });
}

export function useUpdateServiceRegion() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { code?: string; name_ar?: string; name_en?: string; country_code?: string; display_order?: number; is_active?: boolean } }) =>
      serviceRegionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceRegionKeys.all });
      addToast('success', t('locations.serviceRegions.toast.updated'));
    },
    onError: () => addToast('error', t('locations.serviceRegions.toast.updateFailed')),
  });
}

export function useToggleServiceRegionActive() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => serviceRegionsApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceRegionKeys.all });
      addToast('success', t('locations.serviceRegions.toast.toggled'));
    },
    onError: () => addToast('error', t('locations.serviceRegions.toast.toggleFailed')),
  });
}

export function useDeleteServiceRegion() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => serviceRegionsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceRegionKeys.all });
      addToast('success', t('locations.serviceRegions.toast.deleted'));
    },
    onError: () => addToast('error', t('locations.serviceRegions.toast.deleteFailed')),
  });
}
