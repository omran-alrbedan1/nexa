import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useOrdersList, } from '../hooks/useOrders';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListItem } from '@/components/ui/ListItem';
import { ROUTES } from '@/routes/routes';
import { Pagination } from '@/components/ui/Pagination';
import { ShoppingBag, Package, CheckCircle2, AlertTriangle,
  Search, Filter, ChevronRight, TrendingUp, ListOrdered,
  Download, CalendarDays, Layers,
} from 'lucide-react';
import type { OrderStatus, OrderType } from '@/types/marketplace';
import type { OrderSummary } from '../api/ordersApi';
import { cn } from '@/lib/utils';
import { useFormatPrice } from '@/hooks/useFormatPrice';

const STATUS_BADGE: Record<string, 'green' | 'teal' | 'yellow' | 'purple' | 'red' | 'gray'> = {
  new: 'purple',
  pending_management: 'yellow',
  pending_pricing: 'yellow',
  pending_customer_approval: 'yellow',
  confirmed: 'teal',
  paid: 'teal',
  pending_supply: 'yellow',
  pending_aggregation: 'yellow',
  ready_to_ship: 'teal',
  ready_to_deliver: 'teal',
  out_for_delivery: 'teal',
  delivered: 'green',
  failed_delivery: 'red',
  cancelled: 'red',
  postponed: 'yellow',
  suspended: 'gray',
  refunded: 'gray',
};

const TYPE_BADGE: Record<string, 'teal' | 'coral' | 'purple'> = {
  regular: 'teal', special: 'coral', seasonal: 'purple',
};



