import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import { Timer, TrendingDown, TrendingUp } from 'lucide-react';
import type { TimeKPI } from '../api/dashboardApi';

interface TimeKPIsWidgetProps {
  kpis: TimeKPI[];
  isLoading?: boolean;
}

export function TimeKPIsWidget({ kpis, isLoading }: TimeKPIsWidgetProps) {
  const { t } = useTranslation();

  return (
    <Card padding="lg" hover>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <Timer size={16} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('dashboard.timeKPIs.title')}</h3>
            <p className="text-xs text-text-secondary font-body">{t('dashboard.timeKPIs.subtitle')}</p>
          </div>
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {kpis.map((kpi) => (
            <div
              key={kpi.metric}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-bg-section-alt transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-text-primary font-body truncate">{kpi.metric}</p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-sm font-extrabold text-text-primary font-display">
                  {kpi.metric.toLowerCase().includes('rate') || kpi.metric.toLowerCase().includes('success')
                    ? `${kpi.averageHours}%`
                    : `${kpi.averageHours}h`}
                </span>
                {kpi.trend !== 'stable' && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 text-xs font-bold font-body px-1.5 py-0.5 rounded-full',
                      kpi.trend === 'down'
                        ? 'text-status-success bg-green-50'
                        : 'text-status-error bg-red-50'
                    )}
                  >
                    {kpi.trend === 'down' ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                    {kpi.trendPercent}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
