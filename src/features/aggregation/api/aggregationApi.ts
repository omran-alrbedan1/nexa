// ============================================================
// Aggregation (Warehouse) API Service
// ============================================================
// Backend tables: warehouses, warehouse_zone, supply_records, order_warehouse_details
// Admin routes: ✅ BUILT (commit d991d0b — AggregationController + AdminAggregationService)
//   GET    /api/v1/admin/aggregation/supply-receiving        — SupplyRecordResource
//   POST   /api/v1/admin/aggregation/supply-receiving/{id}/confirm
//   GET    /api/v1/admin/aggregation/queue                    — AggregationQueueResource
//   POST   /api/v1/admin/aggregation/queue/{id}/start-processing
//   POST   /api/v1/admin/aggregation/queue/{id}/mark-packed
//   POST   /api/v1/admin/aggregation/queue/{id}/quality-check
//   GET    /api/v1/admin/aggregation/ready-to-ship
//   POST   /api/v1/admin/aggregation/orders/{orderId}/assign-trip
//   GET    /api/v1/admin/aggregation/throughput
//
// ⚠ Backend response key map:
//   supply-receiving → { supply_records: [...], meta: {...} }
//   queue            → { items: [...], meta: {...} }
//   ready-to-ship    → { orders: [...], meta: {...} }
//   throughput       → direct stats object (no wrapper)
// ============================================================

import { apiClient } from '@/lib/axios';
import { unwrap } from '@/lib/apiHelpers';
import type { PaginatedResponse, ApiResponse } from '@/types/common';

// ──────────────────────────────────────────────
// Domain Types
// ──────────────────────────────────────────────

export type SupplyStatus = 'pending' | 'awaiting_supplier' | 'in_transit' | 'confirmed' | 'partial' | 'cancelled';
export type AggregationStatus = 'queued' | 'processing' | 'packed' | 'completed';
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
  eta: string;
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
  totalWeight: number;
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
  avgProcessingTime: number;
}

export interface AggregationPageData {
  supplyReceiving: WarehouseSupplyItem[];
  aggregationQueue: AggregationOrder[];
  readyToShip: ReadyToShipItem[];
  throughput: WarehouseThroughput;
}

