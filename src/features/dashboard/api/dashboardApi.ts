import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';
import { ordersApi } from '@/features/orders/api/ordersApi';
import { suppliersApi } from '@/features/suppliers/api/suppliersApi';
import { driversApi } from '@/features/drivers/api/driversApi';
import { regionsApi } from '@/features/regions/api/regionsApi';

// ──────────────────────────────────────────────
// Backend Raw Response Types
// These match the response from GET /api/v1/admin/dashboard
// ──────────────────────────────────────────────

/** Orders section from backend dashboard */
export interface DashboardOrders {
  today: number;
  week: number;
  month: number;
  by_type: Record<string, number>;
}

/** Action required item from backend dashboard */
export interface DashboardActionRequired {
  special_orders_pending_admin: number;
  special_orders_pending_pricing: number;
  orders_pending_customer: number;
  orders_in_supply_delayed: number;
  orders_ready_without_trip: number;
  trips_without_driver: number;
  delivery_failed_open: number;
}

/** Pipeline from backend dashboard */
export interface DashboardPipeline {
  in_supply: number;
  in_aggregation: number;
  ready_to_ship: number;
  out_for_delivery: number;
  delivered_today: number;
}

/** Trips today from backend dashboard */
export interface DashboardTripsToday {
  scheduled: number;
  in_progress: number;
  completed: number;
}

/** Pending approvals from backend dashboard */
export interface DashboardPendingApprovals {
  suppliers: number;
  products: number;
}

/** Exact shape returned by GET /api/v1/admin/dashboard */
export interface DashboardBackendResponse {
  orders: DashboardOrders;
  action_required: DashboardActionRequired;
  pipeline: DashboardPipeline;
  trips_today: DashboardTripsToday;
  revenue: number;
  pending_approvals: DashboardPendingApprovals;
}

// ──────────────────────────────────────────────
// Frontend Widget Types (used by components)
// ──────────────────────────────────────────────

export interface RecentOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  type: string;
  status: string;
  total: number;
  createdAt: string;
}

export interface PendingApproval {
  id: number;
  orderNumber: string;
  customerName: string;
  requestDetails: string;
  createdAt: string;
}

export interface DriverStatus {
  id: number;
  name: string;
  status: 'available' | 'on_trip' | 'offline';
  completedToday: number;
  regionName: string;
}

export interface ActionRequiredItem {
  type: 'new_special' | 'pending_pricing' | 'pending_customer' | 'overdue_supply' | 'ready_no_trip' | 'trip_no_driver' | 'failed_delivery';
  label: string;
  count: number;
  link?: string;
}

export interface PipelineStage {
  stage: 'in_supply' | 'in_aggregation' | 'ready_to_ship' | 'in_trip' | 'delivered_today';
  label: string;
  count: number;
  color: string;
}

export interface TripSummary {
  scheduled: number;
  inProgress: number;
  completed: number;
  failed: number;
}

export interface TimeKPI {
  metric: string;
  averageHours: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

export interface TopSupplier {
  id: number;
  name: string;
  orderCount: number;
  acceptanceRate: number;
}

export interface TopArea {
  id: number;
  name: string;
  orderCount: number;
  totalRevenue: number;
}

export interface DashboardFilters {
  dateFrom: string;
  dateTo: string;
  regionId: number | null;
  warehouseId: number | null;
  supplierId: number | null;
  driverId: number | null;
  orderType: string | null;
  status: string | null;
  paymentMethod: string | null;
}

/**
 * Combined frontend dashboard shape.
 *
 * Shape matches what the dashboard components expect:
 * - `stats` — computed from backend data for StatCards
 * - `actionRequired`, `pipeline` (array), `tripSummary`, etc. — widget data
 * - Backend raw data is transformed/hydrated by transformBackendResponse()
 */
export interface DashboardWidgetsExpanded {
  /** Computed stats for StatCards — derived from backend core data */
  stats: {
    totalOrders: number;
    activeOrders: number;
    deliveredToday: number;
    pendingDeliveries: number;
    revenueToday: number;
    revenueThisMonth: number;
    activeDrivers: number;
    pendingSpecialRequests: number;
    ordersByStatus: Record<string, number>;
    ordersByType: Record<string, number>;
  };

