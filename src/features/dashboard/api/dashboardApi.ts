import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@/types/common';
import { ordersApi } from '@/features/orders/api/ordersApi';
import { suppliersApi } from '@/features/suppliers/api/suppliersApi';
import { driversApi } from '@/features/drivers/api/driversApi';

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

// ── Dummy data for frontend-only widgets ──

const DUMMY_RECENT_ORDERS: RecentOrder[] = [
  { id: 1, orderNumber: 'ORD-2025-001', customerName: 'Ahmed Ali', type: 'regular', status: 'delivered', total: 245.00, createdAt: '2025-06-07T09:15:00Z' },
  { id: 2, orderNumber: 'ORD-2025-002', customerName: 'Sara Khalid', type: 'special', status: 'pending_pricing', total: 0, createdAt: '2025-06-07T09:30:00Z' },
  { id: 3, orderNumber: 'ORD-2025-003', customerName: 'Mohamed Noor', type: 'regular', status: 'out_for_delivery', total: 189.50, createdAt: '2025-06-07T08:45:00Z' },
  { id: 4, orderNumber: 'ORD-2025-004', customerName: 'Nora Hassan', type: 'seasonal', status: 'confirmed', total: 320.00, createdAt: '2025-06-07T07:20:00Z' },
  { id: 5, orderNumber: 'ORD-2025-005', customerName: 'Faisal Omar', type: 'regular', status: 'pending_aggregation', total: 78.00, createdAt: '2025-06-06T16:10:00Z' },
];

const DUMMY_PENDING_APPROVALS: PendingApproval[] = [
  { id: 1, orderNumber: 'ORD-2025-002', customerName: 'Sara Khalid', requestDetails: 'Organic honey 5kg + Premium dates box', createdAt: '2025-06-07T09:30:00Z' },
  { id: 2, orderNumber: 'ORD-2025-006', customerName: 'Layla Ibrahim', requestDetails: 'Imported cheese selection (3 types)', createdAt: '2025-06-07T08:15:00Z' },
  { id: 3, orderNumber: 'ORD-2025-007', customerName: 'Khalid Salem', requestDetails: 'Fresh seafood platter for 10 guests', createdAt: '2025-06-06T14:20:00Z' },
];

const DUMMY_DRIVER_ACTIVITY: DriverStatus[] = [
  { id: 1, name: 'Hassan Ali', status: 'on_trip', completedToday: 8, regionName: 'Riyadh North' },
  { id: 2, name: 'Omar Farouk', status: 'available', completedToday: 12, regionName: 'Riyadh South' },
  { id: 3, name: 'Khaled Ahmed', status: 'on_trip', completedToday: 5, regionName: 'Jeddah Central' },
  { id: 4, name: 'Majid Sultan', status: 'offline', completedToday: 3, regionName: 'Dammam East' },
  { id: 5, name: 'Sami Walid', status: 'available', completedToday: 0, regionName: 'Mecca North' },
];

const DUMMY_TIME_KPIS: TimeKPI[] = [
  { metric: 'Avg Order Time (→ Delivery)', averageHours: 28.5, trend: 'down', trendPercent: 8 },
  { metric: 'Avg Supply Time', averageHours: 14.2, trend: 'down', trendPercent: 12 },
  { metric: 'Avg Aggregation Time', averageHours: 6.8, trend: 'stable', trendPercent: 1 },
  { metric: 'Avg Trip Setup Time', averageHours: 3.5, trend: 'down', trendPercent: 15 },
  { metric: 'Avg Last-Mile Delivery', averageHours: 2.1, trend: 'up', trendPercent: 5 },
  { metric: 'First-Attempt Success Rate', averageHours: 89, trend: 'up', trendPercent: 3 },
];

