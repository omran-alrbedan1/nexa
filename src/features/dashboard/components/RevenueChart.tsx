import { Card, CardHeader } from '@/components/ui/Card';

const DUMMY_REVENUE_DATA = [
  { day: 'Sun', amount: 5200 },
  { day: 'Mon', amount: 7800 },
  { day: 'Tue', amount: 6100 },
  { day: 'Wed', amount: 8900 },
  { day: 'Thu', amount: 7200 },
  { day: 'Fri', amount: 4500 },
  { day: 'Sat', amount: 8390 },
];

const MAX_AMOUNT = Math.max(...DUMMY_REVENUE_DATA.map((d) => d.amount));

export function RevenueChart() {
  return (
    <Card padding="md">
      <CardHeader>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Revenue</h3>
          <p className="text-xs text-gray-500">Last 7 days</p>
        </div>
      </CardHeader>
      <div className="flex items-end justify-between gap-2 h-40 pt-4">
        {DUMMY_REVENUE_DATA.map((item) => {
          const heightPercent = (item.amount / MAX_AMOUNT) * 100;
          return (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-xs text-gray-600 font-medium">
                SAR {item.amount.toLocaleString()}
              </span>
              <div
                className="w-full max-w-[40px] bg-blue-500 rounded-t-md transition-all duration-500 hover:bg-blue-600"
                style={{ height: `${heightPercent}%` }}
                title={`${item.day}: SAR ${item.amount.toLocaleString()}`}
              />
              <span className="text-xs text-gray-400">{item.day}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
