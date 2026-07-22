import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/stores/toastStore';
import { supportApi, type SupportTicketDetail, type SupportTicketMessage } from '../api/supportApi';
import { extractErrorMessage } from '@/lib/apiHelpers';
import { useAuth } from '@/contexts/AuthContext';

export function useTicketDetail(id: number) {
  return useQuery({
    queryKey: ['support-ticket', id],
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
      await queryClient.cancelQueries({ queryKey: ['support-ticket', ticketId] });
      const previous = queryClient.getQueryData<SupportTicketDetail>(['support-ticket', ticketId]);
      if (previous) {
        const tempMessage: SupportTicketMessage = {
          id: -Date.now(),
          message: data.message ?? null,
          is_internal: data.is_internal ?? false,
          user: user ? { id: user.id, full_name: user.full_name } : null,
          created_at: new Date().toISOString(),
        };
        queryClient.setQueryData<SupportTicketDetail>(['support-ticket', ticketId], {
          ...previous,
          messages: [...(previous.messages || []), tempMessage],
        });
      }
      return { previous };
    },
    onSuccess: (result) => {
      queryClient.setQueryData<SupportTicketDetail>(['support-ticket', ticketId], result);
    },
    onError: (err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['support-ticket', ticketId], context.previous);
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
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      addToast('success', t('support.toast.statusUpdated', { status: data.status }));
    },
    onError: (err) => {
      addToast('error', extractErrorMessage(err));
    },
  });
}
