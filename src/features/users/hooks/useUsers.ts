import { useQuery } from '@tanstack/react-query';
import { usersApi, type UserQueryParams } from '../api/usersApi';
import type { PaginatedResponse } from '@/types/common';
import type { User } from '../types/userTypes';

export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (params: UserQueryParams) => [...usersKeys.lists(), params] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: number) => [...usersKeys.details(), id] as const,
};

export function useUsers(params: UserQueryParams = {}) {
  return useQuery<PaginatedResponse<User>>({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: (previousData) => previousData,
  });
}