  /** Recent orders (frontend-only widget — dummy until backend route exists) */
  recentOrders: RecentOrder[];

  /** Special request approvals (frontend-only widget — dummy until backend route exists) */
  pendingApprovals: PendingApproval[];

  /** Driver activity (frontend-only widget — dummy until backend route exists) */
  driverActivity: DriverStatus[];

  /** Action required items derived from backend action_required data */
  actionRequired: ActionRequiredItem[];

  /** Pipeline stages derived from backend pipeline data */
  pipeline: PipelineStage[];

  /** Trip summary derived from backend trips_today data */
  tripSummary: TripSummary;

  /** Time KPIs (frontend-only widget — dummy until backend route exists) */
  timeKPIs: TimeKPI[];

  /** Top suppliers (frontend-only widget — dummy until backend route exists) */
  topSuppliers: TopSupplier[];

  /** Top areas (frontend-only widget — dummy until backend route exists) */
  topAreas: TopArea[];
}

// ── Helper: build frontend types from backend data ──

function buildActionRequired(ar: DashboardActionRequired): ActionRequiredItem[] {
  return [
    { type: 'new_special', label: 'Special Orders — Pending Admin Review', count: ar.special_orders_pending_admin, link: '/orders?status=pending_management' },
    { type: 'pending_pricing', label: 'Orders Awaiting Pricing', count: ar.special_orders_pending_pricing, link: '/orders?status=pending_pricing' },
    { type: 'pending_customer', label: 'Awaiting Customer Approval', count: ar.orders_pending_customer, link: '/orders?status=pending_customer_approval' },
    { type: 'overdue_supply', label: 'Overdue Supply (Past SLA)', count: ar.orders_in_supply_delayed, link: '/orders?status=pending_supply' },
    { type: 'ready_no_trip', label: 'Ready to Ship — No Trip Assigned', count: ar.orders_ready_without_trip, link: '/orders?status=ready_to_ship' },
    { type: 'trip_no_driver', label: 'Trips Without Driver', count: ar.trips_without_driver, link: '/trips?status=scheduled' },
    { type: 'failed_delivery', label: 'Failed Delivery — Needs Follow-up', count: ar.delivery_failed_open, link: '/orders?status=failed_delivery' },
  ];
}

function buildPipeline(pl: DashboardPipeline): PipelineStage[] {
  return [
    { stage: 'in_supply', label: 'In Supply', count: pl.in_supply, color: '#F59E0B' },
    { stage: 'in_aggregation', label: 'In Aggregation', count: pl.in_aggregation, color: '#3B82F6' },
    { stage: 'ready_to_ship', label: 'Ready to Ship', count: pl.ready_to_ship, color: '#8B5CF6' },
    { stage: 'in_trip', label: 'In Trip', count: pl.out_for_delivery, color: '#10B981' },
    { stage: 'delivered_today', label: 'Delivered Today', count: pl.delivered_today, color: '#059669' },
  ];
}

function buildTripSummary(tt: DashboardTripsToday): TripSummary {
  return {
    scheduled: tt.scheduled,
    inProgress: tt.in_progress,
    completed: tt.completed,
    failed: 0, // backend doesn't provide this yet
  };
}

function buildStatsFromBackend(backend: DashboardBackendResponse): DashboardWidgetsExpanded['stats'] {
  const activeOps = backend.pipeline.in_supply + backend.pipeline.in_aggregation + backend.pipeline.ready_to_ship + backend.pipeline.out_for_delivery;
  return {
    totalOrders: backend.orders.today,
    activeOrders: activeOps,
    deliveredToday: backend.pipeline.delivered_today,
    pendingDeliveries: backend.pipeline.out_for_delivery,
    revenueToday: backend.revenue,
    revenueThisMonth: backend.orders.month > 0 ? Math.round(backend.revenue * 30) : Math.round(backend.revenue * 30),
    activeDrivers: 0, // not yet available from backend endpoint
    pendingSpecialRequests: backend.action_required.special_orders_pending_admin + backend.action_required.special_orders_pending_pricing,
    ordersByStatus: {},
    ordersByType: backend.orders.by_type,
  };
}

// ── Helper: fetch widget data from their respective APIs ──

async function fetchRecentOrders(): Promise<RecentOrder[]> {
  const result = await ordersApi.getOrders({ perPage: 5 });
  return result.orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    type: o.type,
    status: o.status,
    total: o.total,
    createdAt: o.createdAt,
  }));
}

