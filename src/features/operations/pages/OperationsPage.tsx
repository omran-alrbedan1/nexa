import { useTranslation } from 'react-i18next';
import { useOperationsPage } from '../hooks/useOperations';
import { OrderManagementSection } from '../components/OrderManagementSection';
import { SpecialRequestsSection } from '../components/SpecialRequestsSection';
import { ComplaintsSection } from '../components/ComplaintsSection';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Package, FileClock, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  newOrders: <Package size={20} />,
  pendingSpecials: <FileClock size={20} />,
  pendingPricing: <DollarSign size={20} />,
  complaints: <AlertTriangle size={20} />,
  delivered: <CheckCircle2 size={20} />,
};

const VARIANT_MAP: Record<string, 'teal' | 'coral' | 'warning' | 'purple' | 'success'> = {
  newOrders: 'teal',
  pendingSpecials: 'coral',
  pendingPricing: 'warning',
  complaints: 'purple',
  delivered: 'success',
};

export function OperationsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error, refetch } = useOperationsPage();

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('operations.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('operations.description')}</p>
        </div>
        <ErrorState
          title="Failed to load operations data"
          message={error instanceof Error ? error.message : 'An unexpected error occurred'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('operations.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('operations.description')}</p>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent rounded-full opacity-30" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { key: 'newOrders', label: t('operations.stats.newOrdersToday'), value: stats?.newOrdersToday ?? '—', sub: 'Awaiting processing' },
          { key: 'pendingSpecials', label: t('operations.stats.pendingSpecials'), value: stats?.pendingSpecials ?? '—', sub: `${stats?.pendingPricing ?? 0} ${t('operations.stats.awaitingPricing').toLowerCase()}` },
          { key: 'pendingPricing', label: t('operations.stats.awaitingPricing'), value: stats?.pendingPricing ?? '—', sub: `${stats?.pendingCustomerApproval ?? 0} ${t('operations.specialRequests.awaitingCustomer').toLowerCase()}` },
          { key: 'complaints', label: t('operations.stats.activeComplaints'), value: stats?.activeComplaints ?? '—', sub: `${stats?.failedDeliveries ?? 0} failed deliveries` },
          { key: 'delivered', label: t('operations.stats.deliveredToday'), value: stats?.deliveredToday ?? '—', sub: `${stats?.ordersInProgress ?? 0} in progress` },
        ].map((stat) => (
          <Card key={stat.key} padding="md" hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{stat.label}</p>
                <p className="text-2xl font-extrabold text-text-primary font-display mt-1">
                  {isLoading ? (
                    <span className="inline-block w-12 h-7 bg-gray-200 rounded animate-pulse" />
                  ) : stat.value}
                </p>
                <p className="text-xs text-text-tertiary font-body mt-1">{stat.sub}</p>
              </div>
              <div className={cn(
                'p-2.5 rounded-lg flex-shrink-0',
                VARIANT_MAP[stat.key] === 'teal' ? 'bg-brand-primary-light text-brand-primary' :
                VARIANT_MAP[stat.key] === 'coral' ? 'bg-brand-accent-light text-brand-accent' :
                VARIANT_MAP[stat.key] === 'warning' ? 'bg-amber-50 text-amber-600' :
                VARIANT_MAP[stat.key] === 'purple' ? 'bg-purple-50 text-purple-600' :
                'bg-green-50 text-green-600'
              )}>
                {ICON_MAP[stat.key]}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="xl:col-span-2">
          <OrderManagementSection
            orders={data?.recentOrders ?? []}
            isLoading={isLoading}
          />
        </div>
        <div>
          <SpecialRequestsSection
            requests={data?.specialRequests ?? []}
            isLoading={isLoading}
          />
        </div>
        <div>
          <ComplaintsSection
            complaints={data?.complaints ?? []}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
