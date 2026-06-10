import { useAggregationPage } from '../hooks/useAggregation';
import { SupplyReceivingSection } from '../components/SupplyReceivingSection';
import { AggregationQueueSection } from '../components/AggregationQueueSection';
import { ReadyToShipSection } from '../components/ReadyToShipSection';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card } from '@/components/ui/Card';
import { Package, Boxes, Ship, Users, Clock, Warehouse } from 'lucide-react';

const STAT_CONFIG = [
  { label: 'Items Received', icon: Package, variant: 'teal' as const },
  { label: 'Items Processed', icon: Boxes, variant: 'teal' as const },
  { label: 'Items Shipped', icon: Ship, variant: 'teal' as const },
  { label: 'Active Workers', icon: Users, variant: 'warning' as const },
  { label: 'Avg Process Time', icon: Clock, variant: 'purple' as const },
];

export function AggregationPage() {
  const { data, isLoading, error, refetch } = useAggregationPage();

  if (error) {
    return (
      <ErrorState
        title="Failed to load warehouse data"
        message={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-purple-500/10 via-purple-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <Warehouse size={28} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">Warehouse Dashboard</h1>
            <p className="text-sm text-text-secondary font-body mt-1">Supply receiving, aggregation queue, and shipping management</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-purple-500 via-brand-primary to-purple-500 rounded-full opacity-30" />
      </div>

      {/* Throughput Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { label: 'Items Received', value: data?.throughput.itemsReceived ?? 0 },
          { label: 'Items Processed', value: data?.throughput.itemsProcessed ?? 0 },
          { label: 'Items Shipped', value: data?.throughput.itemsShipped ?? 0 },
          { label: 'Active Workers', value: data?.throughput.activeWorkers ?? 0 },
          { label: 'Avg Process Time', value: data ? `${data.throughput.avgProcessingTime}m` : '-' },
        ].map((stat, idx) => {
          const Icon = STAT_CONFIG[idx].icon;
          const variant = STAT_CONFIG[idx].variant;
          return (
            <Card key={stat.label} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{stat.label}</p>
                  <p className="text-2xl font-extrabold text-text-primary font-display mt-1">
                    {isLoading ? (
                      <span className="inline-block h-7 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : stat.value}
                  </p>
                </div>
                <div className={cn(
                  'p-2.5 rounded-lg flex-shrink-0',
                  variant === 'teal' ? 'bg-brand-primary-light text-brand-primary' :
                  variant === 'warning' ? 'bg-amber-50 text-amber-600' :
                  'bg-purple-50 text-purple-600'
                )}>
                  <Icon size={20} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Sections */}
      <SupplyReceivingSection items={data?.supplyReceiving ?? []} isLoading={isLoading} />
      <AggregationQueueSection items={data?.aggregationQueue ?? []} isLoading={isLoading} />
      <ReadyToShipSection items={data?.readyToShip ?? []} isLoading={isLoading} />
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
