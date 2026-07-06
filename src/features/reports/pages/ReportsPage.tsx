import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrdersReport, useRevenueReport, useSuppliersReport } from '../hooks/useReports';
import { Card, CardHeader } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { DollarSign, Building2, BarChart3, CalendarDays, Package, CheckCircle2, XCircle, MapPin, Star, Truck } from 'lucide-react';

const REPORTS_TABS = [
  { key: 'orders', label: 'reports.tabs.orders', icon: BarChart3 },
  { key: 'revenue', label: 'reports.tabs.revenue', icon: DollarSign },
  { key: 'suppliers', label: 'reports.tabs.suppliers', icon: Building2 },
];

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function ReportsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('orders');
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);

  const filters = { from: dateFrom, to: dateTo };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-blue-500/10 via-blue-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <BarChart3 size={22} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('reports.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('reports.description')}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-blue-500 via-brand-primary to-blue-500 rounded-full opacity-30" />
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-border-default/60 p-3 shadow-card">
        <CalendarDays size={16} className="text-text-tertiary" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-secondary font-body">{t('reports.from')}</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-2.5 py-1.5 border border-border-default rounded-lg text-xs font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input" />
        </div>
        <span className="text-text-tertiary text-xs hidden sm:inline">—</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-secondary font-body">{t('reports.to')}</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="px-2.5 py-1.5 border border-border-default rounded-lg text-xs font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-bg-section-alt rounded-xl overflow-x-auto">
        {REPORTS_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Icon size={16} />
              {t(tab.label)}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' && <OrdersReportTab filters={filters} t={t} />}
      {activeTab === 'revenue' && <RevenueReportTab filters={filters} t={t} />}
      {activeTab === 'suppliers' && <SuppliersReportTab filters={filters} t={t} />}
    </div>
  );
}

// ── Orders Report Tab ──

