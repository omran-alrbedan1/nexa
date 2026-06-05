import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoginPage } from '../LoginPage';

// Mock the auth API
vi.mock('@/features/auth/api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    me: vi.fn().mockRejectedValue(new Error('No token')),
    register: vi.fn(),
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

function renderLoginPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    try { localStorage.removeItem('auth_token'); } catch { /* noop */ }
  });

  it('renders the login form', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeDefined();
    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getByLabelText(/password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();
  });

  it('has a link to the register page', () => {
    renderLoginPage();

    const registerLink = screen.getByRole('link', { name: /sign up/i });
    expect(registerLink).toBeDefined();
    expect(registerLink.getAttribute('href')).toBe('/register');
  });

  it('submits the form with email and password', async () => {
    const user = userEvent.setup();
    const { authApi } = await import('@/features/auth/api/authApi');
    vi.mocked(authApi.login).mockResolvedValue({
      data: {
        user: {
          id: 1,
          name: 'Test',
          email: 'test@example.com',
          role: 'viewer',
          avatar: null,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        token: 'test-token',
      },
      message: 'Success',
      success: true,
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows error message on failed login', async () => {
    const user = userEvent.setup();
    const { authApi } = await import('@/features/auth/api/authApi');
    const apiError = new Error('Invalid credentials');
    (apiError as Record<string, unknown>).response = {
      data: { message: 'Invalid email or password' },
    };
    vi.mocked(authApi.login).mockRejectedValue(apiError);

    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeDefined();
    });
  });
});
