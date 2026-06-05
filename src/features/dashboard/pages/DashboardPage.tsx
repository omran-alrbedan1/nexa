import { useAuth } from '@/contexts/AuthContext';
import { useDashboardWidgets } from '../hooks/useDashboardStats';
import { StatsCard } from '../components/StatsCard';
import { RevenueChart } from '../components/RevenueChart';
import { OrdersByStatusChart } from '../components/OrdersByStatusChart';
import { RecentOrdersWidget } from '../components/RecentOrdersWidget';
import { PendingApprovalsWidget } from '../components/PendingApprovalsWidget';
import { DriverActivityWidget } from '../components/DriverActivityWidget';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { UserRole } from '@/features/users/types/userTypes';
import type { ComponentType } from 'react';

// ── Admin / Operations dashboard ──
function AdminDashboard() {
  const { data, isLoading, error, refetch } = useDashboardWidgets();

  if (error) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        message={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Orders Today"
          value={data?.stats.deliveredToday ?? '-'}
          subtitle={`${data?.stats.activeOrders ?? 0} active orders`}
          variant="blue"
          isLoading={isLoading}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />
        <StatsCard
          title="Revenue Today"
          value={data ? `SAR ${data.stats.revenueToday.toLocaleString()}` : '-'}
          subtitle={`SAR ${(data?.stats.revenueThisMonth ?? 0).toLocaleString()} this month`}
          variant="green"
          isLoading={isLoading}
          trend={{ value: 12, isPositive: true }}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Active Drivers"
          value={data?.stats.activeDrivers ?? '-'}
          subtitle={`${data?.stats.pendingDeliveries ?? 0} pending deliveries`}
          variant="purple"
          isLoading={isLoading}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-1m2 1l2-1m2 1l2-1m2 1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v10m-6 1a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          }
        />
        <StatsCard
          title="Pending Requests"
          value={data?.stats.pendingSpecialRequests ?? '-'}
          subtitle="Special orders needing pricing"
          variant="amber"
          isLoading={isLoading}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <OrdersByStatusChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrdersWidget orders={data?.recentOrders ?? []} isLoading={isLoading} />
        </div>
        <PendingApprovalsWidget approvals={data?.pendingApprovals ?? []} isLoading={isLoading} />
      </div>

      <DriverActivityWidget drivers={data?.driverActivity ?? []} isLoading={isLoading} />
    </div>
  );
}

// ── Customer dashboard ──
function CustomerDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" hover>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Next Delivery</p>
              <p className="text-lg font-bold text-gray-900">Tomorrow 10AM</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent customer orders */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Orders</h3>
        <div className="space-y-3">
          {[
            { id: 'ORD-101', date: 'Jun 4', items: '3 items', status: 'Delivered', total: 'SAR 245.00', color: 'green' as const },
            { id: 'ORD-102', date: 'Jun 3', items: '1 item', status: 'Out for Delivery', total: 'SAR 89.50', color: 'blue' as const },
            { id: 'ORD-103', date: 'Jun 2', items: '5 items', status: 'Processing', total: 'SAR 320.00', color: 'yellow' as const },
          ].map((order) => (
            <div key={order.id} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.id}</p>
                  <p className="text-xs text-gray-500">{order.date} · {order.items}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">{order.total}</span>
                <Badge variant={order.color} size="sm">{order.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick action */}
      <Card padding="md" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Browse Products</h3>
            <p className="text-sm text-blue-100 mt-1">Explore our catalog and place your next order</p>
          </div>
          <a
            href="/catalog"
            className="px-5 py-2.5 bg-white text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors text-sm"
          >
            Go to Catalog →
          </a>
        </div>
      </Card>
    </div>
  );
}

// ── Driver dashboard ──
function DriverDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" hover>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-1m2 1l2-1m2 1l2-1m2 1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v10m-6 1a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Today's Stops</p>
              <p className="text-2xl font-bold text-gray-900">18</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">12</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-100 text-red-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">6</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="md">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Trip</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-gray-900">Riyadh North Route</p>
              <p className="text-sm text-gray-500">Region: Riyadh North · 6 stops left</p>
            </div>
            <Badge variant="blue" size="sm" dot>In Progress</Badge>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
              Start Trip
            </button>
            <button className="flex-1 px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              View Route
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Supplier dashboard ──
function SupplierDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" hover>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">My Products</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Revenue This Month</p>
              <p className="text-2xl font-bold text-gray-900">SAR 12,450</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="md">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Orders</h3>
        <div className="space-y-2">
          {[
            { id: 'ORD-201', product: 'Organic Dates 1kg', qty: 10, status: 'Pending Supply', color: 'yellow' as const },
            { id: 'ORD-202', product: 'Fresh Milk 2L', qty: 24, status: 'Supplied', color: 'green' as const },
            { id: 'ORD-203', product: 'Whole Wheat Flour 5kg', qty: 5, status: 'Pending Supply', color: 'yellow' as const },
          ].map((o) => (
            <div key={o.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">{o.product}</p>
                <p className="text-xs text-gray-500">{o.id} · Qty: {o.qty}</p>
              </div>
              <Badge variant={o.color} size="sm">{o.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Warehouse (aggregation) dashboard ──
function WarehouseDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" hover>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">To Process</p>
              <p className="text-2xl font-bold text-gray-900">14</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Supply</p>
              <p className="text-2xl font-bold text-gray-900">6</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ready to Ship</p>
              <p className="text-2xl font-bold text-green-600">9</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="md">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Today's Queue</h3>
        <div className="space-y-2">
          {[
            { order: 'ORD-301', supplier: 'Fresh Farm Co.', items: 'Organic Vegetables', status: 'Pending', color: 'yellow' as const },
            { order: 'ORD-302', supplier: 'Dairy Best', items: 'Milk & Cheese', status: 'Processing', color: 'blue' as const },
            { order: 'ORD-303', supplier: 'Golden Grains', items: 'Flour & Rice', status: 'Ready', color: 'green' as const },
          ].map((item) => (
            <div key={item.order} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.items}</p>
                <p className="text-xs text-gray-500">{item.order} · {item.supplier}</p>
              </div>
              <Badge variant={item.color} size="sm">{item.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Role-aware dispatcher ──
const ROLE_DASHBOARDS: Record<UserRole, ComponentType> = {
  admin: AdminDashboard,
  operations: AdminDashboard,
  aggregation: WarehouseDashboard,
  supplier: SupplierDashboard,
  driver: DriverDashboard,
  customer: CustomerDashboard,
};

export function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? 'customer';
  const DashboardComponent = ROLE_DASHBOARDS[role];

  const roleTitles: Record<string, string> = {
    admin: 'Admin Dashboard',
    operations: 'Operations Dashboard',
    aggregation: 'Warehouse Dashboard',
    supplier: 'Supplier Dashboard',
    driver: 'Driver Dashboard',
    customer: 'My Dashboard',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{roleTitles[role] || 'Dashboard'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, <span className="font-semibold">{user?.name}</span>
        </p>
      </div>
      <DashboardComponent />
    </div>
  );
}
