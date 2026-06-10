import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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

function getStatusBadgeVariant(status: string): 'teal' | 'green' | 'yellow' | 'purple' | 'gray' | 'red' {
  const s = status.toLowerCase();
  if (s.includes('delivered')) return 'green';
  if (s.includes('out for')) return 'teal';
  if (s.includes('confirmed') || s.includes('new')) return 'purple';
  if (s.includes('pending') || s.includes('aggregat')) return 'yellow';
  if (s.includes('failed') || s.includes('pricing')) return 'red';
  return 'gray';
}

interface RecentOrdersWidgetProps {
  orders: RecentOrder[];
  isLoading?: boolean;
}

export function RecentOrdersWidget({ orders, isLoading }: RecentOrdersWidgetProps) {
  return (
    <Card padding="lg" hover>
      <CardHeader>
        <div>
          <h3 className="text-sm font-bold text-text-primary font-display">Recent Orders</h3>
          <p className="text-xs text-text-secondary font-body mt-0.5">Latest 5 orders</p>
        </div>
        <button className="text-xs font-bold text-brand-primary hover:text-brand-primary-dark transition-colors font-body">
          View All →
        </button>
      </CardHeader>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-bg-section-alt transition-colors cursor-pointer group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary font-body truncate group-hover:text-brand-primary transition-colors">
                    {order.customerName}
                  </span>
                  <span className="text-xs text-text-tertiary font-mono">{order.orderNumber}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-medium text-text-secondary capitalize font-body">{order.type}</span>
                  <span className="text-xs text-text-tertiary">·</span>
                  <span className="text-xs text-text-tertiary font-body">{formatTimeAgo(order.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                {order.total > 0 && (
                  <span className="text-sm font-extrabold text-text-primary font-display">
                    SAR {order.total.toFixed(2)}
                  </span>
                )}
                <Badge
                  variant={getStatusBadgeVariant(order.status)}
                  size="sm"
                >
                  {formatStatusLabel(order.status)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
