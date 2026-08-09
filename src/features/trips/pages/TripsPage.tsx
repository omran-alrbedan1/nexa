import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useTripsPage, useAssignDriver, useStartTrip, useCompleteTrip, tripKeys } from '../hooks/useTrips';
import { tripsApi } from '../api/tripsApi';
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
import { useFormatPrice } from '@/hooks/useFormatPrice';
import { Truck, Calendar, Zap, Users, CheckCircle2, ShoppingCart, Plus, Filter, Navigation, UserPlus } from 'lucide-react';
import type { DashboardTrip, TripType } from '../api/tripsApi';
import type { TripStatus } from '@/types/marketplace';

function getStatusVariant(status: string): 'green' | 'teal' | 'yellow' | 'purple' | 'red' {
  switch (status) {
    case 'completed': return 'green';
    case 'in_progress': return 'teal';
    case 'pickup_pending': return 'teal';
    case 'closure_pending': return 'teal';
    case 'assigned': return 'yellow';
    case 'scheduled': return 'purple';
    default: return 'red';
  }
}

function getTypeVariant(type: TripType): 'teal' | 'gray' {
  return type === 'supplier_pickup' ? 'teal' : 'gray';
}



export function TripsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const STATUS_LABELS: Record<string, string> = {
    scheduled: t('trips.statusLabels.scheduled'), assigned: t('trips.statusLabels.assigned'), accepted: t('trips.statusLabels.accepted'),
    in_progress: t('trips.statusLabels.in_progress'), pickup_pending: t('trips.statusLabels.pickup_pending'),
    closure_pending: t('trips.statusLabels.closure_pending'),
    completed: t('trips.statusLabels.completed'), cancelled: t('trips.statusLabels.cancelled'), failed: t('trips.statusLabels.failed'),
  };
  const formatPrice = useFormatPrice();
  const [statusFilter, setStatusFilter] = useState<TripStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<TripType | ''>('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useTripsPage({
    page,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  });
  const { data: driversData } = useQuery({
    queryKey: [...tripKeys.all, 'available-drivers'],
    queryFn: () => tripsApi.getAvailableDrivers(),
    staleTime: 30_000,
  });
  const assignDriver = useAssignDriver();
  const startTrip = useStartTrip();
  const completeTrip = useCompleteTrip();

  const [assignModal, setAssignModal] = useState<{
    open: boolean; trip: DashboardTrip | null; driverId: number; driverName: string;
  }>({ open: false, trip: null, driverId: 0, driverName: '' });
  const [scheduleView, setScheduleView] = useState(false);

  if (isError) return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('trips.title')}</h1>
        <p className="text-sm text-text-secondary font-body mt-1">{t('trips.description')}</p>
      </div>
      <ErrorState title={t('common.error')} message={error instanceof Error ? error.message : t('common.error')} onRetry={() => refetch()} />
    </div>
  );

  const stats = data?.stats;
  const trips = data?.trips ?? [];
  // schedule view sorting is client-side and applies to the current page only
  const displayTrips = scheduleView
    ? [...trips].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    : trips;
  const meta = data?.meta ?? { currentPage: 1, lastPage: 1, perPage: 15, total: 0 };
  const availableDrivers = driversData ?? [];

  const getActions = (trip: DashboardTrip) => {
    const actions: Array<{ label: string; onClick: () => void; variant: 'primary' | 'danger' | 'secondary'; icon?: React.ReactNode }> = [];
    if (trip.status === 'scheduled') {
      if (trip.driverId) actions.push({ label: t('trips.list.startTrip'), onClick: () => startTrip.mutate(trip.id), variant: 'primary', icon: <Navigation size={12} /> });
      else actions.push({ label: t('trips.list.assignDriver'), onClick: () => setAssignModal({ open: true, trip, driverId: 0, driverName: '' }), variant: 'primary', icon: <UserPlus size={12} /> });
    }
    if (trip.status === 'assigned') {
      actions.push({ label: t('trips.list.startTrip'), onClick: () => startTrip.mutate(trip.id), variant: 'primary', icon: <Navigation size={12} /> });
      actions.push({ label: t('trips.list.reassign'), onClick: () => setAssignModal({ open: true, trip, driverId: trip.driverId || 0, driverName: trip.driverName || '' }), variant: 'secondary', icon: <UserPlus size={12} /> });
    }
    if (trip.status === 'in_progress') {
      actions.push({ label: t('trips.list.complete'), onClick: () => completeTrip.mutate(trip.id), variant: 'primary', icon: <CheckCircle2 size={12} /> });
    }
    if (trip.status === 'pickup_pending' || trip.status === 'closure_pending') {
      actions.push({ label: t('trips.list.view'), onClick: () => navigate(ROUTES.TRIP_DETAIL(trip.id)), variant: 'secondary', icon: <Navigation size={12} /> });
    }
    return actions;
  };

  const openCreateTrip = () => {
    navigate(ROUTES.TRIP_CREATE);
  };

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
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{t('trips.title')}</h1>
              <p className="text-sm text-text-secondary font-body">{t('trips.description')}</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
        {[
          { key: 'total', label: t('trips.stats.totalTrips'), icon: Truck, variant: 'teal' as const },
          { key: 'scheduled', label: t('trips.stats.scheduled'), icon: Calendar, variant: 'purple' as const },
          { key: 'inProgress', label: t('trips.stats.inProgress'), icon: Zap, variant: 'coral' as const },
          { key: 'assigned', label: t('trips.stats.assigned'), icon: Users, variant: 'warning' as const },
          { key: 'completed', label: t('trips.stats.completed'), icon: CheckCircle2, variant: 'success' as const },
          { key: 'totalOrders', label: t('trips.stats.orders'), icon: ShoppingCart, variant: 'teal' as const },
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
                  s.variant === 'coral' ? 'bg-brand-accent-light text-brand-accent' :
                  s.variant === 'warning' ? 'bg-amber-50 text-amber-600' :
                  'bg-purple-50 text-purple-600'
                )}>
                  <Icon size={18} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Trips */}
      <Card padding="lg">
        <CardHeader
          action={
            <div className="flex items-center gap-2">
              <Button variant={scheduleView ? 'primary' : 'secondary'} size="sm" onClick={() => setScheduleView(!scheduleView)}>{scheduleView ? t('trips.list.listView') : t('trips.list.scheduleView')}</Button>
              <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreateTrip}>{t('trips.list.newTrip')}</Button>
            </div>
          }
        >
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('trips.title')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('trips.list.totalValue', { amount: (stats?.totalValue ?? 0).toLocaleString() })} · {t('trips.list.avgCompletion', { rate: stats?.avgCompletionRate ?? 0 })}</p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-5">
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as TripStatus | '');
                setPage(1);
              }}
              className="pl-9 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all appearance-none"
            >
              <option value="">{t('trips.list.allStatuses')}</option>
              <option value="scheduled">{t('trips.stats.scheduled')}</option>
              <option value="assigned">{t('trips.stats.assigned')}</option>
              <option value="in_progress">{t('trips.stats.inProgress')}</option>
              <option value="pickup_pending">{t('trips.statusLabels.pickup_pending')}</option>
              <option value="closure_pending">{t('trips.statusLabels.closure_pending')}</option>
              <option value="completed">{t('trips.stats.completed')}</option>
              <option value="cancelled">{STATUS_LABELS.cancelled}</option>
            </select>
          </div>
          <div className="relative">
            <Truck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as TripType | '');
                setPage(1);
              }}
              className="pl-9 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all appearance-none"
            >
              <option value="">{t('trips.list.allTypes')}</option>
              <option value="delivery">{t('trips.types.delivery')}</option>
              <option value="supplier_pickup">{t('trips.types.supplierPickup')}</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1,2,3,4].map((i) => <div key={i} className="h-22 bg-gray-100 rounded-xl" />)}</div>
        ) : displayTrips.length === 0 ? (
          <EmptyState title={t('trips.list.noTrips')} description={statusFilter ? t('trips.list.noFilterMatch') : t('trips.list.createFirst')} />
        ) : (
          <div className="space-y-2">
            {displayTrips.map((trip) => (
              <ListItem
                key={trip.id}
                onClick={() => navigate(ROUTES.TRIP_DETAIL(trip.id))}
                icon={<Truck size={16} className="text-brand-primary" />}
                title={<span className="text-sm font-bold text-text-primary font-body truncate flex items-center gap-2">{trip.tripNumber}<Badge variant={getTypeVariant(trip.type)} size="sm">{trip.type === 'supplier_pickup' ? t('trips.types.supplierPickup') : t('trips.types.delivery')}</Badge></span>}
                badges={<Badge variant={getStatusVariant(trip.status)} size="sm">{STATUS_LABELS[trip.status]}</Badge>}
                actions={getActions(trip).map((action, i) => (
                  <Button key={i} variant={action.variant} size="sm" leftIcon={action.icon} onClick={(e) => { e.stopPropagation(); action.onClick(); }}>
                    {action.label}
                  </Button>
                ))}
              >
                <p className="text-xs text-text-secondary font-body truncate">
                  {trip.regionName} · {trip.clusterName} · {trip.scheduledDate} · {trip.timeSlot}
                </p>
                {trip.type === 'supplier_pickup' && trip.supplierNames.length > 0 && (
                  <p className="text-xs text-text-secondary font-body truncate mt-0.5">
                    {t('trips.list.suppliers')}: <span className="font-bold text-text-primary">{trip.supplierNames.join(', ')}</span>
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary font-body flex-wrap">
                  <span>
                    {t('trips.list.driver')}{' '}
                    {trip.driverName ? (
                      <span className="font-bold text-text-primary">{trip.driverName}</span>
                    ) : (
                      <span className="text-status-error font-bold">{t('trips.list.unassigned')}</span>
                    )}
                  </span>
                  <span>{trip.orderCount} {t('trips.stats.orders').toLowerCase()} · <span className="font-bold text-text-primary">{formatPrice(trip.totalValue)}</span></span>
                  {trip.status === 'in_progress' && <span>{t('trips.list.delivered', { done: trip.completedOrders, total: trip.orderCount })}</span>}
                  {trip.notes && <span className="text-amber-600 truncate max-w-[200px]">{trip.notes}</span>}
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

      {/* Assign Driver Modal */}
      <Modal open={assignModal.open} onClose={() => setAssignModal({ ...assignModal, open: false })} title={t('trips.list.assignModalTitle', { trip: assignModal.trip?.tripNumber || '' })}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">{t('trips.list.selectDriver', { region: assignModal.trip?.regionName || '', slot: assignModal.trip?.timeSlot || '' })}</p>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {availableDrivers.map((driver) => (
              <button
                key={driver.id}
                onClick={() => setAssignModal({ ...assignModal, driverId: driver.id, driverName: driver.name })}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl border transition-all font-body',
                  assignModal.driverId === driver.id
                    ? 'border-brand-primary bg-brand-primary-light'
                    : 'border-border-default hover:border-brand-primary/30 hover:bg-bg-section-alt'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-text-secondary">
                    {driver.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{driver.name}</p>
                    <p className="text-xs text-text-secondary">
                      {[driver.regionName, driver.phone].filter(Boolean).join(' · ')}
                      {driver.regionName || driver.phone ? ' · ' : ''}
                      {driver.isAvailable ? <span className="text-status-success font-bold">Available</span> : <span className="text-status-error font-bold">On Trip</span>}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setAssignModal({ ...assignModal, open: false })}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" disabled={!assignModal.driverId} isLoading={assignDriver.isPending} onClick={() => {
              if (!assignModal.trip || !assignModal.driverId) return;
              assignDriver.mutate({ tripId: assignModal.trip.id, driverId: assignModal.driverId });
              setAssignModal({ ...assignModal, open: false });
            }}>{t('trips.list.assignButton')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
