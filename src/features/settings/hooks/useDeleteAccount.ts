import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/features/auth/api/authApi';
import { useToastStore } from '@/stores/toastStore';

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: () => authApi.deleteAccount(),
    onSuccess: () => {
      localStorage.removeItem('auth_token');
      queryClient.clear();
      addToast('info', 'Your account has been deleted');
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to delete account');
      addToast('error', message);
    },
  });
}
