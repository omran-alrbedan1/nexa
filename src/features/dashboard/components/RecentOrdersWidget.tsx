import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge, getStatusColor } from '@/components/ui/StatusBadge';
import type { RecentOrder } from '../api/dashboardApi';

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface RecentOrdersWidgetProps {
  orders: RecentOrder[];
  isLoading?: boolean;
}

export function RecentOrdersWidget({ orders, isLoading }: RecentOrdersWidgetProps) {
  return (
    <Card padding="md">
      <CardHeader>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Recent Orders</h3>
          <p className="text-xs text-gray-500">Latest 5 orders</p>
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {order.customerName}
                  </span>
                  <span className="text-xs text-gray-400">{order.orderNumber}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400 capitalize">{order.type}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{formatTimeAgo(order.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                {order.total > 0 && (
                  <span className="text-sm font-medium text-gray-900">
                    SAR {order.total.toFixed(2)}
                  </span>
                )}
                <StatusBadge
                  status={formatStatusLabel(order.status)}
                  color={getStatusColor(order.status)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
