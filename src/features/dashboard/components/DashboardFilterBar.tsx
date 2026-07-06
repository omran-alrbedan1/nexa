import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/utils/cn';
import { Filter, CalendarDays, ChevronDown, RotateCcw } from 'lucide-react';
import { regionsApi } from '@/features/regions/api/regionsApi';
import { aggregationApi } from '@/features/aggregation/api/aggregationApi';
import { suppliersApi } from '@/features/suppliers/api/suppliersApi';

export interface DashboardFilterState {
  preset: 'today' | 'this_week' | 'this_month' | 'custom';
  dateFrom: string;
  dateTo: string;
  region: string | null;
  warehouse: string | null;
  supplier: string | null;
  orderType: string | null;
  status: string | null;
}

interface DashboardFilterBarProps {
  filters: DashboardFilterState;
  onFilterChange: (filters: Partial<DashboardFilterState>) => void;
  onReset: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

const ORDER_TYPES = ['regular', 'special', 'seasonal'];
const STATUSES = ['new', 'confirmed', 'pending_supply', 'pending_aggregation', 'ready_to_ship', 'out_for_delivery', 'delivered', 'failed_delivery', 'cancelled'];

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
    region: null,
    warehouse: null,
    supplier: null,
    orderType: null,
    status: null,
  };
}

export function DashboardFilterBar({ filters, onFilterChange, onReset, expanded, onToggleExpanded }: DashboardFilterBarProps) {
  const { t } = useTranslation();

  // Fetch real backend data for filter dropdowns
  const { data: regions } = useQuery({
    queryKey: ['dashboard-filters', 'regions'],
    queryFn: () => regionsApi.getPageData().then((d) => d.regions),
    staleTime: 60_000,
  });
  const { data: warehouses } = useQuery({
    queryKey: ['dashboard-filters', 'warehouses'],
    queryFn: () => aggregationApi.getWarehouses(),
    staleTime: 60_000,
  });
  const { data: suppliers } = useQuery({
    queryKey: ['dashboard-filters', 'suppliers'],
    queryFn: () => suppliersApi.getPageData().then((d) => d.suppliers),
    staleTime: 60_000,
  });

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

  const isAllOptions = (arr: unknown[] | undefined | null): arr is [] => !arr || arr.length === 0;

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
          <button
            onClick={onToggleExpanded}
            className="flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors font-body px-2.5 py-1.5 hover:bg-bg-section-alt rounded-lg"
          >
            <Filter size={14} />
            <span>{t('dashboard.filters.filters')}</span>
            <ChevronDown size={12} className={cn('transition-transform', expanded && 'rotate-180')} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border-default/60 p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <FilterSelect
            label={t('dashboard.filters.region')}
            placeholder={t('dashboard.filters.allRegions')}
            value={filters.region || ''}
            onChange={(v) => onFilterChange({ region: v || null })}
            options={regions?.map((r) => r.name) || []}
          />
          <FilterSelect
            label={t('dashboard.filters.warehouse')}
            placeholder={t('dashboard.filters.allWarehouses')}
            value={filters.warehouse || ''}
            onChange={(v) => onFilterChange({ warehouse: v || null })}
            options={warehouses?.map((w) => w.name) || []}
          />
          <FilterSelect
            label={t('dashboard.filters.supplier')}
            placeholder={t('dashboard.filters.allSuppliers')}
            value={filters.supplier || ''}
            onChange={(v) => onFilterChange({ supplier: v || null })}
            options={suppliers?.map((s) => s.name) || []}
            disabled={isAllOptions(suppliers)}
          />
          <FilterSelect
            label={t('dashboard.filters.orderType')}
            placeholder={t('dashboard.filters.allTypes')}
            value={filters.orderType || ''}
            onChange={(v) => onFilterChange({ orderType: v || null })}
            options={ORDER_TYPES.map((t) => t.replace(/_/g, ' '))}
          />
          <FilterSelect
            label={t('dashboard.filters.status')}
            placeholder={t('dashboard.filters.allStatuses')}
            value={filters.status || ''}
            onChange={(v) => onFilterChange({ status: v || null })}
            options={STATUSES.map((s) => s.replace(/_/g, ' '))}
          />
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5 font-body">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-2.5 py-2 border border-border-default rounded-lg text-xs font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt.toLowerCase()}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
