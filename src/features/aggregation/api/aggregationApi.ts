// ============================================================
// Aggregation (Warehouse) API Service
// ============================================================
// All types mirror what a real backend would return.
// To switch to a real API:
//   1. Replace the dummy data in delay()
//   2. Uncomment the apiClient calls
//   3. Update the import from '@/lib/axios'
// ============================================================

import type { PaginatedResponse } from '@/types/common';

// ──────────────────────────────────────────────
// Domain Types — match real API contract
// ──────────────────────────────────────────────

export type SupplyStatus = 'pending' | 'in_transit' | 'received' | 'partial' | 'cancelled';
export type AggregationStatus = 'queued' | 'processing' | 'packed' | 'quality_check' | 'completed';
export type ShipmentStatus = 'pending_trip' | 'assigned_to_trip' | 'loaded' | 'shipped';

export interface Supplier {
  id: number;
  name: string;
  nameAr?: string;
  phone: string;
}

export interface WarehouseSupplyItem {
  id: number;
  supplier: Supplier;
  purchaseOrderNumber: string;
  items: string;
  itemCount: number;
  status: SupplyStatus;
  eta: string;            // ISO 8601
  receivedAt: string | null;
  notes: string;
  createdAt: string;
}

export interface AggregationOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  items: string;
  itemCount: number;
  status: AggregationStatus;
  regionName: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReadyToShipItem {
  id: number;
  orderNumber: string;
  customerName: string;
  items: string;
  itemCount: number;
  totalWeight: number;    // kg
  status: ShipmentStatus;
  regionName: string;
  tripId: number | null;
  tripName: string | null;
  packedAt: string;
  createdAt: string;
}

export interface WarehouseThroughput {
  itemsReceived: number;
  itemsProcessed: number;
  itemsShipped: number;
  activeWorkers: number;
  pendingReceiving: number;
  avgProcessingTime: number; // minutes
}

export interface AggregationPageData {
  supplyReceiving: WarehouseSupplyItem[];
  aggregationQueue: AggregationOrder[];
  readyToShip: ReadyToShipItem[];
  throughput: WarehouseThroughput;
}

// ── Query params ──

export interface SupplyReceivingParams {
  status?: SupplyStatus;
  supplierId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
}

export interface AggregationQueueParams {
  status?: AggregationStatus;
  regionId?: number;
  page?: number;
  perPage?: number;
}

// ──────────────────────────────────────────────
// Dummy Data
// ──────────────────────────────────────────────

const DUMMY_SUPPLIERS: Supplier[] = [
  { id: 1, name: 'Fresh Farm Co.', phone: '+966501234001' },
  { id: 2, name: 'Dairy Best Ltd.', phone: '+966501234002' },
  { id: 3, name: 'Premium Meats', phone: '+966501234003' },
  { id: 4, name: 'Golden Grains', phone: '+966501234004' },
  { id: 5, name: 'Organic Valley', phone: '+966501234005' },
];

const now = new Date();
const today = now.toISOString().split('T')[0];

const DUMMY_SUPPLY_RECEIVING: WarehouseSupplyItem[] = [
  { id: 1, supplier: DUMMY_SUPPLIERS[0], purchaseOrderNumber: 'PO-2025-0042', items: 'Organic Tomatoes (50kg), Cucumbers (30kg), Bell Peppers (20kg)', itemCount: 3, status: 'in_transit', eta: `${today}T10:30:00Z`, receivedAt: null, notes: 'Temperature-sensitive — refrigerated truck', createdAt: '2025-06-06T08:00:00Z' },
  { id: 2, supplier: DUMMY_SUPPLIERS[1], purchaseOrderNumber: 'PO-2025-0043', items: 'Fresh Milk 2L (48 units), Greek Yogurt (24 units), Labneh (36 units)', itemCount: 3, status: 'received', eta: `${today}T09:15:00Z`, receivedAt: `${today}T09:20:00Z`, notes: 'All items within expiry date — approved', createdAt: '2025-06-05T14:00:00Z' },
  { id: 3, supplier: DUMMY_SUPPLIERS[2], purchaseOrderNumber: 'PO-2025-0044', items: 'Chicken Breast (30kg), Beef Cubes (20kg), Lamb Chops (15kg)', itemCount: 3, status: 'pending', eta: `${today}T13:00:00Z`, receivedAt: null, notes: 'Requires freezer storage immediately', createdAt: '2025-06-06T10:00:00Z' },
  { id: 4, supplier: DUMMY_SUPPLIERS[3], purchaseOrderNumber: 'PO-2025-0045', items: 'Whole Wheat Flour 5kg (20 bags), Basmati Rice 10kg (15 bags)', itemCount: 2, status: 'in_transit', eta: `${today}T14:30:00Z`, receivedAt: null, notes: 'Dry goods — store in Aisle 3', createdAt: '2025-06-06T11:00:00Z' },
  { id: 5, supplier: DUMMY_SUPPLIERS[4], purchaseOrderNumber: 'PO-2025-0046', items: 'Organic Honey 500g (24 jars), Premium Dates 1kg (30 boxes)', itemCount: 2, status: 'partial', eta: `${today}T11:00:00Z`, receivedAt: `${today}T11:15:00Z`, notes: 'Honey received. Dates delayed — ETA tomorrow', createdAt: '2025-06-06T09:00:00Z' },
  { id: 6, supplier: DUMMY_SUPPLIERS[0], purchaseOrderNumber: 'PO-2025-0047', items: 'Strawberries (40 punnets), Blueberries (20 punnets)', itemCount: 2, status: 'pending', eta: `${today}T16:00:00Z`, receivedAt: null, notes: 'Urgent — customer pre-orders for weekend', createdAt: '2025-06-07T06:00:00Z' },
];

