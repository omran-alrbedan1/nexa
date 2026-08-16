import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toastStore';
import { supportApi, type SupportListResponse, type SupportTicketDetail, type SupportTicketMessage } from '../api/supportApi';
import { extractErrorMessage } from '@/lib/apiHelpers';
import { useAuth } from '@/contexts/AuthContext';

export const supportTicketKeys = {
  all: ['support-tickets'] as const,
  pageData: () => [...supportTicketKeys.all, 'page-data'] as const,
  detail: (id: number) => [...supportTicketKeys.all, 'detail', id] as const,
};

export function useTicketsPage(params: { page?: number; search?: string; status?: string } = {}) {
  return useQuery<SupportListResponse>({
    queryKey: [...supportTicketKeys.pageData(), params],
    queryFn: () => supportApi.list(params),
    staleTime: 30_000,
  });
}

export function useTicketDetail(id: number) {
  return useQuery({
    queryKey: supportTicketKeys.detail(id),
    queryFn: () => supportApi.get(id),
    enabled: id > 0,
  });
}

export function useSendMessage(ticketId: number) {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: { message?: string; is_internal?: boolean }) =>
      supportApi.sendMessage(ticketId, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: supportTicketKeys.detail(ticketId) });
      const previous = queryClient.getQueryData<SupportTicketDetail>(supportTicketKeys.detail(ticketId));
      if (previous) {
        const tempMessage: SupportTicketMessage = {
          id: -Date.now(),
          message: data.message ?? null,
          is_internal: data.is_internal ?? false,
          user: user ? { id: user.id, full_name: user.full_name } : null,
          created_at: new Date().toISOString(),
        };
        queryClient.setQueryData<SupportTicketDetail>(supportTicketKeys.detail(ticketId), {
          ...previous,
          messages: [...(previous.messages || []), tempMessage],
        });
      }
      return { previous };
    },
    onSuccess: (result) => {
      queryClient.setQueryData<SupportTicketDetail>(supportTicketKeys.detail(ticketId), result);
    },
    onError: (err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(supportTicketKeys.detail(ticketId), context.previous);
      }
      addToast('error', extractErrorMessage(err));
    },
  });
}

export function useUpdateTicketStatus(ticketId: number) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (status: string) => supportApi.updateStatus(ticketId, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.pageData() });
      addToast('success', t('support.toast.statusUpdated', { status: data.status }));
    },
    onError: (err) => {
      addToast('error', extractErrorMessage(err));
    },
  });
}
