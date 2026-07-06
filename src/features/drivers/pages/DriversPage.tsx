import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useDriversPage, useToggleDriverAvailability, useApproveDriver, useRejectDriver } from '../hooks/useDrivers';
import { driversApi } from '../api/driversApi';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  Users, Truck, CheckCircle2, XCircle, Search, Filter, Star, Phone, MapPin, ThumbsUp, ThumbsDown, AlertTriangle,
} from 'lucide-react';



const VEHICLE_ICONS: Record<string, string> = {
  Van: '🚐', Truck: '🚛', Motorcycle: '🏍️', Car: '🚗',
};

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function DriversPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error, refetch } = useDriversPage();
  const toggleAvailability = useToggleDriverAvailability();
  const approveDriver = useApproveDriver();
  const rejectDriver = useRejectDriver();
  const [search, setSearch] = useState('');
  const [showPendingTab, setShowPendingTab] = useState(false);

  // Fetch pending-approval drivers
  const { data: pendingDrivers } = useQuery({
    queryKey: ['drivers', 'pending-approvals'],
    queryFn: () => driversApi.getPendingApprovals(),
    staleTime: 15_000,
  });

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
      </div>
    );
  }

  const stats = data?.stats;
  const drivers = (data?.drivers ?? []).filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.phone.includes(q) || d.vehiclePlate.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Truck size={22} className="text-brand-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('drivers.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('drivers.description')}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { key: 'total', label: t('drivers.stats.totalDrivers'), icon: Users, variant: 'teal' as const },
          { key: 'available', label: t('drivers.stats.available'), icon: CheckCircle2, variant: 'success' as const },
          { key: 'onTrip', label: t('drivers.stats.onTrip'), icon: Truck, variant: 'coral' as const },
          { key: 'inactive', label: t('drivers.stats.inactive'), icon: XCircle, variant: 'coral' as const },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                    {isLoading ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : stats?.[s.key as keyof typeof stats] ?? '—'}
                  </p>
                </div>
                <div className={cn(
                  'p-2.5 rounded-lg flex-shrink-0',
                  s.variant === 'teal' ? 'bg-brand-primary-light text-brand-primary' :
                  s.variant === 'success' ? 'bg-green-50 text-green-600' :
                  'bg-brand-accent-light text-brand-accent'
                )}>
                  <Icon size={18} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Pending Approvals Section ── */}
      {pendingDrivers && pendingDrivers.length > 0 && (
        <Card padding="lg">
          <CardHeader
            action={
              <Button variant="primary" size="sm" onClick={() => setShowPendingTab(!showPendingTab)}>
                {showPendingTab ? t('drivers.pendingApproval.hide') : t('drivers.pendingApproval.review', { count: pendingDrivers.length })}
              </Button>
            }
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertTriangle size={16} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary font-display">{t('drivers.pendingApproval.title')}</h3>
                <p className="text-xs text-text-secondary font-body">{t('drivers.pendingApproval.count', { count: pendingDrivers.length })}</p>
              </div>
            </div>
          </CardHeader>
          {showPendingTab && (
            <div className="space-y-3">
              {pendingDrivers.map((driver) => (
                <div key={driver.id} className="p-4 rounded-xl border border-amber-100 bg-amber-50/30">
                   <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-600 flex-shrink-0">
                          {driver.name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-text-primary font-body truncate">{driver.name}</span>
                          <div className="flex items-center gap-3 text-xs text-text-secondary font-body mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1"><Phone size={10} />{driver.phone}</span>
                            <span className="flex items-center gap-1"><MapPin size={10} />{driver.zoneName}</span>
                            <span>{driver.vehicleType} · {driver.vehiclePlate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                     <div className="flex items-center gap-2 ml-2 sm:ml-4 flex-shrink-0">
                       <Button
                         variant="primary" size="sm"
                         leftIcon={<ThumbsUp size={12} />}
                        isLoading={approveDriver.isPending}
                        onClick={() => approveDriver.mutate(driver.id)}
                      >
                        {t('drivers.pendingApproval.approve')}
                      </Button>
                      <Button
                        variant="secondary" size="sm"
                        leftIcon={<ThumbsDown size={12} />}
                        isLoading={rejectDriver.isPending}
                        onClick={() => rejectDriver.mutate(driver.id)}
                      >
                        {t('drivers.pendingApproval.reject')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Drivers List */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('drivers.list.allDrivers')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('drivers.list.count', { count: drivers.length })}</p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-full sm:max-w-xs relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('drivers.list.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
        ) : drivers.length === 0 ? (
          <EmptyState title={t('drivers.list.noDrivers')} description={search ? t('drivers.list.tryDifferentSearch') : t('drivers.list.addFirst')} />
        ) : (
          <div className="space-y-3">
            {drivers.map((driver) => (
              <div key={driver.id} className="p-4 rounded-xl border border-border-default/60 hover:border-brand-primary/20 hover:bg-bg-section-alt transition-all">
                 <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-primary-light flex items-center justify-center text-sm font-bold text-brand-primary flex-shrink-0">
                        {driver.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-text-primary font-body truncate">{driver.name}</span>
                          <div className={`w-2 h-2 rounded-full ${driver.isAvailable ? 'bg-green-500' : 'bg-amber-500'} flex-shrink-0`} />
                          <span className={`text-xs font-bold ${driver.isAvailable ? 'text-green-600' : 'text-amber-600'}`}>
                            {driver.isAvailable ? t('drivers.list.available') : t('drivers.list.onTrip')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-12 mt-2">
                      <div className="flex items-center gap-4 text-xs text-text-secondary font-body flex-wrap">
                        <span>{VEHICLE_ICONS[driver.vehicleType] || '🚗'} {driver.vehicleType} · {driver.vehiclePlate}</span>
                        <span className="flex items-center gap-1"><MapPin size={10} />{driver.zoneName}</span>
                        <span className="flex items-center gap-1"><Phone size={10} />{driver.phone}</span>
                        <span className="flex items-center gap-1"><Star size={10} className="text-amber-500" />{driver.rating.toFixed(1)}</span>
                      </div>
                       <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary font-body flex-wrap">
                        <span>{t('drivers.list.trips', { count: driver.totalTrips })}</span>
                        <span>{t('drivers.list.ordersDelivered', { count: driver.totalOrders })}</span>
                      </div>
                    </div>
                  </div>
                   <div className="flex items-center gap-2 ml-2 sm:ml-4 flex-shrink-0">
                     <Button
                       variant={driver.isAvailable ? 'secondary' : 'primary'}
                      size="sm"
                      isLoading={toggleAvailability.isPending}
                      onClick={() => toggleAvailability.mutate(driver.id)}
                    >
                      {driver.isAvailable ? t('drivers.list.setUnavailable') : t('drivers.list.setAvailable')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
