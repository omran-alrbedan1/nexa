import { apiClient } from '@/lib/axios';
import type { LoginRequest, LoginResponse } from '../types/authTypes';
import type { ApiResponse } from '@/types/common';
import type { User } from '@/features/users/types/userTypes';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post<LoginResponse>('/auth/register', data).then((r) => r.data),

  me: () => apiClient.get<ApiResponse<User>>('/auth/me').then((r) => r.data),

  logout: () => apiClient.post('/auth/logout'),

  deleteAccount: () =>
    apiClient.delete<ApiResponse<void>>('/auth/account').then((r) => r.data),
};
