import type { DashboardStats } from '@/types/marketplace';

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

export interface DashboardWidgets {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  pendingApprovals: PendingApproval[];
  driverActivity: DriverStatus[];
}

// ── Dummy data ──

const DUMMY_RECENT_ORDERS: RecentOrder[] = [
  { id: 1, orderNumber: 'ORD-2025-001', customerName: 'Ahmed Ali', type: 'regular', status: 'delivered', total: 245.00, createdAt: '2025-06-05T09:15:00Z' },
  { id: 2, orderNumber: 'ORD-2025-002', customerName: 'Sara Khalid', type: 'special', status: 'pending_pricing', total: 0, createdAt: '2025-06-05T09:30:00Z' },
  { id: 3, orderNumber: 'ORD-2025-003', customerName: 'Mohamed Noor', type: 'regular', status: 'out_for_delivery', total: 189.50, createdAt: '2025-06-05T08:45:00Z' },
  { id: 4, orderNumber: 'ORD-2025-004', customerName: 'Nora Hassan', type: 'seasonal', status: 'confirmed', total: 320.00, createdAt: '2025-06-05T07:20:00Z' },
  { id: 5, orderNumber: 'ORD-2025-005', customerName: 'Faisal Omar', type: 'regular', status: 'pending_aggregation', total: 78.00, createdAt: '2025-06-04T16:10:00Z' },
];

const DUMMY_PENDING_APPROVALS: PendingApproval[] = [
  { id: 1, orderNumber: 'ORD-2025-002', customerName: 'Sara Khalid', requestDetails: 'Organic honey 5kg + Premium dates box', createdAt: '2025-06-05T09:30:00Z' },
  { id: 2, orderNumber: 'ORD-2025-006', customerName: 'Layla Ibrahim', requestDetails: 'Imported cheese selection (3 types)', createdAt: '2025-06-05T08:15:00Z' },
  { id: 3, orderNumber: 'ORD-2025-007', customerName: 'Khalid Salem', requestDetails: 'Fresh seafood platter for 10 guests', createdAt: '2025-06-04T14:20:00Z' },
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

// ── Simulated async delay ──

function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const dashboardApi = {
  getWidgets: async (): Promise<DashboardWidgets> => {
    await delay();
    return {
      stats: DUMMY_STATS,
      recentOrders: DUMMY_RECENT_ORDERS,
      pendingApprovals: DUMMY_PENDING_APPROVALS,
      driverActivity: DUMMY_DRIVER_ACTIVITY,
    };
  },

  getStats: async (): Promise<DashboardStats> => {
    await delay();
    return DUMMY_STATS;
  },
};
