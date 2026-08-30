import { apiClient } from '@/lib/axios';
import { env } from '@/config/env';

const STORAGE_KEY = 'nexa-api-base-url';

export function getCachedBaseUrl(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setCachedBaseUrl(url: string) {
  localStorage.setItem(STORAGE_KEY, url);
}

export function getEffectiveBaseUrl(): string {
  return getCachedBaseUrl() || env.API_BASE_URL;
}

export function applyBaseUrl(url: string) {
  const normalized = url.replace(/\/$/, '');
  apiClient.defaults.baseURL = import.meta.env.DEV ? '' : normalized;
  setCachedBaseUrl(normalized);
}

export async function initApiBaseUrl(): Promise<void> {
  const cached = getCachedBaseUrl();
  if (cached && !import.meta.env.DEV) {
    apiClient.defaults.baseURL = cached;
  }
  try {
    const res = await apiClient.get<{ success: boolean; data: { base_url: string; api_base_url: string } }>('/api/v1/config/base-url');
    const url = res.data?.data?.base_url || res.data?.data?.api_base_url;
    if (url && url !== cached) {
      applyBaseUrl(url);
    } else if (url && !cached) {
      setCachedBaseUrl(url.replace(/\/$/, ''));
    }
  } catch {
  }
}
