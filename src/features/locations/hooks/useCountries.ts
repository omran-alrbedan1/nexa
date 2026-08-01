import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toastStore';
import { countriesApi, type CountriesPageData } from '../api/countriesApi';

export const countryKeys = {
  all: ['countries'] as const,
  pageData: () => [...countryKeys.all, 'page-data'] as const,
  detail: (id: number) => [...countryKeys.all, 'detail', id] as const,
};

export function useCountriesPage(params: { page?: number; search?: string } = {}) {
  return useQuery<CountriesPageData>({
    queryKey: [...countryKeys.pageData(), params],
    queryFn: () => countriesApi.getPageData({ ...params, perPage: params.page ? 15 : undefined }),
    staleTime: 30_000,
  });
}

export function useCountry(id: number) {
  return useQuery({
    queryKey: countryKeys.detail(id),
    queryFn: () => countriesApi.getById(id),
    enabled: id > 0,
    staleTime: 30_000,
  });
}

export function useCreateCountry() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (data: { name_ar: string; name_en?: string; code: string; dial_code?: string; is_active?: boolean }) =>
      countriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: countryKeys.all });
      addToast('success', t('locations.countries.toast.created'));
    },
    onError: () => addToast('error', t('locations.countries.toast.createFailed')),
  });
}

export function useUpdateCountry() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name_ar?: string; name_en?: string; code?: string; dial_code?: string; is_active?: boolean } }) =>
      countriesApi.update(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: countryKeys.all });
      queryClient.invalidateQueries({ queryKey: countryKeys.detail(vars.id) });
      addToast('success', t('locations.countries.toast.updated'));
    },
    onError: () => addToast('error', t('locations.countries.toast.updateFailed')),
  });
}

export function useToggleCountryActive() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => countriesApi.toggleActive(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: countryKeys.all });
      addToast('success', data.is_active ? t('locations.countries.toast.enabled') : t('locations.countries.toast.disabled'));
    },
    onError: () => addToast('error', t('locations.countries.toast.toggleFailed')),
  });
}

export function useDeleteCountry() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (id: number) => countriesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: countryKeys.all });
      addToast('success', t('locations.countries.toast.deleted'));
    },
    onError: () => addToast('error', t('locations.countries.toast.deleteFailed')),
  });
}
