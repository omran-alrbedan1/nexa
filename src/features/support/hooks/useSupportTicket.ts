import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useToastStore } from '@/stores/toastStore';
import { supportApi } from '../api/supportApi';
import { extractErrorMessage } from '@/lib/apiHelpers';

export function useTicketDetail(id: number) {
  return useQuery({
    queryKey: ['support-ticket', id],
    queryFn: () => supportApi.get(id),
    enabled: id > 0,
    refetchInterval: 15_000,
  });
}

export function useSendMessage(ticketId: number) {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (data: { message?: string; is_internal?: boolean }) =>
      supportApi.sendMessage(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
    },
    onError: (err) => {
      addToast('error', extractErrorMessage(err));
    },
  });
}

export function useUpdateTicketStatus(ticketId: number) {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (status: string) => supportApi.updateStatus(ticketId, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      addToast('success', `Ticket ${data.status} — updated successfully`);
    },
    onError: (err) => {
      addToast('error', extractErrorMessage(err));
    },
  });
}
