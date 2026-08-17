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
import { mapFromBackend, mapToBackend, CAMPAIGN_STATUS_BACKEND_TO_FRONTEND, CAMPAIGN_STATUS_FRONTEND_TO_BACKEND } from '@/lib/enumMappers';
import type { ApiResponse } from '@/types/common';

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'ended' | 'fulfilled' | 'cancelled';

export interface CampaignProduct {
  id: number;
  productName: string;
  productNameAr: string;
  unit: string;
  regularPrice: number;
  campaignPrice: number;
  quantity: number;
}

export interface CampaignItem {
  id: number;
  nameAr: string;
  nameEn: string | null;
  nameHe: string | null;
  nameRu: string | null;
  description: string | null;
  descriptionHe: string | null;
  categoryId: number;
  productId: number | null;
  unit: string;
  price: number;
  stockQuantity: number;
  variants?: CampaignItemVariant[];
}

export interface CampaignItemVariant {
  id: number;
  nameAr: string;
  nameEn: string | null;
  nameHe: string | null;
  nameRu: string | null;
  price: number;
  stockQuantity: number;
  isActive: boolean;
}

/** Variant payload sent on create/update — `_delete` marks existing rows for removal */
export interface CampaignItemVariantInput {
  id?: number;
  nameAr: string;
  nameEn?: string;
  nameHe?: string;
  nameRu?: string;
  price: number;
  stockQuantity?: number;
  isActive?: boolean;
  _delete?: boolean;
}

export interface AssignedSupplier {
  id: number;
  businessName: string;
}

