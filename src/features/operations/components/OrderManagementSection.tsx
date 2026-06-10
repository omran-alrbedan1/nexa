import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToastStore } from '@/stores/toastStore';
import { useUpdateOrderStatus } from '../hooks/useOperations';
import type { OperationsOrder } from '../api/operationsApi';
import type { OrderStatus, OrderType } from '@/types/marketplace';

const STATUS_COLORS: Record<string, 'green' | 'yellow' | 'blue' | 'orange' | 'red' | 'purple'> = {
  new: 'blue',
  pending_management: 'orange',
  pending_pricing: 'yellow',
  pending_customer_approval: 'yellow',
  confirmed: 'green',
  paid: 'green',
  pending_supply: 'blue',
  pending_aggregation: 'blue',
  ready_to_ship: 'purple',
  ready_to_deliver: 'purple',
  out_for_delivery: 'blue',
  delivered: 'green',
  failed_delivery: 'red',
  cancelled: 'red',
  postponed: 'orange',
  suspended: 'red',
  refunded: 'orange',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  pending_management: 'Pending Mgmt',
  pending_pricing: 'Pending Pricing',
  pending_customer_approval: 'Awaiting Customer',
  confirmed: 'Confirmed',
  paid: 'Paid',
  pending_supply: 'Pending Supply',
  pending_aggregation: 'In Aggregation',
  ready_to_ship: 'Ready to Ship',
  ready_to_deliver: 'Ready to Deliver',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  failed_delivery: 'Failed Delivery',
  cancelled: 'Cancelled',
  postponed: 'Postponed',
  suspended: 'Suspended',
  refunded: 'Refunded',
};

const TYPE_BADGE_COLORS: Record<OrderType, 'blue' | 'yellow' | 'purple'> = {
  regular: 'blue',
  special: 'yellow',
  seasonal: 'purple',
};

interface OrderManagementSectionProps {
  orders: OperationsOrder[];
  isLoading: boolean;
}

export function OrderManagementSection({ orders, isLoading }: OrderManagementSectionProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<OrderType | ''>('');
  const updateStatus = useUpdateOrderStatus();

  const filtered = orders.filter((order) => {
    const matchesSearch =
      !search ||
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesType = !typeFilter || order.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  /** Status transitions the operations role can perform */
  const getQuickActions = (order: OperationsOrder) => {
    const actions: Array<{ label: string; status: OrderStatus; variant: 'primary' | 'danger' | 'outline' }> = [];

    switch (order.status) {
      case 'new':
        actions.push({ label: 'Confirm', status: 'confirmed', variant: 'primary' });
        actions.push({ label: 'Cancel', status: 'cancelled', variant: 'danger' });
        break;
      case 'confirmed':
        actions.push({ label: 'Mark Paid', status: 'paid', variant: 'primary' });
        break;
      case 'failed_delivery':
        actions.push({ label: 'Retry Delivery', status: 'out_for_delivery', variant: 'primary' });
        actions.push({ label: 'Cancel', status: 'cancelled', variant: 'danger' });
        break;
      case 'pending_aggregation':
        actions.push({ label: 'Mark Ready', status: 'ready_to_ship', variant: 'primary' });
        break;
      default:
        break;
    }

    return actions;
  };

  return (
    <Card padding="md">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Order Management</h3>
            <p className="text-xs text-gray-500">
              {orders.length} orders · {orders.filter((o) => o.status === 'new').length} new
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => useToastStore.getState().addToast('info', 'Export feature coming soon')}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => useToastStore.getState().addToast('info', 'New order form coming soon')}
            >
              + New Order
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Filters row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 max-w-xs">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search order or customer..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending_supply">Pending Supply</option>
          <option value="pending_aggregation">In Aggregation</option>
          <option value="ready_to_ship">Ready to Ship</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="failed_delivery">Failed Delivery</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as OrderType | '')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="regular">Regular</option>
          <option value="special">Special</option>
          <option value="seasonal">Seasonal</option>
        </select>
      </div>

      {/* Order list */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No orders found"
          description={search ? 'Try a different search term' : 'No orders match the selected filters'}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const actions = getQuickActions(order);
            return (
              <div
                key={order.id}
                className="flex items-start justify-between py-3 px-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                {/* Left: order info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{order.orderNumber}</span>
                    <Badge variant={TYPE_BADGE_COLORS[order.type]} size="sm">
                      {order.type}
                    </Badge>
                    <StatusBadge
                      status={STATUS_LABELS[order.status] || order.status}
                      color={STATUS_COLORS[order.status] || 'blue'}
                    />
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    {order.customerName}
                    <span className="text-gray-400 mx-1">·</span>
                    {order.regionName}
                    <span className="text-gray-400 mx-1">·</span>
                    {order.itemCount} items
                    <span className="text-gray-400 mx-1">·</span>
                    {order.total > 0 ? `${order.total.toFixed(2)} SAR` : 'TBD'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-lg">{order.items}</p>
                  {order.notes && (
                    <p className="text-xs text-amber-600 mt-0.5 truncate max-w-md">{order.notes}</p>
                  )}
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 ml-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {actions.map((action) => (
                    <Button
                      key={action.status}
                      variant={action.variant}
                      size="sm"
                      isLoading={updateStatus.isPending}
                      onClick={() =>
                        updateStatus.mutate({ orderId: order.id, newStatus: action.status })
                      }
                    >
                      {action.label}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary bar */}
      {!isLoading && orders.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            {orders.filter((o) => o.status === 'new').length} new ·{' '}
            {orders.filter((o) => o.status === 'failed_delivery').length} failed deliveries
          </span>
          <button
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            onClick={() => useToastStore.getState().addToast('info', 'Full orders page with pagination coming soon')}
          >
            View All Orders →
          </button>
        </div>
      )}
    </Card>
  );
}