const DUMMY_TOP_SUPPLIERS: TopSupplier[] = [
  { id: 1, name: 'Fresh Farm Co.', orderCount: 48, acceptanceRate: 94 },
  { id: 2, name: 'Dairy Best Ltd.', orderCount: 36, acceptanceRate: 97 },
  { id: 3, name: 'Golden Grains', orderCount: 29, acceptanceRate: 91 },
  { id: 4, name: 'Premium Meats', orderCount: 22, acceptanceRate: 86 },
  { id: 5, name: 'Organic Valley', orderCount: 18, acceptanceRate: 100 },
];

const DUMMY_TOP_AREAS: TopArea[] = [
  { id: 1, name: 'Riyadh North', orderCount: 98, totalRevenue: 48500 },
  { id: 2, name: 'Jeddah Central', orderCount: 76, totalRevenue: 37200 },
  { id: 3, name: 'Dammam East', orderCount: 54, totalRevenue: 28100 },
  { id: 4, name: 'Mecca North', orderCount: 42, totalRevenue: 19500 },
  { id: 5, name: 'Riyadh South', orderCount: 38, totalRevenue: 18200 },
];

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
  try {
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
  } catch {
    return DUMMY_RECENT_ORDERS;
  }
}

async function fetchPendingApprovals(): Promise<PendingApproval[]> {
  try {
    const pendingSuppliers = await suppliersApi.getPendingApprovals();
    if (pendingSuppliers.length === 0) return [];
    return pendingSuppliers.map((s) => ({
      id: s.id,
      orderNumber: `SPL-${s.id}`,
      customerName: s.name,
      requestDetails: s.notes || `New supplier pending approval`,
      createdAt: s.createdAt,
    }));
  } catch {
    return DUMMY_PENDING_APPROVALS;
  }
}

async function fetchDriverActivity(): Promise<DriverStatus[]> {
  try {
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
  } catch {
    return DUMMY_DRIVER_ACTIVITY;
  }
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

    // Frontend-only widgets — still dummy
    timeKPIs: DUMMY_TIME_KPIS,
    topSuppliers: DUMMY_TOP_SUPPLIERS,
    topAreas: DUMMY_TOP_AREAS,
  };
}

export const dashboardApi = {
  /**
   * Fetch all dashboard widget data.
   * Calls the real backend for core stats, derives widget data from backend response,
   * and fetches widget-specific data from their respective APIs.
   */
  getWidgetsExpanded: async (): Promise<DashboardWidgetsExpanded> => {
    // Fire all data fetches in parallel
    const [dashboardResult, recentOrdersData, pendingApprovalsData, driverActivityData] = await Promise.all([
      apiClient.get<ApiResponse<DashboardBackendResponse>>('/api/v1/admin/dashboard').then((r) => r.data.data).catch(() => null as DashboardBackendResponse | null),
      fetchRecentOrders(),
      fetchPendingApprovals(),
      fetchDriverActivity(),
    ]);

    // If the real dashboard backend was available, use it; otherwise fall back to all-dummy
    let backendData: DashboardBackendResponse;
    if (dashboardResult) {
      backendData = dashboardResult;
    } else {
      // If backend is not available, return all-dummy data for development
      backendData = {
        orders: { today: 47, week: 342, month: 1425, by_type: { regular: 230, special: 45, seasonal: 67 } },
        action_required: {
          special_orders_pending_admin: 3, special_orders_pending_pricing: 4, orders_pending_customer: 2,
          orders_in_supply_delayed: 5, orders_ready_without_trip: 11, trips_without_driver: 3, delivery_failed_open: 2,
        },
        pipeline: { in_supply: 12, in_aggregation: 8, ready_to_ship: 11, out_for_delivery: 9, delivered_today: 47 },
        trips_today: { scheduled: 4, in_progress: 3, completed: 8 },
        revenue: 8390.50,
        pending_approvals: { suppliers: 1, products: 0 },
      };
    }

    const result = transformBackendResponse(backendData);
    result.recentOrders = recentOrdersData;
    result.pendingApprovals = pendingApprovalsData;
    result.driverActivity = driverActivityData;
    return result;
  },
};
