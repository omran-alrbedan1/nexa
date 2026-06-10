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
  return (
    <div className="space-y-6">
      {/* Global Filters */}
      <DashboardFilterBar />

      {/* ═══ Bento Stats Grid — 4 cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Orders Today"
          value={data?.stats.deliveredToday ?? '-'}
          subtitle={`${data?.stats.activeOrders ?? 0} active · ${data?.stats.totalOrders ?? 0} total`}
          variant="teal"
          isLoading={isLoading}
          icon={<Package size={20} />}
        />
        <StatsCard
          title="Revenue Today"
          value={data ? `SAR ${data.stats.revenueToday.toLocaleString()}` : '-'}
          subtitle={`SAR ${(data?.stats.revenueThisMonth ?? 0).toLocaleString()} this month`}
          variant="primary"
          isLoading={isLoading}
          trend={{ value: 12, isPositive: true }}
          icon={<TrendingUp size={20} />}
        />
        <StatsCard
          title="Active Drivers"
          value={data?.stats.activeDrivers ?? '-'}
          subtitle={`${data?.stats.pendingDeliveries ?? 0} pending · ${data?.tripSummary.inProgress ?? 0} on trip`}
          variant="purple"
          isLoading={isLoading}
          icon={<Truck size={20} />}
        />
        <StatsCard
          title="Pending Requests"
          value={data?.stats.pendingSpecialRequests ?? '-'}
          subtitle="Special orders needing pricing"
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
        <OrdersByStatusChart />
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
