import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { tripsApi, type PickupIssue } from '../api/tripsApi';
import { useResolvePickupIssue, tripKeys } from '../hooks/useTrips';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/routes/routes';
import { ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';

const ISSUE_BADGE: Record<string, 'yellow' | 'red' | 'green' | 'teal'> = {
  open: 'red',
  resolved: 'green',
};

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function PickupIssuesPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const id = parseInt(tripId || '0', 10);
  const { t } = useTranslation();

  const resolveIssue = useResolvePickupIssue();

  const [resolveModal, setResolveModal] = useState<{ open: boolean; issue: PickupIssue | null; resolution: string; notes: string }>({
    open: false, issue: null, resolution: '', notes: '',
  });

  const { data: issues = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: tripKeys.pickupIssues(id),
    queryFn: () => tripsApi.getPickupIssues(id),
    enabled: id > 0,
  });

  const openIssues = issues.filter((i) => i.status === 'open');
  const resolvedIssues = issues.filter((i) => i.status === 'resolved');

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate(ROUTES.TRIP_DETAIL(id))} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> {t('trips.detail.back')}
        </button>
        <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <button onClick={() => navigate(ROUTES.TRIP_DETAIL(id))} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('trips.detail.back')}
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-amber-50 via-amber-50/30 to-transparent">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <AlertTriangle size={22} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('trips.pickupIssues.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('trips.pickupIssues.description')}</p>
            </div>
          </div>
        </div>
      </div>

      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('trips.pickupIssues.openIssues')} ({openIssues.length})</h3>
          </div>
        </CardHeader>
        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>
        ) : openIssues.length === 0 ? (
          <EmptyState title={t('trips.pickupIssues.noOpenIssues')} description={t('trips.pickupIssues.allResolved')} />
        ) : (
          <div className="space-y-3">
            {openIssues.map((issue) => (
              <div key={issue.id} className="p-4 rounded-xl border border-border-default hover:border-amber-200 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={ISSUE_BADGE[issue.status] || 'red'} size="sm">{issue.status}</Badge>
                      {issue.order && <span className="text-xs font-bold text-text-secondary">{issue.order.order_number}</span>}
                    </div>
                    <p className="text-sm font-bold text-text-primary">{issue.issue_type}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{issue.description}</p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setResolveModal({ open: true, issue, resolution: '', notes: '' })}>
                    {t('trips.pickupIssues.resolve')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {resolvedIssues.length > 0 && (
        <Card padding="lg">
          <CardHeader>
            <div>
              <h3 className="text-sm font-bold text-text-primary font-display">{t('trips.pickupIssues.resolvedIssues')} ({resolvedIssues.length})</h3>
            </div>
          </CardHeader>
          <div className="space-y-3">
            {resolvedIssues.map((issue) => (
              <div key={issue.id} className="p-4 rounded-xl border border-border-default bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={ISSUE_BADGE[issue.status] || 'green'} size="sm">{issue.status}</Badge>
                  {issue.order && <span className="text-xs font-bold text-text-secondary">{issue.order.order_number}</span>}
                </div>
                <p className="text-sm font-bold text-text-primary">{issue.issue_type}</p>
                <p className="text-xs text-text-secondary mt-0.5">{issue.description}</p>
                {issue.resolution && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle2 size={12} /> {issue.resolution}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={resolveModal.open} onClose={() => setResolveModal({ ...resolveModal, open: false })} title={t('trips.pickupIssues.resolveTitle')}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">{t('trips.pickupIssues.resolveDescription')}</p>
          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body mb-1 block">{t('trips.pickupIssues.resolutionLabel')}</label>
            <input
              type="text"
              value={resolveModal.resolution}
              onChange={(e) => setResolveModal({ ...resolveModal, resolution: e.target.value })}
              className="w-full px-4 py-2.5 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all"
              placeholder={t('trips.pickupIssues.resolutionPlaceholder')}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body mb-1 block">{t('trips.detail.notesLabel')} ({t('common.optional')})</label>
            <textarea
              value={resolveModal.notes}
              onChange={(e) => setResolveModal({ ...resolveModal, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all resize-none"
              rows={3}
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setResolveModal({ ...resolveModal, open: false })}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" disabled={!resolveModal.resolution} isLoading={resolveIssue.isPending} onClick={() => {
              if (!resolveModal.issue || !resolveModal.resolution) return;
              resolveIssue.mutate({ tripId: id, issueId: resolveModal.issue.id, data: { resolution: resolveModal.resolution, notes: resolveModal.notes || undefined } });
              setResolveModal({ ...resolveModal, open: false });
            }}>{t('trips.pickupIssues.resolve')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