export interface SupplyReceivingParams {
  status?: SupplyStatus;
  warehouseId?: number;
  supplierId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface AggregationQueueParams {
  aggregationStatus?: AggregationStatus;
  warehouseId?: number;
  assignedTo?: number;
  page?: number;
  perPage?: number;
}

export interface ReadyToShipParams {
  warehouseId?: number;
  zoneId?: number;
  page?: number;
  perPage?: number;
}

// ── Backend Raw Types (matching SupplyRecordResource) ──

interface BackendSupplyRecordOrder {
  id: number;
  order_number: string;
  status: string;
  total: number;
  items_count: number;
}

interface BackendSupplyRecordSupplier {
  id: number;
  business_name: string;
  phone: string;
}

interface BackendSupplyRecordWarehouse {
  id: number;
  name: string;
}

interface BackendSupplyRecordConfirmedBy {
  id: number;
  full_name: string;
}

interface BackendSupplyRecord {
  id: number;
  status: string;
  expected_at: string | null;
  arrived_at: string | null;
  confirmed_at: string | null;
  supplier_note: string | null;
  receipt_image: string | null;
  order: BackendSupplyRecordOrder | null;
  supplier: BackendSupplyRecordSupplier | null;
  warehouse: BackendSupplyRecordWarehouse | null;
  confirmed_by: BackendSupplyRecordConfirmedBy | null;
  created_at: string;
}

// ── Backend Raw Types (matching AggregationQueueResource) ──

interface BackendQueueOrderCustomer {
  full_name: string;
  phone: string;
}

interface BackendQueueOrderZone {
  /** Backend returns `name_ar` (Arabic name), not `name` */
  name_ar: string;
}

interface BackendQueueOrder {
  id: number;
  order_number: string;
  status: string;
  total: number;
  customer: BackendQueueOrderCustomer | null;
  items_count: number;
  items_summary: string | null;
  zone: BackendQueueOrderZone | null;
}

interface BackendQueueAssignedTo {
  id: number;
  full_name: string;
}

interface BackendAggregationQueueItem {
  id: number;
  aggregation_status: string;
  shelf_location: string | null;
  processing_started_at: string | null;
  packed_at: string | null;
  quality_checked_at: string | null;
  completed_at: string | null;
  qc_note: string | null;
  order: BackendQueueOrder | null;
  assigned_to: BackendQueueAssignedTo | null;
}

// ── Backend Raw Types (ready-to-ship uses OrderResource) ──
// OrderResource fields: id, order_number, order_type, status, payment_status,
//   total, created_at, delivery_scheduled_at, customer, supplier, warehouse
// It does NOT have: ready_to_ship_at, items, items_count, trip_orders

interface BackendReadyToShipOrder {
  id: number;
  order_number: string;
  order_type?: string;
  status: string;
  payment_status?: string;
  total: number;
  created_at: string;
  delivery_scheduled_at?: string | null;
  customer: { id: number; name: string; phone: string } | null;
  warehouse: { id: number; name: string } | null;
}

// ── Backend Raw Types (throughput) ──

interface BackendThroughput {
  items_received: number;
  items_processed: number;
  items_shipped: number;
  active_workers: number;
  pending_receiving: number;
  avg_processing_time_hours: number;
}

// ── Backend wrapper types matching actual controller responses ──

interface BackendSupplyReceivingResponse {
  supply_records: BackendSupplyRecord[];
  meta: { current_page: number; last_page: number; total: number };
}

interface BackendAggregationQueueResponse {
  items: BackendAggregationQueueItem[];
  meta: { current_page: number; last_page: number; total: number };
}

interface BackendReadyToShipResponse {
  orders: BackendReadyToShipOrder[];
  meta: { current_page: number; last_page: number; total: number };
}

// ── Mapping ──

function mapBackendSupplyStatus(status: string): SupplyStatus {
  const map: Record<string, SupplyStatus> = {
    'pending': 'pending',
    'awaiting_supplier': 'awaiting_supplier',
    'in_transit': 'in_transit',
    'confirmed': 'confirmed',
    'partial': 'partial',
    'cancelled': 'cancelled',
  };
  return map[status] || 'pending';
}

function mapBackendAggregationStatus(status: string): AggregationStatus {
  const map: Record<string, AggregationStatus> = {
    'queued': 'queued',
    'processing': 'processing',
    'packed': 'packed',
    'completed': 'completed',
  };
  return map[status] || 'queued';
}

function mapBackendSupplyRecord(r: BackendSupplyRecord): WarehouseSupplyItem {
  const orderNum = r.order?.order_number || '';
  return {
    id: r.id,
    supplier: {
      id: r.supplier?.id || r.order?.id || 0,
      name: r.supplier?.business_name || `Supplier #${r.id}`,
      phone: r.supplier?.phone || '',
    },
    purchaseOrderNumber: orderNum ? `PO-${orderNum}` : `PO-${r.id}`,
    items: '',
    itemCount: r.order?.items_count || 0,
    status: mapBackendSupplyStatus(r.status || 'pending'),
    eta: r.expected_at || r.created_at,
    receivedAt: r.confirmed_at || r.arrived_at,
    notes: r.supplier_note || '',
    createdAt: r.created_at,
  };
}

function mapBackendQueueItem(q: BackendAggregationQueueItem): AggregationOrder {
  const order = q.order;
  // Backend returns name_ar for zone, not name
  const regionName = order?.zone?.name_ar || '';
  return {
    id: q.id,
    orderNumber: order?.order_number || `ORD-${q.id}`,
    customerName: order?.customer?.full_name || 'Unknown',
    items: order?.items_summary || '',
    itemCount: order?.items_count || 0,
    status: mapBackendAggregationStatus(q.aggregation_status),
    regionName,
    assignedTo: q.assigned_to?.full_name || null,
    createdAt: q.processing_started_at || new Date().toISOString(),
    updatedAt: q.quality_checked_at || q.packed_at || q.processing_started_at || new Date().toISOString(),
  };
}

function mapBackendReadyToShip(o: BackendReadyToShipOrder): ReadyToShipItem {
  return {
    id: o.id,
    orderNumber: o.order_number || `ORD-${o.id}`,
    customerName: o.customer?.name || 'Unknown',
    // OrderResource doesn't include items/trip_orders, so defaults for now
    items: '',
    itemCount: 0,
    totalWeight: 0,
    status: 'pending_trip',
    regionName: '',
    tripId: null,
    tripName: null,
    packedAt: o.created_at,
    createdAt: o.created_at,
  };
}

function mapBackendThroughput(t: BackendThroughput): WarehouseThroughput {
  return {
    itemsReceived: t.items_received,
    itemsProcessed: t.items_processed,
    itemsShipped: t.items_shipped,
    activeWorkers: t.active_workers,
    pendingReceiving: t.pending_receiving,
    avgProcessingTime: Math.round(t.avg_processing_time_hours * 60),
  };
}



/** Helper: extract paginated items from a backend response with a dynamic key */
function extractPaginated<T>(response: ApiResponse<Record<string, unknown>> | null, key: string, map: (raw: unknown) => T): { items: T[]; meta: { current_page: number; last_page: number; total: number } } {
  if (!response) return { items: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } };
  try {
    const data = unwrap(response);
    const rawItems = (data[key] as unknown[]) || [];
    return { items: rawItems.map(map), meta: data.meta as { current_page: number; last_page: number; total: number } || { current_page: 1, last_page: 1, total: rawItems.length } };
  } catch {
    return { items: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } };
  }
}

