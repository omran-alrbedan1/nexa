import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { extractErrorMessage } from '@/lib/apiHelpers';
import { useToastStore } from '@/stores/toastStore';
import { colorsApi, type GlobalColorInput, type GlobalColorListParams } from '../api/colorsApi';

export const globalColorKeys = {
  all: ['global-colors'] as const,
  lists: () => [...globalColorKeys.all, 'list'] as const,
  list: (params: GlobalColorListParams) => [...globalColorKeys.lists(), params] as const,
};

function isColorInUseError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('response' in error)) return false;
  const data = (error as { response?: { data?: Record<string, unknown> } }).response?.data;
  return data?.error_code === 'color_in_use' || data?.code === 'color_in_use' || data?.error === 'color_in_use' || data?.message === 'color_in_use';
}

function useGlobalColorMutationToast() {
  const { t } = useTranslation();
  const addToast = useToastStore((state) => state.addToast);
  return { t, addToast };
}

export function useColors(params: GlobalColorListParams) {
  return useQuery({
    queryKey: globalColorKeys.list(params),
    queryFn: () => colorsApi.list(params),
    staleTime: 30_000,
  });
}

export function useCreateColor() {
  const queryClient = useQueryClient();
  const { t, addToast } = useGlobalColorMutationToast();
  return useMutation({
    mutationFn: (data: GlobalColorInput) => colorsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalColorKeys.all });
      addToast('success', t('colors.toast.created'));
    },
    onError: (error) => addToast('error', extractErrorMessage(error)),
  });
}

export function useUpdateColor() {
  const queryClient = useQueryClient();
  const { t, addToast } = useGlobalColorMutationToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GlobalColorInput> }) => colorsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalColorKeys.all });
      addToast('success', t('colors.toast.updated'));
    },
    onError: (error) => addToast('error', extractErrorMessage(error)),
  });
}

export function useToggleColor() {
  const queryClient = useQueryClient();
  const { t, addToast } = useGlobalColorMutationToast();
  return useMutation({
    mutationFn: (id: number) => colorsApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalColorKeys.all });
      addToast('success', t('colors.toast.toggled'));
    },
    onError: (error) => addToast('error', extractErrorMessage(error)),
  });
}

export function useDeleteColor() {
  const queryClient = useQueryClient();
  const { t, addToast } = useGlobalColorMutationToast();
  return useMutation({
    mutationFn: (id: number) => colorsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: globalColorKeys.all });
      addToast('success', t('colors.toast.deleted'));
    },
    onError: (error) => {
      addToast('error', isColorInUseError(error) ? t('colors.errors.colorInUse') : extractErrorMessage(error));
    },
  });
}
