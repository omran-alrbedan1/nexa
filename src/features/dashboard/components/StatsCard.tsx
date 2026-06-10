import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  variant?: 'teal' | 'coral' | 'primary' | 'warning' | 'success' | 'purple';
  isLoading?: boolean;
}

const iconBgStyles = {
  teal: 'bg-brand-primary-light text-brand-primary',
  coral: 'bg-brand-accent-light text-brand-accent',
  primary: 'bg-brand-primary text-white',
  warning: 'bg-amber-50 text-amber-600',
  success: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
};

const accentBorderStyles = {
  teal: '',
  coral: '',
  primary: '',
  warning: 'border-l-4 border-l-status-warning',
  success: '',
  purple: '',
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'teal',
  isLoading = false,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <Card padding="md" className="animate-pulse">
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-32" />
        </div>
      </Card>
    );
  }

  return (
    <Card padding="md" hover className={cn('relative overflow-hidden group', accentBorderStyles[variant])}>
      {/* Background glow effect */}
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-5 group-hover:opacity-10 transition-all"
        style={{ backgroundColor: variant === 'coral' ? '#E76F51' : '#2A9D8F' }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{title}</p>
          <p className="text-2xl font-extrabold text-text-primary font-display">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-secondary font-body">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <span
                className={cn(
                  'inline-flex items-center text-xs font-bold font-body',
                  trend.isPositive ? 'text-status-success' : 'text-status-error'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-text-tertiary font-body">vs last period</span>
            </div>
          )}
        </div>
        <div className={cn('p-2.5 rounded-lg flex-shrink-0', iconBgStyles[variant])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
