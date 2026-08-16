import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToastStore } from '@/stores/toastStore';
import { AlertTriangle, AlertCircle, Clock, UserX, Package, MessageCircle } from 'lucide-react';
import type { ActionRequiredItem } from '../api/dashboardApi';

const ICON_MAP: Record<ActionRequiredItem['type'], React.ReactNode> = {
  new_special: <AlertCircle size={18} />,
  pending_pricing: <Clock size={18} />,
  pending_customer: <Clock size={18} />,
  negotiation_reply: <MessageCircle size={18} />,
  overdue_supply: <AlertTriangle size={18} />,
  ready_no_trip: <Package size={18} />,
  trip_no_driver: <UserX size={18} />,
  failed_delivery: <AlertTriangle size={18} />,
};

const VARIANT_MAP: Record<ActionRequiredItem['type'], 'red' | 'yellow' | 'teal' | 'purple'> = {
  new_special: 'yellow',
  pending_pricing: 'yellow',
  pending_customer: 'teal',
  negotiation_reply: 'purple',
  overdue_supply: 'red',
  ready_no_trip: 'purple',
  trip_no_driver: 'red',
  failed_delivery: 'red',
};

interface ActionRequiredWidgetProps {
  items: ActionRequiredItem[];
  isLoading?: boolean;
}

export function ActionRequiredWidget({ items, isLoading }: ActionRequiredWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const handleItemClick = (item: ActionRequiredItem) => {
    if (item.link) {
      navigate(item.link);
    } else {
      addToast('info', `${t('dashboard.actionRequired.items.' + item.type)}: ${item.count} ${t('dashboard.actionRequired.items')}`);
    }
  };

  return (
    <Card padding="md">
      <CardHeader>
        <div>
          <h3 className="text-sm font-bold text-text-primary font-display">{t('dashboard.actionRequired.title')}</h3>
          <p className="text-xs text-text-secondary font-body mt-0.5">{t('dashboard.actionRequired.subtitle')}</p>
        </div>
        {items.length > 0 && (
          <span className="bg-brand-accent-light text-brand-accent-dark text-xs font-bold px-2 py-1 rounded-full font-body">
            {items.length}
          </span>
        )}
      </CardHeader>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-6 text-center">
          <div className="mx-auto w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-text-tertiary font-body">{t('dashboard.actionRequired.allClear')}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => {
            const variant = VARIANT_MAP[item.type];
            return (
              <div
                key={item.type}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-bg-section-alt transition-colors cursor-pointer group"
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    variant === 'red' ? 'bg-red-50 text-status-error' :
                    variant === 'yellow' ? 'bg-amber-50 text-amber-600' :
                    variant === 'purple' ? 'bg-purple-50 text-purple-600' :
                    'bg-brand-primary-light text-brand-primary'
                  )}>
                    {ICON_MAP[item.type]}
                  </div>
                  <span className="text-sm text-text-primary font-body font-medium truncate">{t('dashboard.actionRequired.items.' + item.type)}</span>
                </div>
                <Badge variant={variant === 'red' ? 'red' : variant === 'yellow' ? 'yellow' : variant === 'purple' ? 'purple' : 'teal'} size="sm">
                  {item.count}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
