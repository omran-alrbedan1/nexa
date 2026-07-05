import { extractErrorMessage } from './apiHelpers';

/**
 * Application-level error with structured context.
 * Preserves the original error message, status code, and response data
 * so that React Query's onError / extractErrorMessage can display
 * meaningful messages to the user.
 */
export class AppError extends Error {
  public readonly statusCode: number | null;
  public readonly responseData: unknown;

  constructor(message: string, statusCode?: number | null, responseData?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode ?? null;
    this.responseData = responseData;
  }
}

/**
 * Convert an unknown error (AxiosError, Error, string, etc.) into an AppError.
 * Preserves as much context as possible.
 */
export function toAppError(error: unknown, fallbackMessage?: string): AppError {
  if (error instanceof AppError) return error;

  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as {
      response?: { status?: number; data?: unknown };
      message?: string;
    };
    const statusCode = axiosError.response?.status ?? null;
    const message = extractErrorMessage(error);
    return new AppError(message, statusCode, axiosError.response?.data);
  }

  if (error instanceof Error) {
    return new AppError(error.message);
  }

  return new AppError(fallbackMessage ?? 'An unexpected error occurred');
}
