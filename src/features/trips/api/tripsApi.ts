// ============================================================
// Trips API Service
// ============================================================
// PDF Reference: §2.5 (إدارة الرحلات / Trip Management), §1.5 (حالات الرحلة)
// Admin manages: trip creation, driver assignment, tracking, completion
// ============================================================

import type { TripStatus } from '@/types/marketplace';

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export interface TripOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  total: number;
  status: string;
}

export interface DashboardTrip {
  id: number;
  tripNumber: string;
  driverId: number | null;
  driverName: string | null;
  regionName: string;
  clusterName: string;
  status: TripStatus;
  scheduledDate: string;
  timeSlot: string;
  orderCount: number;
  totalValue: number;
  completedOrders: number;
  failedOrders: number;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripsPageData {
  stats: {
    total: number;
    scheduled: number;
    assigned: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    failed: number;
    totalOrders: number;
    totalValue: number;
    avgCompletionRate: number;
  };
  trips: DashboardTrip[];
  availableDrivers: { id: number; name: string; regionName: string; isAvailable: boolean }[];
}

// ── Dummy Data ──

const now = new Date();
const today = now.toISOString().split('T')[0];

const DUMMY_TRIPS: DashboardTrip[] = [
  { id: 1, tripNumber: 'TRP-2025-001', driverId: 1, driverName: 'Hassan Ali', regionName: 'Riyadh North', clusterName: 'Al-Olaya', status: 'in_progress', scheduledDate: today, timeSlot: '08:00-12:00', orderCount: 8, totalValue: 1240, completedOrders: 4, failedOrders: 0, startedAt: `${today}T08:15:00Z`, completedAt: null, notes: null, createdAt: `${today}T06:00:00Z`, updatedAt: `${today}T08:15:00Z` },
  { id: 2, tripNumber: 'TRP-2025-002', driverId: 2, driverName: 'Omar Farouk', regionName: 'Riyadh South', clusterName: 'Al-Batha', status: 'in_progress', scheduledDate: today, timeSlot: '08:00-12:00', orderCount: 6, totalValue: 890, completedOrders: 2, failedOrders: 1, startedAt: `${today}T08:30:00Z`, completedAt: null, notes: 'One customer not home', createdAt: `${today}T06:00:00Z`, updatedAt: `${today}T08:30:00Z` },
  { id: 3, tripNumber: 'TRP-2025-003', driverId: 3, driverName: 'Khaled Ahmed', regionName: 'Jeddah Central', clusterName: 'Al-Salamah', status: 'completed', scheduledDate: today, timeSlot: '08:00-12:00', orderCount: 7, totalValue: 1560, completedOrders: 7, failedOrders: 0, startedAt: `${today}T08:00:00Z`, completedAt: `${today}T11:45:00Z`, notes: null, createdAt: `${today}T06:00:00Z`, updatedAt: `${today}T11:45:00Z` },
  { id: 4, tripNumber: 'TRP-2025-004', driverId: null, driverName: null, regionName: 'Riyadh North', clusterName: 'Al-Malaz', status: 'scheduled', scheduledDate: today, timeSlot: '14:00-18:00', orderCount: 9, totalValue: 1340, completedOrders: 0, failedOrders: 0, startedAt: null, completedAt: null, notes: 'Need to assign driver', createdAt: `${today}T06:00:00Z`, updatedAt: `${today}T06:00:00Z` },
  { id: 5, tripNumber: 'TRP-2025-005', driverId: 4, driverName: 'Majid Sultan', regionName: 'Dammam East', clusterName: 'Al-Dammam Downtown', status: 'assigned', scheduledDate: today, timeSlot: '14:00-18:00', orderCount: 5, totalValue: 670, completedOrders: 0, failedOrders: 0, startedAt: null, completedAt: null, notes: null, createdAt: `${today}T06:00:00Z`, updatedAt: `${today}T08:00:00Z` },
  { id: 6, tripNumber: 'TRP-2025-006', driverId: null, driverName: null, regionName: 'Mecca North', clusterName: 'Al-Aziziyah', status: 'scheduled', scheduledDate: today, timeSlot: '14:00-18:00', orderCount: 4, totalValue: 520, completedOrders: 0, failedOrders: 0, startedAt: null, completedAt: null, notes: 'Region inactive — check', createdAt: `${today}T06:00:00Z`, updatedAt: `${today}T06:00:00Z` },
  { id: 7, tripNumber: 'TRP-2025-007', driverId: 1, driverName: 'Hassan Ali', regionName: 'Riyadh North', clusterName: 'King Fahd District', status: 'cancelled', scheduledDate: today, timeSlot: '08:00-12:00', orderCount: 3, totalValue: 450, completedOrders: 0, failedOrders: 0, startedAt: null, completedAt: null, notes: 'Driver unavailable — trip cancelled', createdAt: `${today}T05:00:00Z`, updatedAt: `${today}T07:00:00Z` },
];

const DUMMY_DRIVERS = [
  { id: 1, name: 'Hassan Ali', regionName: 'Riyadh North', isAvailable: false },
  { id: 2, name: 'Omar Farouk', regionName: 'Riyadh South', isAvailable: false },
  { id: 3, name: 'Khaled Ahmed', regionName: 'Jeddah Central', isAvailable: true },
  { id: 4, name: 'Majid Sultan', regionName: 'Dammam East', isAvailable: true },
  { id: 5, name: 'Sami Walid', regionName: 'Mecca North', isAvailable: true },
  { id: 6, name: 'Faisal Omar', regionName: 'Riyadh North', isAvailable: true },
];

const DUMMY_STATS = {
  total: 7, scheduled: 2, assigned: 1, inProgress: 2, completed: 1, cancelled: 1, failed: 0,
  totalOrders: 42, totalValue: 6670, avgCompletionRate: 85,
};

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const tripsApi = {
  getPageData: async (): Promise<TripsPageData> => {
    await delay();
    return { stats: DUMMY_STATS, trips: DUMMY_TRIPS, availableDrivers: DUMMY_DRIVERS };
  },

  assignDriver: async (tripId: number, driverId: number, driverName: string): Promise<DashboardTrip> => {
    await delay(400);
    const trip = DUMMY_TRIPS.find((t) => t.id === tripId);
    if (!trip) throw new Error('Trip not found');
    return { ...trip, driverId, driverName, status: 'assigned', updatedAt: new Date().toISOString() };
  },

  startTrip: async (tripId: number): Promise<DashboardTrip> => {
    await delay(400);
    const trip = DUMMY_TRIPS.find((t) => t.id === tripId);
    if (!trip) throw new Error('Trip not found');
    return { ...trip, status: 'in_progress', startedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  },

  completeTrip: async (tripId: number): Promise<DashboardTrip> => {
    await delay(400);
    const trip = DUMMY_TRIPS.find((t) => t.id === tripId);
    if (!trip) throw new Error('Trip not found');
    return { ...trip, status: 'completed', completedAt: new Date().toISOString(), completedOrders: trip.orderCount, updatedAt: new Date().toISOString() };
  },
};

export type TripsApi = typeof tripsApi;
