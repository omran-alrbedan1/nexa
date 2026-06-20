import { useTranslation } from 'react-i18next';
import type { DashboardWidgetsExpanded } from '../api/dashboardApi';
import { DashboardFilterBar } from './DashboardFilterBar';
import { StatsCard } from './StatsCard';
import { RevenueChart } from './RevenueChart';
import { OrdersByStatusChart } from './OrdersByStatusChart';
import { RecentOrdersWidget } from './RecentOrdersWidget';
import { PendingApprovalsWidget } from './PendingApprovalsWidget';
import { DriverActivityWidget } from './DriverActivityWidget';
import { ActionRequiredWidget } from './ActionRequiredWidget';
import { PipelineWidget } from './PipelineWidget';
import { TimeKPIsWidget } from './TimeKPIsWidget';
import { BestSuppliersWidget } from './BestSuppliersWidget';
import { BestAreasWidget } from './BestAreasWidget';
import { TripSummaryWidget } from './TripSummaryWidget';
import { Package, TrendingUp, Truck, AlertTriangle } from 'lucide-react';

interface AdminDashboardProps {
  data: DashboardWidgetsExpanded | undefined;
  isLoading: boolean;
}

export function AdminDashboard({ data, isLoading }: AdminDashboardProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Global Filters */}
      <DashboardFilterBar />

      {/* ═══ Bento Stats Grid — 4 cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title={t('dashboard.stats.totalOrdersToday')}
          value={data?.stats.deliveredToday ?? '-'}
          subtitle={t('dashboard.subtitle.activeOrders', { active: data?.stats.activeOrders ?? 0, total: data?.stats.totalOrders ?? 0 })}
          variant="teal"
          isLoading={isLoading}
          icon={<Package size={20} />}
        />
        <StatsCard
          title={t('dashboard.stats.revenueToday')}
          value={data ? `SAR ${data.stats.revenueToday.toLocaleString()}` : '-'}
          subtitle={t('dashboard.subtitle.revenueMonth', { amount: (data?.stats.revenueThisMonth ?? 0).toLocaleString() })}
          variant="primary"
          isLoading={isLoading}
          trend={{ value: 12, isPositive: true }}
          icon={<TrendingUp size={20} />}
        />
        <StatsCard
          title={t('dashboard.stats.activeDrivers')}
          value={data?.stats.activeDrivers ?? '-'}
          subtitle={t('dashboard.subtitle.pendingDeliveries', { pending: data?.stats.pendingDeliveries ?? 0, trip: data?.tripSummary.inProgress ?? 0 })}
          variant="purple"
          isLoading={isLoading}
          icon={<Truck size={20} />}
        />
        <StatsCard
          title={t('dashboard.stats.pendingRequests')}
          value={data?.stats.pendingSpecialRequests ?? '-'}
          subtitle={t('dashboard.subtitle.specialOrdersPricing')}
          variant="coral"
          isLoading={isLoading}
          icon={<AlertTriangle size={20} />}
        />
      </div>

      {/* ═══ Middle Section — 3 col grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActionRequiredWidget items={data?.actionRequired ?? []} isLoading={isLoading} />
        <PipelineWidget stages={data?.pipeline ?? []} isLoading={isLoading} />
        <TripSummaryWidget summary={data?.tripSummary ?? { scheduled: 0, inProgress: 0, completed: 0, failed: 0 }} isLoading={isLoading} />
      </div>

      {/* ═══ Charts Row ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <OrdersByStatusChart pipeline={data?.pipeline?.reduce((acc, p) => ({ ...acc, [p.stage]: p.count }), {} as Record<string, number>)} ordersByType={data?.stats.ordersByType} />
      </div>

      {/* ═══ Orders & Approvals ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrdersWidget orders={data?.recentOrders ?? []} isLoading={isLoading} />
        </div>
        <PendingApprovalsWidget approvals={data?.pendingApprovals ?? []} isLoading={isLoading} />
      </div>

      {/* ═══ Time KPIs + Driver Activity ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeKPIsWidget kpis={data?.timeKPIs ?? []} isLoading={isLoading} />
        <DriverActivityWidget drivers={data?.driverActivity ?? []} isLoading={isLoading} />
      </div>

      {/* ═══ Top Suppliers + Top Areas ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BestSuppliersWidget suppliers={data?.topSuppliers ?? []} isLoading={isLoading} />
        <BestAreasWidget areas={data?.topAreas ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
