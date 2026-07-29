import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DashboardWidgetsExpanded } from '../api/dashboardApi';
import { DashboardFilterBar, type DashboardFilterState } from './DashboardFilterBar';
import { StatsCard } from './StatsCard';
import { ROUTES } from '@/routes/routes';
import { OrdersByStatusChart } from './OrdersByStatusChart';
import { RecentOrdersWidget } from './RecentOrdersWidget';
import { PendingApprovalsWidget } from './PendingApprovalsWidget';
import { ActionRequiredWidget } from './ActionRequiredWidget';
import { PipelineWidget } from './PipelineWidget';
import { TripSummaryWidget } from './TripSummaryWidget';
import { BestAreasWidget } from './BestAreasWidget';
import { Package, Activity, AlertTriangle, Truck } from 'lucide-react';

interface OperationsDashboardProps {
  data: DashboardWidgetsExpanded | undefined;
  isLoading: boolean;
  filters: DashboardFilterState;
  onFilterChange: (filters: Partial<DashboardFilterState>) => void;
  onResetFilters: () => void;
}

export function OperationsDashboard({ data, isLoading, filters, onFilterChange, onResetFilters }: OperationsDashboardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Global Filters */}
      <DashboardFilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        onReset={onResetFilters}
      />

      {/* ═══ Stats grid — operations focused ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <StatsCard
          title={t('dashboard.stats.ordersToday')}
          value={data?.stats.deliveredToday ?? '-'}
          subtitle={t('dashboard.subtitle.activeOrdersProcessing')}
          variant="teal"
          isLoading={isLoading}
          icon={<Package size={20} />}
          onClick={() => navigate(`${ROUTES.ORDERS}?status=delivered`)}
        />
        <StatsCard
          title={t('dashboard.stats.activeOrders')}
          value={data?.stats.activeOrders ?? '-'}
          subtitle={t('dashboard.subtitle.activeOrders')}
          variant="purple"
          isLoading={isLoading}
          icon={<Activity size={20} />}
          onClick={() => navigate(`${ROUTES.ORDERS}?status=pending_management`)}
        />
        <StatsCard
          title={t('dashboard.stats.specialRequests')}
          value={data?.stats.pendingSpecialRequests ?? '-'}
          subtitle={t('dashboard.subtitle.awaitingReview')}
          variant="coral"
          isLoading={isLoading}
          icon={<AlertTriangle size={20} />}
          onClick={() => navigate(ROUTES.OPERATIONS)}
        />
        <StatsCard
          title={t('dashboard.stats.pendingDeliveries')}
          value={data?.stats.pendingDeliveries ?? '-'}
          subtitle={t('dashboard.subtitle.outForDelivery')}
          variant="success"
          isLoading={isLoading}
          icon={<Truck size={20} />}
          onClick={() => navigate(`${ROUTES.ORDERS}?status=out_for_delivery`)}
        />
      </div>

      {/* ═══ Action & Pipeline ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActionRequiredWidget items={data?.actionRequired ?? []} isLoading={isLoading} />
        <PipelineWidget stages={data?.pipeline ?? []} isLoading={isLoading} />
      </div>

      {/* ═══ Orders Status + Trips + Areas ═══ */}
      {data?.topAreas && data.topAreas.length > 1 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <OrdersByStatusChart pipeline={data?.pipeline?.reduce((acc, p) => ({ ...acc, [p.stage]: p.count }), {} as Record<string, number>)} ordersByType={data?.stats.ordersByType} />
          <TripSummaryWidget summary={data?.tripSummary ?? { scheduled: 0, inProgress: 0, completed: 0, failed: 0 }} isLoading={isLoading} />
          <BestAreasWidget areas={data?.topAreas ?? []} isLoading={isLoading} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrdersByStatusChart pipeline={data?.pipeline?.reduce((acc, p) => ({ ...acc, [p.stage]: p.count }), {} as Record<string, number>)} ordersByType={data?.stats.ordersByType} />
          <TripSummaryWidget summary={data?.tripSummary ?? { scheduled: 0, inProgress: 0, completed: 0, failed: 0 }} isLoading={isLoading} />
        </div>
      )}

      {/* ═══ Recent Orders + Approvals ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrdersWidget orders={data?.recentOrders ?? []} isLoading={isLoading} />
        </div>
        <PendingApprovalsWidget approvals={data?.pendingApprovals ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
