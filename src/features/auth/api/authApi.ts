import { apiClient } from '@/lib/axios';
import type { LoginRequest, LoginResponse } from '../types/authTypes';
import type { ApiResponse } from '@/types/common';
import type { User } from '@/types/marketplace';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data).then((r) => r.data),


  me: () => apiClient.get<ApiResponse<User>>('/auth/me').then((r) => r.data),

  logout: () => apiClient.post('/auth/logout'),

};
