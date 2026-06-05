import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/usersApi';
import { usersKeys } from './useUsers';
import type { ApiResponse } from '@/types/common';
import type { User } from '../types/userTypes';

export function useUser(id: number | undefined) {
  return useQuery<ApiResponse<User>>({
    queryKey: usersKeys.detail(id!),
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
  });
}
