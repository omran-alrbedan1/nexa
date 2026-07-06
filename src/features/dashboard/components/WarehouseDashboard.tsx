import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DashboardWidgetsExpanded } from '../api/dashboardApi';
import { DashboardFilterBar, type DashboardFilterState } from './DashboardFilterBar';
import { StatsCard } from './StatsCard';
import { ROUTES } from '@/routes/routes';
import { PipelineWidget } from './PipelineWidget';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';
import { Package, Boxes, Ship, CheckCircle2, Warehouse, ArrowRight, Clock } from 'lucide-react';

interface WarehouseDashboardProps {
  data: DashboardWidgetsExpanded | undefined;
  isLoading: boolean;
  filters: DashboardFilterState;
  onFilterChange: (filters: Partial<DashboardFilterState>) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onResetFilters: () => void;
}

export function WarehouseDashboard({ data, isLoading, filters, onFilterChange, isExpanded, onToggleExpanded, onResetFilters }: WarehouseDashboardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Global Filters */}
      <DashboardFilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        onReset={onResetFilters}
        expanded={isExpanded}
        onToggleExpanded={onToggleExpanded}
      />

      {/* ═══ Stats grid — warehouse focused ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <StatsCard
          title={t('dashboard.stats.inSupply')}
          value={data?.pipeline.find((p) => p.stage === 'in_supply')?.count ?? '-'}
          subtitle={t('dashboard.subtitle.awaitingSupplier')}
          variant="coral"
          isLoading={isLoading}
          icon={<Package size={20} />}
          onClick={() => navigate(`${ROUTES.ORDERS}?status=pending_supply`)}
        />
        <StatsCard
          title={t('dashboard.stats.inAggregation')}
          value={data?.pipeline.find((p) => p.stage === 'in_aggregation')?.count ?? '-'}
          subtitle={t('dashboard.subtitle.processingWarehouse')}
          variant="teal"
          isLoading={isLoading}
          icon={<Boxes size={20} />}
          onClick={() => navigate(`${ROUTES.ORDERS}?status=pending_aggregation`)}
        />
        <StatsCard
          title={t('dashboard.stats.readyToShip')}
          value={data?.pipeline.find((p) => p.stage === 'ready_to_ship')?.count ?? '-'}
          subtitle={t('dashboard.subtitle.awaitingTrip')}
          variant="purple"
          isLoading={isLoading}
          icon={<Ship size={20} />}
          onClick={() => navigate(`${ROUTES.ORDERS}?status=ready_to_ship`)}
        />
        <StatsCard
          title={t('dashboard.stats.deliveredToday')}
          value={data?.pipeline.find((p) => p.stage === 'delivered_today')?.count ?? '-'}
          subtitle={t('dashboard.subtitle.successfullyDelivered')}
          variant="success"
          isLoading={isLoading}
          icon={<CheckCircle2 size={20} />}
          onClick={() => navigate(`${ROUTES.ORDERS}?status=delivered`)}
        />
      </div>

      {/* ═══ Pipeline + Warehouse Queue ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineWidget stages={data?.pipeline ?? []} isLoading={isLoading} />

        {/* Warehouse Queue */}
        <Card padding="lg">
          <CardHeader
            action={
              <span className="bg-brand-primary-light text-brand-primary-dark text-xs font-bold px-2.5 py-1 rounded-full font-body">
                {t('dashboard.live')}
              </span>
            }
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Warehouse size={16} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary font-display">{t('dashboard.warehouseQueue.title')}</h3>
                <p className="text-xs text-text-secondary font-body">{t('dashboard.warehouseQueue.subtitle')}</p>
              </div>
            </div>
          </CardHeader>

          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {[
                { supplier: 'Fresh Farm Co.', items: 'Organic vegetables, Fruits', status: t('dashboard.warehouseQueue.received'), eta: '10:30 AM', statusColor: 'green' as const },
                { supplier: 'Dairy Best Ltd.', items: 'Milk, Cheese, Yogurt', status: t('dashboard.warehouseQueue.processing'), eta: '11:15 AM', statusColor: 'teal' as const },
                { supplier: 'Premium Meats', items: 'Chicken, Beef cuts', status: t('dashboard.warehouseQueue.pending'), eta: '01:00 PM', statusColor: 'gray' as const },
                { supplier: 'Golden Grains', items: 'Flour, Rice, Lentils', status: t('dashboard.warehouseQueue.pending'), eta: '02:30 PM', statusColor: 'gray' as const },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2.5 px-3.5 rounded-xl border border-border-default/60 hover:border-brand-primary/20 hover:bg-bg-section-alt transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center',
                      item.status === t('dashboard.warehouseQueue.received') ? 'bg-green-50' :
                      item.status === t('dashboard.warehouseQueue.processing') ? 'bg-brand-primary-light' :
                      'bg-gray-100'
                    )}>
                      <Warehouse size={16} className={cn(
                        item.status === t('dashboard.warehouseQueue.received') ? 'text-status-success' :
                        item.status === t('dashboard.warehouseQueue.processing') ? 'text-brand-primary' :
                        'text-text-tertiary'
                      )} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary font-body group-hover:text-brand-primary transition-colors">{item.supplier}</p>
                      <p className="text-xs text-text-tertiary font-body">{item.items}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                      <Clock size={12} />
                      <span className="font-body">{item.eta}</span>
                    </div>
                    <Badge variant={item.statusColor as 'green' | 'teal' | 'gray'} size="sm">
                      {item.status}
                    </Badge>
                    <ArrowRight size={14} className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="mt-3 w-full text-center text-xs font-bold text-brand-primary hover:text-brand-primary-dark transition-colors font-body py-2 hover:bg-brand-primary-light rounded-lg">
            {t('dashboard.warehouseQueue.viewFullQueue')} →
          </button>
        </Card>
      </div>

      {/* ═══ Today's Throughput ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: t('dashboard.warehouseQueue.itemsReceived'), value: '156', icon: Package, bg: 'from-brand-accent/10 to-brand-accent-light', iconColor: 'text-brand-accent', textColor: 'text-brand-accent-dark' },
          { label: t('dashboard.warehouseQueue.itemsProcessed'), value: '98', icon: Boxes, bg: 'from-brand-primary/10 to-brand-primary-light', iconColor: 'text-brand-primary', textColor: 'text-brand-primary-dark' },
          { label: t('dashboard.warehouseQueue.itemsShipped'), value: '72', icon: Ship, bg: 'from-purple-500/10 to-purple-50', iconColor: 'text-purple-600', textColor: 'text-purple-700' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'bg-gradient-to-br rounded-xl p-5 flex items-center gap-4 shadow-xs hover:shadow-sm transition-all',
              stat.bg
            )}
          >
            <div className={cn('w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center', stat.iconColor)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className={cn('text-2xl font-extrabold font-display', stat.textColor)}>{stat.value}</p>
              <p className="text-xs font-bold text-text-secondary font-body">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
