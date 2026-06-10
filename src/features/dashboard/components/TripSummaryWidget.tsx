import { Card, CardHeader } from '@/components/ui/Card';
import { CheckCircle2, Clock, Truck, XCircle } from 'lucide-react';
import type { TripSummary } from '../api/dashboardApi';

interface TripSummaryWidgetProps {
  summary: TripSummary;
  isLoading?: boolean;
}

export function TripSummaryWidget({ summary, isLoading }: TripSummaryWidgetProps) {
  const items = [
    { label: 'Scheduled', count: summary.scheduled, color: 'text-brand-primary', bg: 'bg-brand-primary-light', icon: <Clock size={16} /> },
    { label: 'In Progress', count: summary.inProgress, color: 'text-amber-600', bg: 'bg-amber-50', icon: <Truck size={16} /> },
    { label: 'Completed', count: summary.completed, color: 'text-status-success', bg: 'bg-green-50', icon: <CheckCircle2 size={16} /> },
    { label: 'Failed', count: summary.failed, color: 'text-status-error', bg: 'bg-red-50', icon: <XCircle size={16} /> },
  ];

  return (
    <Card padding="md">
      <CardHeader>
        <div>
          <h3 className="text-sm font-bold text-text-primary font-display">Today's Trips</h3>
          <p className="text-xs text-text-secondary font-body mt-0.5">Delivery trip status</p>
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className={`${item.bg} rounded-xl p-3 flex flex-col items-center justify-center hover:shadow-sm transition-shadow`}
            >
              <div className={`${item.color} mb-1.5`}>
                {item.icon}
              </div>
              <span className="text-xl font-extrabold text-text-primary font-display">{item.count}</span>
              <span className="text-xs text-text-secondary font-body font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
