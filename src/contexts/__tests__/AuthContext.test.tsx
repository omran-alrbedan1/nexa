import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../AuthContext';
import type { ReactNode } from 'react';

// Mock the toast store
const mockAddToast = vi.fn();
vi.mock('@/stores/toastStore', () => ({
  useToastStore: Object.assign(
    (selector?: (s: { addToast: typeof mockAddToast }) => unknown) => {
      const state = { addToast: mockAddToast };
      return selector ? selector(state) : state;
    },
    { getState: () => ({ addToast: mockAddToast }) }
  ),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

function clearLocalStorage() {
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  } catch { /* noop */ }
}

describe('useAuth (dummy data)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearLocalStorage();
  });

  it('throws when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  it('initializes with no user', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('restores user from localStorage on mount', async () => {
    const savedUser = {
      id: 1,
      name: 'Test User',
      email: 'admin@test.com',
      phone: '+966501234567',
      role: 'admin' as const,
      avatar: null,
      isActive: true,
      regionId: null,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    localStorage.setItem('auth_token', 'dummy-token');
    localStorage.setItem('auth_user', JSON.stringify(savedUser));

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(savedUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logs in with valid dummy credentials', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('admin@test.com', 'password123');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.name).toBe('Admin User');
    expect(result.current.user?.role).toBe('admin');
    expect(localStorage.getItem('auth_token')).toContain('dummy-token');
  });

  it('throws error for invalid credentials', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.login('wrong@test.com', 'wrongpass');
      })
    ).rejects.toThrow(/Invalid credentials/i);
  });

  it('registers a new user as customer role', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    await act(async () => {
      await result.current.register('New User', 'new@test.com', 'password123');
    });

    expect(result.current).not.toBeNull();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.name).toBe('New User');
    expect(result.current.user?.role).toBe('customer');
    expect(localStorage.getItem('auth_token')).toContain('dummy-token');
  });

  it('logs out successfully', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    // Login first
    await act(async () => {
      await result.current.login('admin@test.com', 'password123');
    });
    expect(result.current).not.toBeNull();
    expect(result.current.isAuthenticated).toBe(true);

    // Logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current).not.toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('can login with all 6 dummy accounts', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const accounts = [
      { email: 'admin@test.com', expectedRole: 'admin' },
      { email: 'operations@test.com', expectedRole: 'operations' },
      { email: 'warehouse@test.com', expectedRole: 'aggregation' },
      { email: 'supplier@test.com', expectedRole: 'supplier' },
      { email: 'driver@test.com', expectedRole: 'driver' },
      { email: 'customer@test.com', expectedRole: 'customer' },
    ];

    for (const account of accounts) {
      await act(async () => {
        await result.current.login(account.email, 'password123');
      });
      expect(result.current.user?.role).toBe(account.expectedRole);
    }
  });
});
