import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { regionsApi, type Region } from '../api/regionsApi';
import { useToggleRegionActive, useUpdateDeliveryFee } from '../hooks/useRegions';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { ArrowLeft, MapPin, Globe, Layers, Clock, DollarSign, CheckCircle2, XCircle, Map, Zap, ShoppingCart, Calendar } from 'lucide-react';
import { regionKeys } from '../hooks/useRegions';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function RegionDetailPage() {
  const { regionId } = useParams<{ regionId: string }>();
  const navigate = useNavigate();
  const id = parseInt(regionId || '0', 10);
  const queryClient = useQueryClient();
  const toggleActive = useToggleRegionActive();
  const updateFee = useUpdateDeliveryFee();

  const { data: region, isLoading, isError, error, refetch } = useQuery<Region>({
    queryKey: regionKeys.detail(id),
    queryFn: () => regionsApi.getRegion(id),
    enabled: id > 0,
    staleTime: 30_000,
    retry: 1,
  });

  const [feeModal, setFeeModal] = useState<{ open: boolean; fee: string }>({ open: false, fee: '' });

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate(ROUTES.REGIONS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> Back to Regions
        </button>
        <ErrorState title="Failed to load region" message={error instanceof Error ? error.message : 'An error occurred'} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !region) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <button onClick={() => navigate(ROUTES.REGIONS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> Back to Regions
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
                <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{region.name}</h1>
                <span className="text-sm text-text-tertiary">{region.nameAr}</span>
                {region.isActive ? <Badge variant="green" size="sm">Active</Badge> : <Badge variant="red" size="sm">Inactive</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="secondary" size="sm" leftIcon={<DollarSign size={14} />} onClick={() => setFeeModal({ open: true, fee: String(region.deliveryFee) })}>
                Update Fee
              </Button>
              <Button variant={region.isActive ? 'secondary' : 'primary'} size="sm" isLoading={toggleActive.isPending} onClick={() => toggleActive.mutate(region.id)}>
                {region.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-purple-500 via-brand-primary to-purple-500 rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-brand-primary-light text-brand-primary"><DollarSign size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">Delivery Fee</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{region.deliveryFee} SAR</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600"><CheckCircle2 size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">Min Order</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{region.minimumOrder} SAR</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-green-50 text-green-600"><Zap size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">Free Delivery</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{region.freeDeliveryThreshold ? `${region.freeDeliveryThreshold} SAR` : '—'}</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-brand-accent-light text-brand-accent"><ShoppingCart size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">Orders</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{region.totalOrders}</p>
              <p className="text-xs text-text-tertiary">{region.totalRevenue.toLocaleString()} SAR</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Clusters + Time Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clusters */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-purple-600" />
            <h3 className="text-sm font-bold text-text-primary font-display">Clusters</h3>
            <span className="text-xs text-text-tertiary">({region.clusters.length})</span>
          </div>
          {region.clusters.length === 0 ? (
            <p className="text-sm text-text-tertiary font-body">No clusters configured</p>
          ) : (
            <div className="space-y-2">
              {region.clusters.map((cl) => (
                <div key={cl.id} className="flex items-center justify-between p-3 rounded-xl border border-border-default/60">
                  <div className="flex items-center gap-2.5">
                    <MapPin size={14} className="text-purple-600" />
                    <div>
                      <p className="text-sm font-bold text-text-primary font-body">{cl.name}</p>
                      <p className="text-xs text-text-tertiary">{cl.nameAr}</p>
                    </div>
                  </div>
                  {cl.isActive ? <Badge variant="green" size="sm">Active</Badge> : <Badge variant="red" size="sm">Inactive</Badge>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Time Slots */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-purple-600" />
            <h3 className="text-sm font-bold text-text-primary font-display">Time Slots</h3>
            <span className="text-xs text-text-tertiary">({region.timeSlots.filter((ts) => ts.isActive).length} active)</span>
          </div>
          {region.timeSlots.length === 0 ? (
            <p className="text-sm text-text-tertiary font-body">No time slots configured</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {region.timeSlots.map((ts) => (
                <div key={ts.id} className={`flex items-center justify-between p-2.5 rounded-lg text-sm font-body ${ts.isActive ? '' : 'opacity-50'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-text-secondary w-16">{DAY_NAMES[ts.dayOfWeek]?.slice(0, 3)}</span>
                    <span className="text-text-primary">{ts.startTime}–{ts.endTime}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-tertiary">max {ts.maxOrders}</span>
                    {ts.isActive ? <CheckCircle2 size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-400" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Working Days */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-purple-600" />
          <h3 className="text-sm font-bold text-text-primary font-display">Working Days</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {DAY_NAMES.map((day, idx) => {
            const hasSlot = region.timeSlots.some((ts) => ts.dayOfWeek === idx && ts.isActive);
            return (
              <span key={day} className={`px-3 py-1.5 rounded-lg text-xs font-bold font-body ${
                hasSlot ? 'bg-brand-primary-light text-brand-primary' : 'bg-gray-100 text-text-tertiary'
              }`}>
                {day.slice(0, 3)}
              </span>
            );
          })}
        </div>
      </Card>

      {/* Fee Modal */}
      <Modal open={feeModal.open} onClose={() => setFeeModal({ ...feeModal, open: false })} title={`Update Delivery Fee — ${region.name}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-text-secondary font-body mb-1">Delivery Fee (SAR)</label>
            <input type="number" step="0.5" min="0" value={feeModal.fee} onChange={(e) => setFeeModal({ ...feeModal, fee: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light bg-bg-input" />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setFeeModal({ ...feeModal, open: false })}>Cancel</Button>
            <Button variant="primary" size="sm" isLoading={updateFee.isPending} onClick={() => {
              updateFee.mutate({ id, deliveryFee: parseFloat(feeModal.fee) });
              setFeeModal({ ...feeModal, open: false });
            }}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
