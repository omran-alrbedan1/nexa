import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCampaignsPage, useCampaignAction } from '../hooks/useCampaigns';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListItem } from '@/components/ui/ListItem';
import { Pagination } from '@/components/ui/Pagination';
import { useToastStore } from '@/stores/toastStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { Megaphone, PlayCircle, CalendarClock, FileEdit, ShoppingCart, TrendingUp, Filter, Plus, CalendarRange } from 'lucide-react';
import type { CampaignStatus } from '../api/campaignsApi';

const STATUS_BADGE: Record<CampaignStatus, 'green' | 'teal' | 'yellow' | 'purple' | 'red'> = {
  active: 'green', scheduled: 'teal', draft: 'yellow', ended: 'purple', fulfilled: 'green', cancelled: 'red',
};



export function CampaignsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const campaignAction = useCampaignAction();

  const [statusFilter, setStatusFilter] = useState<CampaignStatus | ''>('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useCampaignsPage({
    page,
    status: statusFilter || undefined,
  });

  if (isError) return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('campaigns.title')}</h1>
        <p className="text-sm text-text-secondary font-body mt-1">{t('campaigns.description')}</p>
      </div>
      <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
    </div>
  );

  const stats = data?.stats;
  const campaigns = data?.campaigns ?? [];
  const meta = data?.meta ?? { currentPage: 1, lastPage: 1, perPage: 15, total: 0 };

  const getActions = (status: CampaignStatus) => {
    const actions: Array<{ label: string; action: 'activate' | 'end' | 'cancel'; variant: 'primary' | 'danger' | 'secondary' }> = [];
    if (status === 'draft' || status === 'scheduled') actions.push({ label: t('campaigns.list.activate'), action: 'activate', variant: 'primary' });
    if (status === 'active') actions.push({ label: t('campaigns.list.endCampaign'), action: 'end', variant: 'secondary' });
    if (status === 'draft' || status === 'scheduled') actions.push({ label: t('campaigns.list.cancel'), action: 'cancel', variant: 'danger' });
    return actions;
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Megaphone size={22} className="text-brand-accent" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('campaigns.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('campaigns.description')}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
        {[
          { key: 'total', label: t('campaigns.stats.totalCampaigns'), icon: Megaphone, variant: 'teal' as const },
          { key: 'active', label: t('campaigns.stats.active'), icon: PlayCircle, variant: 'success' as const },
          { key: 'scheduled', label: t('campaigns.stats.scheduled'), icon: CalendarClock, variant: 'teal' as const },
          { key: 'draft', label: t('campaigns.stats.drafts'), icon: FileEdit, variant: 'warning' as const },
          { key: 'totalOrders', label: t('campaigns.stats.totalOrders'), icon: ShoppingCart, variant: 'coral' as const },
          { key: 'totalRevenue', label: t('campaigns.stats.revenue'), icon: TrendingUp, variant: 'success' as const, suffix: '', format: true },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                    {isLoading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : (
                      <>{s.format ? (stats?.[s.key as keyof typeof stats] ?? 0).toLocaleString() : stats?.[s.key as keyof typeof stats] ?? '—'}{s.suffix || ''}</>
                    )}
                  </p>
                </div>
                <div className={cn(
                  'p-2.5 rounded-lg flex-shrink-0',
                  s.variant === 'teal' ? 'bg-brand-primary-light text-brand-primary' :
                  s.variant === 'success' ? 'bg-green-50 text-green-600' :
                  s.variant === 'coral' ? 'bg-brand-accent-light text-brand-accent' :
                  'bg-amber-50 text-amber-600'
                )}>
                  <Icon size={18} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Campaigns */}
      <Card padding="lg">
        <CardHeader
          action={
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => navigate(ROUTES.CAMPAIGN_CREATE)}>
              {t('campaigns.list.newCampaign')}
            </Button>
          }
        >
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.list.allCampaigns')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('campaigns.list.count', { count: meta.total })}</p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-5">
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as CampaignStatus | '');
                setPage(1);
              }}
              className="pl-9 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all appearance-none"
            >
              <option value="">{t('campaigns.list.allStatuses')}</option>
              <option value="active">{t('campaigns.list.active')}</option>
              <option value="scheduled">{t('campaigns.list.scheduled')}</option>
              <option value="draft">{t('campaigns.list.draft')}</option>
              <option value="ended">{t('campaigns.list.ended')}</option>
              <option value="fulfilled">{t('campaigns.list.fulfilled')}</option>
              <option value="cancelled">{t('campaigns.list.cancelled')}</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1,2,3].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}</div>
        ) : campaigns.length === 0 ? (
          <EmptyState title={t('campaigns.list.noCampaigns')} description={statusFilter ? t('campaigns.list.noFilterMatch') : t('campaigns.list.createFirst')} />
        ) : (
          <div className="space-y-3">
            {campaigns.map((camp) => (
              <ListItem
                key={camp.id}
                onClick={() => navigate(ROUTES.CAMPAIGN_DETAIL(camp.id))}
                icon={<Megaphone size={16} className="text-brand-accent" />}
                iconClassName="bg-brand-accent-light"
                title={<span className="text-sm font-bold text-text-primary font-body truncate">{camp.name}</span>}
                badges={<>
                  <span className="text-xs text-text-tertiary truncate hidden sm:inline">{camp.nameAr}</span>
                  <Badge variant={STATUS_BADGE[camp.status]} size="sm">{camp.status}</Badge>
                </>}
                actions={getActions(camp.status).map((action) => (
                  <Button key={action.action} variant={action.variant} size="sm" isLoading={campaignAction.isPending} onClick={(e) => { e.stopPropagation(); campaignAction.mutate({ id: camp.id, action: action.action }); }}>
                    {action.label}
                  </Button>
                ))}
              >
                <p className="text-xs text-text-secondary font-body line-clamp-1">{camp.description}</p>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-text-tertiary font-body flex-wrap">
                  <span className="flex items-center gap-1"><CalendarRange size={12} />{new Date(camp.startDate).toLocaleDateString()} → {new Date(camp.endDate).toLocaleDateString()}</span>
                  <span>{t('campaigns.list.orders', { count: camp.totalOrders })}</span>
                  {camp.isStockLimited && camp.stockTotalQuantity !== null && (
                    <span>{camp.stockSoldQuantity}/{camp.stockTotalQuantity} {camp.stockUnit}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {camp.targetRegions.map((r) => <Badge key={r} variant="purple" size="sm">{r}</Badge>)}
                </div>
              </ListItem>
            ))}
          </div>
        )}
        <Pagination
          currentPage={meta.currentPage}
          lastPage={meta.lastPage}
          total={meta.total}
          perPage={15}
          onPageChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </Card>
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
