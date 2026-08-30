import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

export interface ApiBaseUrlData {
  base_url: string;
  api_base_url: string;
  updated_at: string | null;
}

export const apiBaseUrlApi = {
  getAdmin: async (): Promise<ApiBaseUrlData> => {
    const res = await apiClient.get<ApiResponse<ApiBaseUrlData>>('/api/v1/admin/api-base-url');
    return res.data.data;
  },
  updateAdmin: async (baseUrl: string): Promise<ApiBaseUrlData> => {
    const res = await apiClient.put<ApiResponse<ApiBaseUrlData>>('/api/v1/admin/api-base-url', { base_url: baseUrl });
    return res.data.data;
  },
  getPublic: async (): Promise<ApiBaseUrlData> => {
    const res = await apiClient.get<ApiResponse<ApiBaseUrlData>>('/api/v1/config/base-url');
    return res.data.data;
  },
};