export interface Campaign {
  id: number;
  zoneId: number;
  name: string;
  nameAr: string;
  nameHe: string | null;
  nameRu: string | null;
  subtitleAr: string | null;
  subtitleEn: string | null;
  subtitleHe: string | null;
  subtitleRu: string | null;
  description: string;
  descriptionEn: string | null;
  descriptionHe: string | null;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  orderingClosesAt: string | null;
  deliveryLeadTimeMinDays: number | null;
  deliveryLeadTimeMaxDays: number | null;
  isStockLimited: boolean;
  stockTotalQuantity: number | null;
  stockReservedQuantity: number | null;
  stockSoldQuantity: number;
  stockLowStockThreshold: number | null;
  stockUnit: string;
  products: CampaignProduct[];
  items: CampaignItem[];
  assignedSupplier: AssignedSupplier | null;
  totalOrders: number;
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
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

// ── Backend Raw Types (matching seasonal_campaigns DB table) ──

interface BackendCampaignItem {
  id: number;
  name_ar: string;
  name_en: string | null;
  name_he: string | null;
  name_ru: string | null;
  description: string | null;
  description_he: string | null;
  category_id: number;
  product_id: number | null;
  unit: string;
  price: number;
  stock_quantity: number;
  variants?: BackendCampaignItemVariant[];
}

interface BackendCampaignItemVariant {
  id: number;
  name_ar: string;
  name_en: string | null;
  name_he: string | null;
  name_ru: string | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
}

interface BackendAssignedSupplier {
  id: number;
  business_name: string;
}

const IMAGE_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function toAbsoluteUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${IMAGE_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

interface BackendCampaign {
  id: number;
  name_ar: string;
  name_en: string | null;
  name_he: string | null;
  name_ru: string | null;
  subtitle_ar: string | null;
  subtitle_en: string | null;
  subtitle_he: string | null;
  subtitle_ru: string | null;
  description: string | null;
  description_en: string | null;
  description_he: string | null;
  zone_id: number;
  starts_at: string;
  ends_at: string;
  ordering_closes_at: string | null;
  closed_at: string | null;
  delivery_lead_time_min_days: number | null;
  delivery_lead_time_max_days: number | null;
  is_stock_limited: boolean;
  stock_total_quantity: number | null;
  stock_reserved_quantity: number | null;
  stock_sold_quantity: number;
  stock_low_stock_threshold: number | null;
  stock_unit: string;
  status: 'draft' | 'scheduled' | 'open' | 'closed' | 'fulfilled' | 'archived';
  created_at: string;
  updated_at: string;
  image?: string | null;
  // Related data (when loaded via resource):
  zone?: { id: number; name_en: string | null; name_ar: string } | null;
  products_count?: number;
  orders_count?: number;
  items?: BackendCampaignItem[];
  assigned_supplier?: BackendAssignedSupplier | null;
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

function mapBackendCampaign(c: BackendCampaign): Campaign {
  return {
    id: c.id,
    zoneId: c.zone_id,
    name: c.name_en || c.name_ar,
    nameAr: c.name_ar,
    nameHe: c.name_he ?? null,
    nameRu: c.name_ru ?? null,
    subtitleAr: c.subtitle_ar ?? null,
    subtitleEn: c.subtitle_en ?? null,
    subtitleHe: c.subtitle_he ?? null,
    subtitleRu: c.subtitle_ru ?? null,
    description: c.description || '',
    descriptionEn: c.description_en ?? null,
    descriptionHe: c.description_he ?? null,
    status: mapFromBackend(c.status, CAMPAIGN_STATUS_BACKEND_TO_FRONTEND) as CampaignStatus,
    startDate: c.starts_at,
    endDate: c.ends_at,
    orderingClosesAt: c.ordering_closes_at ?? null,
    deliveryLeadTimeMinDays: c.delivery_lead_time_min_days ?? null,
    deliveryLeadTimeMaxDays: c.delivery_lead_time_max_days ?? null,
    isStockLimited: c.is_stock_limited,
    stockTotalQuantity: c.stock_total_quantity ?? null,
    stockReservedQuantity: c.stock_reserved_quantity ?? null,
    stockSoldQuantity: c.stock_sold_quantity ?? 0,
    stockLowStockThreshold: c.stock_low_stock_threshold ?? null,
    stockUnit: c.stock_unit ?? 'item',
    products: [],
    items: (c.items || []).map((i) => ({
      id: i.id,
      nameAr: i.name_ar,
      nameEn: i.name_en,
      nameHe: i.name_he ?? null,
      nameRu: i.name_ru ?? null,
      description: i.description,
      descriptionHe: i.description_he ?? null,
      categoryId: i.category_id,
      productId: i.product_id ?? null,
      unit: i.unit,
      price: i.price,
      stockQuantity: i.stock_quantity,
      variants: (i.variants || []).map((v) => ({
        id: v.id,
        nameAr: v.name_ar,
        nameEn: v.name_en,
        nameHe: v.name_he ?? null,
        nameRu: v.name_ru ?? null,
        price: v.price,
        stockQuantity: v.stock_quantity,
        isActive: v.is_active,
      })),
    })),
    assignedSupplier: c.assigned_supplier
      ? { id: c.assigned_supplier.id, businessName: c.assigned_supplier.business_name }
      : null,
    totalOrders: c.orders_count || 0,
    bannerUrl: toAbsoluteUrl(c.image),
    targetRegions: c.zone ? [c.zone.name_en || c.zone.name_ar] : [],
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

// Backend has no 'cancelled' campaign status — cancelled campaigns are stored as 'archived'
const CAMPAIGN_FILTER_FRONTEND_TO_BACKEND: Record<string, string> = {
  ...CAMPAIGN_STATUS_FRONTEND_TO_BACKEND,
  cancelled: 'archived',
};

export const campaignsApi = {
  /** Fetch all campaigns page data */
  getPageData: async (params: { page?: number; status?: string } = {}): Promise<CampaignsPageData> => {
    const response = await apiClient.get<ApiResponse<BackendCampaignsResponse>>('/api/v1/admin/campaigns', {
      params: {
        page: params.page ?? 1,
        per_page: 15,
        status: params.status ? CAMPAIGN_FILTER_FRONTEND_TO_BACKEND[params.status] : undefined,
      },
    });
    const backendData = response.data.data;
    const campaigns = backendData.campaigns.map(mapBackendCampaign);
    const meta = backendData.meta;
    return {
      stats: {
        total: meta.total ?? campaigns.length,
        active: campaigns.filter((c) => c.status === 'active').length,
        scheduled: campaigns.filter((c) => c.status === 'scheduled').length,
        draft: campaigns.filter((c) => c.status === 'draft').length,
        ended: campaigns.filter((c) => c.status === 'ended' || c.status === 'fulfilled').length,
        totalRevenue: 0,
        totalOrders: campaigns.reduce((s, c) => s + c.totalOrders, 0),
        totalBudget: 0,
      },
      campaigns,
      meta: {
        currentPage: meta.current_page ?? 1,
        lastPage: meta.last_page ?? 1,
        perPage: 15,
        total: meta.total ?? campaigns.length,
      },
    };
  },

  /** Fetch all delivery zones for dropdown */
  getZones: async (): Promise<Array<{ id: number; name_ar: string; name_en: string | null }>> => {
    const response = await apiClient.get<ApiResponse<{ zones: Array<{ id: number; name_ar: string; name_en: string | null }> }>>('/api/v1/admin/zones');
    return response.data.data.zones;
  },

  /** Create a new campaign — backend POST /api/v1/admin/campaigns */
  createCampaign: async (data: {
    name: string;
    nameAr?: string;
    nameHe?: string;
    nameRu?: string;
    subtitleAr?: string;
    subtitleEn?: string;
    subtitleHe?: string;
    subtitleRu?: string;
    description?: string;
    descriptionEn?: string;
    descriptionHe?: string;
    zoneId: number;
    startsAt: string;
    endsAt: string;
    orderingClosesAt?: string;
    deliveryLeadTimeMinDays?: number;
    deliveryLeadTimeMaxDays?: number;
    isStockLimited?: boolean;
    stockTotalQuantity?: number;
    stockReservedQuantity?: number;
    stockSoldQuantity?: number;
    stockLowStockThreshold?: number;
    stockUnit?: string;
    status?: string;
    items?: Array<{
      nameAr: string;
      nameEn?: string;
      nameHe?: string;
      nameRu?: string;
      description?: string;
      descriptionHe?: string;
      categoryId: number;
      unit: string;
      price: number;
      stockQuantity?: number;
      variants?: CampaignItemVariantInput[];
    }>;
  }): Promise<Campaign> => {
    const payload: Record<string, unknown> = {
      name_en: data.name,
      name_ar: data.nameAr || data.name,
      name_he: data.nameHe ?? null,
      name_ru: data.nameRu ?? null,
      subtitle_ar: data.subtitleAr ?? null,
      subtitle_en: data.subtitleEn ?? null,
      subtitle_he: data.subtitleHe ?? null,
      subtitle_ru: data.subtitleRu ?? null,
      description: data.description,
      description_en: data.descriptionEn ?? null,
      description_he: data.descriptionHe ?? null,
      zone_id: data.zoneId,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      ordering_closes_at: data.orderingClosesAt ?? null,
      delivery_lead_time_min_days: data.deliveryLeadTimeMinDays ?? null,
      delivery_lead_time_max_days: data.deliveryLeadTimeMaxDays ?? null,
      is_stock_limited: data.isStockLimited ?? false,
      stock_total_quantity: data.stockTotalQuantity ?? null,
      stock_reserved_quantity: data.stockReservedQuantity ?? null,
      stock_sold_quantity: data.stockSoldQuantity ?? 0,
      stock_low_stock_threshold: data.stockLowStockThreshold ?? null,
      stock_unit: data.stockUnit ?? 'item',
      status: data.status || 'draft',
    };
    if (data.items && data.items.length > 0) {
      payload.items = data.items.map((item) => ({
        name_ar: item.nameAr,
        name_en: item.nameEn ?? null,
        name_he: item.nameHe ?? null,
        name_ru: item.nameRu ?? null,
        description: item.description ?? null,
        description_he: item.descriptionHe ?? null,
        category_id: item.categoryId,
        unit: item.unit,
        price: item.price,
        stock_quantity: item.stockQuantity ?? 0,
        variants: (item.variants || []).map((v) => ({
          ...(v.id ? { id: v.id } : {}),
          name_ar: v.nameAr,
          name_en: v.nameEn ?? null,
          name_he: v.nameHe ?? null,
          name_ru: v.nameRu ?? null,
          price: v.price,
          stock_quantity: v.stockQuantity ?? 0,
          is_active: v.isActive ?? true,
          ...(v._delete ? { _delete: true } : {}),
        })),
      }));
    }
    const response = await apiClient.post<ApiResponse<BackendCampaign>>('/api/v1/admin/campaigns', payload);
    return mapBackendCampaign(response.data.data);
  },

  /** Get single campaign */
  getCampaign: async (id: number): Promise<Campaign> => {
    const response = await apiClient.get<ApiResponse<BackendCampaign>>(`/api/v1/admin/campaigns/${id}`);
    return mapBackendCampaign(response.data.data);
  },

  /** Update an existing campaign — backend POST /api/v1/admin/campaigns/{id} (PUT via _method) */
  updateCampaign: async (id: number, data: {
    name?: string;
    nameAr?: string;
    nameHe?: string;
    nameRu?: string;
    subtitleAr?: string;
    subtitleEn?: string;
    subtitleHe?: string;
    subtitleRu?: string;
    description?: string;
    descriptionEn?: string;
    descriptionHe?: string;
    zoneId?: number;
    startsAt?: string;
    endsAt?: string;
    orderingClosesAt?: string;
    deliveryLeadTimeMinDays?: number;
    deliveryLeadTimeMaxDays?: number;
    isStockLimited?: boolean;
    stockTotalQuantity?: number;
    stockReservedQuantity?: number;
    stockSoldQuantity?: number;
    stockLowStockThreshold?: number;
    stockUnit?: string;
    status?: string;
    image?: File;
    items?: Array<{
      nameAr: string;
      nameEn?: string;
      nameHe?: string;
      nameRu?: string;
      description?: string;
      descriptionHe?: string;
      categoryId: number;
      unit: string;
      price: number;
      stockQuantity?: number;
      variants?: CampaignItemVariantInput[];
    }>;
  }): Promise<Campaign> => {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    if (data.name) formData.append('name_en', data.name);
    if (data.nameAr) formData.append('name_ar', data.nameAr);
    if (data.nameHe) formData.append('name_he', data.nameHe);
    if (data.nameRu) formData.append('name_ru', data.nameRu);
    if (data.subtitleAr !== undefined) formData.append('subtitle_ar', data.subtitleAr);
    if (data.subtitleEn !== undefined) formData.append('subtitle_en', data.subtitleEn);
    if (data.subtitleHe !== undefined) formData.append('subtitle_he', data.subtitleHe);
    if (data.subtitleRu !== undefined) formData.append('subtitle_ru', data.subtitleRu);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.descriptionEn !== undefined) formData.append('description_en', data.descriptionEn);
    if (data.descriptionHe !== undefined) formData.append('description_he', data.descriptionHe);
    if (data.zoneId) formData.append('zone_id', String(data.zoneId));
    if (data.startsAt) formData.append('starts_at', data.startsAt);
    if (data.endsAt) formData.append('ends_at', data.endsAt);
    if (data.orderingClosesAt !== undefined) formData.append('ordering_closes_at', data.orderingClosesAt);
    if (data.deliveryLeadTimeMinDays !== undefined) formData.append('delivery_lead_time_min_days', String(data.deliveryLeadTimeMinDays));
    if (data.deliveryLeadTimeMaxDays !== undefined) formData.append('delivery_lead_time_max_days', String(data.deliveryLeadTimeMaxDays));
    if (data.isStockLimited !== undefined) formData.append('is_stock_limited', data.isStockLimited ? '1' : '0');
    if (data.stockTotalQuantity !== undefined) formData.append('stock_total_quantity', String(data.stockTotalQuantity));
    if (data.stockReservedQuantity !== undefined) formData.append('stock_reserved_quantity', String(data.stockReservedQuantity));
    if (data.stockSoldQuantity !== undefined) formData.append('stock_sold_quantity', String(data.stockSoldQuantity));
    if (data.stockLowStockThreshold !== undefined) formData.append('stock_low_stock_threshold', String(data.stockLowStockThreshold));
    if (data.stockUnit !== undefined) formData.append('stock_unit', data.stockUnit);
    if (data.status) formData.append('status', mapToBackend(data.status, CAMPAIGN_STATUS_FRONTEND_TO_BACKEND));
    if (data.image instanceof File) formData.append('image', data.image);
    if (data.items) {
      data.items.forEach((item, index) => {
        formData.append(`items[${index}][name_ar]`, item.nameAr);
        if (item.nameEn) formData.append(`items[${index}][name_en]`, item.nameEn);
        if (item.nameHe) formData.append(`items[${index}][name_he]`, item.nameHe);
        if (item.nameRu) formData.append(`items[${index}][name_ru]`, item.nameRu);
        if (item.description) formData.append(`items[${index}][description]`, item.description);
        if (item.descriptionHe) formData.append(`items[${index}][description_he]`, item.descriptionHe);
        formData.append(`items[${index}][category_id]`, String(item.categoryId));
        formData.append(`items[${index}][unit]`, item.unit);
        formData.append(`items[${index}][price]`, String(item.price));
        if (item.stockQuantity !== undefined) formData.append(`items[${index}][stock_quantity]`, String(item.stockQuantity));
        (item.variants || []).forEach((v, vIndex) => {
          const prefix = `items[${index}][variants][${vIndex}]`;
          if (v.id) formData.append(`${prefix}[id]`, String(v.id));
          formData.append(`${prefix}[name_ar]`, v.nameAr);
          if (v.nameEn) formData.append(`${prefix}[name_en]`, v.nameEn);
          if (v.nameHe) formData.append(`${prefix}[name_he]`, v.nameHe);
          if (v.nameRu) formData.append(`${prefix}[name_ru]`, v.nameRu);
          formData.append(`${prefix}[price]`, String(v.price));
          if (v.stockQuantity !== undefined) formData.append(`${prefix}[stock_quantity]`, String(v.stockQuantity));
          if (v.isActive !== undefined) formData.append(`${prefix}[is_active]`, v.isActive ? '1' : '0');
          if (v._delete) formData.append(`${prefix}[_delete]`, '1');
        });
      });
    }

    const response = await apiClient.post<ApiResponse<BackendCampaign>>(`/api/v1/admin/campaigns/${id}`, formData, { headers: { 'Content-Type': undefined } });
    return mapBackendCampaign(response.data.data);
  },

  /** Activate, close, or archive a campaign */
  campaignAction: async (id: number, action: 'activate' | 'end' | 'cancel'): Promise<Campaign> => {
    const endpoint = action === 'activate' ? 'activate' : action === 'end' ? 'close' : 'archive';
    const response = await apiClient.post<ApiResponse<BackendCampaign>>(`/api/v1/admin/campaigns/${id}/${endpoint}`);
    return mapBackendCampaign(response.data.data);
  },

  /** Materialize a campaign item into a real seasonal product */
  materializeItemProduct: async (campaignId: number, itemId: number): Promise<{ id: number }> => {
    const response = await apiClient.post<ApiResponse<{ id: number }>>(
      `/api/v1/admin/campaigns/${campaignId}/items/${itemId}/product`
    );
    return response.data.data;
  },
};

export type CampaignsApi = typeof campaignsApi;