function OrdersReportTab({ filters, t }: { filters: { from: string; to: string }; t: (key: string) => string }) {
  const { data, isLoading, isError, error, refetch } = useOrdersReport(filters);

  if (isError) {
    return <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : ''} onRetry={() => refetch()} />;
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  const maxDailyCount = Math.max(...data.daily.map((d) => d.count), 1);

  return (
    <div className="space-y-5">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600"><BarChart3 size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('reports.orders.totalOrders')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{data.totals.orders}</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-green-50 text-green-600"><DollarSign size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('reports.orders.totalRevenue')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{data.totals.revenue.toLocaleString()} SAR</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('reports.orders.delivered')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{data.totals.delivered}</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-red-50 text-red-600"><XCircle size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('reports.orders.cancelled')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{data.totals.cancelled}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Daily Chart */}
      <Card padding="lg">
        <CardHeader>
          <h3 className="text-sm font-bold text-text-primary font-display">{t('reports.orders.dailyTrend')}</h3>
        </CardHeader>
        <div className="flex items-end justify-between gap-1.5 h-44 pt-4">
          {data.daily.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              <span className="text-[10px] font-bold text-text-secondary font-body opacity-0 group-hover:opacity-100 transition-opacity">{day.count}</span>
              <div className="relative w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                style={{ height: `${(day.count / maxDailyCount) * 100}%`, minHeight: '2px' }} />
              <span className="text-[9px] text-text-tertiary font-body">{day.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* By Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card padding="lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-text-primary font-display">{t('reports.orders.byStatus')}</h3>
            </div>
          </CardHeader>
          <div className="space-y-2">
            {Object.entries(data.byStatus).map(([status, info]) => (
              <div key={status} className="flex items-center justify-between p-2.5 rounded-lg bg-bg-section-alt">
                <span className="text-sm font-bold text-text-primary font-body capitalize">{status.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary">{info.count} {t('reports.orders.orders')}</span>
                  <span className="text-xs font-bold text-text-primary">{info.revenue.toLocaleString()} SAR</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card padding="lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-text-primary font-display">{t('reports.orders.byType')}</h3>
            </div>
          </CardHeader>
          <div className="space-y-2">
            {Object.entries(data.byType).map(([type, info]) => (
              <div key={type} className="flex items-center justify-between p-2.5 rounded-lg bg-bg-section-alt">
                <span className="text-sm font-bold text-text-primary font-body capitalize">{type}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary">{info.count} {t('reports.orders.orders')}</span>
                  <span className="text-xs font-bold text-text-primary">{info.revenue.toLocaleString()} SAR</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Revenue Report Tab ──

function RevenueReportTab({ filters, t }: { filters: { from: string; to: string }; t: (key: string) => string }) {
  const { data, isLoading, isError, error, refetch } = useRevenueReport(filters);

  if (isError) {
    return <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : ''} onRetry={() => refetch()} />;
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  const maxRevenue = Math.max(...data.byZone.map((z) => z.revenue), 1);

  return (
    <div className="space-y-5">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600"><DollarSign size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('reports.revenue.totalRevenue')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{data.totalRevenue.toLocaleString()} SAR</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600"><Truck size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('reports.revenue.deliveryFees')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{data.totalDeliveryFees.toLocaleString()} SAR</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600"><CheckCircle2 size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('reports.revenue.ordersDelivered')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{data.ordersDelivered}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue by Zone */}
      <Card padding="lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('reports.revenue.byZone')}</h3>
          </div>
        </CardHeader>
        <div className="space-y-4">
          {data.byZone.map((zone) => (
            <div key={zone.zoneId} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-text-primary font-body">{zone.zoneName}</span>
                  <span className="text-xs text-text-tertiary">{zone.orders} orders</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary">{zone.deliveryFees.toLocaleString()} SAR fees</span>
                  <span className="text-xs font-bold text-text-primary">{zone.revenue.toLocaleString()} SAR</span>
                </div>
              </div>
              <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                  style={{ width: `${(zone.revenue / maxRevenue) * 100}%` }} />
              </div>
            </div>
          ))}
          {data.byZone.length === 0 && (
            <p className="text-sm text-text-tertiary text-center py-6 font-body">{t('common.noData')}</p>
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Suppliers Report Tab ──

function SuppliersReportTab({ filters, t }: { filters: { from: string; to: string }; t: (key: string) => string }) {
  const { data, isLoading, isError, error, refetch } = useSuppliersReport(filters);

  if (isError) {
    return <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : ''} onRetry={() => refetch()} />;
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
      </div>
    );
  }

  const maxRevenue = Math.max(...data.suppliers.map((s) => s.revenue), 1);

  return (
    <div className="space-y-3">
      <Card padding="md" className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><Building2 size={18} /></div>
        <div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('reports.suppliers.totalSuppliers')}</p>
          <p className="text-lg font-extrabold text-text-primary font-display">{data.suppliers.length}</p>
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader>
          <h3 className="text-sm font-bold text-text-primary font-display">{t('reports.suppliers.supplierRanking')}</h3>
        </CardHeader>
        <div className="space-y-4">
          {data.suppliers.map((supplier, idx) => {
            const rankColor = idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-text-tertiary';
            return (
              <div key={supplier.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`text-xs font-extrabold font-mono w-6 ${rankColor}`}>#{idx + 1}</span>
                    <span className="text-sm font-bold text-text-primary font-body truncate">{supplier.businessName}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      <Package size={12} /> {supplier.productsCount}
                    </span>
                    <span className="text-xs text-text-secondary">{supplier.ordersCount} orders</span>
                    {supplier.ratingAvg > 0 && (
                      <span className="text-xs text-amber-500 flex items-center gap-0.5"><Star size={12} fill="currentColor" />{supplier.ratingAvg.toFixed(1)}</span>
                    )}
                    <span className="text-xs font-bold text-text-primary">{supplier.revenue.toLocaleString()} SAR</span>
                  </div>
                </div>
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                    style={{ width: `${(supplier.revenue / maxRevenue) * 100}%` }} />
                </div>
              </div>
            );
          })}
          {data.suppliers.length === 0 && (
            <p className="text-sm text-text-tertiary text-center py-6 font-body">{t('common.noData')}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
