import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/usersApi';
import { usersKeys } from './useUsers';
import { useToastStore } from '@/stores/toastStore';

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (userId: number) => usersApi.delete(userId),
    onMutate: async (userId: number) => {
      await queryClient.cancelQueries({ queryKey: usersKeys.lists() });
      const previousData = queryClient.getQueriesData({ queryKey: usersKeys.lists() });
      queryClient.setQueriesData({ queryKey: usersKeys.lists() }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('data' in (old as Record<string, unknown>))) return old;
        const typed = old as { data: Array<{ id: number }> };
        return { ...typed, data: typed.data.filter((u) => u.id !== userId) };
      });
      return { previousData };
    },
    onSuccess: () => {
      addToast('success', 'User deleted successfully');
    },
    onError: (err, _userId, context) => {
      if (context?.previousData) {
        for (const [key, data] of context.previousData) {
          queryClient.setQueryData(key, data);
        }
      }
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to delete user');
      addToast('error', message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}
