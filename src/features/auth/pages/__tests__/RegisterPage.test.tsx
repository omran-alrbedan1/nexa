import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { RegisterPage } from '../RegisterPage';

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

function renderRegisterPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    try { localStorage.removeItem('auth_token'); } catch { /* noop */ }
  });

  it('renders the registration form', () => {
    renderRegisterPage();

    expect(screen.getByRole('heading', { name: /create account/i })).toBeDefined();
    expect(screen.getByLabelText(/^name$/i)).toBeDefined();
    expect(screen.getByLabelText(/^email$/i)).toBeDefined();
    expect(screen.getByLabelText(/^password$/i)).toBeDefined();
    expect(screen.getByLabelText(/confirm password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /create account/i })).toBeDefined();
  });

  it('has a link to the login page', () => {
    renderRegisterPage();

    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toBeDefined();
    expect(loginLink.getAttribute('href')).toBe('/login');
  });

  it('submits the form with valid data', async () => {
    const user = userEvent.setup();
    const { authApi } = await import('@/features/auth/api/authApi');
    vi.mocked(authApi.register).mockResolvedValue({
      data: {
        user: {
          id: 1,
          name: 'New User',
          email: 'new@example.com',
          role: 'viewer',
          avatar: null,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        token: 'new-token',
      },
      message: 'Success',
      success: true,
    });

    renderRegisterPage();

    await user.type(screen.getByLabelText(/^name$/i), 'New User');
    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        password: 'Password1',
      });
    });
  });

  it('shows validation error for short name', async () => {
    const user = userEvent.setup();

    renderRegisterPage();

    await user.type(screen.getByLabelText(/^name$/i), 'J');
    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeDefined();
    });
  });

  it('shows validation error for mismatched passwords', async () => {
    const user = userEvent.setup();

    renderRegisterPage();

    await user.type(screen.getByLabelText(/^name$/i), 'New User');
    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.type(screen.getByLabelText(/confirm password/i), 'Different1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeDefined();
    });
  });

  it('shows error message on failed registration', async () => {
    const user = userEvent.setup();
    const { authApi } = await import('@/features/auth/api/authApi');
    const apiError = new Error('Registration failed');
    (apiError as Record<string, unknown>).response = {
      data: { message: 'Email already taken' },
    };
    vi.mocked(authApi.register).mockRejectedValue(apiError);

    renderRegisterPage();

    await user.type(screen.getByLabelText(/^name$/i), 'New User');
    await user.type(screen.getByLabelText(/^email$/i), 'taken@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already taken/i)).toBeDefined();
    });
  });
});
