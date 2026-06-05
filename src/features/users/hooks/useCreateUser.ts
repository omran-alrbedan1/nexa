import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, type CreateUserDto } from '../api/usersApi';
import { usersKeys } from './useUsers';
import { useToastStore } from '@/stores/toastStore';

export function useCreateUser() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (dto: CreateUserDto) => usersApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      addToast('success', 'User created successfully');
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to create user');
      addToast('error', message);
    },
  });
}
