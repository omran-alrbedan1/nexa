import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/routes/routes';
import { ClockAlert, ExternalLink, CheckCircle2 } from 'lucide-react';
import type { PendingApproval } from '../api/dashboardApi';

interface PendingApprovalsWidgetProps {
  approvals: PendingApproval[];
  isLoading?: boolean;
}

export function PendingApprovalsWidget({ approvals, isLoading }: PendingApprovalsWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleSetPrice = () => {
    navigate(ROUTES.OPERATIONS);
  };

  return (
    <Card padding="lg" hover>
      <CardHeader>
        <div>
          <h3 className="text-sm font-bold text-text-primary font-display">{t('dashboard.pendingApprovals.title')}</h3>
          <p className="text-xs text-text-secondary font-body mt-0.5">{t('dashboard.pendingApprovals.subtitle')}</p>
        </div>
        {approvals.length > 0 && (
          <Badge variant="yellow" size="sm">{approvals.length}</Badge>
        )}
      </CardHeader>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : approvals.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mx-auto w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
            <CheckCircle2 size={20} className="text-status-success" />
          </div>
          <p className="text-sm font-medium text-text-tertiary font-body">{t('dashboard.pendingApprovals.noPending')}</p>
          <p className="text-xs text-text-tertiary/70 mt-1 font-body">{t('dashboard.pendingApprovals.allResolved')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="bg-brand-accent-light/60 border border-brand-accent/15 rounded-xl p-3.5 hover:border-brand-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <ClockAlert size={16} className="text-brand-accent flex-shrink-0" />
                  <span className="text-sm font-bold text-text-primary font-body">
                    {approval.customerName}
                  </span>
                </div>
                <Badge variant="yellow" size="sm">{t('dashboard.pendingApprovals.pendingPricing')}</Badge>
              </div>
              <p className="text-xs text-text-secondary font-body line-clamp-2 ml-7">{approval.requestDetails}</p>
              <div className="flex items-center justify-between mt-2.5 ml-7">
                <span className="text-xs font-mono text-text-tertiary">{approval.orderNumber}</span>
                <button
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-accent hover:text-brand-accent-dark transition-colors font-body"
                  onClick={() => handleSetPrice(approval)}
                >
                  {t('dashboard.pendingApprovals.setPrice')} <ExternalLink size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
