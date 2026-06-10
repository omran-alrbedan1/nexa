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
import type { User, UserRole } from '@/types/marketplace';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ──────────────────────────────────────────────
// Dummy users — one for each platform role
// All use password: "password123"
// ──────────────────────────────────────────────
const DUMMY_USERS: User[] = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@test.com',
    phone: '+966501234567',
    role: 'admin',
    avatar: null,
    isActive: true,
    regionId: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Operations Staff',
    email: 'operations@test.com',
    phone: '+966501234568',
    role: 'operations',
    avatar: null,
    isActive: true,
    regionId: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 3,
    name: 'Warehouse Staff',
    email: 'warehouse@test.com',
    phone: '+966501234569',
    role: 'aggregation',
    avatar: null,
    isActive: true,
    regionId: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },

];

/** Map email → user for O(1) lookup */
const DUMMY_USER_MAP = new Map(DUMMY_USERS.map((u) => [u.email, u]));

/** Default route per role after login */
export function getDefaultRoute(role: UserRole | undefined): string {
  const routes: Partial<Record<UserRole, string>> = {
    admin: '/dashboard',
    operations: '/dashboard',
    aggregation: '/dashboard',
  };
  return role ? (routes[role] ?? '/dashboard') : '/dashboard';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const dummyUser = DUMMY_USER_MAP.get(email);

      if (dummyUser && password === 'password123') {
        localStorage.setItem('auth_token', `dummy-token-${dummyUser.role}-${Date.now()}`);
        localStorage.setItem('auth_user', JSON.stringify(dummyUser));
        setUser(dummyUser);
        addToast(
          'success',
          `Signed in as ${dummyUser.name} (${dummyUser.role})`
        );
      } else {
        throw new Error(
          'Invalid credentials.\n\nTry one of:\n' +
            [...DUMMY_USER_MAP.keys()]
              .map((e) => `  ${e} / password123`)
              .join('\n')
        );
      }
    },
    [addToast]
  );

  const logout = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
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
