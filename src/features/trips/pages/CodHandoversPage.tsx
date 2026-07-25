import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { tripsApi, type CodHandover } from '../api/tripsApi';
import { useConfirmCodHandover, tripKeys } from '../hooks/useTrips';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/routes/routes';
import { useFormatPrice } from '@/hooks/useFormatPrice';
import { safeFormatDate, isDateValid } from '@/utils/date';
import { ArrowLeft, DollarSign, CheckCircle2 } from 'lucide-react';

const HANDOVER_BADGE: Record<string, 'yellow' | 'green'> = {
  pending: 'yellow',
  confirmed: 'green',
};

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function CodHandoversPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const id = parseInt(tripId || '0', 10);
  const { t } = useTranslation();
  const formatPrice = useFormatPrice();

  const confirmHandover = useConfirmCodHandover();

  const { data: handovers = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: tripKeys.codHandovers(id),
    queryFn: () => tripsApi.getCodHandovers(id),
    enabled: id > 0,
  });

  const pendingHandovers = handovers.filter((h) => h.status === 'pending');
  const confirmedHandovers = handovers.filter((h) => h.status === 'confirmed');

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

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-green-50 via-green-50/30 to-transparent">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <DollarSign size={22} className="text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('trips.codHandovers.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('trips.codHandovers.description')}</p>
            </div>
          </div>
        </div>
      </div>

      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('trips.codHandovers.pendingHandovers')} ({pendingHandovers.length})</h3>
          </div>
        </CardHeader>
        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}</div>
        ) : pendingHandovers.length === 0 ? (
          <EmptyState title={t('trips.codHandovers.noPending')} description={t('trips.codHandovers.allConfirmed')} />
        ) : (
          <div className="space-y-3">
            {pendingHandovers.map((handover) => (
              <div key={handover.id} className="p-4 rounded-xl border border-border-default hover:border-green-200 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="yellow" size="sm">{handover.status}</Badge>
                      {handover.driver && <span className="text-xs font-bold text-text-secondary">{handover.driver.full_name}</span>}
                    </div>
                    <p className="text-sm font-bold text-text-primary">{formatPrice(handover.amount)} <span className="text-xs font-normal text-text-secondary">{handover.currency}</span></p>
                  </div>
                  <Button variant="primary" size="sm" isLoading={confirmHandover.isPending} onClick={() => confirmHandover.mutate({ tripId: id, handoverId: handover.id })}>
                    {t('trips.codHandovers.confirm')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {confirmedHandovers.length > 0 && (
        <Card padding="lg">
          <CardHeader>
            <div>
              <h3 className="text-sm font-bold text-text-primary font-display">{t('trips.codHandovers.confirmedHandovers')} ({confirmedHandovers.length})</h3>
            </div>
          </CardHeader>
          <div className="space-y-3">
            {confirmedHandovers.map((handover) => (
              <div key={handover.id} className="p-4 rounded-xl border border-border-default bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="green" size="sm">{handover.status}</Badge>
                  {handover.driver && <span className="text-xs font-bold text-text-secondary">{handover.driver.full_name}</span>}
                </div>
                <p className="text-sm font-bold text-text-primary">{formatPrice(handover.amount)} <span className="text-xs font-normal text-text-secondary">{handover.currency}</span></p>
                {handover.confirmed_at && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle2 size={12} /> {safeFormatDate(handover.confirmed_at, (d) => d.toLocaleString())}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
