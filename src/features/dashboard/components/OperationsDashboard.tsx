import type { DashboardWidgetsExpanded } from '../api/dashboardApi';
import { DashboardFilterBar } from './DashboardFilterBar';
import { StatsCard } from './StatsCard';
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
}

export function OperationsDashboard({ data, isLoading }: OperationsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Global Filters */}
      <DashboardFilterBar />

      {/* ═══ Stats grid — operations focused ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Orders Today"
          value={data?.stats.deliveredToday ?? '-'}
          subtitle={`${data?.stats.activeOrders ?? 0} active orders`}
          variant="teal"
          isLoading={isLoading}
          icon={<Package size={20} />}
        />
        <StatsCard
          title="Active Orders"
          value={data?.stats.activeOrders ?? '-'}
          subtitle="Currently being processed"
          variant="purple"
          isLoading={isLoading}
          icon={<Activity size={20} />}
        />
        <StatsCard
          title="Special Requests"
          value={data?.stats.pendingSpecialRequests ?? '-'}
          subtitle="Awaiting review or pricing"
          variant="coral"
          isLoading={isLoading}
          icon={<AlertTriangle size={20} />}
        />
        <StatsCard
          title="Pending Deliveries"
          value={data?.stats.pendingDeliveries ?? '-'}
          subtitle="Out for delivery today"
          variant="success"
          isLoading={isLoading}
          icon={<Truck size={20} />}
        />
      </div>

      {/* ═══ Action & Pipeline ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActionRequiredWidget items={data?.actionRequired ?? []} isLoading={isLoading} />
        <PipelineWidget stages={data?.pipeline ?? []} isLoading={isLoading} />
      </div>

      {/* ═══ Orders Status + Trips + Areas ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OrdersByStatusChart />
        <TripSummaryWidget summary={data?.tripSummary ?? { scheduled: 0, inProgress: 0, completed: 0, failed: 0 }} isLoading={isLoading} />
        <BestAreasWidget areas={data?.topAreas ?? []} isLoading={isLoading} />
      </div>

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
