import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegionsPage, useToggleRegionActive, useUpdateDeliveryFee, useCreateZone } from '../hooks/useRegions';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListItem } from '@/components/ui/ListItem';
import { Pagination } from '@/components/ui/Pagination';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { MapPin, CheckCircle2, Layers, ShoppingCart, Map, Globe, DollarSign, Plus } from 'lucide-react';
import { useFormatPrice } from '@/hooks/useFormatPrice';
import { ZoneForm } from '../components/ZoneForm';



export function RegionsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const formatPrice = useFormatPrice();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useRegionsPage({ page });
  const toggleActive = useToggleRegionActive();
  const updateFee = useUpdateDeliveryFee();
  const createZone = useCreateZone();

  const [feeModal, setFeeModal] = useState<{ open: boolean; regionId: number; regionName: string; warehouseId: number | null; warehouseName: string | null; fee: string }>({ open: false, regionId: 0, regionName: '', warehouseId: null, warehouseName: null, fee: '' });
  const [zoneModal, setZoneModal] = useState(false);

  if (isError) return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('regions.title')}</h1>
        <p className="text-sm text-text-secondary font-body mt-1">{t('regions.description')}</p>
      </div>
      <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
    </div>
  );

  const stats = data?.stats;
  const regions = data?.regions ?? [];
  const meta = data?.meta ?? { currentPage: 1, lastPage: 1, perPage: 15, total: 0 };

  const openFeeModal = (region: typeof regions[0]) => {
    setFeeModal({ open: true, regionId: region.id, regionName: region.name, warehouseId: region.defaultWarehouseId, warehouseName: region.deliveryFees[0]?.warehouseName ?? null, fee: region.deliveryFee.toString() });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-purple-500/10 via-purple-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Map size={22} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('regions.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('regions.description')}</p>
            </div>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setZoneModal(true)}>
            {t('regions.list.addRegion')}
          </Button>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-purple-500 via-brand-primary to-purple-500 rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
        {[
          { key: 'totalRegions', label: t('regions.stats.totalRegions'), icon: Globe, variant: 'teal' as const },
          { key: 'activeRegions', label: t('regions.stats.active'), icon: CheckCircle2, variant: 'success' as const },
          { key: 'totalClusters', label: t('regions.stats.clusters'), icon: Layers, variant: 'purple' as const },
          { key: 'totalOrders', label: t('regions.stats.totalOrders'), icon: ShoppingCart, variant: 'coral' as const },
          { key: 'avgDeliveryFee', label: t('regions.stats.avgFee'), icon: DollarSign, variant: 'warning' as const, suffix: '' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                    {isLoading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : <>{stats?.[s.key as keyof typeof stats]}{s.suffix || ''}</>}
                  </p>
                </div>
                <div className={cn(
                  'p-2.5 rounded-lg flex-shrink-0',
                  s.variant === 'teal' ? 'bg-brand-primary-light text-brand-primary' :
                  s.variant === 'success' ? 'bg-green-50 text-green-600' :
                  s.variant === 'purple' ? 'bg-purple-50 text-purple-600' :
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

      {/* Regions List */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('regions.list.deliveryRegions')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('regions.list.totalRevenue', { amount: (stats?.totalRevenue ?? 0).toLocaleString() })}</p>
          </div>
        </CardHeader>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1,2,3].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}</div>
        ) : regions.length === 0 ? (
          <EmptyState title={t('regions.list.noRegions')} description={t('regions.list.addFirstRegion')} />
        ) : (
          <div className="space-y-3">
            {regions.map((region) => (
              <ListItem
                key={region.id}
                onClick={() => navigate(ROUTES.REGION_DETAIL(region.id))}
                icon={<MapPin size={16} className="text-brand-primary" />}
                title={<span className="text-sm font-bold text-text-primary font-body truncate">{region.name}</span>}
                badges={<>
                  <span className="text-xs text-text-tertiary truncate hidden sm:inline">{region.nameAr}</span>
                  {region.isActive ? <Badge variant="green" size="sm">{t('regions.list.active')}</Badge> : <Badge variant="red" size="sm">{t('regions.list.inactive')}</Badge>}
                </>}
                actions={<>
                  <Button variant="secondary" size="sm" leftIcon={<DollarSign size={12} />} onClick={(e) => { e.stopPropagation(); openFeeModal(region); }}>{t('regions.list.feeButton')}</Button>
                  <Button variant={region.isActive ? 'secondary' : 'primary'} size="sm" isLoading={toggleActive.isPending} onClick={(e) => { e.stopPropagation(); toggleActive.mutate(region.id); }}>
                    {region.isActive ? t('regions.list.deactivate') : t('regions.list.activate')}
                  </Button>
                </>}
              >
                <div className="flex items-center gap-4 text-xs text-text-secondary font-body flex-wrap">
                  <span>{t('regions.list.fee', { amount: region.deliveryFee })}</span>
                  <span>{t('regions.list.min', { amount: region.minimumOrder })}</span>
                  {region.freeDeliveryThreshold && <span>{t('regions.list.freeOver', { amount: region.freeDeliveryThreshold })}</span>}
                  <span>{t('regions.list.orders', { count: region.totalOrders })}</span>
                  <span>{t('regions.list.revenue', { amount: region.totalRevenue.toLocaleString() })}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {region.clusters.map((cl) => (
                    <Badge key={cl.id} variant={cl.isActive ? 'teal' : 'yellow'} size="sm">{cl.name} {!cl.isActive && t('regions.list.inactiveBadge')}</Badge>
                  ))}
                </div>
                <p className="text-xs text-text-tertiary font-body mt-1.5 truncate">
                  {t('regions.list.activeSlots', { count: region.timeSlots.filter((ts) => ts.isActive).length })} · 
                  Sun–Thu: {region.timeSlots.find((ts) => ts.dayOfWeek === 0)?.startTime}–{region.timeSlots.find((ts) => ts.dayOfWeek === 0)?.endTime} / 
                  {region.timeSlots.find((ts) => ts.dayOfWeek === 0)?.maxOrders ?? 0} max per slot
                </p>
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

      {/* Create Zone Modal */}
      <ZoneForm
        open={zoneModal}
        onClose={() => setZoneModal(false)}
        onSave={(data) => createZone.mutate(data, { onSuccess: () => setZoneModal(false) })}
        isSaving={createZone.isPending}
      />

      {/* Fee Modal */}
      <Modal open={feeModal.open} onClose={() => setFeeModal({ ...feeModal, open: false })} title={t('regions.list.feeModalTitle', { name: feeModal.regionName })}>
        <div className="space-y-4">
          {feeModal.warehouseName && (
            <p className="text-xs text-text-secondary font-body">
              {t('regions.list.feeWarehouse', 'Warehouse: {{name}}', { name: feeModal.warehouseName })}
            </p>
          )}
          <div>
            <label className="block text-sm font-bold text-text-secondary font-body mb-1">{t('regions.list.deliveryFee')}</label>
            <input type="number" step="0.5" min="0" value={feeModal.fee} onChange={(e) => setFeeModal({ ...feeModal, fee: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input" />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setFeeModal({ ...feeModal, open: false })}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={updateFee.isPending} disabled={feeModal.warehouseId === null && !feeModal.warehouseName} onClick={() => { updateFee.mutate({ id: feeModal.regionId, deliveryFee: parseFloat(feeModal.fee), warehouseId: feeModal.warehouseId }); setFeeModal({ ...feeModal, open: false }); }}>{t('regions.list.update')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
