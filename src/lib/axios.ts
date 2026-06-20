import axios from 'axios';
import { env } from '@/config/env';
import { useToastStore } from '@/stores/toastStore';

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Send current language to backend for localization
  const lang = localStorage.getItem('nexa-lang') || 'en';
  config.headers['Accept-Language'] = lang;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const requestUrl = error.config?.url || '';

      // 401 — clear session and redirect to login (no toast, handled by ProtectedRoute)
      // Skip the redirect for login endpoint — a 401 there means wrong credentials, not expired session
      if (error.response?.status === 401 && !requestUrl.includes('/login')) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Network error (no response received) — show global toast
      // These errors are NOT caught by local mutation onError handlers
      if (!error.response) {
        useToastStore.getState().addToast(
          'error',
          'Network error. Please check your connection and try again.'
        );
        return Promise.reject(error);
      }

      // 5xx server errors without a useful body — show global toast
      // These indicate server issues, not client-side validation errors
      if (error.response.status >= 500 && !error.response.data?.message) {
        useToastStore.getState().addToast(
          'error',
          `Server error (${error.response.status}). Please try again later.`
        );
      }
      // 4xx errors and 5xx with data.message are expected to be handled
      // by local mutation onError callbacks — no global toast to avoid duplicates
    }

    return Promise.reject(error);
  }
);
