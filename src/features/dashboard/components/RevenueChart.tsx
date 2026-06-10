import { Card, CardHeader } from '@/components/ui/Card';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

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
    <Card padding="lg" hover>
      <CardHeader
        action={
          <div className="flex items-center gap-1.5 text-xs font-bold text-status-success font-body">
            <ArrowUpRight size={14} />
            <span>+12.3%</span>
          </div>
        }
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-primary-light flex items-center justify-center">
              <TrendingUp size={16} className="text-brand-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary font-display">Revenue Trend</h3>
              <p className="text-xs text-text-secondary font-body">Last 7 days</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <div className="flex items-end justify-between gap-2 h-44 pt-2">
        {DUMMY_REVENUE_DATA.map((item) => {
          const heightPercent = (item.amount / MAX_AMOUNT) * 100;
          const isHighest = item.amount === MAX_AMOUNT;
          return (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[10px] font-bold text-text-secondary font-body opacity-0 group-hover:opacity-100 transition-opacity">
                SAR {item.amount.toLocaleString()}
              </span>
              <div className="relative w-full max-w-[40px] flex flex-col items-center">
                <div
                  className={cn(
                    'w-full rounded-t-lg transition-all duration-500',
                    isHighest ? 'bg-gradient-to-t from-brand-primary to-brand-primary-light' : 'bg-brand-primary/30 hover:bg-brand-primary/60'
                  )}
                  style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                />
              </div>
              <span className="text-xs font-medium text-text-tertiary font-body">{item.day}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
