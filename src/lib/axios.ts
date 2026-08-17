import axios from 'axios';
import { env } from '@/config/env';
import { useToastStore } from '@/stores/toastStore';
import i18n from '@/i18n';

let _authToken: string | null = localStorage.getItem('auth_token');

export function setAuthToken(token: string | null) {
  _authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function getAuthToken(): string | null {
  return _authToken;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? '' : env.API_BASE_URL,
  timeout: 15_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  // Send current language to backend for localization
  const lang = localStorage.getItem('nexa-lang') || 'en';
  config.headers['Accept-Language'] = lang;
  // Attach auth token if available (backend uses Bearer token auth)
  if (_authToken) {
    config.headers.Authorization = `Bearer ${_authToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const requestUrl = error.config?.url || '';

      // 401 — redirect to login (session expired/invalid)
      // Skip redirect for login endpoint — a 401 there means wrong credentials
      if (error.response?.status === 401 && !requestUrl.includes('/login') && window.location.pathname !== '/login') {
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Network error (no response received) — show global toast
      // These errors are NOT caught by local mutation onError handlers
      if (!error.response) {
        useToastStore.getState().addToast(
          'error',
          i18n.t('common.networkError')
        );
        return Promise.reject(error);
      }

      // 5xx server errors without a useful body — show global toast
      // These indicate server issues, not client-side validation errors
      if (error.response.status >= 500 && !error.response.data?.message) {
        useToastStore.getState().addToast(
          'error',
          i18n.t('common.serverError', { status: error.response.status })
        );
      }
      // 4xx errors and 5xx with data.message are expected to be handled
      // by local mutation onError callbacks — no global toast to avoid duplicates
    }

    return Promise.reject(error);
  }
);
