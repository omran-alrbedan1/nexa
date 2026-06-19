import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { campaignsApi, type Campaign } from '../api/campaignsApi';
import { campaignKeys, useCampaignAction } from '../hooks/useCampaigns';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import {
  ArrowLeft, Megaphone, CalendarRange, ShoppingCart, TrendingUp,
  Wallet, MapPin, Tag, Clock, Package,
} from 'lucide-react';

const STATUS_BADGE: Record<string, 'green' | 'teal' | 'yellow' | 'purple' | 'red'> = {
  active: 'green', scheduled: 'teal', draft: 'yellow', ended: 'purple', cancelled: 'red',
};

const STAT_CONFIG = [
  { key: 'totalOrders', label: 'Total Orders', icon: ShoppingCart, variant: 'teal' as const, suffix: '' },
  { key: 'totalRevenue', label: 'Revenue', icon: TrendingUp, variant: 'success' as const, suffix: ' SAR', prefix: '' },
  { key: 'budget', label: 'Budget', icon: Wallet, variant: 'coral' as const, suffix: ' SAR' },
  { key: 'spentAmount', label: 'Spent', icon: Wallet, variant: 'warning' as const, suffix: ' SAR' },
];

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const id = parseInt(campaignId || '0', 10);
  const campaignAction = useCampaignAction();

  const { data: campaign, isLoading, isError, error, refetch } = useQuery<Campaign>({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignsApi.getCampaign(id),
    enabled: id > 0,
    staleTime: 30_000,
    retry: 1,
  });

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate(ROUTES.CAMPAIGNS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> Back to Campaigns
        </button>
        <ErrorState
          title="Failed to load campaign"
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const getActions = (status: string) => {
    const actions: Array<{ label: string; action: 'activate' | 'end' | 'cancel'; variant: 'primary' | 'danger' | 'secondary' }> = [];
    if (status === 'draft' || status === 'scheduled') actions.push({ label: 'Activate', action: 'activate', variant: 'primary' });
    if (status === 'active') actions.push({ label: 'End Campaign', action: 'end', variant: 'secondary' });
    if (status === 'draft' || status === 'scheduled') actions.push({ label: 'Cancel', action: 'cancel', variant: 'danger' });
    return actions;
  };

  const formatValue = (key: string) => {
    const val = campaign[key as keyof Campaign];
    if (typeof val === 'number') {
      if (['totalRevenue', 'budget', 'spentAmount'].includes(key)) return val.toLocaleString();
      return val.toLocaleString();
    }
    return val ?? '—';
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back */}
      <button onClick={() => navigate(ROUTES.CAMPAIGNS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> Back to Campaigns
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
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent rounded-full opacity-30" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {STAT_CONFIG.map((s) => {
          const Icon = s.icon;
          const val = campaign[s.key as keyof Campaign];
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                  <p className="text-2xl font-extrabold text-text-primary font-display mt-1">
                    {typeof val === 'number' ? formatValue(s.key) : val ?? '—'}
                    {s.suffix}
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

      {/* Two-column info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Details */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Tag size={16} className="text-brand-accent" />
            <h3 className="text-sm font-bold text-text-primary font-display">Campaign Details</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><CalendarRange size={12} /> Start Date</span>
              <span className="font-bold text-text-primary">{new Date(campaign.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><CalendarRange size={12} /> End Date</span>
              <span className="font-bold text-text-primary">{new Date(campaign.endDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><Clock size={12} /> Duration</span>
              <span className="font-bold text-text-primary">
                {Math.ceil((new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><ShoppingCart size={12} /> Orders</span>
              <span className="font-bold text-text-primary">{campaign.totalOrders}</span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm font-body">
              <span className="text-text-secondary flex items-center gap-2"><Wallet size={12} /> Budget Utilization</span>
              <span className="font-bold text-text-primary">
                {campaign.budget > 0 ? `${Math.round((campaign.spentAmount / campaign.budget) * 100)}%` : '—'}
              </span>
            </div>
          </div>
        </Card>

        {/* Target Regions */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-brand-accent" />
            <h3 className="text-sm font-bold text-text-primary font-display">Target Regions</h3>
          </div>
          {campaign.targetRegions.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {campaign.targetRegions.map((r) => <Badge key={r} variant="purple" size="sm">{r}</Badge>)}
            </div>
          ) : (
            <p className="text-sm text-text-secondary font-body">No target regions set</p>
          )}

          <div className="mt-6">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body mb-3">Description</h4>
            <p className="text-sm text-text-primary font-body">{campaign.description || 'No description'}</p>
            {campaign.descriptionAr && (
              <p className="text-sm text-text-secondary font-body mt-2 text-right" dir="rtl">{campaign.descriptionAr}</p>
            )}
          </div>
        </Card>
      </div>

      {/* Campaign Products */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-brand-accent" />
          <h3 className="text-sm font-bold text-text-primary font-display">Campaign Products</h3>
          <span className="text-xs text-text-tertiary">({campaign.products.length} items)</span>
        </div>
        {campaign.products.length === 0 ? (
          <p className="text-sm text-text-secondary font-body">No products assigned to this campaign yet.</p>
        ) : (
          <div className="space-y-2">
            {campaign.products.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 px-4 rounded-xl border border-border-default/60">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-text-tertiary flex-shrink-0" />
                    <span className="text-sm font-bold text-text-primary font-body">{p.productName}</span>
                    <span className="text-xs text-text-tertiary">{p.productNameAr}</span>
                  </div>
                  <p className="text-xs text-text-secondary font-body mt-1 ml-6">
                    {p.unit} · Qty: {p.quantity} · Regular: <span className="line-through text-text-tertiary">{p.regularPrice} SAR</span>
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-lg font-extrabold text-brand-accent font-display">{p.campaignPrice} <span className="text-xs font-body text-text-tertiary">SAR</span></p>
                  <p className="text-xs text-green-600 font-bold">
                    -{Math.round((1 - p.campaignPrice / p.regularPrice) * 100)}% off
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Timeline / History */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-brand-accent" />
          <h3 className="text-sm font-bold text-text-primary font-display">Campaign Timeline</h3>
        </div>
        <div className="relative pl-8">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border-default" />
          {[
            { label: 'Created', time: campaign.createdAt },
            { label: campaign.status === 'scheduled' ? 'Scheduled' : campaign.status === 'active' ? 'Activated' : 'Updated', time: campaign.updatedAt },
          ].map((step, idx, arr) => (
            <div key={idx} className="relative pb-6 last:pb-0">
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
