import type { DashboardStats } from '@/types/marketplace';

// ──────────────────────────────────────────────
// Existing types
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

// ──────────────────────────────────────────────
// NEXA PDF — Section 2.2 Dashboard types
// ──────────────────────────────────────────────

/** Action required items (Section 2.2.3) */
export interface ActionRequiredItem {
  type: 'new_special' | 'pending_pricing' | 'pending_customer' | 'overdue_supply' | 'ready_no_trip' | 'trip_no_driver' | 'failed_delivery';
  label: string;
  count: number;
  link?: string;
}

/** Pipeline stage (Section 2.2.4) */
export interface PipelineStage {
  stage: 'in_supply' | 'in_aggregation' | 'ready_to_ship' | 'in_trip' | 'delivered_today';
  label: string;
  count: number;
  color: string;
}

/** Trip summary (Section 2.2.5) */
export interface TripSummary {
  scheduled: number;
  inProgress: number;
  completed: number;
  failed: number;
}

/** Time KPIs (Section 2.2.6) */
export interface TimeKPI {
  metric: string;
  averageHours: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

/** Top supplier (Section 2.2.7) */
export interface TopSupplier {
  id: number;
  name: string;
  orderCount: number;
  acceptanceRate: number;
}

/** Top area (Section 2.2.8) */
export interface TopArea {
  id: number;
  name: string;
  orderCount: number;
  totalRevenue: number;
}

/** Filter state for dashboard */
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

/** Extended dashboard widgets matching NEXA spec */
export interface DashboardWidgetsExpanded {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  pendingApprovals: PendingApproval[];
  driverActivity: DriverStatus[];
  actionRequired: ActionRequiredItem[];
  pipeline: PipelineStage[];
  tripSummary: TripSummary;
  timeKPIs: TimeKPI[];
  topSuppliers: TopSupplier[];
  topAreas: TopArea[];
}

// ── Dummy data ──

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

const DUMMY_STATS: DashboardStats = {
  totalOrders: 342,
  activeOrders: 28,
  deliveredToday: 47,
  pendingDeliveries: 15,
  revenueToday: 8390.50,
  revenueThisMonth: 142500.00,
  activeDrivers: 12,
  pendingSpecialRequests: 3,
  ordersByStatus: {
    new: 5,
    confirmed: 8,
    pending_aggregation: 6,
    out_for_delivery: 9,
    delivered: 47,
    failed_delivery: 2,
    pending_pricing: 3,
  },
  ordersByType: {
    regular: 230,
    special: 45,
    seasonal: 67,
  },
};

const DUMMY_ACTION_REQUIRED: ActionRequiredItem[] = [
  { type: 'new_special', label: 'Special Orders — Pending Admin Review', count: 3, link: '/orders?status=pending_management' },
  { type: 'pending_pricing', label: 'Orders Awaiting Pricing', count: 4, link: '/orders?status=pending_pricing' },
  { type: 'pending_customer', label: 'Awaiting Customer Approval', count: 2, link: '/orders?status=pending_customer_approval' },
  { type: 'overdue_supply', label: 'Overdue Supply (Past SLA)', count: 5, link: '/orders?status=pending_supply' },
  { type: 'ready_no_trip', label: 'Ready to Ship — No Trip Assigned', count: 11, link: '/orders?status=ready_to_ship' },
  { type: 'trip_no_driver', label: 'Trips Without Driver', count: 3, link: '/trips?status=scheduled' },
  { type: 'failed_delivery', label: 'Failed Delivery — Needs Follow-up', count: 2, link: '/orders?status=failed_delivery' },
];

const DUMMY_PIPELINE: PipelineStage[] = [
  { stage: 'in_supply', label: 'In Supply', count: 12, color: '#F59E0B' },
  { stage: 'in_aggregation', label: 'In Aggregation', count: 8, color: '#3B82F6' },
  { stage: 'ready_to_ship', label: 'Ready to Ship', count: 11, color: '#8B5CF6' },
  { stage: 'in_trip', label: 'In Trip', count: 9, color: '#10B981' },
  { stage: 'delivered_today', label: 'Delivered Today', count: 47, color: '#059669' },
];

const DUMMY_TRIP_SUMMARY: TripSummary = {
  scheduled: 4,
  inProgress: 3,
  completed: 8,
  failed: 1,
};

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

// ── Simulated async delay ──

function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const dashboardApi = {
  getWidgetsExpanded: async (): Promise<DashboardWidgetsExpanded> => {
    await delay();
    return {
      stats: DUMMY_STATS,
      recentOrders: DUMMY_RECENT_ORDERS,
      pendingApprovals: DUMMY_PENDING_APPROVALS,
      driverActivity: DUMMY_DRIVER_ACTIVITY,
      actionRequired: DUMMY_ACTION_REQUIRED,
      pipeline: DUMMY_PIPELINE,
      tripSummary: DUMMY_TRIP_SUMMARY,
      timeKPIs: DUMMY_TIME_KPIS,
      topSuppliers: DUMMY_TOP_SUPPLIERS,
      topAreas: DUMMY_TOP_AREAS,
    };
  },

  getStats: async (): Promise<DashboardStats> => {
    await delay();
    return DUMMY_STATS;
  },
};
