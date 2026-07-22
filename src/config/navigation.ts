import {
  LayoutDashboard, ClipboardList, Truck, Warehouse,
  Users, Map, Megaphone, Package, FolderTree, Settings2,
  CreditCard, LifeBuoy, BarChart3, FileClock, Building2,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/routes/routes';

export interface NavItemConfig {
  id: string;
  label: string;
  icon: string;
  type: 'item';
  to: string;
  roles?: string[];
}

export interface NavGroupConfig {
  id: string;
  label: string;
  icon: string;
  type: 'group';
  roles?: string[];
  items: NavItemConfig[];
}

export type NavEntryConfig = NavGroupConfig;

export const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  ClipboardList,
  Truck,
  Warehouse,
  Users,
  Map,
  Megaphone,
  Package,
  FolderTree,
  Building2,
  Clock,
  Settings2,
  CreditCard,
  LifeBuoy,
  BarChart3,
  FileClock,
};

export const DEFAULT_NAV_CONFIG: NavGroupConfig[] = [
  {
    id: 'group-dashboard',
    label: 'nav.dashboard',
    icon: 'LayoutDashboard',
    type: 'group',
    items: [
      { id: 'dashboard', label: 'nav.dashboard', icon: 'LayoutDashboard', type: 'item', to: ROUTES.DASHBOARD },
    ],
  },
  {
    id: 'group-operations',
    label: 'nav.operations',
    icon: 'ClipboardList',
    type: 'group',
    roles: ['operations'],
    items: [
      { id: 'operations', label: 'nav.operations', icon: 'ClipboardList', type: 'item', to: ROUTES.OPERATIONS, roles: ['operations'] },
    ],
  },
  {
    id: 'group-orders',
    label: 'nav.groupOrders',
    icon: 'ClipboardList',
    type: 'group',
    roles: ['admin', 'operations'],
    items: [
      { id: 'orders', label: 'nav.orders', icon: 'ClipboardList', type: 'item', to: ROUTES.ORDERS, roles: ['admin', 'operations'] },
      { id: 'payments', label: 'nav.payments', icon: 'CreditCard', type: 'item', to: ROUTES.PAYMENTS, roles: ['admin', 'operations'] },
      { id: 'support', label: 'nav.support', icon: 'LifeBuoy', type: 'item', to: ROUTES.SUPPORT_TICKETS, roles: ['admin', 'operations'] },
      { id: 'special-orders', label: 'nav.specialOrders', icon: 'FileClock', type: 'item', to: ROUTES.SPECIAL_ORDERS, roles: ['admin', 'operations'] },
    ],
  },
  {
    id: 'group-fulfillment',
    label: 'nav.groupFulfillment',
    icon: 'Truck',
    type: 'group',
    roles: ['admin', 'operations', 'aggregation'],
    items: [
      { id: 'trips', label: 'nav.trips', icon: 'Truck', type: 'item', to: ROUTES.TRIPS, roles: ['admin', 'operations'] },
      { id: 'driver-monitor', label: 'nav.driverMonitor', icon: 'Map', type: 'item', to: ROUTES.DRIVER_MONITOR, roles: ['admin', 'operations'] },
      { id: 'warehouse', label: 'nav.warehouse', icon: 'Warehouse', type: 'item', to: ROUTES.AGGREGATION, roles: ['admin', 'aggregation'] },
    ],
  },
  {
    id: 'group-logistics',
    label: 'nav.groupLogistics',
    icon: 'Truck',
    type: 'group',
    roles: ['admin', 'operations'],
    items: [
      { id: 'customers', label: 'nav.customers', icon: 'Users', type: 'item', to: ROUTES.CUSTOMERS, roles: ['admin', 'operations'] },
      { id: 'suppliers', label: 'nav.suppliers', icon: 'Users', type: 'item', to: ROUTES.SUPPLIERS, roles: ['admin', 'operations'] },
      { id: 'drivers', label: 'nav.drivers', icon: 'Truck', type: 'item', to: ROUTES.DRIVERS, roles: ['admin', 'operations'] },
      { id: 'regions', label: 'nav.regions', icon: 'Map', type: 'item', to: ROUTES.REGIONS, roles: ['admin'] },
      { id: 'delivery-slots', label: 'nav.deliverySlots', icon: 'Clock', type: 'item', to: ROUTES.DELIVERY_SLOTS, roles: ['admin', 'operations'] },
    ],
  },
  {
    id: 'group-catalog',
    label: 'nav.groupCatalog',
    icon: 'Package',
    type: 'group',
    roles: ['admin'],
    items: [
      { id: 'products', label: 'nav.products', icon: 'Package', type: 'item', to: ROUTES.PRODUCTS },
      { id: 'campaigns', label: 'nav.campaigns', icon: 'Megaphone', type: 'item', to: ROUTES.CAMPAIGNS },
      { id: 'categories', label: 'nav.categories', icon: 'FolderTree', type: 'item', to: ROUTES.CATEGORIES },
    ],
  },
  {
    id: 'group-reports',
    label: 'nav.reports',
    icon: 'BarChart3',
    type: 'group',
    roles: ['admin'],
    items: [
      { id: 'reports', label: 'nav.reports', icon: 'BarChart3', type: 'item', to: ROUTES.REPORTS, roles: ['admin'] },
    ],
  },
  {
    id: 'group-settings',
    label: 'nav.settings',
    icon: 'Settings2',
    type: 'group',
    roles: ['admin'],
    items: [
      { id: 'settings', label: 'nav.settings', icon: 'Settings2', type: 'item', to: ROUTES.SETTINGS, roles: ['admin'] },
    ],
  },
];

export function resolveLabel(
  id: string,
  defaultLabel: string,
  customLabels: Record<string, string>,
  t: (key: string) => string,
): string {
  if (customLabels[id]) return customLabels[id];
  if (defaultLabel.startsWith('nav.')) return t(defaultLabel);
  return defaultLabel;
}

export function getItemTo(item: NavItemConfig): { path: string; search: string } {
  const [path, search] = item.to.split('?');
  return { path, search: search ? `?${search}` : '' };
}
