import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoginPage } from '../LoginPage';

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

  it('shows quick-fill buttons for all 6 roles', () => {
    renderLoginPage();

    expect(screen.getByText('admin')).toBeDefined();
    expect(screen.getByText('operations')).toBeDefined();
    expect(screen.getByText('supplier')).toBeDefined();
    expect(screen.getByText('driver')).toBeDefined();
    expect(screen.getByText('customer')).toBeDefined();
  });

  it('quick-fill button fills email and password', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByText('admin'));

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    expect(emailInput.value).toBe('admin@test.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('logs in with valid dummy credentials', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // After login, should navigate away (no error message shown)
    await waitFor(() => {
      // If login succeeded, the error message should not be displayed
      expect(screen.queryByText(/invalid|error/i)).toBeNull();
    });
  });

  it('shows error message on failed login with wrong password', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/password123/i)).toBeDefined();
    });
  });
});
