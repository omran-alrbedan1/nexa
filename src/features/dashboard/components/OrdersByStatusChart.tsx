import { Card, CardHeader } from '@/components/ui/Card';

interface StatusCount {
  label: string;
  count: number;
  color: string;
}

const STATUS_DATA: StatusCount[] = [
  { label: 'Delivered', count: 47, color: '#10B981' },
  { label: 'Out for Delivery', count: 9, color: '#3B82F6' },
  { label: 'Confirmed', count: 8, color: '#8B5CF6' },
  { label: 'Pending Aggregation', count: 6, color: '#F59E0B' },
  { label: 'New', count: 5, color: '#6B7280' },
  { label: 'Pending Pricing', count: 3, color: '#EF4444' },
  { label: 'Failed Delivery', count: 2, color: '#DC2626' },
];

const total = STATUS_DATA.reduce((sum, s) => sum + s.count, 0);

function ConicDonut({ data }: { data: StatusCount[] }) {
  let cumulativePercent = 0;
  const segments = data
    .filter((s) => s.count > 0)
    .map((s) => {
      const percent = (s.count / total) * 100;
      const start = cumulativePercent;
      cumulativePercent += percent;
      return `${s.color} ${start}% ${cumulativePercent}%`;
    });

  const conicGradient = `conic-gradient(${segments.join(', ')})`;

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative h-36 w-36 rounded-full"
        style={{ background: conicGradient }}
      >
        <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-500">Today</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrdersByStatusChart() {
  return (
    <Card padding="md">
      <CardHeader>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Orders by Status</h3>
          <p className="text-xs text-gray-500">Today's orders</p>
        </div>
      </CardHeader>
      <div className="flex items-start gap-6">
        <ConicDonut data={STATUS_DATA} />
        <div className="space-y-1.5 flex-1">
          {STATUS_DATA.filter((s) => s.count > 0).map((s) => (
            <div key={s.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-gray-600">{s.label}</span>
              </div>
              <span className="font-medium text-gray-900">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
