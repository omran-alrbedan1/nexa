import { apiClient } from '@/lib/axios';
import type { LoginRequest, LoginResponse, MeResponse } from '../types/authTypes';


export const authApi = {

  /** POST /api/v1/auth/admin/login — admin panel login */
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/api/v1/auth/admin/login', data).then((r) => r.data),

  /** GET /api/v1/auth/me — current authenticated user */
  me: () =>
    apiClient.get<MeResponse>('/api/v1/auth/me').then((r) => r.data),

  /** POST /api/v1/auth/logout — revoke current token */
  logout: () =>
    apiClient.post('/api/v1/auth/logout'),

  /** POST /api/v1/auth/logout-all — revoke all tokens */
  logoutAll: () =>
    apiClient.post('/api/v1/auth/logout-all'),
};
