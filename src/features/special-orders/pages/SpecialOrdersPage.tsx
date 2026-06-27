import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSpecialOrdersList } from '../hooks/useSpecialOrders';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { FileClock, Search, Filter, ArrowRight, User, Phone } from 'lucide-react';

const STATUS_OPTIONS = [
  { key: '', label: 'All Statuses' },
  { key: 'pending_admin', label: 'Pending Admin', color: 'purple' as const },
  { key: 'pending_pricing', label: 'Pending Pricing', color: 'yellow' as const },
  { key: 'pending_customer', label: 'Awaiting Customer', color: 'blue' as const },
  { key: 'priced', label: 'Priced', color: 'teal' as const },
  { key: 'approved', label: 'Approved', color: 'green' as const },
  { key: 'rejected', label: 'Rejected', color: 'red' as const },
  { key: 'cancelled', label: 'Cancelled', color: 'red' as const },
];

const STATUS_BADGE: Record<string, 'green' | 'yellow' | 'red' | 'purple' | 'teal' | 'blue'> = {
  pending_admin: 'purple',
  pending_pricing: 'yellow',
  pending_customer: 'blue',
  priced: 'teal',
  approved: 'green',
  rejected: 'red',
  cancelled: 'red',
};

export function SpecialOrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useSpecialOrdersList({ status: statusFilter || undefined, search: search || undefined });

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : ''} onRetry={() => refetch()} />
      </div>
    );
  }

  const orders = data?.data || [];
  const stats = {
    pending_admin: orders.filter((o) => o.status === 'pending_admin').length,
    pending_pricing: orders.filter((o) => o.status === 'pending_pricing').length,
    pending_customer: orders.filter((o) => o.status === 'pending_customer').length,
    approved: orders.filter((o) => o.status === 'approved').length,
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-amber-500/10 via-amber-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <FileClock size={22} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('specialOrders.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('specialOrders.description')}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-amber-500 via-brand-primary to-amber-500 rounded-full opacity-30" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="md" hover onClick={() => setStatusFilter('')}>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('specialOrders.total')}</p>
          <p className="text-xl font-extrabold text-text-primary font-display mt-1">{orders.length}</p>
        </Card>
        <Card padding="md" hover onClick={() => setStatusFilter('pending_admin')}>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('specialOrders.pendingAdmin')}</p>
          <p className="text-xl font-extrabold text-amber-600 font-display mt-1">{stats.pending_admin}</p>
        </Card>
        <Card padding="md" hover onClick={() => setStatusFilter('pending_pricing')}>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('specialOrders.pendingPricing')}</p>
          <p className="text-xl font-extrabold text-purple-600 font-display mt-1">{stats.pending_pricing}</p>
        </Card>
        <Card padding="md" hover onClick={() => setStatusFilter('approved')}>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('specialOrders.approved')}</p>
          <p className="text-xl font-extrabold text-green-600 font-display mt-1">{stats.approved}</p>
        </Card>
      </div>

      <Card padding="lg">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="text-sm font-bold text-text-primary font-display">{t('specialOrders.allRequests')}</h3>
              <p className="text-xs text-text-secondary font-body mt-0.5">{orders.length} {t('common.items')}</p>
            </div>
          </div>
        </CardHeader>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 max-w-xs relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('specialOrders.searchPlaceholder')} className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-9 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none appearance-none focus:border-brand-primary">
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
        ) : orders.length === 0 ? (
          <EmptyState title={t('specialOrders.noRequests')} description={t('specialOrders.noRequestsDescription')} />
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(ROUTES.SPECIAL_ORDER_DETAIL(order.id))}
                className="p-4 rounded-xl border border-border-default/60 hover:border-brand-primary/20 hover:bg-bg-section-alt transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <FileClock size={16} className="text-amber-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-text-primary font-body">{order.referenceNumber}</span>
                          <Badge variant={STATUS_BADGE[order.status] || 'yellow'} size="sm">{STATUS_OPTIONS.find((o) => o.key === order.status)?.label || order.status}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-tertiary font-body mt-1">
                          <span className="flex items-center gap-1"><User size={12} /> {order.customerName}</span>
                          <span className="flex items-center gap-1"><Phone size={12} /> {order.customerPhone}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary font-body mt-2 line-clamp-2">{order.customerNotes}</p>
                    <div className="flex items-center gap-3 text-xs text-text-tertiary font-body mt-1.5">
                      {order.itemCount > 0 && <span>{order.itemCount} item(s)</span>}
                      {order.assignedToName && <span>Assigned: {order.assignedToName}</span>}
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-text-tertiary flex-shrink-0 mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
