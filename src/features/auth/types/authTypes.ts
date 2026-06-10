import type { User } from '@/types/marketplace';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  data: {
    user: User;
    token: string;
  };
  message: string;
  success: boolean;
}
