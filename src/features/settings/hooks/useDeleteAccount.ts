import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores/toastStore';

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    // Dummy implementation — just clears local state, no API call
    mutationFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      queryClient.clear();
    },
    onSuccess: () => {
      addToast('info', 'Your account has been deleted');
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to delete account';
      addToast('error', message);
    },
  });
}
