import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import { CalendarDays, RotateCcw } from 'lucide-react';

export interface DashboardFilterState {
  preset: 'today' | 'this_week' | 'this_month' | 'custom';
  dateFrom: string;
  dateTo: string;
}

interface DashboardFilterBarProps {
  filters: DashboardFilterState;
  onFilterChange: (filters: Partial<DashboardFilterState>) => void;
  onReset: () => void;
}

function computePresetRange(preset: DashboardFilterState['preset']): { dateFrom: string; dateTo: string } {
  const today = new Date().toISOString().split('T')[0];
  if (preset === 'today') return { dateFrom: today, dateTo: today };
  if (preset === 'this_week') {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    return { dateFrom: start.toISOString().split('T')[0], dateTo: today };
  }
  if (preset === 'this_month') {
    const start = new Date();
    start.setDate(1);
    return { dateFrom: start.toISOString().split('T')[0], dateTo: today };
  }
  return { dateFrom: '', dateTo: '' };
}

export function getDefaultFilters(): DashboardFilterState {
  const today = new Date().toISOString().split('T')[0];
  return {
    preset: 'today',
    dateFrom: today,
    dateTo: today,
  };
}

export function DashboardFilterBar({ filters, onFilterChange, onReset }: DashboardFilterBarProps) {
  const { t } = useTranslation();

  const DATE_PRESETS = [
    { key: 'today' as const, label: t('dashboard.filters.today') },
    { key: 'this_week' as const, label: t('dashboard.filters.thisWeek') },
    { key: 'this_month' as const, label: t('dashboard.filters.thisMonth') },
    { key: 'custom' as const, label: t('dashboard.filters.custom') },
  ];

  const handlePresetClick = (preset: DashboardFilterState['preset']) => {
    if (preset === 'custom') {
      onFilterChange({ preset, dateFrom: '', dateTo: '' });
    } else {
      const range = computePresetRange(preset);
      onFilterChange({ preset, dateFrom: range.dateFrom, dateTo: range.dateTo });
    }
  };

  const handleDateFromChange = (value: string) => {
    onFilterChange({ dateFrom: value, preset: 'custom' });
  };

  const handleDateToChange = (value: string) => {
    onFilterChange({ dateTo: value, preset: 'custom' });
  };

  return (
    <div className="bg-white rounded-xl border border-border-default/60 shadow-card">
      <div className="flex items-center justify-between p-3 flex-wrap gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          {/* Date range presets */}
          <div className="flex items-center gap-1 flex-wrap">
            {DATE_PRESETS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handlePresetClick(key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold font-body transition-all',
                  filters.preset === key
                    ? 'bg-brand-primary-light text-brand-primary-dark'
                    : 'text-text-secondary hover:bg-bg-section-alt'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-border-default hidden sm:inline">|</span>
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-text-tertiary flex-shrink-0" />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="px-2.5 py-1.5 border border-border-default rounded-lg text-xs font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input w-full sm:w-32"
            />
            <span className="text-text-tertiary text-xs hidden sm:inline">—</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="px-2.5 py-1.5 border border-border-default rounded-lg text-xs font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input w-full sm:w-32"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onReset}
            className="p-1.5 text-text-tertiary hover:text-text-secondary hover:bg-bg-section-alt rounded-lg transition-colors"
            title={t('dashboard.filters.reset')}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
