import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Building2 } from 'lucide-react';
import type { TopSupplier } from '../api/dashboardApi';

interface BestSuppliersWidgetProps {
  suppliers: TopSupplier[];
  isLoading?: boolean;
}

export function BestSuppliersWidget({ suppliers, isLoading }: BestSuppliersWidgetProps) {
  const { t } = useTranslation();
  const sorted = [...suppliers].sort((a, b) => b.orderCount - a.orderCount).slice(0, 5);
  const maxOrders = Math.max(...sorted.map((s) => s.orderCount), 1);

  return (
    <Card padding="lg" hover>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-accent-light flex items-center justify-center">
            <Building2 size={16} className="text-brand-accent" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('dashboard.topSuppliers.title')}</h3>
            <p className="text-xs text-text-secondary font-body">{t('dashboard.topSuppliers.subtitle')}</p>
          </div>
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-text-tertiary text-center py-6 font-body">{t('dashboard.topSuppliers.empty')}</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((supplier, idx) => {
            const rankColor = idx === 0 ? 'text-brand-primary' : idx === 1 ? 'text-brand-accent' : idx === 2 ? 'text-amber-600' : 'text-text-tertiary';
            return (
              <div key={supplier.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`text-xs font-extrabold font-mono w-5 flex-shrink-0 ${rankColor}`}>#{idx + 1}</span>
                    <span className="text-sm font-bold text-text-primary font-body truncate">{supplier.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-xs text-text-secondary font-body whitespace-nowrap">{t('dashboard.topSuppliers.orders', { count: supplier.orderCount })}</span>
                    <Badge
                      variant={supplier.acceptanceRate >= 90 ? 'green' : supplier.acceptanceRate >= 80 ? 'yellow' : 'red'}
                      size="sm"
                    >
                      {supplier.acceptanceRate}%
                    </Badge>
                  </div>
                </div>
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all bg-gradient-to-r from-brand-primary to-brand-primary-light"
                    style={{ width: `${(supplier.orderCount / maxOrders) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
