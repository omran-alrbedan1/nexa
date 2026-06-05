import { apiClient } from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types/common';
import type { User } from '../types/userTypes';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'operations' | 'aggregation' | 'supplier' | 'driver' | 'customer';
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: 'admin' | 'operations' | 'aggregation' | 'supplier' | 'driver' | 'customer';
  isActive?: boolean;
}

export interface UserQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

const ENDPOINT = '/users';

export const usersApi = {
  list: (params?: UserQueryParams) =>
    apiClient.get<PaginatedResponse<User>>(ENDPOINT, { params }).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<ApiResponse<User>>(`${ENDPOINT}/${id}`).then((r) => r.data),

  create: (dto: CreateUserDto) =>
    apiClient.post<ApiResponse<User>>(ENDPOINT, dto).then((r) => r.data),

  update: (id: number, dto: UpdateUserDto) =>
    apiClient.put<ApiResponse<User>>(`${ENDPOINT}/${id}`, dto).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`${ENDPOINT}/${id}`).then((r) => r.data),
};
