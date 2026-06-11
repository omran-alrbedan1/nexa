/**
 * API Response Helpers.
 *
 * The Laravel backend wraps all API responses in a standard envelope:
 *   { success: true, message: "OK", data: { ...actualData... } }
 *
 * These helpers unwrap the envelope and extract the nested `data` field,
 * so frontend code never has to deal with the envelope.
 */

import type { ApiResponse } from '@/types/common';

// ──────────────────────────────────────────────
// Response unwrapper
// ──────────────────────────────────────────────

/**
 * Unwrap the ApiResponse envelope and return just the `data` field.
 *
 * Usage in API services:
 *
 *   import { unwrap } from '@/lib/apiHelpers';
 *   import { apiClient } from '@/lib/axios';
 *
 *   export const myApi = {
 *     getList: async (): Promise<MyType[]> => {
 *       const response = await apiClient.get<ApiResponse<MyType[]>>('/api/v1/endpoint');
 *       return unwrap(response.data);
 *     },
 *   };
 */
export function unwrap<T>(response: ApiResponse<T>): T {
  return response.data;
}

/**
 * Unwrap with fallback — returns `fallback` if the API call fails or returns falsy data.
 *
 * Useful for widgets that should show empty state instead of crashing on error.
 *
 * Usage:
 *
 *   const data = await safeFetch(
 *     () => apiClient.get<ApiResponse<MyType[]>>('/api/v1/endpoint').then(r => unwrap(r.data)),
 *     []
 *   );
 */
export async function safeFetch<T>(
  fetcher: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    const result = await fetcher();
    return result ?? fallback;
  } catch {
    return fallback;
  }
}

// ──────────────────────────────────────────────
// Error message extractor
// ──────────────────────────────────────────────

/**
 * Extract a human-readable error message from an API error response.
 * Handles Laravel's validation error format and generic errors.
 *
 * Usage in mutation onError callbacks:
 *
 *   onError: (error) => {
 *     const message = extractErrorMessage(error);
 *     addToast('error', message);
 *   }
 */
export function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
    const data = axiosError.response?.data;
    if (data?.message) return data.message;
    if (data?.errors) {
      const firstError = Object.values(data.errors).flat()[0];
      if (firstError) return firstError;
    }
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

/**
 * Extract validation errors from a Laravel API error response.
 * Returns a record of field → first error message, or null if not a validation error.
 *
 * Usage:
 *
 *   const fieldErrors = extractValidationErrors(error);
 *   if (fieldErrors) {
 *     setErrors(fieldErrors);
 *   }
 */
export function extractValidationErrors(
  error: unknown
): Record<string, string> | null {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { errors?: Record<string, string[]> } } };
    const errors = axiosError.response?.data?.errors;
    if (errors) {
      const result: Record<string, string> = {};
      for (const [field, messages] of Object.entries(errors)) {
        result[field] = messages[0];
      }
      return result;
    }
  }
  return null;
}
