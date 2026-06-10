import { useState } from 'react';
import { cn } from '@/utils/cn';
import { Filter, CalendarDays, ChevronDown, RotateCcw } from 'lucide-react';

interface DashboardFilterBarProps {}

const DATE_PRESETS = ['Today', 'This Week', 'This Month', 'Custom'];

export function DashboardFilterBar(_props: DashboardFilterBarProps) {
  const [activePreset, setActivePreset] = useState('Today');
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-border-default/60 shadow-card">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          {/* Date range presets */}
          <div className="flex items-center gap-1">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setActivePreset(preset)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold font-body transition-all',
                  activePreset === preset
                    ? 'bg-brand-primary-light text-brand-primary-dark'
                    : 'text-text-secondary hover:bg-bg-section-alt'
                )}
              >
                {preset}
              </button>
            ))}
          </div>
          <span className="text-border-default">|</span>
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-text-tertiary" />
            <input
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="px-2.5 py-1.5 border border-border-default rounded-lg text-xs font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input w-32"
            />
            <span className="text-text-tertiary text-xs">—</span>
            <input
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="px-2.5 py-1.5 border border-border-default rounded-lg text-xs font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input w-32"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-text-tertiary hover:text-text-secondary hover:bg-bg-section-alt rounded-lg transition-colors">
            <RotateCcw size={14} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors font-body px-2.5 py-1.5 hover:bg-bg-section-alt rounded-lg"
          >
            <Filter size={14} />
            <span>Filters</span>
            <ChevronDown size={12} className={cn('transition-transform', isExpanded && 'rotate-180')} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border-default/60 p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <FilterSelect label="Region" placeholder="All regions" />
          <FilterSelect label="Warehouse" placeholder="All warehouses" />
          <FilterSelect label="Supplier" placeholder="All suppliers" />
          <FilterSelect label="Order Type" placeholder="All types" options={['Regular', 'Special', 'Seasonal']} />
          <FilterSelect label="Status" placeholder="All statuses" />
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  placeholder,
  options,
}: {
  label: string;
  placeholder: string;
  options?: string[];
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5 font-body">{label}</label>
      <select
        className="w-full px-2.5 py-2 border border-border-default rounded-lg text-xs font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input transition-all"
        defaultValue=""
      >
        <option value="" disabled>{placeholder}</option>
        {options?.map((opt) => (
          <option key={opt} value={opt.toLowerCase()}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
