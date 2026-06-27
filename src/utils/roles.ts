/**
 * Role and permission-based access control utilities.
 * Adapted for the Laravel backend where dashboard staff use 'staff' user_type + permissions.
 */

import type { UserRole } from '@/types/marketplace';

/** Check if a user has a specific permission */
export function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes(required);
}

/** Check if a user can access a given set of permissions (ANY match) */
export function hasAnyPermission(permissions: string[], required: string[]): boolean {
  return required.some((p) => permissions.includes(p));
}

/** Check if a user can access a given set of permissions (ALL must match) */
export function hasAllPermissions(permissions: string[], required: string[]): boolean {
  return required.every((p) => permissions.includes(p));
}

/** Get the dashboard role label in readable format */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<string, string> = {
    customer: 'Customer',
    supplier: 'Supplier',
    driver: 'Driver',
    operations: 'Operations',
    aggregation: 'Warehouse',
    admin: 'Admin',
    staff: 'Staff',
  };
  return labels[role] || role;
}

/** Dashboard home route per frontend role */
export function getDefaultRoute(role: UserRole): string {
  const routes: Record<string, string> = {
    admin: '/dashboard',
    operations: '/dashboard',
    aggregation: '/dashboard',
    staff: '/dashboard',
  };
  return routes[role] || '/dashboard';
}
