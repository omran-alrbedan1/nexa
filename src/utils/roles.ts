/**
 * Role-based access control utilities.
 * Maps the 6 platform roles to their permissions and route access.
 */

export type UserRole = 'customer' | 'supplier' | 'driver' | 'operations' | 'aggregation' | 'admin';

/** Role hierarchy: higher index = more privileges */
export const ROLE_HIERARCHY: UserRole[] = [
  'customer',
  'supplier',
  'driver',
  'aggregation',
  'operations',
  'admin',
];

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(requiredRole);
}

export function canAccess(
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(userRole);
}

/** Get the role label in a readable format */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    customer: 'Customer',
    supplier: 'Supplier',
    driver: 'Driver',
    operations: 'Operations',
    aggregation: 'Warehouse',
    admin: 'Admin',
  };
  return labels[role];
}

/** Get the role label in Arabic */
export function getRoleLabelAr(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    customer: 'عميل',
    supplier: 'مورد',
    driver: 'سائق',
    operations: 'عمليات',
    aggregation: 'مستودع',
    admin: 'مدير',
  };
  return labels[role];
}

/** Get a color for the role badge */
export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    customer: 'blue',
    supplier: 'purple',
    driver: 'orange',
    operations: 'indigo',
    aggregation: 'green',
    admin: 'red',
  };
  return colors[role];
}

/** Dashboard home route per role */
export function getDefaultRoute(role: UserRole): string {
  const routes: Record<UserRole, string> = {
    admin: '/admin/dashboard',
    operations: '/admin/orders',
    aggregation: '/admin/aggregation',
    customer: '/customer/products',
    supplier: '/supplier/dashboard',
    driver: '/driver/trips',
  };
  return routes[role];
}

/** Check if a role can manage other users */
export function canManageUsers(role: UserRole): boolean {
  return role === 'admin' || role === 'operations';
}

/** Check if a role can manage products */
export function canManageProducts(role: UserRole): boolean {
  return role === 'admin' || role === 'supplier';
}

/** Check if a role can view financial data */
export function canViewFinance(role: UserRole): boolean {
  return role === 'admin' || role === 'operations';
}
