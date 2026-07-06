import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { regionsApi, type Region } from '../api/regionsApi';
import { useToggleRegionActive, useUpdateDeliveryFee, useUpdateZone } from '../hooks/useRegions';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { ArrowLeft, MapPin, Globe, Layers, Clock, DollarSign, CheckCircle2, XCircle, Map, Zap, ShoppingCart, Calendar, Pencil, Settings2 } from 'lucide-react';
import { regionKeys } from '../hooks/useRegions';
import { ClustersSection } from '../components/ClustersSection';
import { DeliverySlotsSection } from '../components/DeliverySlotsSection';
import { WorkingDaysSection } from '../components/WorkingDaysSection';
import { ZoneForm } from '../components/ZoneForm';

const REGION_TABS = [
  { key: 'overview', label: 'regions.tabs.overview', icon: Globe },
  { key: 'clusters', label: 'regions.tabs.clusters', icon: Layers },
  { key: 'slots', label: 'regions.tabs.slots', icon: Clock },
  { key: 'workingDays', label: 'regions.tabs.workingDays', icon: Calendar },
];

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function RegionDetailPage() {
  const { regionId } = useParams<{ regionId: string }>();
  const navigate = useNavigate();
  const id = parseInt(regionId || '0', 10);
  const { t } = useTranslation();
  const toggleActive = useToggleRegionActive();
  const updateFee = useUpdateDeliveryFee();
  const updateZone = useUpdateZone();

  const [activeTab, setActiveTab] = useState('overview');

  const { data: region, isLoading, isError, error, refetch } = useQuery<Region>({
    queryKey: regionKeys.detail(id),
    queryFn: () => regionsApi.getRegion(id),
    enabled: id > 0,
    staleTime: 30_000,
    retry: 1,
  });

  const [feeModal, setFeeModal] = useState<{ open: boolean; fee: string }>({ open: false, fee: '' });
  const [zoneEditModal, setZoneEditModal] = useState(false);

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate(ROUTES.REGIONS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> {t('regions.detail.back')}
        </button>
        <ErrorState title={t('regions.detail.errorTitle')} message={error instanceof Error ? error.message : 'An error occurred'} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !region) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <button onClick={() => navigate(ROUTES.REGIONS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('regions.detail.back')}
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-purple-500/10 via-purple-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <Map size={24} className="text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display truncate">{region.name}</h1>
                <span className="text-sm text-text-tertiary truncate hidden sm:inline">{region.nameAr}</span>
                {region.isActive ? <Badge variant="green" size="sm">{t('regions.detail.activeClusters')}</Badge> : <Badge variant="red" size="sm">{t('regions.detail.inactiveClusters')}</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" leftIcon={<Pencil size={14} />} onClick={() => setZoneEditModal(true)}>
                {t('regions.detail.edit')}
              </Button>
              <Button variant="secondary" size="sm" leftIcon={<DollarSign size={14} />} onClick={() => setFeeModal({ open: true, fee: String(region.deliveryFee) })}>
                {t('regions.detail.updateFee')}
              </Button>
              <Button variant={region.isActive ? 'secondary' : 'primary'} size="sm" isLoading={toggleActive.isPending} onClick={() => toggleActive.mutate(region.id)}>
                {region.isActive ? t('regions.detail.deactivate') : t('regions.detail.activate')}
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-purple-500 via-brand-primary to-purple-500 rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-brand-primary-light text-brand-primary"><DollarSign size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('regions.detail.deliveryFee')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{region.deliveryFee} SAR</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600"><CheckCircle2 size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('regions.detail.minOrder')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{region.minimumOrder} SAR</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-green-50 text-green-600"><Zap size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('regions.detail.freeDelivery')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{region.freeDeliveryThreshold ? `${region.freeDeliveryThreshold} SAR` : '—'}</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-brand-accent-light text-brand-accent"><ShoppingCart size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('regions.detail.orders')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{region.totalOrders}</p>
              <p className="text-xs text-text-tertiary">{region.totalRevenue.toLocaleString()} SAR</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-bg-section-alt rounded-xl overflow-x-auto">
        {REGION_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-white text-purple-600 shadow-sm font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Icon size={16} />
              {t(tab.label)}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Stat cards remain */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Card padding="md" hover>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-brand-primary-light text-brand-primary"><DollarSign size={16} /></div>
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('regions.detail.deliveryFee')}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display">{region.deliveryFee} SAR</p>
                </div>
              </div>
            </Card>
            <Card padding="md" hover>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600"><CheckCircle2 size={16} /></div>
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('regions.detail.minOrder')}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display">{region.minimumOrder} SAR</p>
                </div>
              </div>
            </Card>
            <Card padding="md" hover>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-green-50 text-green-600"><Zap size={16} /></div>
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('regions.detail.freeDelivery')}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display">{region.freeDeliveryThreshold ? `${region.freeDeliveryThreshold} SAR` : '—'}</p>
                </div>
              </div>
            </Card>
            <Card padding="md" hover>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-brand-accent-light text-brand-accent"><ShoppingCart size={16} /></div>
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('regions.detail.orders')}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display">{region.totalOrders}</p>
                  <p className="text-xs text-text-tertiary">{region.totalRevenue.toLocaleString()} SAR</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Summary Info */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 size={16} className="text-purple-600" />
              <h3 className="text-sm font-bold text-text-primary font-display">{t('regions.detail.zoneInfo')}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-body">
              <div className="flex items-center justify-between p-3 rounded-xl bg-bg-section-alt">
                <span className="text-text-secondary">{t('regions.detail.clusters')}</span>
                <span className="font-bold text-text-primary">{region.clusters.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-bg-section-alt">
                <span className="text-text-secondary">{t('regions.detail.activeSlotsCount')}</span>
                <span className="font-bold text-text-primary">{region.timeSlots.filter((ts) => ts.isActive).length}</span>
              </div>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'clusters' && (
        <Card padding="lg">
          <ClustersSection zoneId={region.id} />
        </Card>
      )}

      {activeTab === 'slots' && (
        <Card padding="lg">
          <DeliverySlotsSection zoneId={region.id} />
        </Card>
      )}

      {activeTab === 'workingDays' && (
        <Card padding="lg">
          <WorkingDaysSection region={region} />
        </Card>
      )}

      {/* Edit Zone Modal */}
      <ZoneForm
        open={zoneEditModal}
        onClose={() => setZoneEditModal(false)}
        onSave={(data) => updateZone.mutate({ id: region.id, data }, { onSuccess: () => setZoneEditModal(false) })}
        isSaving={updateZone.isPending}
        editing={region}
      />

      {/* Fee Modal */}
      <Modal open={feeModal.open} onClose={() => setFeeModal({ ...feeModal, open: false })} title={t('regions.list.feeModalTitle', { name: region.name })}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-text-secondary font-body mb-1">{t('regions.list.deliveryFee')}</label>
            <input type="number" step="0.5" min="0" value={feeModal.fee} onChange={(e) => setFeeModal({ ...feeModal, fee: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input" />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setFeeModal({ ...feeModal, open: false })}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={updateFee.isPending} onClick={() => {
              updateFee.mutate({ id, deliveryFee: parseFloat(feeModal.fee) });
              setFeeModal({ ...feeModal, open: false });
            }}>{t('regions.list.update')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
