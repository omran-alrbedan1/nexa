/**
 * API contract types shared across the application.
 */

/** Standard API error shape returned by the backend */
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

/** Pagination metadata returned by list endpoints */
export interface PaginationMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

/** Generic paginated response wrapper */
export interface PaginatedData<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Query parameters for list endpoints */
export interface ListQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/** Generic filter state for list pages */
export interface FilterState {
  search: string;
  page: number;
  perPage: number;
  [key: string]: unknown;
}

/** API response wrapper type */
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
