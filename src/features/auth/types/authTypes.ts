import type { User } from '@/types/marketplace';

/** POST /api/v1/auth/admin/login */
export interface LoginRequest {
  email: string;
  password: string;
  device_name?: string;
  remember?: boolean;
}

/** AuthTokenResource response from backend (wrapped in ApiResponse wrapper) */
export interface AuthTokenResource {
  token: string;
  token_type: string; // "Bearer"
  expires_at: string | null;
  user: User;
}

/** The full API response on login */
export interface LoginResponse {
  success: boolean;
  message: string;
  data: AuthTokenResource;
}

/** GET /api/v1/auth/me response */
export interface MeResponse {
  success: boolean;
  message: string;
  data: User;
}
