import { useState } from 'react';
import { useRegionsPage, useToggleRegionActive, useUpdateDeliveryFee } from '../hooks/useRegions';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { MapPin, CheckCircle2, Layers, ShoppingCart, TrendingUp, Map, Globe, DollarSign } from 'lucide-react';

const STAT_CONFIG = [
  { key: 'totalRegions', label: 'Total Regions', icon: Globe, variant: 'teal' as const },
  { key: 'activeRegions', label: 'Active', icon: CheckCircle2, variant: 'success' as const },
  { key: 'totalClusters', label: 'Clusters', icon: Layers, variant: 'purple' as const },
  { key: 'totalOrders', label: 'Total Orders', icon: ShoppingCart, variant: 'coral' as const },
  { key: 'avgDeliveryFee', label: 'Avg Fee', icon: DollarSign, variant: 'warning' as const, suffix: ' SAR' },
];

export function RegionsPage() {
  const { data, isLoading, isError, error, refetch } = useRegionsPage();
  const toggleActive = useToggleRegionActive();
  const updateFee = useUpdateDeliveryFee();

  const [feeModal, setFeeModal] = useState<{ open: boolean; regionId: number; regionName: string; fee: string }>({ open: false, regionId: 0, regionName: '', fee: '' });

  if (isError) return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary font-display">Regions</h1>
        <p className="text-sm text-text-secondary font-body mt-1">Manage delivery regions, clusters, time slots, and pricing</p>
      </div>
      <ErrorState title="Failed to load regions" message={error instanceof Error ? error.message : 'An error occurred'} onRetry={() => refetch()} />
    </div>
  );

  const stats = data?.stats;
  const regions = data?.regions ?? [];

  const openFeeModal = (region: typeof regions[0]) => {
    setFeeModal({ open: true, regionId: region.id, regionName: region.name, fee: region.deliveryFee.toString() });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-purple-500/10 via-purple-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Map size={22} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">Regions</h1>
              <p className="text-sm text-text-secondary font-body">Manage delivery regions, clusters, time slots, and pricing</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-purple-500 via-brand-primary to-purple-500 rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        {STAT_CONFIG.map((s) => {
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
            <h3 className="text-sm font-bold text-text-primary font-display">Delivery Regions</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{stats?.totalRevenue?.toLocaleString()} SAR total revenue</p>
          </div>
        </CardHeader>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1,2,3].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}</div>
        ) : regions.length === 0 ? (
          <EmptyState title="No regions configured" description="Add your first delivery region to start operations" />
        ) : (
          <div className="space-y-3">
            {regions.map((region) => (
              <div key={region.id} className="p-4 rounded-xl border border-border-default/60 hover:border-brand-primary/20 hover:bg-bg-section-alt transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-brand-primary-light flex items-center justify-center flex-shrink-0">
                        <MapPin size={16} className="text-brand-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-text-primary font-body">{region.name}</span>
                          <span className="text-xs text-text-tertiary">{region.nameAr}</span>
                          {region.isActive ? <Badge variant="green" size="sm">Active</Badge> : <Badge variant="red" size="sm">Inactive</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="ml-11 mt-2">
                      <div className="flex items-center gap-4 text-xs text-text-secondary font-body flex-wrap">
                        <span>Fee: <span className="font-bold text-text-primary">{region.deliveryFee} SAR</span></span>
                        <span>Min: <span className="font-bold text-text-primary">{region.minimumOrder} SAR</span></span>
                        {region.freeDeliveryThreshold && <span>Free over: <span className="font-bold text-text-primary">{region.freeDeliveryThreshold} SAR</span></span>}
                        <span>Orders: <span className="font-bold text-text-primary">{region.totalOrders}</span></span>
                        <span>Revenue: <span className="font-bold text-brand-primary">{region.totalRevenue.toLocaleString()} SAR</span></span>
                      </div>
                      {/* Clusters */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {region.clusters.map((cl) => (
                          <Badge key={cl.id} variant={cl.isActive ? 'teal' : 'yellow'} size="sm">{cl.name} {!cl.isActive && '(inactive)'}</Badge>
                        ))}
                      </div>
                      {/* Time slots summary */}
                      <p className="text-xs text-text-tertiary font-body mt-1.5">
                        {region.timeSlots.filter((ts) => ts.isActive).length} active time slots · 
                        Sun–Thu: {region.timeSlots.find((ts) => ts.dayOfWeek === 0)?.startTime}–{region.timeSlots.find((ts) => ts.dayOfWeek === 0)?.endTime} / 
                        {region.timeSlots.find((ts) => ts.dayOfWeek === 0)?.maxOrders ?? 0} max per slot
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <Button variant="secondary" size="sm" leftIcon={<DollarSign size={12} />} onClick={() => openFeeModal(region)}>Fee</Button>
                    <Button variant={region.isActive ? 'secondary' : 'primary'} size="sm" isLoading={toggleActive.isPending} onClick={() => toggleActive.mutate(region.id)}>
                      {region.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Fee Modal */}
      <Modal open={feeModal.open} onClose={() => setFeeModal({ ...feeModal, open: false })} title={`Update Delivery Fee — ${feeModal.regionName}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-text-secondary font-body mb-1">Delivery Fee (SAR)</label>
            <input type="number" step="0.5" min="0" value={feeModal.fee} onChange={(e) => setFeeModal({ ...feeModal, fee: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input" />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setFeeModal({ ...feeModal, open: false })}>Cancel</Button>
            <Button variant="primary" size="sm" isLoading={updateFee.isPending} onClick={() => { updateFee.mutate({ id: feeModal.regionId, deliveryFee: parseFloat(feeModal.fee) }); setFeeModal({ ...feeModal, open: false }); }}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
