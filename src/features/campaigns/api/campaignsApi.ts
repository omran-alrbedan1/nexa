// ============================================================
// Campaigns API Service
// ============================================================
// Backend table: seasonal_campaigns
// Admin routes: ✅ BUILT (CampaignController)
//   GET    /api/v1/admin/campaigns
//   POST   /api/v1/admin/campaigns
//   GET    /api/v1/admin/campaigns/{id}
//   PUT    /api/v1/admin/campaigns/{id}
//   POST   /api/v1/admin/campaigns/{id}/close
// Note: activate/archive endpoints are ✅ BUILT (commit d991d0b — AdminCampaignService)
// ============================================================

import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'ended' | 'cancelled';

export interface CampaignProduct {
  id: number;
  productName: string;
  productNameAr: string;
  unit: string;
  regularPrice: number;
  campaignPrice: number;
  quantity: number;
}

export interface Campaign {
  id: number;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  products: CampaignProduct[];
  totalOrders: number;
  totalRevenue: number;
  budget: number;
  spentAmount: number;
  bannerUrl: string | null;
  targetRegions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignsPageData {
  stats: {
    total: number;
    active: number;
    scheduled: number;
    draft: number;
    ended: number;
    totalRevenue: number;
    totalOrders: number;
    totalBudget: number;
  };
  campaigns: Campaign[];
}

// ── Backend Raw Types (matching seasonal_campaigns DB table) ──

interface BackendCampaign {
  id: number;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  zone_id: number;
  starts_at: string;
  ends_at: string;
  closed_at: string | null;
  status: 'draft' | 'scheduled' | 'open' | 'closed' | 'fulfilled' | 'archived';
  created_at: string;
  updated_at: string;
  // Related data (when loaded via resource):
  zone?: { id: number; name_en: string | null; name_ar: string } | null;
  products_count?: number;
  orders_count?: number;
}

interface BackendCampaignsResponse {
  campaigns: BackendCampaign[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

// ── Mapping ──

function mapBackendCampaignStatus(status: string): CampaignStatus {
  const map: Record<string, CampaignStatus> = {
    'draft': 'draft',
    'scheduled': 'scheduled',
    'open': 'active',
    'closed': 'ended',
    'fulfilled': 'ended',
    'archived': 'ended',
  };
  return map[status] || 'draft';
}

function mapBackendCampaign(c: BackendCampaign): Campaign {
  return {
    id: c.id,
    name: c.name_en || c.name_ar,
    nameAr: c.name_ar,
    description: c.description || '',
    descriptionAr: '',
    status: mapBackendCampaignStatus(c.status),
    startDate: c.starts_at,
    endDate: c.ends_at,
    products: [],
    totalOrders: c.orders_count || 0,
    totalRevenue: 0, // not available from backend yet
    budget: 0, // not available from backend yet
    spentAmount: 0, // not available from backend yet
    bannerUrl: null,
    targetRegions: c.zone ? [c.zone.name_en || c.zone.name_ar] : [],
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

export const campaignsApi = {
  /** Fetch all campaigns page data */
  getPageData: async (): Promise<CampaignsPageData> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendCampaignsResponse>>('/api/v1/admin/campaigns');
      const backendData = response.data.data;
      const campaigns = backendData.campaigns.map(mapBackendCampaign);
      return {
        stats: {
          total: campaigns.length,
          active: campaigns.filter((c) => c.status === 'active').length,
          scheduled: campaigns.filter((c) => c.status === 'scheduled').length,
          draft: campaigns.filter((c) => c.status === 'draft').length,
          ended: campaigns.filter((c) => c.status === 'ended').length,
          totalRevenue: campaigns.reduce((s, c) => s + c.totalRevenue, 0),
          totalOrders: campaigns.reduce((s, c) => s + c.totalOrders, 0),
          totalBudget: campaigns.reduce((s, c) => s + c.budget, 0),
        },
        campaigns,
      };
    } catch {
      return { stats: { total: 0, active: 0, scheduled: 0, draft: 0, ended: 0, totalRevenue: 0, totalOrders: 0, totalBudget: 0 }, campaigns: [] };
    }
  },

  /** Create a new campaign — backend POST /api/v1/admin/campaigns */
  createCampaign: async (data: {
    name: string;
    nameAr?: string;
    description?: string;
    zoneId: number;
    startsAt: string;
    endsAt: string;
    status?: string;
  }): Promise<Campaign> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendCampaign>>('/api/v1/admin/campaigns', {
        name_en: data.name,
        name_ar: data.nameAr || data.name,
        description: data.description,
        zone_id: data.zoneId,
        starts_at: data.startsAt,
        ends_at: data.endsAt,
        status: data.status || 'draft',
      });
      return mapBackendCampaign(response.data.data);
    } catch {
      throw new Error('Failed to create campaign');
    }
  },

  /** Get single campaign */
  getCampaign: async (id: number): Promise<Campaign> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendCampaign>>(`/api/v1/admin/campaigns/${id}`);
      return mapBackendCampaign(response.data.data);
    } catch {
      throw new Error('Campaign not found');
    }
  },

  /** Activate, close, or archive a campaign */
  campaignAction: async (id: number, action: 'activate' | 'end' | 'cancel'): Promise<Campaign> => {
    try {
      const endpoint = action === 'activate' ? 'activate' : action === 'end' ? 'close' : 'archive';
      const response = await apiClient.post<ApiResponse<BackendCampaign>>(`/api/v1/admin/campaigns/${id}/${endpoint}`);
      return mapBackendCampaign(response.data.data);
    } catch {
      throw new Error('Campaign not found');
    }
  },
};

export type CampaignsApi = typeof campaignsApi;
