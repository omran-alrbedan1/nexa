import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { campaignsApi, type Campaign } from '../api/campaignsApi';
import { campaignKeys, useCampaignAction, useMaterializeItemProduct } from '../hooks/useCampaigns';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import {
  ArrowLeft, Megaphone, CalendarRange, ShoppingCart, TrendingUp,
  MapPin, Tag, Clock, Package, PenLine, PackagePlus, ExternalLink,
} from 'lucide-react';

const STATUS_BADGE: Record<string, 'green' | 'teal' | 'yellow' | 'purple' | 'red'> = {
  active: 'green', scheduled: 'teal', draft: 'yellow', ended: 'purple', fulfilled: 'green', cancelled: 'red',
};

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const id = parseInt(campaignId || '0', 10);
  const { t } = useTranslation();
  const campaignAction = useCampaignAction();
  const materialize = useMaterializeItemProduct(id);

  const { data: campaign, isLoading, isError, error, refetch } = useQuery<Campaign>({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignsApi.getCampaign(id),
    enabled: id > 0,
    staleTime: 30_000,
    retry: 1,
  });

  const stockUnit = campaign?.stockUnit || '';
  const STAT_CONFIG = [
    { key: 'totalOrders', label: t('campaigns.detail.totalOrders'), icon: ShoppingCart, variant: 'teal' as const, suffix: '' },
    { key: 'isStockLimited', label: t('campaigns.detail.stockType'), icon: Package, variant: 'success' as const, suffix: '', formatStockLimited: true },
    ...(campaign?.isStockLimited ? [
      { key: 'stockSoldQuantity' as const, label: t('campaigns.detail.sold'), icon: TrendingUp, variant: 'coral' as const, suffix: ` ${stockUnit}` },
      { key: 'stockTotalQuantity' as const, label: t('campaigns.detail.totalStock'), icon: Package, variant: 'warning' as const, suffix: ` ${stockUnit}` },
    ] : []),
  ];

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate(ROUTES.CAMPAIGNS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> {t('campaigns.detail.back')}
        </button>
        <ErrorState
          title={t('campaigns.detail.errorTitle')}
          message={error instanceof Error ? error.message : 'An unexpected error occurred'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading || !campaign) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const getActions = (status: string) => {
    const actions: Array<{ label: string; action: 'activate' | 'end' | 'cancel'; variant: 'primary' | 'danger' | 'secondary' }> = [];
    if (status === 'draft' || status === 'scheduled') actions.push({ label: t('campaigns.detail.activate'), action: 'activate', variant: 'primary' });
    if (status === 'active') actions.push({ label: t('campaigns.detail.endCampaign'), action: 'end', variant: 'secondary' });
    if (status === 'draft' || status === 'scheduled') actions.push({ label: t('campaigns.detail.cancel'), action: 'cancel', variant: 'danger' });
    return actions;
  };

  const catName = (item: { categoryId: number }) => {
    return item.categoryId ? `Cat #${item.categoryId}` : '—';
  };

  const formatValue = (key: string) => {
    if (key === 'isStockLimited') return campaign.isStockLimited ? t('campaigns.detail.limited') : t('campaigns.detail.unlimited');
    if (key === 'stockTotalQuantity') return campaign.stockTotalQuantity?.toLocaleString() ?? '—';
    if (key === 'stockSoldQuantity') return campaign.stockSoldQuantity.toLocaleString();
    const val = campaign[key as keyof Campaign];
    if (typeof val === 'number') return val.toLocaleString();
    return val ?? '—';
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back */}
      <button onClick={() => navigate(ROUTES.CAMPAIGNS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('campaigns.detail.back')}
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-accent/10 via-brand-accent-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <Megaphone size={28} className="text-brand-accent" />
            </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{campaign.name}</h1>
                  <span className="text-sm text-text-tertiary">{campaign.nameAr}</span>
                  <Badge variant={STATUS_BADGE[campaign.status]} size="sm">{campaign.status}</Badge>
                </div>
                {(campaign.subtitleAr || campaign.subtitleEn) && (
                  <p className="text-sm text-text-secondary font-body mt-1 italic">
                    {campaign.subtitleEn || campaign.subtitleAr}
                  </p>
                )}
                <p className="text-sm text-text-secondary font-body mt-1 line-clamp-2">{campaign.description}</p>
              </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getActions(campaign.status).map((action) => (
                <Button
                  key={action.action}
                  variant={action.variant}
                  size="sm"
                  isLoading={campaignAction.isPending}
                  onClick={() => campaignAction.mutate({ id: campaign.id, action: action.action })}
                >
                  {action.label}
                </Button>
              ))}
              <Button variant="secondary" size="sm" leftIcon={<PenLine size={14} />} onClick={() => navigate(ROUTES.CAMPAIGN_EDIT(campaign.id))}>
                {t('campaigns.detail.edit')}
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent rounded-full opacity-30" />
      </div>

      {/* Banner Image */}
      {campaign.bannerUrl && (
        <div className="relative overflow-hidden rounded-2xl">
          <img src={campaign.bannerUrl} alt={campaign.name} className="w-full h-48 md:h-64 object-cover" />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {STAT_CONFIG.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                  <p className="text-2xl font-extrabold text-text-primary font-display mt-1">
                    {s.formatStockLimited
                      ? (campaign.isStockLimited ? t('campaigns.detail.limited') : t('campaigns.detail.unlimited'))
                      : formatValue(s.key)
                    }
                    {!s.formatStockLimited && s.suffix}
                  </p>
                </div>
                <div className={cn(
                  'p-2.5 rounded-lg flex-shrink-0',
                  s.variant === 'teal' ? 'bg-brand-primary-light text-brand-primary' :
                  s.variant === 'success' ? 'bg-green-50 text-green-600' :
                  s.variant === 'warning' ? 'bg-amber-50 text-amber-600' :
                  'bg-brand-accent-light text-brand-accent'
                )}>
                  <Icon size={18} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Stock Progress Bar */}
      {campaign.isStockLimited && campaign.stockTotalQuantity && campaign.stockTotalQuantity > 0 && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-3">
            <Package size={16} className="text-brand-accent" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.detail.stockProgress')}</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary font-body">{t('campaigns.detail.remaining')}</span>
              <span className="font-bold text-text-primary font-body">
                {(campaign.stockTotalQuantity - campaign.stockSoldQuantity - (campaign.stockReservedQuantity || 0)).toLocaleString()} / {campaign.stockTotalQuantity.toLocaleString()} {campaign.stockUnit}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-accent to-brand-primary transition-all"
                style={{ width: `${Math.min(100, ((campaign.stockSoldQuantity + (campaign.stockReservedQuantity || 0)) / campaign.stockTotalQuantity) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-text-tertiary">
              <span>{t('campaigns.detail.sold')}: {campaign.stockSoldQuantity.toLocaleString()}</span>
              <span>{t('campaigns.detail.reserved')}: {(campaign.stockReservedQuantity || 0).toLocaleString()}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Two-column info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Details */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Tag size={16} className="text-brand-accent" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.detail.campaignDetails')}</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><CalendarRange size={12} /> {t('campaigns.detail.startDate')}</span>
              <span className="font-bold text-text-primary">{new Date(campaign.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><CalendarRange size={12} /> {t('campaigns.detail.endDate')}</span>
              <span className="font-bold text-text-primary">{new Date(campaign.endDate).toLocaleDateString()}</span>
            </div>
            {campaign.orderingClosesAt && (
              <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
                <span className="text-text-secondary flex items-center gap-2"><Clock size={12} /> {t('campaigns.detail.orderingCloses')}</span>
                <span className="font-bold text-text-primary">{new Date(campaign.orderingClosesAt).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><Clock size={12} /> {t('campaigns.detail.duration')}</span>
              <span className="font-bold text-text-primary">
                {t('campaigns.detail.days', { count: Math.ceil((new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24)) })}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><ShoppingCart size={12} /> {t('campaigns.detail.orders')}</span>
              <span className="font-bold text-text-primary">{campaign.totalOrders}</span>
            </div>
            {campaign.deliveryLeadTimeMinDays !== null && (
              <div className="flex items-center justify-between py-2 text-sm font-body">
                <span className="text-text-secondary flex items-center gap-2"><Package size={12} /> {t('campaigns.detail.deliveryLeadTime')}</span>
                <span className="font-bold text-text-primary">
                  {campaign.deliveryLeadTimeMinDays}–{campaign.deliveryLeadTimeMaxDays} {t('campaigns.detail.days')}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Target Regions */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-brand-accent" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.detail.targetRegions')}</h3>
          </div>
          {campaign.targetRegions.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {campaign.targetRegions.map((r) => <Badge key={r} variant="purple" size="sm">{r}</Badge>)}
            </div>
          ) : (
            <p className="text-sm text-text-secondary font-body">{t('campaigns.detail.noTargetRegions')}</p>
          )}

          <div className="mt-6">
            {campaign.subtitleAr && (
              <div className="mb-3">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body mb-1">{t('campaigns.detail.subtitle')} (AR)</h4>
                <p className="text-sm text-text-primary font-body" dir="rtl">{campaign.subtitleAr}</p>
              </div>
            )}
            {campaign.subtitleEn && (
              <div className="mb-3">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body mb-1">{t('campaigns.detail.subtitle')} (EN)</h4>
                <p className="text-sm text-text-primary font-body">{campaign.subtitleEn}</p>
              </div>
            )}
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body mb-3">{t('campaigns.detail.description')}</h4>
            <p className="text-sm text-text-primary font-body">{campaign.description || t('campaigns.detail.noDescription')}</p>
            {campaign.descriptionEn && (
              <p className="text-sm text-text-secondary font-body mt-2">{campaign.descriptionEn}</p>
            )}
          </div>
        </Card>
      </div>

      {/* Campaign Items */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-brand-accent" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.detail.campaignProducts')}</h3>
          <span className="text-xs text-text-tertiary">{t('campaigns.detail.itemsCount', { count: campaign.items.length })}</span>
        </div>
        {campaign.items.length === 0 ? (
          <p className="text-sm text-text-secondary font-body">{t('campaigns.detail.noProducts')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default/60 text-xs font-bold text-text-secondary uppercase tracking-wider">
                  <th className="text-left py-2 pr-4 font-body">{t('campaigns.detail.table.nameAr')}</th>
                  <th className="text-left py-2 pr-4 font-body">{t('campaigns.detail.table.nameEn')}</th>
                  <th className="text-left py-2 pr-4 font-body">{t('campaigns.detail.table.category')}</th>
                  <th className="text-left py-2 pr-4 font-body">{t('campaigns.detail.table.unit')}</th>
                  <th className="text-right py-2 pr-4 font-body">{t('campaigns.detail.table.price')}</th>
                  <th className="text-right py-2 pr-4 font-body">{t('campaigns.detail.table.stock')}</th>
                  <th className="text-right py-2 font-body">{t('campaigns.detail.product')}</th>
                </tr>
              </thead>
              <tbody>
                {campaign.items.map((item) => (
                  <tr key={item.id} className="border-b border-border-default/30">
                    <td className="py-3 pr-4 font-bold text-text-primary font-body">{item.nameAr}</td>
                    <td className="py-3 pr-4 text-text-secondary font-body">{item.nameEn || '—'}</td>
                    <td className="py-3 pr-4 text-text-secondary font-body">{catName(item)}</td>
                    <td className="py-3 pr-4 text-text-secondary font-body">{item.unit}</td>
                    <td className="py-3 pr-4 text-right font-bold text-text-primary font-body">{item.price.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-right text-text-secondary font-body">{item.stockQuantity}</td>
                    <td className="py-3 text-right">
                      {item.productId ? (
                        <Button variant="secondary" size="sm" leftIcon={<ExternalLink size={12} />} onClick={() => navigate(ROUTES.PRODUCT_DETAIL(item.productId!))}>
                          {t('campaigns.detail.viewProduct')}
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<PackagePlus size={12} />}
                          isLoading={materialize.isPending && materialize.variables?.itemId === item.id}
                          onClick={() => materialize.mutate({ itemId: item.id })}
                        >
                          {t('campaigns.detail.makeProduct')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Assigned Supplier */}
      {campaign.assignedSupplier && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-brand-accent" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.detail.assignedSupplier')}</h3>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border-default/60">
            <div className="w-10 h-10 rounded-full bg-brand-accent-light flex items-center justify-center">
              <Package size={18} className="text-brand-accent" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary font-body">{campaign.assignedSupplier.businessName}</p>
              <p className="text-xs text-text-tertiary font-body">{t('campaigns.detail.supplierId', { id: campaign.assignedSupplier.id })}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Timeline / History */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-brand-accent" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('campaigns.detail.campaignTimeline')}</h3>
        </div>
        <div className="relative pl-8">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border-default" />
          {[
            { label: t('campaigns.detail.created'), time: campaign.createdAt },
            { label: campaign.status === 'scheduled' ? t('campaigns.detail.scheduledLabel') : campaign.status === 'active' ? t('campaigns.detail.activated') : t('campaigns.detail.updated'), time: campaign.updatedAt },
          ].map((step, idx, arr) => (
            <div key={idx} className="relative pb-10 last:pb-0">
              <div className={cn(
                'absolute -left-[23px] w-[22px] h-[22px] rounded-full border-2 border-white flex items-center justify-center',
                idx === arr.length - 1 ? 'bg-brand-accent' : 'bg-white'
              )}>
                <div className={cn('w-2 h-2 rounded-full', idx === arr.length - 1 ? 'bg-white' : 'bg-border-default')} />
              </div>
              <div>
                <span className="text-sm font-bold text-text-primary font-body">{step.label}</span>
                <span className="text-xs text-text-tertiary font-body ml-2">
                  {new Date(step.time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