export const aggregationApi = {
  /** Fetch all warehouse/aggregation page data */
  getPageData: async (): Promise<AggregationPageData> => {
    try {
      // Fire all data fetches in parallel
      const [supplyRes, queueRes, readyRes, throughputRes] = await Promise.all([
        apiClient.get<ApiResponse<BackendSupplyReceivingResponse>>('/api/v1/admin/aggregation/supply-receiving').then((r) => r.data).catch(() => null),
        apiClient.get<ApiResponse<BackendAggregationQueueResponse>>('/api/v1/admin/aggregation/queue').then((r) => r.data).catch(() => null),
        apiClient.get<ApiResponse<BackendReadyToShipResponse>>('/api/v1/admin/aggregation/ready-to-ship').then((r) => r.data).catch(() => null),
        apiClient.get<ApiResponse<BackendThroughput>>('/api/v1/admin/aggregation/throughput').then((r) => r.data).catch(() => null),
      ]);

      // Backend keys: supply-receiving→supply_records, queue→items, ready-to-ship→orders
      const supplyResult = extractPaginated(supplyRes, 'supply_records', mapBackendSupplyRecord);
      const queueResult = extractPaginated(queueRes, 'items', mapBackendQueueItem);
      const readyResult = extractPaginated(readyRes, 'orders', mapBackendReadyToShip);

      const throughput = throughputRes
        ? mapBackendThroughput(unwrap(throughputRes))
        : { itemsReceived: 0, itemsProcessed: 0, itemsShipped: 0, activeWorkers: 0, pendingReceiving: 0, avgProcessingTime: 0 };

      return { supplyReceiving: supplyResult.items, aggregationQueue: queueResult.items, readyToShip: readyResult.items, throughput };
    } catch {
      return { supplyReceiving: [], aggregationQueue: [], readyToShip: [], throughput: { itemsReceived: 0, itemsProcessed: 0, itemsShipped: 0, activeWorkers: 0, pendingReceiving: 0, avgProcessingTime: 0 } };
    }
  },

  /** Fetch supply receiving list with optional filters */
  getSupplyReceiving: async (params?: SupplyReceivingParams): Promise<PaginatedResponse<WarehouseSupplyItem>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.set('status', params.status);
      if (params?.warehouseId) queryParams.set('warehouse_id', String(params.warehouseId));
      if (params?.supplierId) queryParams.set('supplier_id', String(params.supplierId));
      if (params?.dateFrom) queryParams.set('from_date', params.dateFrom);
      if (params?.dateTo) queryParams.set('to_date', params.dateTo);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.page) queryParams.set('page', String(params.page));
      if (params?.perPage) queryParams.set('per_page', String(params.perPage));
      const qs = queryParams.toString();
      const response = await apiClient.get<ApiResponse<BackendSupplyReceivingResponse>>(
        `/api/v1/admin/aggregation/supply-receiving${qs ? '?' + qs : ''}`
      );
      const backendData = unwrap(response.data);
      const items = backendData.supply_records.map(mapBackendSupplyRecord);
      return { data: items, meta: { currentPage: backendData.meta.current_page, lastPage: backendData.meta.last_page, perPage: params?.perPage || 20, total: backendData.meta.total } };
    } catch {
      return { data: [], meta: { currentPage: 1, lastPage: 1, perPage: 20, total: 0 } };
    }
  },

  /** Fetch aggregation queue with optional filters */
  getAggregationQueue: async (params?: AggregationQueueParams): Promise<PaginatedResponse<AggregationOrder>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.aggregationStatus) queryParams.set('aggregation_status', params.aggregationStatus);
      if (params?.warehouseId) queryParams.set('warehouse_id', String(params.warehouseId));
      if (params?.assignedTo) queryParams.set('assigned_to', String(params.assignedTo));
      if (params?.page) queryParams.set('page', String(params.page));
      if (params?.perPage) queryParams.set('per_page', String(params.perPage));
      const qs = queryParams.toString();
      const response = await apiClient.get<ApiResponse<BackendAggregationQueueResponse>>(
        `/api/v1/admin/aggregation/queue${qs ? '?' + qs : ''}`
      );
      const backendData = unwrap(response.data);
      const items = backendData.items.map(mapBackendQueueItem);
      return { data: items, meta: { currentPage: backendData.meta.current_page, lastPage: backendData.meta.last_page, perPage: params?.perPage || 20, total: backendData.meta.total } };
    } catch {
      return { data: [], meta: { currentPage: 1, lastPage: 1, perPage: 20, total: 0 } };
    }
  },

  /** Confirm receipt of supplier items */
  confirmReceipt: async (supplyId: number, note?: string): Promise<WarehouseSupplyItem> => {
    try {
      const body = note ? { note } : {};
      const response = await apiClient.post<ApiResponse<BackendSupplyRecord>>(`/api/v1/admin/aggregation/supply-receiving/${supplyId}/confirm`, body);
      return mapBackendSupplyRecord(unwrap(response.data));
    } catch {
      throw new Error('Failed to confirm receipt');
    }
  },

  /** Start processing an item in the aggregation queue */
  startProcessing: async (orderId: number, _assignee: string): Promise<AggregationOrder> => {
    try {
      // Backend StartProcessingRequest expects `assigned_to` (nullable integer, user ID)
      const response = await apiClient.post<ApiResponse<BackendAggregationQueueItem>>(
        `/api/v1/admin/aggregation/queue/${orderId}/start-processing`,
        { assigned_to: undefined }
      );
      return mapBackendQueueItem(unwrap(response.data));
    } catch {
      throw new Error('Failed to start processing');
    }
  },

  /** Mark packed */
  markPacked: async (orderId: number): Promise<AggregationOrder> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendAggregationQueueItem>>(`/api/v1/admin/aggregation/queue/${orderId}/mark-packed`);
      return mapBackendQueueItem(unwrap(response.data));
    } catch {
      throw new Error('Failed to mark as packed');
    }
  },

  /** Pass quality check */
  passQualityCheck: async (orderId: number, passed: boolean = true, note?: string): Promise<AggregationOrder> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendAggregationQueueItem>>(
        `/api/v1/admin/aggregation/queue/${orderId}/quality-check`,
        { passed, note: note || undefined }
      );
      return mapBackendQueueItem(unwrap(response.data));
    } catch {
      throw new Error('Quality check failed');
    }
  },

  /** Get ready-to-ship list */
  getReadyToShip: async (params?: ReadyToShipParams): Promise<PaginatedResponse<ReadyToShipItem>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.warehouseId) queryParams.set('warehouse_id', String(params.warehouseId));
      if (params?.zoneId) queryParams.set('zone_id', String(params.zoneId));
      if (params?.page) queryParams.set('page', String(params.page));
      if (params?.perPage) queryParams.set('per_page', String(params.perPage));
      const qs = queryParams.toString();
      const response = await apiClient.get<ApiResponse<BackendReadyToShipResponse>>(
        `/api/v1/admin/aggregation/ready-to-ship${qs ? '?' + qs : ''}`
      );
      const backendData = unwrap(response.data);
      const items = backendData.orders.map(mapBackendReadyToShip);
      return { data: items, meta: { currentPage: backendData.meta.current_page, lastPage: backendData.meta.last_page, perPage: params?.perPage || 20, total: backendData.meta.total } };
    } catch {
      return { data: [], meta: { currentPage: 1, lastPage: 1, perPage: 20, total: 0 } };
    }
  },

  /** Assign to trip — backend uses POST /aggregation/orders/{orderId}/assign-trip */
  assignToTrip: async (itemId: number, tripId: number, tripName: string): Promise<ReadyToShipItem> => {
    try {
      const response = await apiClient.post<ApiResponse<BackendReadyToShipOrder>>(`/api/v1/admin/aggregation/orders/${itemId}/assign-trip`, { trip_id: tripId });
      const data = unwrap(response.data);
      return {
        id: data.id || itemId,
        orderNumber: data.order_number || `ORD-${itemId}`,
        customerName: data.customer?.name || 'Unknown',
        items: '',
        itemCount: 0,
        totalWeight: 0,
        status: 'assigned_to_trip',
        regionName: '',
        tripId,
        tripName,
        packedAt: new Date().toISOString(),
        createdAt: data.created_at || new Date().toISOString(),
      };
    } catch {
      throw new Error('Failed to assign to trip');
    }
  },

  /** Get warehouse throughput stats */
  getThroughput: async (warehouseId?: number): Promise<WarehouseThroughput> => {
    try {
      const qs = warehouseId ? `?warehouse_id=${warehouseId}` : '';
      const response = await apiClient.get<ApiResponse<BackendThroughput>>(`/api/v1/admin/aggregation/throughput${qs}`);
      return mapBackendThroughput(unwrap(response.data));
    } catch {
      return { itemsReceived: 0, itemsProcessed: 0, itemsShipped: 0, activeWorkers: 0, pendingReceiving: 0, avgProcessingTime: 0 };
    }
  },

  /** Get all warehouses — backend returns {warehouses: [...], meta: {...}} */
  getWarehouses: async (): Promise<{ id: number; name: string; nameAr?: string; address: string; capacity: number; isActive: boolean }[]> => {
    try {
      const response = await apiClient.get<ApiResponse<{ warehouses: Record<string, unknown>[]; meta: Record<string, unknown> }>>('/api/v1/admin/warehouses');
      const data = unwrap(response.data);
      return data.warehouses.map((w: Record<string, unknown>) => ({
        id: w.id,
        name: w.name,
        nameAr: w.name_ar || '',
        address: w.address || '',
        capacity: Number(w.capacity || 0),
        isActive: w.is_active !== false,
      }));
    } catch {
      return [
        { id: 1, name: 'Riyadh Main Warehouse', address: 'Riyadh, Industrial Zone', capacity: 500, isActive: true },
        { id: 2, name: 'Jeddah Warehouse', address: 'Jeddah, Industrial Area', capacity: 300, isActive: true },
        { id: 3, name: 'Dammam Warehouse', address: 'Dammam, Industrial City', capacity: 200, isActive: true },
      ];
    }
  },

  /** Update warehouse settings */
  updateWarehouse: async (id: number, data: {
    name?: string;
    address?: string;
    capacity?: number;
    isActive?: boolean;
    zoneIds?: number[];
  }): Promise<void> => {
    try {
      await apiClient.put(`/api/v1/admin/warehouses/${id}`, {
        name: data.name,
        address: data.address,
        capacity: data.capacity,
        is_active: data.isActive,
        zone_ids: data.zoneIds,
      });
    } catch {
      return;
    }
  },
};

export type AggregationApi = typeof aggregationApi;
