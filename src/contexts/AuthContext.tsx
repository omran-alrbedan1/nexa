import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/stores/toastStore';
import { authApi } from '@/features/auth/api/authApi';
import { setAuthToken } from '@/lib/axios';
import type { User, UserRole, UserType } from '@/types/marketplace';
import { userTypeToDashboardRole } from '@/types/marketplace';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ──────────────────────────────────────────────
// Helper: map backend user shape to frontend User
// ──────────────────────────────────────────────
function mapBackendUser(backendUser: Record<string, unknown>): User {
  const userType = (backendUser.user_type as UserType) || 'staff';
  const permissions = (backendUser.permissions as string[]) || [];
  const roles = (backendUser.roles as string[]) || [];
  const role: UserRole = userType === 'staff'
    ? userTypeToDashboardRole(permissions, roles)
    : (userType as UserRole);

  return {
    id: backendUser.id as number,
    first_name: backendUser.first_name as string,
    last_name: backendUser.last_name as string | null,
    full_name: backendUser.full_name as string,
    phone: backendUser.phone as string | null,
    email: backendUser.email as string | null,
    avatar: backendUser.avatar as string | null,
    user_type: userType,
    status: (backendUser.status as User['status']) || 'active',
    role,
    roles,
    permissions,
    customer_profile: backendUser.customer_profile as Record<string, unknown> | null,
    supplier_profile: backendUser.supplier_profile as Record<string, unknown> | null,
    driver_profile: backendUser.driver_profile as Record<string, unknown> | null,
    registration_source: backendUser.registration_source as string | null,
    phone_verified_at: backendUser.phone_verified_at as string | null,
    email_verified_at: backendUser.email_verified_at as string | null,
    last_login_at: backendUser.last_login_at as string | null,
    createdAt: backendUser.created_at as string || backendUser.createdAt as string,
    updatedAt: backendUser.updated_at as string || backendUser.updatedAt as string,
  } satisfies User;
}

/** Default route per role after login */
export function getDefaultRoute(role: UserRole | undefined): string {
  const routes: Partial<Record<UserRole, string>> = {
    admin: '/dashboard',
    operations: '/dashboard',
    aggregation: '/dashboard',
    staff: '/dashboard',
  };
  return role ? (routes[role] ?? '/dashboard') : '/dashboard';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  // ── On mount: verify session via backend (httpOnly cookie) ──
  useEffect(() => {
    authApi
      .me()
      .then((res) => {
        const payload = res as unknown as Record<string, unknown>;
        const data = payload.data as Record<string, unknown> | undefined;
        const backendUser = ((data?.user ?? data) ?? payload) as Record<string, unknown>;
        setUser(mapBackendUser(backendUser));
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ── Login: call the real backend API ──
  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login({ email, password });

      // response = { success, message, data: { token, token_type, expires_at, user } }
      const { token, user: backendUser } = response.data;
      setAuthToken(token);

      const mappedUser = mapBackendUser(backendUser as unknown as Record<string, unknown>);
      setUser(mappedUser);

      addToast(
        'success',
        `Signed in as ${mappedUser.full_name}`
      );
    },
    [addToast]
  );

  // ── Logout: revoke session on backend + clear state ──
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the API call fails, clear local state
    }
    setAuthToken(null);
    setUser(null);
    queryClient.clear();
    addToast('info', 'Signed out');
  }, [queryClient, addToast]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