const DUMMY_AGGREGATION_QUEUE: AggregationOrder[] = [
  { id: 1, orderNumber: 'ORD-2025-008', customerName: 'Nora Hassan', items: 'Seasonal fruit basket, Premium dates (2kg)', itemCount: 2, status: 'processing', regionName: 'Riyadh North', assignedTo: 'Ahmed Al-Saud', createdAt: '2025-06-07T07:00:00Z', updatedAt: '2025-06-07T08:30:00Z' },
  { id: 2, orderNumber: 'ORD-2025-009', customerName: 'Mohamed Noor', items: 'Fresh milk (2L×3), Labneh, Brown eggs (12pk)', itemCount: 4, status: 'queued', regionName: 'Riyadh South', assignedTo: null, createdAt: '2025-06-07T08:00:00Z', updatedAt: '2025-06-07T08:00:00Z' },
  { id: 3, orderNumber: 'ORD-2025-010', customerName: 'Layla Ibrahim', items: 'Imported cheese selection', itemCount: 1, status: 'quality_check', regionName: 'Jeddah Central', assignedTo: 'Sara Al-Otaibi', createdAt: '2025-06-06T16:00:00Z', updatedAt: '2025-06-07T09:00:00Z' },
  { id: 4, orderNumber: 'ORD-2025-011', customerName: 'Faisal Omar', items: 'Chicken breast (2kg), Beef cubes (1kg)', itemCount: 2, status: 'packed', regionName: 'Dammam East', assignedTo: 'Khalid Al-Ghamdi', createdAt: '2025-06-06T14:00:00Z', updatedAt: '2025-06-07T07:45:00Z' },
  { id: 5, orderNumber: 'ORD-2025-012', customerName: 'Ahmed Ali', items: 'Organic vegetables box (large)', itemCount: 1, status: 'processing', regionName: 'Riyadh North', assignedTo: 'Ahmed Al-Saud', createdAt: '2025-06-07T06:30:00Z', updatedAt: '2025-06-07T09:00:00Z' },
  { id: 6, orderNumber: 'ORD-2025-013', customerName: 'Sara Khalid', items: 'Organic honey 5kg, Premium dates box', itemCount: 2, status: 'queued', regionName: 'Riyadh North', assignedTo: null, createdAt: '2025-06-07T09:30:00Z', updatedAt: '2025-06-07T09:30:00Z' },
];

const DUMMY_READY_TO_SHIP: ReadyToShipItem[] = [
  { id: 1, orderNumber: 'ORD-2025-004', customerName: 'Nora Hassan', items: 'Seasonal fruit basket', itemCount: 1, totalWeight: 3.5, status: 'pending_trip', regionName: 'Riyadh North', tripId: null, tripName: null, packedAt: `${today}T08:30:00Z`, createdAt: '2025-06-07T07:00:00Z' },
  { id: 2, orderNumber: 'ORD-2025-005', customerName: 'Khaled Salem', items: 'Fresh seafood platter', itemCount: 1, totalWeight: 2.8, status: 'assigned_to_trip', regionName: 'Jeddah Central', tripId: 101, tripName: 'Jeddah Morning Route', packedAt: `${today}T07:45:00Z`, createdAt: '2025-06-06T16:00:00Z' },
  { id: 3, orderNumber: 'ORD-2025-011', customerName: 'Faisal Omar', items: 'Chicken breast (2kg), Beef cubes (1kg)', itemCount: 2, totalWeight: 3.2, status: 'pending_trip', regionName: 'Dammam East', tripId: null, tripName: null, packedAt: `${today}T07:45:00Z`, createdAt: '2025-06-06T14:00:00Z' },
  { id: 4, orderNumber: 'ORD-2025-014', customerName: 'Majid Sultan', items: 'Whole wheat bread (5 loaves), Organic eggs (2×12pk)', itemCount: 2, totalWeight: 4.1, status: 'loaded', regionName: 'Riyadh South', tripId: 102, tripName: 'Riyadh South Afternoon', packedAt: `${today}T09:00:00Z`, createdAt: '2025-06-07T06:00:00Z' },
  { id: 5, orderNumber: 'ORD-2025-015', customerName: 'Sami Walid', items: 'Assorted nuts & dried fruits pack', itemCount: 1, totalWeight: 1.5, status: 'pending_trip', regionName: 'Mecca North', tripId: null, tripName: null, packedAt: `${today}T09:15:00Z`, createdAt: '2025-06-06T12:00:00Z' },
];

