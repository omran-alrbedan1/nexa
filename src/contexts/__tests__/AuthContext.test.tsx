import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../AuthContext';
import { authApi } from '@/features/auth/api/authApi';
import type { ReactNode } from 'react';

// Mock the auth API
vi.mock('@/features/auth/api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock the toast store — supports both hook usage (with selector) and getState()
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

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'viewer' as const,
  avatar: null,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

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

function clearAuthToken() {
  try { localStorage.removeItem('auth_token'); } catch { /* noop */ }
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAuthToken();
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

  it('fetches user on mount when token exists', async () => {
    localStorage.setItem('auth_token', 'test-token');
    vi.mocked(authApi.me).mockResolvedValue({ data: mockUser });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(authApi.me).toHaveBeenCalledOnce();
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('clears token when me() fails', async () => {
    localStorage.setItem('auth_token', 'invalid-token');
    vi.mocked(authApi.me).mockRejectedValue(new Error('Unauthorized'));

    renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  it('logs in successfully', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      data: { user: mockUser, token: 'new-token' },
      message: 'Success',
      success: true,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(authApi.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(localStorage.getItem('auth_token')).toBe('new-token');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('registers successfully', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      data: { user: mockUser, token: 'new-token' },
      message: 'Success',
      success: true,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.register('Test User', 'test@example.com', 'password123');
    });

    expect(authApi.register).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(localStorage.getItem('auth_token')).toBe('new-token');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logs out successfully', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      data: { user: mockUser, token: 'test-token' },
      message: 'Success',
      success: true,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });
    expect(result.current.isAuthenticated).toBe(true);

    vi.mocked(authApi.logout).mockResolvedValue(undefined);

    await act(async () => {
      await result.current.logout();
    });

    expect(authApi.logout).toHaveBeenCalledOnce();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('clears local state even if logout API fails', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      data: { user: mockUser, token: 'test-token' },
      message: 'Success',
      success: true,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    vi.mocked(authApi.logout).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      await result.current.logout();
    });

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('propagates login errors to the caller', async () => {
    const apiError = new Error('Invalid credentials');
    (apiError as Record<string, unknown>).response = {
      data: { message: 'Invalid email or password' },
    };
    vi.mocked(authApi.login).mockRejectedValue(apiError);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(
      act(async () => {
        await result.current.login('wrong@example.com', 'wrong');
      })
    ).rejects.toThrow('Invalid credentials');
  });
});
