import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toastStore';
import { campaignsApi, type CampaignsPageData } from '../api/campaignsApi';

export const campaignKeys = {
  all: ['campaigns'] as const,
  pageData: () => [...campaignKeys.all, 'page-data'] as const,
  detail: (id: number) => [...campaignKeys.all, 'detail', id] as const,
};

export function useCampaignsPage() {
  return useQuery<CampaignsPageData>({
    queryKey: campaignKeys.pageData(),
    queryFn: () => campaignsApi.getPageData(),
    staleTime: 30_000,
  });
}

export function useCampaignAction() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'activate' | 'end' | 'cancel' }) =>
      campaignsApi.campaignAction(id, action),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.pageData() });
      const labels = { activate: 'activated', end: 'ended', cancel: 'cancelled' };
      addToast('success', t('campaigns.toast.updated', { action: labels[variables.action] }));
    },
    onError: () => addToast('error', t('campaigns.toast.updateFailed')),
  });
}
