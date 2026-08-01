import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toastStore';
import { provincesApi, type ProvincesPageData } from '../api/provincesApi';

export const provinceKeys = {
  all: ['provinces'] as const,
  list: (params?: Record<string, unknown>) => ['provinces', 'list', params] as const,
  detail: (id: number) => ['provinces', id] as const,
};

export function useProvincesList(params?: { country_id?: number; search?: string; page?: number }) {
  return useQuery<ProvincesPageData>({
    queryKey: provinceKeys.list(params),
    queryFn: () => provincesApi.getAll(params),
    staleTime: 30_000,
  });
}

export function useCreateProvince() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: { country_id: number; name_ar: string; name_en?: string; is_active?: boolean }) =>
      provincesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provinceKeys.all });
      addToast('success', t('locations.provinces.toast.created'));
    },
    onError: () => addToast('error', t('locations.provinces.toast.createFailed')),
  });
}

export function useUpdateProvince() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name_ar?: string; name_en?: string; is_active?: boolean } }) =>
      provincesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provinceKeys.all });
      addToast('success', t('locations.provinces.toast.updated'));
    },
    onError: () => addToast('error', t('locations.provinces.toast.updateFailed')),
  });
}

export function useToggleProvinceActive() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => provincesApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provinceKeys.all });
      addToast('success', t('locations.provinces.toast.toggled'));
    },
    onError: () => addToast('error', t('locations.provinces.toast.toggleFailed')),
  });
}

export function useDeleteProvince() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => provincesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provinceKeys.all });
      addToast('success', t('locations.provinces.toast.deleted'));
    },
    onError: () => addToast('error', t('locations.provinces.toast.deleteFailed')),
  });
}
