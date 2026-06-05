import type { User } from '@/features/users/types/userTypes';

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

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}
