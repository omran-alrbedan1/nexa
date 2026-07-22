import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Truck } from 'lucide-react';
import type { DriverStatus } from '../api/dashboardApi';

interface DriverActivityWidgetProps {
  drivers: DriverStatus[];
  isLoading?: boolean;
}

export function DriverActivityWidget({ drivers, isLoading }: DriverActivityWidgetProps) {
  const { t } = useTranslation();

  function getStatusBadge(status: DriverStatus['status']) {
    switch (status) {
      case 'on_trip':
        return <Badge variant="teal" size="sm" dot>{t('dashboard.drivers.onTrip')}</Badge>;
      case 'available':
        return <Badge variant="green" size="sm" dot>{t('dashboard.drivers.available')}</Badge>;
      case 'offline':
        return <Badge variant="gray" size="sm">{t('dashboard.drivers.offline')}</Badge>;
    }
  }

  return (
    <Card padding="lg" hover>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-primary-light flex items-center justify-center">
            <Truck size={16} className="text-brand-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('dashboard.drivers.title')}</h3>
            <p className="text-xs text-text-secondary font-body">{t('dashboard.drivers.subtitle')}</p>
          </div>
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-bg-section-alt transition-colors"
            >
              <Avatar name={driver.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary font-body truncate">
                    {driver.name}
                  </span>
                  {getStatusBadge(driver.status)}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-tertiary font-body mt-0.5">
                  <span>{driver.regionName}</span>
                  <span>·</span>
                  <span>{t('dashboard.drivers.deliveriesToday', { count: driver.completedToday })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
