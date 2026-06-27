import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateWorkingDays } from '../hooks/useRegions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, Sun, Save } from 'lucide-react';
import type { Region } from '../api/regionsApi';

interface WorkingDaysSectionProps {
  region: Region | null;
}

const DAY_NAMES = [
  { key: 0, en: 'Sunday', ar: 'الأحد' },
  { key: 1, en: 'Monday', ar: 'الإثنين' },
  { key: 2, en: 'Tuesday', ar: 'الثلاثاء' },
  { key: 3, en: 'Wednesday', ar: 'الأربعاء' },
  { key: 4, en: 'Thursday', ar: 'الخميس' },
  { key: 5, en: 'Friday', ar: 'الجمعة' },
  { key: 6, en: 'Saturday', ar: 'السبت' },
];

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function WorkingDaysSection({ region }: WorkingDaysSectionProps) {
  const { t, i18n } = useTranslation();
  const updateWorkingDays = useUpdateWorkingDays();

  // Determine which days are working based on region's time slots
  const [workingDays, setWorkingDays] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (region?.timeSlots) {
      const days: Record<number, boolean> = {};
      for (let i = 0; i < 7; i++) {
        days[i] = region.timeSlots.some((ts) => ts.dayOfWeek === i && ts.isActive);
      }
      setWorkingDays(days);
    }
  }, [region]);

  const toggleDay = (dayIdx: number) => {
    setWorkingDays((prev) => ({ ...prev, [dayIdx]: !prev[dayIdx] }));
  };

  const handleSave = () => {
    if (region) {
      const days = Object.entries(workingDays).map(([day_of_week, is_working]) => ({
        day_of_week: parseInt(day_of_week),
        is_working,
      }));
      updateWorkingDays.mutate({ id: region.id, days });
    }
  };

  const isRtl = i18n.language === 'ar';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('regions.workingDays.title')}</h3>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Save size={14} />}
          isLoading={updateWorkingDays.isPending}
          onClick={handleSave}
        >
          {t('common.save')}
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {DAY_NAMES.map((day) => {
          const isWorking = workingDays[day.key] ?? false;
          const label = isRtl ? day.ar : day.en;
          return (
            <button
              key={day.key}
              onClick={() => toggleDay(day.key)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                isWorking
                  ? 'border-brand-primary bg-brand-primary-light text-brand-primary font-bold'
                  : 'border-border-default bg-bg-section-alt text-text-tertiary hover:border-border-default/80'
              )}
            >
              <Sun size={isWorking ? 20 : 16} className={isWorking ? 'text-brand-primary' : 'text-text-tertiary'} />
              <span className="text-xs font-body">{label.slice(0, 3)}</span>
              {isWorking && (
                <span className="text-[10px] text-green-600 font-bold">{t('regions.workingDays.working')}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
