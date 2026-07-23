import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/components/ui/Card';
import { TrendingUp } from 'lucide-react';
import { useFormatPrice } from '@/hooks/useFormatPrice';

interface RevenueChartProps {
  /** Daily revenue data from API. If empty/undefined, chart shows placeholder */
  data?: { day: string; amount: number }[];
  /** Optional single-day total to show when no daily breakdown is available */
  todayRevenue?: number;
  isLoading?: boolean;
}

export function RevenueChart({ data, todayRevenue, isLoading }: RevenueChartProps) {
  const { t } = useTranslation();
  const formatPrice = useFormatPrice();

  return (
    <Card padding="lg" hover>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-primary-light flex items-center justify-center">
            <TrendingUp size={16} className="text-brand-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('dashboard.revenueChart.title')}</h3>
            <p className="text-xs text-text-secondary font-body">{t('dashboard.revenueChart.subtitle')}</p>
          </div>
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="flex items-end justify-between gap-2 h-44 pt-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="w-full max-w-[40px] bg-gray-100 rounded-t-lg animate-pulse" style={{ height: `${30 + Math.random() * 60}%` }} />
              <span className="text-xs text-gray-200 animate-pulse w-6 h-3 rounded" />
            </div>
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="flex items-end justify-between gap-2 h-44 pt-2">
          {data.map((item) => {
            const maxAmount = Math.max(...data.map((d) => d.amount));
            const heightPercent = (item.amount / maxAmount) * 100;
            const isHighest = item.amount === maxAmount;
            return (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-text-secondary font-body opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatPrice(item.amount)}
                </span>
                <div className="relative w-full max-w-[40px] flex flex-col items-center">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isHighest ? 'bg-gradient-to-t from-brand-primary to-brand-primary-light' : 'bg-brand-primary/30 hover:bg-brand-primary/60'
                    }`}
                    style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                  />
                </div>
                <span className="text-xs font-medium text-text-tertiary font-body">{item.day}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-44 text-center">
          <TrendingUp size={32} className="text-text-tertiary mb-2 opacity-40" />
          <p className="text-sm text-text-secondary font-body">
            {todayRevenue !== undefined
              ? `${t('dashboard.todayRevenue')}: ${formatPrice(todayRevenue)}`
              : t('common.noData')}
          </p>
        </div>
      )}
    </Card>
  );
}
