import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/components/ui/Card';
import { ChevronRight } from 'lucide-react';
import type { PipelineStage } from '../api/dashboardApi';

interface PipelineWidgetProps {
  stages: PipelineStage[];
  isLoading?: boolean;
}

export function PipelineWidget({ stages, isLoading }: PipelineWidgetProps) {
  const { t } = useTranslation();
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <Card padding="md">
      <CardHeader>
        <div>
          <h3 className="text-sm font-bold text-text-primary font-display">{t('dashboard.pipeline.title')}</h3>
          <p className="text-xs text-text-secondary font-body mt-0.5">{t('dashboard.pipeline.subtitle')}</p>
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {stages.map((stage, idx) => (
            <div key={stage.stage} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0 ring-2 ring-white"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-text-primary font-medium font-body">{stage.label}</span>
                </div>
                <span className="text-text-primary font-extrabold font-display">{stage.count}</span>
              </div>
              <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(stage.count / maxCount) * 100}%`,
                    backgroundColor: stage.color,
                  }}
                />
              </div>
              {idx < stages.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ChevronRight size={14} className="text-text-tertiary" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
