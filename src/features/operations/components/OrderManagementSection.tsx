import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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



const TYPE_BADGE_COLORS: Record<OrderType, 'teal' | 'yellow' | 'purple'> = {
  regular: 'teal',
  special: 'yellow',
  seasonal: 'purple',
};

interface OrderManagementSectionProps {
  orders: OperationsOrder[];
  isLoading: boolean;
}

export function OrderManagementSection({ orders, isLoading }: OrderManagementSectionProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  /** Export filtered orders as CSV */
  const exportAsCSV = () => {
    const headers = ['Order #', 'Customer', 'Type', 'Status', 'Items', 'Total (SAR)', 'Region', 'Created'].join(',');
    const rows = filtered.map((o) => [
      o.orderNumber,
      `"${o.customerName}"`,
      o.type,
      o.status,
      o.itemCount,
      o.total.toFixed(2),
      `"${o.regionName}"`,
      new Date(o.createdAt).toLocaleDateString(),
    ].join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    useToastStore.getState().addToast('success', t('operations.orderManagement.exported', { count: filtered.length }));
  };

  /** Status transitions the operations role can perform */
  const getQuickActions = (order: OperationsOrder) => {
    const actions: Array<{ label: string; status: OrderStatus; variant: 'primary' | 'danger' | 'outline' }> = [];

    switch (order.status) {
      case 'new':
        actions.push({ label: t('operations.orderManagement.confirm'), status: 'confirmed', variant: 'primary' });
        actions.push({ label: t('operations.orderManagement.cancel'), status: 'cancelled', variant: 'danger' });
        break;
      case 'confirmed':
        actions.push({ label: t('operations.orderManagement.markPaid'), status: 'paid', variant: 'primary' });
        break;
      case 'failed_delivery':
        actions.push({ label: t('operations.orderManagement.retryDelivery'), status: 'out_for_delivery', variant: 'primary' });
        actions.push({ label: t('operations.orderManagement.cancel'), status: 'cancelled', variant: 'danger' });
        break;
      case 'pending_aggregation':
        actions.push({ label: t('operations.orderManagement.markReady'), status: 'ready_to_ship', variant: 'primary' });
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
            <h3 className="text-sm font-semibold text-gray-900">{t('operations.orderManagement.title')}</h3>
            <p className="text-xs text-gray-500">
              {t('operations.orderManagement.itemCount', { count: orders.length })} · {t('operations.orderManagement.newCount', { count: orders.filter((o) => o.status === 'new').length })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsCSV}
            >
              {t('operations.orderManagement.exportCsv')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/orders')}
            >
              {t('operations.orderManagement.newOrder')}
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
            placeholder={t('operations.orderManagement.searchPlaceholder')}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t('operations.orderManagement.allStatuses')}</option>
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
          <option value="">{t('operations.orderManagement.allTypes')}</option>
          <option value="regular">{t('operations.orderManagement.regular')}</option>
          <option value="special">{t('operations.orderManagement.special')}</option>
          <option value="seasonal">{t('operations.orderManagement.seasonal')}</option>
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
          title={t('operations.orderManagement.noOrdersFound')}
          description={search ? t('operations.orderManagement.tryDifferentSearch') : t('operations.orderManagement.noOrdersMatch')}
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
            {orders.filter((o) => o.status === 'new').length} {t('orders.stats.new').toLowerCase()} ·{' '}
            {orders.filter((o) => o.status === 'failed_delivery').length} {t('operations.stats.failedDeliveries')}
          </span>
          <button
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            onClick={() => navigate('/orders')}
          >
            {t('operations.orderManagement.viewAllOrders')} →
          </button>
        </div>
      )}
    </Card>
  );
}