export function OrdersPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const STATUS_LABELS: Record<string, string> = {
    new: t('orders.status.new'),
    pending_management: t('orders.status.pending_management'),
    pending_pricing: t('orders.status.pending_pricing'),
    pending_customer_approval: t('orders.status.pending_customer_approval'),
    confirmed: t('orders.status.confirmed'),
    paid: t('orders.status.paid'),
    pending_supply: t('orders.status.pending_supply'),
    pending_aggregation: t('orders.status.pending_aggregation'),
    ready_to_ship: t('orders.status.ready_to_ship'),
    out_for_delivery: t('orders.status.out_for_delivery'),
    delivered: t('orders.status.delivered'),
    failed_delivery: t('orders.status.failed_delivery'),
    cancelled: t('orders.status.cancelled'),
    postponed: t('orders.status.postponed'),
    refunded: t('orders.status.refunded'),
  };
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<OrderType | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const formatPrice = useFormatPrice();

  const { data, isLoading, isError, error, refetch } = useOrdersList({
    search: search || undefined,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    page: currentPage,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const orders = data?.orders ?? [];
  const pagination = data?.pagination;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: OrderStatus | '') => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleTypeChange = (value: OrderType | '') => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    setCurrentPage(1);
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    setCurrentPage(1);
  };

  const exportCSV = useCallback(() => {
    const headers = ['Order #','Customer','Type','Status','Total','Region','Supplier','Created At'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.customerName,
      o.type,
      o.status,
      o.total.toFixed(2),
      o.regionName,
      o.supplierName || '',
      new Date(o.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [orders]);

  const renderOrderRow = (order: OrderSummary) => {
    const isParent = order.isParent && order.children.length > 0;
    const childStatus = isParent
      ? order.children.some((c) => c.status === 'delivered')
        ? 'delivered'
        : order.children.every((c) => c.status === 'cancelled')
          ? 'cancelled'
          : order.children.some((c) => ['failed_delivery', 'cancelled'].includes(c.status))
            ? 'failed_delivery'
            : order.children.some((c) => ['ready_to_ship', 'out_for_delivery', 'ready_to_deliver'].includes(c.status))
              ? 'ready_to_ship'
              : 'in_progress'
      : null;

    return (
      <ListItem
        key={order.id}
        onClick={() => navigate(ROUTES.ORDER_DETAIL(order.id))}
        icon={isParent ? <Layers size={16} className="text-brand-primary" /> : <ShoppingBag size={16} className="text-brand-accent" />}
        iconClassName={isParent ? 'bg-brand-primary-light' : 'bg-brand-accent-light'}
        title={<span className="text-sm font-bold text-text-primary font-body truncate">{order.orderNumber}</span>}
        badges={<>
          {isParent && <Badge variant="purple" size="sm">{t('orders.list.parentOrder')}</Badge>}
          <Badge variant={TYPE_BADGE[order.type]} size="sm">{t(`orders.list.${order.type}`)}</Badge>
          <Badge variant={STATUS_BADGE[childStatus || order.status] || 'gray'} size="sm">
            {childStatus ? t(`orders.status.${childStatus}`) : (STATUS_LABELS[order.status] || t('common.unknown'))}
          </Badge>
          {order.deliveryUrgency && (
            <Badge variant={order.deliveryUrgency === 'fast' ? 'purple' : 'yellow'} size="sm">
              {order.deliveryUrgency === 'fast' ? t('orders.list.fast') : t('orders.list.scheduled')}
            </Badge>
          )}
        </>}
        actions={<>
          {isParent && (
            <Badge variant="teal" size="sm">{t('orders.list.suppliersCount', { count: order.children.length })}</Badge>
          )}
          <span className="text-sm font-extrabold text-text-primary font-display">{order.total > 0 ? `${formatPrice(order.total)}` : t('orders.list.tbd')}</span>
          <ChevronRight size={16} className="text-text-tertiary" />
        </>}
      >
        <p className="text-xs text-text-secondary font-body truncate">
          {order.customerName} · {order.regionName}{order.supplierName ? ` · ${order.supplierName}` : ''} · {isParent
            ? t('orders.list.suppliersCount', { count: order.children.length })
            : t('orders.list.itemsCount', { count: order.itemCount })}
        </p>
      </ListItem>
    );
  };

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <ShoppingBag size={22} className="text-brand-accent" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('orders.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('orders.description')}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
        {[
          { key: 'total', label: t('orders.stats.totalOrders'), icon: ListOrdered, variant: 'teal' as const },
          { key: 'new', label: t('orders.stats.new'), icon: Package, variant: 'purple' as const },
          { key: 'confirmed', label: t('orders.stats.confirmed'), icon: CheckCircle2, variant: 'teal' as const },
          { key: 'inProgress', label: t('orders.stats.inProgress'), icon: TrendingUp, variant: 'coral' as const },
          { key: 'delivered', label: t('orders.stats.delivered'), icon: ShoppingBag, variant: 'success' as const },
          { key: 'failed', label: t('orders.stats.failed'), icon: AlertTriangle, variant: 'coral' as const },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                    {isLoading ? (
                      <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" />
                    ) : stats?.[s.key as keyof typeof stats] ?? '—'}
                  </p>
                </div>
                <div className={cn(
                  'p-2.5 rounded-lg flex-shrink-0',
                  s.variant === 'teal' ? 'bg-brand-primary-light text-brand-primary' :
                  s.variant === 'success' ? 'bg-green-50 text-green-600' :
                  s.variant === 'coral' ? 'bg-brand-accent-light text-brand-accent' :
                  'bg-purple-50 text-purple-600'
                )}>
                  <Icon size={18} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Orders List */}
      <Card padding="lg">
        <CardHeader
          action={
            <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={exportCSV} disabled={orders.length === 0}>
              {t('orders.list.export')}
            </Button>
          }
        >
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('orders.list.allOrders')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('orders.list.totalOrders', { count: pagination?.total ?? orders.length })}</p>
          </div>
        </CardHeader>

        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="w-full sm:flex-1 sm:min-w-[200px] sm:max-w-xs relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('orders.list.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus | '')}
              className="pl-9 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all appearance-none"
            >
              <option value="">{t('orders.list.allStatuses')}</option>
              <option value="new">{STATUS_LABELS.new}</option>
              <option value="pending_management">{STATUS_LABELS.pending_management}</option>
              <option value="pending_pricing">{STATUS_LABELS.pending_pricing}</option>
              <option value="pending_customer_approval">{STATUS_LABELS.pending_customer_approval}</option>
              <option value="confirmed">{STATUS_LABELS.confirmed}</option>
              <option value="paid">{STATUS_LABELS.paid}</option>
              <option value="pending_supply">{STATUS_LABELS.pending_supply}</option>
              <option value="pending_aggregation">{STATUS_LABELS.pending_aggregation}</option>
              <option value="ready_to_ship">{STATUS_LABELS.ready_to_ship}</option>
              <option value="out_for_delivery">{STATUS_LABELS.out_for_delivery}</option>
              <option value="delivered">{STATUS_LABELS.delivered}</option>
              <option value="failed_delivery">{STATUS_LABELS.failed_delivery}</option>
              <option value="cancelled">{STATUS_LABELS.cancelled}</option>
              <option value="postponed">{STATUS_LABELS.postponed}</option>
              <option value="refunded">{STATUS_LABELS.refunded}</option>
            </select>
          </div>
          <div className="relative">
            <ListOrdered size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <select
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value as OrderType | '')}
              className="pl-9 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all appearance-none"
            >
              <option value="">{t('orders.list.allTypes')}</option>
              <option value="regular">{t('orders.list.regular')}</option>
              <option value="special">{t('orders.list.special')}</option>
              <option value="seasonal">{t('orders.list.seasonal')}</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarDays size={14} className="text-text-tertiary" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light w-full sm:w-36"
              title={t('orders.list.fromDate')}
            />
            <span className="text-text-tertiary text-xs hidden sm:inline">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="px-2.5 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light w-full sm:w-36"
              title={t('orders.list.toDate')}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
        ) : orders.length === 0 ? (
          <EmptyState title={t('orders.list.noOrdersFound')} description={search ? t('orders.list.tryDifferentSearch') : t('orders.list.noOrdersMatch')} />
        ) : (
          <>
            <div className="space-y-2">
              {orders.map((order) => renderOrderRow(order))}
            </div>
            {pagination && (
              <Pagination
                currentPage={pagination.currentPage}
                lastPage={pagination.lastPage}
                total={pagination.total}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
}
