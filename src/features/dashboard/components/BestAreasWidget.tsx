import { Card, CardHeader } from '@/components/ui/Card';
import { MapPin } from 'lucide-react';
import type { TopArea } from '../api/dashboardApi';

interface BestAreasWidgetProps {
  areas: TopArea[];
  isLoading?: boolean;
}

export function BestAreasWidget({ areas, isLoading }: BestAreasWidgetProps) {
  const maxRevenue = Math.max(...areas.map((a) => a.totalRevenue), 1);

  return (
    <Card padding="lg" hover>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-primary-light flex items-center justify-center">
            <MapPin size={16} className="text-brand-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">Top Areas</h3>
            <p className="text-xs text-text-secondary font-body">By orders & revenue</p>
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
        <div className="space-y-3">
          {areas.map((area, idx) => {
            const rankColor = idx === 0 ? 'text-brand-primary' : idx === 1 ? 'text-brand-accent' : idx === 2 ? 'text-amber-600' : 'text-text-tertiary';
            return (
              <div key={area.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-extrabold font-mono w-5 ${rankColor}`}>#{idx + 1}</span>
                    <span className="text-sm font-bold text-text-primary font-body">{area.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-text-secondary font-body">{area.orderCount} orders</span>
                    <span className="font-extrabold text-status-success font-display">
                      SAR {area.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-status-success to-green-300 transition-all"
                    style={{ width: `${(area.totalRevenue / maxRevenue) * 100}%` }}
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
