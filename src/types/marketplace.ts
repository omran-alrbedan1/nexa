/**
 * Core domain types for the Marketplace platform.
 * These types represent the main entities across all features.
 */

// ──────────────────────────────────────────────
// Users & Roles
// ──────────────────────────────────────────────

export type UserRole = 'customer' | 'supplier' | 'driver' | 'operations' | 'aggregation' | 'admin' | 'staff';

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'blocked';
export type UserType = 'customer' | 'supplier' | 'driver' | 'staff';

/** Alias — User is the canonical name used across the app */
export type User = MarketplaceUser;

export interface MarketplaceUser {
  /** Core identity — from backend UserResource */
  id: number;
  first_name: string;
  last_name: string | null;
  full_name: string;
  /** Convenience alias consumed by some pages */
  name?: string | null;
  phone: string | null;
  email: string | null;
  avatar: string | null;

  /** Backend user_type enum */
  user_type: UserType;
  /** Backend user status */
  status: UserStatus;

  /** Dashboard-only: mapped from user_type + permissions for existing frontend logic */
  role: UserRole;

  /** Backend RBAC arrays */
  roles: string[];
  permissions: string[];

  /** Profile relations (backend returns null for profiles that don't apply) */
  customer_profile: Record<string, unknown> | null;
  supplier_profile: Record<string, unknown> | null;
  driver_profile: Record<string, unknown> | null;

  /** Timestamps */
  registration_source: string | null;
  phone_verified_at: string | null;
  email_verified_at: string | null;
  last_login_at: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Map backend permissions to frontend dashboard role.
 * This is how 'staff' user_type users get their 'admin'/'operations'/'aggregation' role.
 *
 * The backend assigns 'admin_panel.access' to ALL staff users, so permissions alone
 * can't distinguish roles. We check the backend role names first for accuracy.
 */
export function userTypeToDashboardRole(
  permissions: string[],
  roles?: string[]
): 'admin' | 'operations' | 'aggregation' {
  // Use backend role names first (more specific than permissions)
  if (roles) {
    if (roles.includes('aggregation')) return 'aggregation';
    if (roles.includes('operations')) return 'operations';
    if (roles.includes('super_admin') || roles.includes('admin')) return 'admin';
  }

  // Fall back to permission-based check
  if (permissions.includes('warehouse.access')) return 'aggregation';
  if (permissions.includes('orders.manage')) return 'operations';
  if (permissions.includes('admin_panel.access')) return 'admin';
  return 'admin'; // final fallback
}

// ──────────────────────────────────────────────
// Products
// ──────────────────────────────────────────────

export type ProductSource = 'internal' | 'supplier' | 'seasonal';

export interface Product {
  id: number;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  unit: string;
  imageUrl: string | null;
  categoryId: number;
  supplierId: number | null;
  source: ProductSource;
  isAvailable: boolean;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  nameAr: string;
  parentId: number | null;
  children?: ProductCategory[];
}

// ──────────────────────────────────────────────
// Orders
// ──────────────────────────────────────────────

export type OrderType = 'regular' | 'special' | 'seasonal';

export type OrderStatus =
  | 'new'
  | 'pending_management'
  | 'pending_pricing'
  | 'pending_customer_approval'
  | 'confirmed'
  | 'paid'
  | 'pending_supply'
  | 'pending_aggregation'
  | 'ready_to_ship'
  | 'ready_to_deliver'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed_delivery'
  | 'cancelled'
  | 'postponed'
  | 'suspended'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cash_on_delivery' | 'card_online' | 'bank_transfer';

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerRegionId: number;
  customerAddress: string;
  type: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  notes: string | null;
  scheduledDate: string;
  scheduledTimeSlot: string;
  regionId: number;
  supplierId: number | null;
  tripId: number | null;
  driverId: number | null;
  specialRequestDetails: string | null;
  specialRequestPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────
// Regions & Delivery
// ──────────────────────────────────────────────

export interface Region {
  id: number;
  name: string;
  nameAr: string;
  deliveryFee: number;
  deliveryTimeSlots: TimeSlot[];
  isActive: boolean;
}

export interface TimeSlot {
  id: number;
  regionId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxOrders: number;
}

// ──────────────────────────────────────────────
// Trips
// ──────────────────────────────────────────────

export type TripStatus =
  | 'scheduled'
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface Trip {
  id: number;
  driverId: number;
  driverName: string;
  regionId: number;
  scheduledDate: string;
  timeSlot: string;
  status: TripStatus;
  orders: Order[];
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────
// Seasonal Campaigns
// ──────────────────────────────────────────────

export interface SeasonalCampaign {
  id: number;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  startDate: string;
  endDate: string;
  products: Product[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────

export interface AppNotification {
  id: number;
  userId: number;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  type: 'order_update' | 'trip_update' | 'payment' | 'system' | 'special_request';
  relatedEntityType: 'order' | 'trip' | 'product' | 'payment';
  relatedEntityId: number;
  isRead: boolean;
  createdAt: string;
}

// ──────────────────────────────────────────────
// Audit Log
// ──────────────────────────────────────────────

export interface AuditLogEntry {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  actorId: number;
  actorName: string;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  createdAt: string;
}

// ──────────────────────────────────────────────
// Dashboard / Analytics
// ──────────────────────────────────────────────

export interface DashboardStats {
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
}
