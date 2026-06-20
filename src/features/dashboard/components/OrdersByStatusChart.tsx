import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/components/ui/Card';
import { PieChart } from 'lucide-react';

interface StatusCount {
  label: string;
  count: number;
  color: string;
}

const DEFAULT_STATUS_DATA: StatusCount[] = [
  { label: 'Delivered', count: 47, color: '#22C55E' },
  { label: 'Out for Delivery', count: 9, color: '#2A9D8F' },
  { label: 'Confirmed', count: 8, color: '#8B5CF6' },
  { label: 'Pending Aggregation', count: 6, color: '#F59E0B' },
  { label: 'New', count: 5, color: '#9CA3AF' },
  { label: 'Pending Pricing', count: 3, color: '#E76F51' },
  { label: 'Failed Delivery', count: 2, color: '#EF4444' },
];

// ── Build status data from real dashboard stats ──

function buildStatusData(ordersByType?: Record<string, number>, pipeline?: Record<string, number>): StatusCount[] {
  if (ordersByType && Object.keys(ordersByType).length > 0) {
    const fromTypes: StatusCount[] = Object.entries(ordersByType).map(([type, count], i) => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      color: ['#22C55E', '#2A9D8F', '#8B5CF6', '#F59E0B', '#9CA3AF', '#E76F51', '#EF4444'][i % 7],
    }));
    if (pipeline) {
      const pipelineLabels: Record<string, { label: string; color: string }> = {
        in_supply: { label: 'In Supply', color: '#F59E0B' },
        in_aggregation: { label: 'In Aggregation', color: '#3B82F6' },
        ready_to_ship: { label: 'Ready to Ship', color: '#8B5CF6' },
        out_for_delivery: { label: 'Out for Delivery', color: '#2A9D8F' },
        delivered_today: { label: 'Delivered', color: '#22C55E' },
      };
      return Object.entries(pipeline).map(([stage, count]) => ({
        label: pipelineLabels[stage]?.label || stage,
        count,
        color: pipelineLabels[stage]?.color || '#9CA3AF',
      }));
    }
    return fromTypes;
  }
  return DEFAULT_STATUS_DATA;
}

function ConicDonut({ data, total: totalCount }: { data: StatusCount[]; total: number }) {
  const { t } = useTranslation();
  let cumulativePercent = 0;
  const segments = data
    .filter((s) => s.count > 0)
    .map((s) => {
      const percent = (s.count / totalCount) * 100;
      const start = cumulativePercent;
      cumulativePercent += percent;
      return `${s.color} ${start}% ${cumulativePercent}%`;
    });

  const conicGradient = `conic-gradient(${segments.join(', ')})`;

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative h-40 w-40 rounded-full shadow-sm"
        style={{ background: conicGradient }}
      >
        <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center shadow-inner">
          <div className="text-center">
            <p className="text-2xl font-extrabold text-text-primary font-display">{totalCount}</p>
            <p className="text-xs font-medium text-text-tertiary font-body">{t('dashboard.ordersByStatus.today')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface OrdersByStatusChartProps {
  pipeline?: Record<string, number>;
  ordersByType?: Record<string, number>;
}

export function OrdersByStatusChart({ pipeline, ordersByType }: OrdersByStatusChartProps) {
  const { t } = useTranslation();
  const STATUS_DATA = buildStatusData(ordersByType, pipeline);
  const total = STATUS_DATA.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card padding="lg" hover>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-accent-light flex items-center justify-center">
            <PieChart size={16} className="text-brand-accent" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('dashboard.ordersByStatus.title')}</h3>
            <p className="text-xs text-text-secondary font-body">{t('dashboard.ordersByStatus.subtitle')}</p>
          </div>
        </div>
      </CardHeader>
      <div className="flex items-start gap-6">
        <ConicDonut data={STATUS_DATA} total={total} />
        <div className="space-y-2 flex-1">
          {STATUS_DATA.filter((s) => s.count > 0).map((s) => {
            const percent = ((s.count / total) * 100).toFixed(0);
            return (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0 ring-2 ring-white"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-xs font-medium text-text-secondary font-body">{s.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-primary font-display">{s.count}</span>
                  <span className="text-[10px] text-text-tertiary font-body">({percent}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
