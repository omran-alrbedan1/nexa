// ============================================================
// Product Units API Service
// ============================================================
// Backend: GET/POST /api/v1/admin/units (ProductUnitController)
//          PUT /api/v1/admin/units/{id}
//          POST /api/v1/admin/units/{id}/toggle
//          DELETE /api/v1/admin/units/{id}
// ============================================================

import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

export interface ProductUnit {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string | null;
  nameHe: string | null;
  nameRu: string | null;
  isActive: boolean;
  sortOrder: number;
  groupIds?: number[];
  groups?: { id: number; code: string; name_ar?: string }[];
  createdAt?: string;
}

export interface UnitGroup {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string | null;
  nameHe: string | null;
  nameRu: string | null;
  isActive: boolean;
  sortOrder: number;
  unitsCount?: number;
  unitIds?: number[];
  createdAt?: string;
}

interface BackendUnit {
  id: number;
  code: string;
  name_ar: string;
  name_en: string | null;
  name_he: string | null;
  name_ru: string | null;
  is_active: boolean;
  sort_order: number;
  group_ids?: number[] | null;
  groups?: { id: number; code: string; name_ar?: string }[] | null;
  created_at?: string;
}

interface BackendGroup {
  id: number;
  code: string;
  name_ar: string;
  name_en: string | null;
  name_he: string | null;
  name_ru: string | null;
  sort_order: number;
  is_active: boolean;
  units_count?: number;
  units?: { id: number; code: string; name_ar?: string }[];
  created_at?: string;
}

function mapBackendUnit(u: BackendUnit): ProductUnit {
  return {
    id: u.id,
    code: u.code,
    nameAr: u.name_ar,
    nameEn: u.name_en,
    nameHe: u.name_he,
    nameRu: u.name_ru,
    isActive: u.is_active,
    sortOrder: u.sort_order,
    createdAt: u.created_at,
    groupIds: u.group_ids ?? undefined,
    groups: u.groups ?? undefined,
  };
}

function mapBackendGroup(g: BackendGroup): UnitGroup {
  return {
    id: g.id,
    code: g.code,
    nameAr: g.name_ar,
    nameEn: g.name_en,
    nameHe: g.name_he,
    nameRu: g.name_ru,
    isActive: g.is_active,
    sortOrder: g.sort_order,
    unitsCount: g.units_count,
    unitIds: g.units?.map((u) => u.id) ?? undefined,
    createdAt: g.created_at,
  };
}

export interface GroupsPageData {
  groups: UnitGroup[];
  meta: { currentPage: number; lastPage: number; total: number };
}

export interface UnitGroupInput {
  code?: string;
  name_ar?: string;
  name_en?: string | null;
  name_he?: string | null;
  name_ru?: string | null;
  is_active?: boolean;
  sort_order?: number;
  unit_ids?: number[];
}

export interface UnitsPageData {
  units: ProductUnit[];
  meta: { currentPage: number; lastPage: number; total: number };
}

export interface UnitInput {
  code: string;
  name_ar: string;
  name_en?: string | null;
  name_he?: string | null;
  name_ru?: string | null;
  is_active?: boolean;
  sort_order?: number;
  group_ids?: number[];
}

export const unitsApi = {
  list: async (params: { page?: number; search?: string; groupId?: number } = {}): Promise<UnitsPageData> => {
    const response = await apiClient.get<ApiResponse<{ units: BackendUnit[]; meta: { current_page: number; last_page: number; total: number } }>>('/api/v1/admin/units', {
      params: {
        page: params.page ?? 1,
        per_page: 50,
        search: params.search || undefined,
        group_id: params.groupId ?? undefined,
      },
    });
    const data = response.data.data;
    const meta = data.meta || {};
    return {
      units: (data.units ?? []).map(mapBackendUnit),
      meta: {
        currentPage: meta.current_page ?? 1,
        lastPage: meta.last_page ?? 1,
        total: meta.total ?? data.units?.length ?? 0,
      },
    };
  },

  create: async (data: UnitInput): Promise<ProductUnit> => {
    const response = await apiClient.post<ApiResponse<BackendUnit>>('/api/v1/admin/units', data);
    return mapBackendUnit(response.data.data);
  },

  update: async (id: number, data: Partial<UnitInput>): Promise<ProductUnit> => {
    const response = await apiClient.put<ApiResponse<BackendUnit>>(`/api/v1/admin/units/${id}`, data);
    return mapBackendUnit(response.data.data);
  },

  toggle: async (id: number): Promise<ProductUnit> => {
    const response = await apiClient.post<ApiResponse<BackendUnit>>(`/api/v1/admin/units/${id}/toggle`);
    return mapBackendUnit(response.data.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/units/${id}`);
  },

  // ── Unit Groups ──

  groupList: async (params: { page?: number; search?: string } = {}): Promise<GroupsPageData> => {
    const response = await apiClient.get<ApiResponse<{ groups: BackendGroup[]; meta: { current_page: number; last_page: number; total: number } }>>('/api/v1/admin/unit-groups', {
      params: {
        page: params.page ?? 1,
        per_page: 50,
        search: params.search || undefined,
      },
    });
    const data = response.data.data;
    const meta = data.meta || {};
    return {
      groups: (data.groups ?? []).map(mapBackendGroup),
      meta: {
        currentPage: meta.current_page ?? 1,
        lastPage: meta.last_page ?? 1,
        total: meta.total ?? data.groups?.length ?? 0,
      },
    };
  },

  groupCreate: async (data: UnitGroupInput): Promise<UnitGroup> => {
    const response = await apiClient.post<ApiResponse<BackendGroup>>('/api/v1/admin/unit-groups', data);
    return mapBackendGroup(response.data.data);
  },

  groupUpdate: async (id: number, data: Partial<UnitGroupInput>): Promise<UnitGroup> => {
    const response = await apiClient.put<ApiResponse<BackendGroup>>(`/api/v1/admin/unit-groups/${id}`, data);
    return mapBackendGroup(response.data.data);
  },

  groupToggle: async (id: number): Promise<UnitGroup> => {
    const response = await apiClient.post<ApiResponse<BackendGroup>>(`/api/v1/admin/unit-groups/${id}/toggle`);
    return mapBackendGroup(response.data.data);
  },

  groupDelete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/unit-groups/${id}`);
  },
};
