import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/usersApi';
import { usersKeys } from './useUsers';
import { useToastStore } from '@/stores/toastStore';

export function useBulkDeleteUsers() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (userIds: number[]) => Promise.all(userIds.map((id) => usersApi.delete(id))),
    onMutate: async (userIds: number[]) => {
      await queryClient.cancelQueries({ queryKey: usersKeys.lists() });
      const previousData = queryClient.getQueriesData({ queryKey: usersKeys.lists() });
      const idSet = new Set(userIds);
      queryClient.setQueriesData({ queryKey: usersKeys.lists() }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('data' in (old as Record<string, unknown>))) return old;
        const typed = old as { data: Array<{ id: number }> };
        return { ...typed, data: typed.data.filter((u) => !idSet.has(u.id)) };
      });
      return { previousData };
    },
    onSuccess: (_data, userIds) => {
      const count = userIds.length;
      addToast('success', `${count} user${count === 1 ? '' : 's'} deleted successfully`);
    },
    onError: (err, _userIds, context) => {
      if (context?.previousData) {
        for (const [key, data] of context.previousData) {
          queryClient.setQueryData(key, data);
        }
      }
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to delete users');
      addToast('error', message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}
