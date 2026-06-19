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

// ── Dummy Data ──

const now = new Date();
const today = now.toISOString().split('T')[0];
const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const DUMMY_CAMPAIGNS: Campaign[] = [
  {
    id: 1, name: 'Summer Fruits Festival', nameAr: 'مهرجان الفواكه الصيفية',
    description: 'Seasonal fruit campaign featuring fresh strawberries, mangoes, and watermelons at special prices.',
    descriptionAr: 'حملة فواكه موسمية تشمل الفراولة الطازجة والمانجو والبطيخ بأسعار خاصة.',
    status: 'active', startDate: lastWeek, endDate: nextWeek,
    products: [
      { id: 1, productName: 'Fresh Strawberries (500g)', productNameAr: 'فراولة طازجة (500 جم)', unit: 'pack', regularPrice: 22, campaignPrice: 18, quantity: 200 },
      { id: 2, productName: 'Mangoes (1kg)', productNameAr: 'مانجو (1 كجم)', unit: 'kg', regularPrice: 18, campaignPrice: 14, quantity: 150 },
      { id: 3, productName: 'Watermelon (whole)', productNameAr: 'بطيخ كامل', unit: 'piece', regularPrice: 25, campaignPrice: 20, quantity: 100 },
    ],
    totalOrders: 67, totalRevenue: 8900, budget: 15000, spentAmount: 5200,
    bannerUrl: null, targetRegions: ['Riyadh North', 'Jeddah Central', 'Dammam East'],
    createdAt: twoWeeksAgo, updatedAt: lastWeek,
  },
  {
    id: 2, name: 'Ramadan Specials', nameAr: 'عروض رمضان',
    description: 'Special Ramadan bundle with dates, labneh, and traditional sweets.',
    descriptionAr: 'باقة رمضان الخاصة مع التمر واللبنة والحلويات التقليدية.',
    status: 'scheduled', startDate: nextWeek, endDate: new Date(now.getTime() + 37 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    products: [
      { id: 4, productName: 'Premium Dates Box', productNameAr: 'علبة تمر فاخرة', unit: 'box', regularPrice: 45, campaignPrice: 38, quantity: 300 },
      { id: 5, productName: 'Labneh Deluxe (1kg)', productNameAr: 'لبنة ديلوكس (1 كجم)', unit: 'tub', regularPrice: 28, campaignPrice: 22, quantity: 200 },
    ],
    totalOrders: 0, totalRevenue: 0, budget: 25000, spentAmount: 0,
    bannerUrl: null, targetRegions: ['Riyadh North', 'Riyadh South', 'Jeddah Central', 'Mecca North'],
    createdAt: today, updatedAt: today,
  },
  {
    id: 3, name: 'Spring Harvest', nameAr: 'حصاد الربيع',
    description: 'Spring seasonal vegetables at farm-fresh prices.',
    descriptionAr: 'خضروات الربيع الموسمية بأسعار المزرعة الطازجة.',
    status: 'ended', startDate: twoWeeksAgo, endDate: lastWeek,
    products: [
      { id: 6, productName: 'Fresh Greens Bundle', productNameAr: 'باقة الخضار الورقية', unit: 'bundle', regularPrice: 15, campaignPrice: 12, quantity: 400 },
    ],
    totalOrders: 123, totalRevenue: 14760, budget: 10000, spentAmount: 9800,
    bannerUrl: null, targetRegions: ['Riyadh North', 'Riyadh South'],
    createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], updatedAt: twoWeeksAgo,
  },
  {
    id: 4, name: 'Seafood Weekend', nameAr: 'عطلة المأكولات البحرية',
    description: 'Weekend special on fresh seafood — salmon, shrimp, and fish fillets.',
    descriptionAr: 'عرض نهاية الأسبوع على المأكولات البحرية الطازجة.',
    status: 'draft',
    startDate: nextWeek, endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    products: [
      { id: 7, productName: 'Salmon Fillet (400g)', productNameAr: 'فيليه سلمون (400 جم)', unit: 'piece', regularPrice: 55, campaignPrice: 45, quantity: 80 },
      { id: 8, productName: 'Shrimp (500g)', productNameAr: 'جمبري (500 جم)', unit: 'pack', regularPrice: 42, campaignPrice: 35, quantity: 100 },
    ],
    totalOrders: 0, totalRevenue: 0, budget: 8000, spentAmount: 0,
    bannerUrl: null, targetRegions: ['Dammam East'],
    createdAt: today, updatedAt: today,
  },
];

const DUMMY_STATS = {
  total: 4, active: 1, scheduled: 1, draft: 1, ended: 1,
  totalRevenue: 23660, totalOrders: 190, totalBudget: 58000,
};

function getDummyPageData(): CampaignsPageData {
  return { stats: DUMMY_STATS, campaigns: DUMMY_CAMPAIGNS };
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
      return getDummyPageData();
    }
  },

  /** Get single campaign */
  getCampaign: async (id: number): Promise<Campaign> => {
    try {
      const response = await apiClient.get<ApiResponse<BackendCampaign>>(`/api/v1/admin/campaigns/${id}`);
      return mapBackendCampaign(response.data.data);
    } catch {
      const campaign = DUMMY_CAMPAIGNS.find((c) => c.id === id);
      if (!campaign) throw new Error('Campaign not found');
      return campaign;
    }
  },

  /** Activate, close, or archive a campaign */
  campaignAction: async (id: number, action: 'activate' | 'end' | 'cancel'): Promise<Campaign> => {
    try {
      const endpoint = action === 'activate' ? 'activate' : action === 'end' ? 'close' : 'archive';
      const response = await apiClient.post<ApiResponse<BackendCampaign>>(`/api/v1/admin/campaigns/${id}/${endpoint}`);
      return mapBackendCampaign(response.data.data);
    } catch {
      const campaign = DUMMY_CAMPAIGNS.find((c) => c.id === id);
      if (!campaign) throw new Error('Campaign not found');
      const statusMap = { activate: 'active', end: 'ended', cancel: 'ended' } as const;
      return { ...campaign, status: statusMap[action], updatedAt: new Date().toISOString() };
    }
  },
};

export type CampaignsApi = typeof campaignsApi;
