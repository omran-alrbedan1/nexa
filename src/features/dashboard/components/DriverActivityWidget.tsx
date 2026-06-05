import { Card, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { DriverStatus } from '../api/dashboardApi';

interface DriverActivityWidgetProps {
  drivers: DriverStatus[];
  isLoading?: boolean;
}

function getStatusBadge(status: DriverStatus['status']) {
  switch (status) {
    case 'on_trip':
      return <Badge variant="blue" size="sm" dot>On Trip</Badge>;
    case 'available':
      return <Badge variant="green" size="sm" dot>Available</Badge>;
    case 'offline':
      return <Badge variant="gray" size="sm">Offline</Badge>;
  }
}

export function DriverActivityWidget({ drivers, isLoading }: DriverActivityWidgetProps) {
  return (
    <Card padding="md">
      <CardHeader>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Drivers</h3>
          <p className="text-xs text-gray-500">Current activity</p>
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Avatar name={driver.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {driver.name}
                  </span>
                  {getStatusBadge(driver.status)}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                  <span>{driver.regionName}</span>
                  <span>·</span>
                  <span>{driver.completedToday} today</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
