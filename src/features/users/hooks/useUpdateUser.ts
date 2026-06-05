import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, type UpdateUserDto } from '../api/usersApi';
import { usersKeys } from './useUsers';
import { useToastStore } from '@/stores/toastStore';

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateUserDto }) => usersApi.update(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(variables.id) });
      addToast('success', 'User updated successfully');
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to update user');
      addToast('error', message);
    },
  });
}