async function fetchPendingApprovals(): Promise<PendingApproval[]> {
  const pendingSuppliers = await suppliersApi.getPendingApprovals();
  if (pendingSuppliers.length === 0) return [];
  return pendingSuppliers.map((s) => ({
    id: s.id,
    orderNumber: `SPL-${s.id}`,
    customerName: s.name,
    requestDetails: s.notes || `New supplier pending approval`,
    createdAt: s.createdAt,
  }));
}

async function fetchTopSuppliers(): Promise<TopSupplier[]> {
  const result = await suppliersApi.getPageData();
  return result.suppliers
    .filter((s) => s.totalOrders > 0)
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      name: s.name,
      orderCount: s.totalOrders,
      acceptanceRate: s.acceptanceRate,
    }));
}

async function fetchTopAreas(): Promise<TopArea[]> {
  const result = await regionsApi.getPageData();
  return result.regions
    .filter((r) => r.totalOrders > 0)
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      name: r.name,
      orderCount: r.totalOrders,
      totalRevenue: r.totalRevenue,
    }));
}

async function fetchDriverActivity(): Promise<DriverStatus[]> {
  const result = await driversApi.getPageData();
  return result.drivers.map((d) => {
    let status: DriverStatus['status'] = 'offline';
    if (d.isAvailable) {
      status = 'available';
    } else if (d.totalTrips > 0) {
      status = 'on_trip';
    }
    return {
      id: d.id,
      name: d.name,
      status,
      completedToday: d.totalOrders,
      regionName: d.zoneName,
    };
  });
}

// ── Transform backend response to frontend shape ──

function transformBackendResponse(backend: DashboardBackendResponse): DashboardWidgetsExpanded {
  return {
    stats: buildStatsFromBackend(backend),

    // Frontend-only widgets — populated by fetchWidgetData() call below
    recentOrders: [],
    pendingApprovals: [],
    driverActivity: [],

    // Derived from backend data
    actionRequired: buildActionRequired(backend.action_required),
    pipeline: buildPipeline(backend.pipeline),
    tripSummary: buildTripSummary(backend.trips_today),

    // Frontend-only widgets — populated by fetchWidgetData() call below
    timeKPIs: [],
    topSuppliers: [],
    topAreas: [],
  };
}

export const dashboardApi = {
  /**
   * Fetch all dashboard widget data.
   * Calls the real backend for core stats, derives widget data from backend response,
   * and fetches widget-specific data from their respective APIs.
   * Accepts optional filter params (dateFrom, dateTo) passed as query params to the dashboard API.
   */
  getWidgetsExpanded: async (filters?: { dateFrom?: string; dateTo?: string }): Promise<DashboardWidgetsExpanded> => {
    // Build query string from filter params
    const params = new URLSearchParams();
    if (filters?.dateFrom) params.set('from_date', filters.dateFrom);
    if (filters?.dateTo) params.set('to_date', filters.dateTo);
    const qs = params.toString();
    const url = `/api/v1/admin/dashboard${qs ? `?${qs}` : ''}`;

    // Fire all data fetches in parallel
    const [dashboardResult, recentOrdersData, pendingApprovalsData, driverActivityData, topSuppliersData, topAreasData] = await Promise.all([
      apiClient.get<ApiResponse<DashboardBackendResponse>>(url).then((r) => r.data.data).catch(() => null as DashboardBackendResponse | null),
      fetchRecentOrders(),
      fetchPendingApprovals(),
      fetchDriverActivity(),
      fetchTopSuppliers(),
      fetchTopAreas(),
    ]);

    // Throw if the main dashboard API is unavailable — let the UI show error state
    if (!dashboardResult) {
      throw new Error('Dashboard data is unavailable. Please check your connection.');
    }

    const result = transformBackendResponse(dashboardResult);
    result.recentOrders = recentOrdersData;
    result.pendingApprovals = pendingApprovalsData;
    result.driverActivity = driverActivityData;
    result.topSuppliers = topSuppliersData;
    result.topAreas = topAreasData;
    return result;
  },
};