const DUMMY_THROUGHPUT: WarehouseThroughput = {
  itemsReceived: 156,
  itemsProcessed: 98,
  itemsShipped: 72,
  activeWorkers: 8,
  pendingReceiving: 6,
  avgProcessingTime: 45,
};

// ──────────────────────────────────────────────
// Simulated async delay
// ──────────────────────────────────────────────

function delay(ms = 350): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────
// API Methods — ready for backend integration
// ──────────────────────────────────────────────
// To connect to a real backend, uncomment the apiClient
// lines and delete the dummy data fallbacks.
// import { apiClient } from '@/lib/axios';

export const aggregationApi = {

  /** Fetch all warehouse/aggregation page data */
  getPageData: async (): Promise<AggregationPageData> => {
    await delay();
    return {
      supplyReceiving: DUMMY_SUPPLY_RECEIVING,
      aggregationQueue: DUMMY_AGGREGATION_QUEUE,
      readyToShip: DUMMY_READY_TO_SHIP,
      throughput: DUMMY_THROUGHPUT,
    };
  },

  /** Fetch supply receiving list with optional filters */
  getSupplyReceiving: async (_params?: SupplyReceivingParams): Promise<PaginatedResponse<WarehouseSupplyItem>> => {
    await delay();
    return {
      data: DUMMY_SUPPLY_RECEIVING,
      meta: { currentPage: 1, lastPage: 1, perPage: 20, total: DUMMY_SUPPLY_RECEIVING.length },
    };
  },

  /** Fetch aggregation queue with optional filters */
  getAggregationQueue: async (_params?: AggregationQueueParams): Promise<PaginatedResponse<AggregationOrder>> => {
    await delay();
    return {
      data: DUMMY_AGGREGATION_QUEUE,
      meta: { currentPage: 1, lastPage: 1, perPage: 20, total: DUMMY_AGGREGATION_QUEUE.length },
    };
  },

  /** Confirm receipt of supplier items */
  confirmReceipt: async (supplyId: number): Promise<WarehouseSupplyItem> => {
    await delay(600);
    const item = DUMMY_SUPPLY_RECEIVING.find((s) => s.id === supplyId);
    if (!item) throw new Error('Supply item not found');
    return {
      ...item,
      status: 'received',
      receivedAt: new Date().toISOString(),
    };
  },

  /** Start processing an order in the aggregation queue */
  startProcessing: async (orderId: number, assignee: string): Promise<AggregationOrder> => {
    await delay(500);
    const order = DUMMY_AGGREGATION_QUEUE.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    return { ...order, status: 'processing', assignedTo: assignee, updatedAt: new Date().toISOString() };
  },

  /** Mark order as packed and ready for quality check */
  markPacked: async (orderId: number): Promise<AggregationOrder> => {
    await delay(500);
    const order = DUMMY_AGGREGATION_QUEUE.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    return { ...order, status: 'packed', updatedAt: new Date().toISOString() };
  },

  /** Pass quality check — move to ready-to-ship */
  passQualityCheck: async (orderId: number): Promise<AggregationOrder> => {
    await delay(500);
    const order = DUMMY_AGGREGATION_QUEUE.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    return { ...order, status: 'completed', updatedAt: new Date().toISOString() };
  },

  /** Assign ready-to-ship items to a trip */
  assignToTrip: async (itemId: number, tripId: number, tripName: string): Promise<ReadyToShipItem> => {
    await delay(600);
    const item = DUMMY_READY_TO_SHIP.find((r) => r.id === itemId);
    if (!item) throw new Error('Item not found');
    return { ...item, status: 'assigned_to_trip', tripId, tripName };
  },

  /** Get warehouse throughput stats */
  getThroughput: async (): Promise<WarehouseThroughput> => {
    await delay(200);
    return DUMMY_THROUGHPUT;
  },
};

/** Type helper for API response types */
export type AggregationApi = typeof aggregationApi;
