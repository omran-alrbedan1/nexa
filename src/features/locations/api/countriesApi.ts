import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface CountryProvince {
  id: number;
  name_ar: string;
  name_en: string | null;
  is_active: boolean;
}

export interface Country {
  id: number;
  name_ar: string;
  name_en: string | null;
  code: string;
  dial_code: string | null;
  is_active: boolean;
  provinces: CountryProvince[];
  provinces_count: number;
  created_at: string;
}

export interface CountriesPageData {
  stats: {
    totalCountries: number;
    activeCountries: number;
    totalProvinces: number;
  };
  countries: Country[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

// ── Backend Raw Types ──

interface BackendProvince {
  id: number;
  name_ar: string;
  name_en: string | null;
  is_active: boolean;
}

interface BackendCountry {
  id: number;
  name_ar: string;
  name_en: string | null;
  code: string;
  dial_code: string | null;
  is_active: boolean;
  provinces?: BackendProvince[];
  provinces_count?: number;
  created_at: string;
}

interface BackendCountriesResponse {
  countries: BackendCountry[];
  meta: { current_page: number; last_page: number; total: number };
}

// ── Mapping ──

function mapBackendCountry(bc: BackendCountry): Country {
  return {
    id: bc.id,
    name_ar: bc.name_ar,
    name_en: bc.name_en,
    code: bc.code,
    dial_code: bc.dial_code,
    is_active: bc.is_active,
    provinces: (bc.provinces || []).map((p) => ({
      id: p.id,
      name_ar: p.name_ar,
      name_en: p.name_en,
      is_active: p.is_active,
    })),
    provinces_count: bc.provinces_count ?? (bc.provinces?.length || 0),
    created_at: bc.created_at,
  };
}

export const countriesApi = {
  /** Fetch all countries page data */
  getPageData: async (params: { page?: number; search?: string; perPage?: number } = {}): Promise<CountriesPageData> => {
    const requestParams: Record<string, string | number> = {};
    if (params.page) requestParams.page = params.page;
    if (params.perPage) requestParams.per_page = params.perPage;
    if (params.search) requestParams.search = params.search;
    const response = await apiClient.get<ApiResponse<BackendCountriesResponse>>('/api/v1/admin/countries', { params: requestParams });
    const backendData = response.data.data;
    const countries = backendData.countries.map(mapBackendCountry);
    const meta = backendData.meta || {};
    return {
      stats: {
        totalCountries: countries.length,
        activeCountries: countries.filter((c) => c.is_active).length,
        totalProvinces: countries.reduce((sum, c) => sum + c.provinces_count, 0),
      },
      countries,
      meta: {
        currentPage: meta.current_page ?? 1,
        lastPage: meta.last_page ?? 1,
        perPage: 15,
        total: meta.total ?? countries.length,
      },
    };
  },

  /** Get single country */
  getById: async (id: number): Promise<Country> => {
    const response = await apiClient.get<ApiResponse<BackendCountry>>(`/api/v1/admin/countries/${id}`);
    return mapBackendCountry(response.data.data);
  },

  /** Create a new country */
  create: async (data: { name_ar: string; name_en?: string; code: string; dial_code?: string; is_active?: boolean }): Promise<Country> => {
    const response = await apiClient.post<ApiResponse<BackendCountry>>('/api/v1/admin/countries', data);
    return mapBackendCountry(response.data.data);
  },

  /** Update an existing country */
  update: async (id: number, data: { name_ar?: string; name_en?: string; code?: string; dial_code?: string; is_active?: boolean }): Promise<Country> => {
    const response = await apiClient.put<ApiResponse<BackendCountry>>(`/api/v1/admin/countries/${id}`, data);
    return mapBackendCountry(response.data.data);
  },

  /** Toggle country active status */
  toggleActive: async (id: number): Promise<Country> => {
    const response = await apiClient.post<ApiResponse<BackendCountry>>(`/api/v1/admin/countries/${id}/toggle`);
    return mapBackendCountry(response.data.data);
  },

  /** Delete a country */
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/countries/${id}`);
  },
};

export type CountriesApi = typeof countriesApi;
