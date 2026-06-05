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
import type { User } from '@/features/users/types/userTypes';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DUMMY_USER: User = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  avatar: null,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

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

  const login = useCallback(async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (email === 'test@example.com' && password === 'password123') {
      localStorage.setItem('auth_token', 'dummy-token-123');
      localStorage.setItem('auth_user', JSON.stringify(DUMMY_USER));
      setUser(DUMMY_USER);
      addToast('success', 'Signed in successfully');
    } else {
      throw new Error('Invalid credentials. Use test@example.com and password123.');
    }
  }, [addToast]);

  const register = useCallback(async (name: string, email: string, _password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newUser: User = {
      id: Date.now(),
      name,
      email,
      role: 'viewer',
      avatar: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('auth_token', 'dummy-token-' + Date.now());
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setUser(newUser);
    addToast('success', 'Account created successfully');
  }, [addToast]);

  const logout = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    queryClient.clear();
    addToast('info', 'Signed out');
  }, [queryClient, addToast]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
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