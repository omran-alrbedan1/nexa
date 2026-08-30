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
