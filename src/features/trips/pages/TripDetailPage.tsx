import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { tripsApi } from '../api/tripsApi';
import {
  useAssignDriver, useStartTrip, useCompleteTrip, useTripDetail,
  useBumpManifest, useOptimizeRoute, useRemoveOrderFromTrip, tripKeys,
} from '../hooks/useTrips';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { useFormatPrice } from '@/hooks/useFormatPrice';
import { safeFormatDate, isDateValid } from '@/utils/date';
import GoogleDriverTrackingMap from '@/components/maps/GoogleDriverTrackingMap'
import {
  ArrowLeft, Navigation, Truck, User, Calendar, Clock, MapPin,
  CheckCircle2, ShoppingCart, Warehouse, PackageCheck, ClipboardCheck,
  AlertTriangle, DollarSign, RefreshCw, Trash2, Route as RouteIcon,
} from 'lucide-react';

const STATUS_BADGE: Record<string, 'green' | 'teal' | 'yellow' | 'purple' | 'red'> = {
  scheduled: 'purple', assigned: 'yellow', accepted: 'teal',
  in_progress: 'teal', pickup_pending: 'teal', closure_pending: 'teal',
  completed: 'green', cancelled: 'red', failed: 'red',
};




function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const id = parseInt(tripId || '0', 10);
  const { t } = useTranslation();
  const STATUS_LABELS: Record<string, string> = {
    scheduled: t('trips.statusLabels.scheduled'), assigned: t('trips.statusLabels.assigned'), accepted: t('trips.statusLabels.accepted'),
    in_progress: t('trips.statusLabels.in_progress'), pickup_pending: t('trips.statusLabels.pickup_pending'),
    closure_pending: t('trips.statusLabels.closure_pending'),
    completed: t('trips.statusLabels.completed'), cancelled: t('trips.statusLabels.cancelled'), failed: t('trips.statusLabels.failed'),
  };
  const formatPrice = useFormatPrice();

  const assignDriver = useAssignDriver();
  const startTrip = useStartTrip();
  const completeTrip = useCompleteTrip();
  const bumpManifest = useBumpManifest();
  const optimizeRoute = useOptimizeRoute();
  const removeOrder = useRemoveOrderFromTrip();

  const { data: trip, isLoading, isError, error, refetch } = useTripDetail(id);

  const [assignModal, setAssignModal] = useState<{
    open: boolean; driverId: number; driverName: string;
  }>({ open: false, driverId: 0, driverName: '' });

  const { data: driversData } = useQuery({
    queryKey: [...tripKeys.all, 'available-drivers'],
    queryFn: () => tripsApi.getAvailableDrivers(),
    enabled: assignModal.open,
    staleTime: 30_000,
  });

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate(ROUTES.TRIPS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> {t('trips.detail.back')}
        </button>
        <ErrorState title={t('trips.detail.errorTitle')} message={error instanceof Error ? error.message : 'An error occurred'} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !trip) {
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

  const availableDrivers = driversData ?? [];

  return (
    <div className="space-y-6 animate-fade-up">
      <button onClick={() => navigate(ROUTES.TRIPS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('trips.detail.back')}
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <Truck size={24} className="text-brand-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">{trip.tripNumber}</h1>
                <Badge variant={trip.type === 'supplier_pickup' ? 'teal' : 'gray'} size="sm">{trip.type === 'supplier_pickup' ? t('trips.types.supplierPickup') : t('trips.types.delivery')}</Badge>
                <Badge variant={STATUS_BADGE[trip.status] || 'purple'} size="sm">{STATUS_LABELS[trip.status]}</Badge>
              </div>
              <p className="text-sm text-text-secondary font-body mt-1 truncate">
                {trip.regionName}{trip.clusterName ? ` · ${trip.clusterName}` : ''} · {trip.scheduledDate} · {trip.timeSlot}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {trip.status === 'scheduled' && !trip.driverId && (
                <Button variant="primary" size="sm" leftIcon={<User size={14} />} onClick={() => setAssignModal({ open: true, driverId: 0, driverName: '' })}>
                  {t('trips.detail.assignButton')}
                </Button>
              )}
              {(trip.status === 'scheduled' || trip.status === 'assigned') && (
                <Button variant="primary" size="sm" leftIcon={<Navigation size={14} />} isLoading={startTrip.isPending} onClick={() => startTrip.mutate(trip.id)}>
                  {t('trips.list.startTrip')}
                </Button>
              )}
              {(trip.status === 'in_progress' || trip.status === 'pickup_pending') && (
                <Button variant="primary" size="sm" leftIcon={<CheckCircle2 size={14} />} isLoading={completeTrip.isPending} onClick={() => completeTrip.mutate(trip.id)}>
                  {t('trips.list.complete')}
                </Button>
              )}
              {trip.status === 'closure_pending' && (
                <Button variant="primary" size="sm" leftIcon={<CheckCircle2 size={14} />} disabled>
                  {t('trips.list.waitingDriver')}
                </Button>
              )}
              <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} isLoading={bumpManifest.isPending} onClick={() => bumpManifest.mutate(trip.id)}>
                {t('trips.detail.bumpManifest')}
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary rounded-full opacity-30" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-brand-primary-light text-brand-primary">
              <User size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body mb-1">{t('trips.detail.driver')}</p>
              {trip.driverName ? (
                <p className="text-sm font-bold text-text-primary">{trip.driverName}</p>
              ) : (
                <p className="text-sm text-amber-600 font-bold">{t('trips.detail.unassigned')}</p>
              )}
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
              <Warehouse size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body mb-1">{t('trips.detail.region')}</p>
              <p className="text-sm font-bold text-text-primary">{trip.regionName}</p>
              <p className="text-xs text-text-secondary">{trip.clusterName}</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-brand-accent-light text-brand-accent">
              <Calendar size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body mb-1">{t('trips.detail.schedule')}</p>
              <p className="text-sm font-bold text-text-primary">{new Date(trip.scheduledDate).toLocaleDateString()}</p>
              <p className="text-xs text-text-secondary">{trip.timeSlot}</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-green-50 text-green-600">
              <ShoppingCart size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body mb-1">{t('trips.detail.stats')}</p>
              <p className="text-sm font-bold text-text-primary">{t('trips.detail.total', { count: trip.orderCount })}</p>
              <p className="text-xs text-text-secondary">{formatPrice(trip.totalValue)} · {t('trips.list.delivered', { done: trip.completedOrders, total: trip.orderCount })}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Orders on Trip */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} className="text-brand-primary" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('trips.detail.ordersOnTrip')}</h3>
            <span className="text-xs text-text-tertiary">{t('trips.detail.total', { count: trip.orderCount })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<RouteIcon size={14} />} isLoading={optimizeRoute.isPending} onClick={() => optimizeRoute.mutate(trip.id)}>
              {t('trips.detail.optimizeRoute')}
            </Button>
          </div>
        </div>
        {trip.tripOrders.length === 0 ? (
          <p className="text-sm text-text-secondary font-body">{t('trips.detail.noOrdersOnTrip')}</p>
        ) : (
          <div className="space-y-2">
            {trip.tripOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl border border-border-default/60">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary font-body">{order.customerName ?? '—'}</p>
                  <p className="text-xs text-text-secondary font-body">{order.orderNumber} · {order.deliveryStatus}</p>
                </div>
                <span className="text-sm font-extrabold text-text-primary font-display">{formatPrice(order.total)}</span>
                {trip.status !== 'completed' && trip.status !== 'cancelled' && (
                  <button
                    title={t('trips.detail.removeOrder')}
                    onClick={() => removeOrder.mutate({ tripId: trip.id, orderId: order.orderId })}
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-status-error hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-4 text-xs text-text-tertiary font-body">
          <span className="font-bold text-text-primary">{t('trips.detail.delivered', { count: trip.completedOrders })}</span>
          <span>{t('trips.detail.failed', { count: trip.failedOrders })}</span>
          <span>{t('trips.detail.pending', { count: trip.orderCount - trip.completedOrders - trip.failedOrders })}</span>
        </div>
      </Card>

      {/* Stops (supplier pickup trips) */}
      {trip.type === 'supplier_pickup' && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-brand-primary" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('trips.detail.stops')}</h3>
            <span className="text-xs text-text-tertiary">{t('trips.detail.total', { count: trip.stops.length })}</span>
          </div>
          {trip.stops.length === 0 ? (
            <p className="text-sm text-text-secondary font-body">{t('trips.detail.noStops')}</p>
          ) : (
            <div className="space-y-3">
              {trip.stops.map((stop) => (
                <div key={stop.id} className="p-3 rounded-xl border border-border-default/60">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Badge variant={stop.status === 'collected' ? 'green' : stop.status === 'arrived' ? 'teal' : 'yellow'} size="sm">
                        {t(`trips.stopStatus.${stop.status}`)}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-primary font-body">
                        {t('trips.detail.stopSequence', { seq: stop.sequence })} · {stop.supplier?.businessName ?? '—'}
                      </p>
                      <p className="text-xs text-text-secondary font-body">
                        {stop.orders.length} {t('trips.create.ordersLabel')}
                        {stop.arrivedAt ? ` · ${t('trips.detail.arrivedAt', { time: safeFormatDate(stop.arrivedAt, (d) => d.toLocaleTimeString()) })}` : ''}
                        {stop.collectedAt ? ` · ${t('trips.detail.collectedAt', { time: safeFormatDate(stop.collectedAt, (d) => d.toLocaleTimeString()) })}` : ''}
                      </p>
                    </div>
                  </div>
                  {stop.orders.length > 0 && (
                    <div className="mt-2 pl-4 border-l-2 border-border-default/60 space-y-1">
                      {stop.orders.map((o) => (
                        <p key={o.id} className="text-xs text-text-secondary font-body">
                          {o.orderNumber} · {o.customerName ?? '—'}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Pickup Status */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <PackageCheck size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('trips.detail.pickupStatus')}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('trips.detail.pickupStatus')}</p>
            <p className="text-sm font-bold text-text-primary mt-1">{trip.pickupStatus ? t(`trips.pickupStatus.${trip.pickupStatus}`) : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('trips.detail.manifestVersion')}</p>
            <p className="text-sm font-bold text-text-primary mt-1">v{trip.manifestVersion}</p>
          </div>
          {trip.pickupStartedAt && (
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('trips.detail.pickupStarted')}</p>
              <p className="text-sm font-bold text-text-primary mt-1">{safeFormatDate(trip.pickupStartedAt, (d) => d.toLocaleString())}</p>
            </div>
          )}
          {trip.pickupCompletedAt && (
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('trips.detail.pickupCompleted')}</p>
              <p className="text-sm font-bold text-text-primary mt-1">{safeFormatDate(trip.pickupCompletedAt, (d) => d.toLocaleString())}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Link to={ROUTES.PICKUP_ISSUES(trip.id)} className="inline-flex items-center gap-1.5 text-sm text-brand-primary hover:text-brand-accent font-body font-bold transition-colors">
            <AlertTriangle size={14} /> {t('trips.detail.viewPickupIssues')}
          </Link>
        </div>
      </Card>

      {/* Closure Status */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('trips.detail.closureStatus')}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('trips.detail.closureStatus')}</p>
            <p className="text-sm font-bold text-text-primary mt-1">{trip.closureStatus ? t(`trips.closureStatus.${trip.closureStatus}`) : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('trips.detail.closureVersion')}</p>
            <p className="text-sm font-bold text-text-primary mt-1">v{trip.closureVersion}</p>
          </div>
          {trip.closureStartedAt && (
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('trips.detail.closureStarted')}</p>
              <p className="text-sm font-bold text-text-primary mt-1">{safeFormatDate(trip.closureStartedAt, (d) => d.toLocaleString())}</p>
            </div>
          )}
          {trip.closedAt && (
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('trips.detail.closed')}</p>
              <p className="text-sm font-bold text-text-primary mt-1">{safeFormatDate(trip.closedAt, (d) => d.toLocaleString())}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Link to={ROUTES.COD_HANDOVERS(trip.id)} className="inline-flex items-center gap-1.5 text-sm text-brand-primary hover:text-brand-accent font-body font-bold transition-colors">
            <DollarSign size={14} /> {t('trips.detail.viewCodHandovers')}
          </Link>
        </div>
      </Card>

      {/* Timeline */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-5">
          <Clock size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('trips.detail.tripTimeline')}</h3>
        </div>
        <div className="relative pl-8">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border-default" />
          {[
            { status: 'Scheduled', time: trip.createdAt, actor: 'System' },
            ...(trip.driverName ? [{ status: 'Driver Assigned', time: trip.updatedAt, actor: trip.driverName }] : []),
            ...(trip.startedAt ? [{ status: 'Started', time: trip.startedAt, actor: 'System' }] : []),
            ...(trip.pickupStartedAt ? [{ status: 'Pickup Started', time: trip.pickupStartedAt, actor: 'System' }] : []),
            ...(trip.pickupCompletedAt ? [{ status: 'Pickup Completed', time: trip.pickupCompletedAt, actor: 'System' }] : []),
            ...(trip.closureStartedAt ? [{ status: 'Closure Started', time: trip.closureStartedAt, actor: 'System' }] : []),
            ...(trip.completedAt ? [{ status: 'Completed', time: trip.completedAt, actor: trip.driverName || 'System' }] : []),
            ...(trip.closedAt ? [{ status: 'Closed', time: trip.closedAt, actor: 'System' }] : []),
          ].map((step, idx, arr) => (
            <div key={idx} className="relative pb-10 last:pb-0">
              <div className={cn(
                'absolute -left-[23px] w-[22px] h-[22px] rounded-full border-2 border-white flex items-center justify-center',
                idx === arr.length - 1 ? 'bg-brand-primary' : 'bg-white'
              )}>
                <div className={cn('w-2 h-2 rounded-full', idx === arr.length - 1 ? 'bg-white' : 'bg-border-default')} />
              </div>
              <div>
                <span className="text-sm font-bold text-text-primary font-body">{step.status}</span>
                {isDateValid(step.time) && (
                  <span className="text-xs text-text-tertiary font-body ml-2">
                    {safeFormatDate(step.time, (d) => d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}
                  </span>
                )}
                {step.actor && (
                  <p className="text-xs text-text-secondary font-body mt-0.5">{t('trips.detail.by', { actor: step.actor })}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Notes */}
      {trip.notes && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-amber-600" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('trips.detail.notes')}</h3>
          </div>
          <p className="text-sm text-text-secondary font-body">{trip.notes}</p>
        </Card>
      )}

      {/* Monitoring Map */}
      {trip.driverName && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-brand-accent" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('orders.detail.driverTracking')}</h3>
          </div>
          <div className="rounded-xl overflow-hidden border border-border-default/60 mb-4">
            <GoogleDriverTrackingMap
              orderId={trip.tripOrders?.[0]?.orderId ?? 0}
              height="400px"
              follow
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
                <span className="text-xs font-bold text-text-primary">#{trip.tripNumber}</span>
              </div>
              <span className="text-xs text-text-secondary">{trip.driverName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-primary-light text-brand-primary font-bold">{trip.status}</span>
            </div>
            <Link to={ROUTES.DRIVER_MONITOR} className="inline-flex items-center gap-1.5 text-sm text-brand-primary hover:text-brand-accent font-bold font-body transition-colors">
              <MapPin size={14} /> {t('trips.detail.viewDriverMonitor')}
            </Link>
          </div>
        </Card>
      )}

      {/* Assign Driver Modal */}
      <Modal open={assignModal.open} onClose={() => setAssignModal({ ...assignModal, open: false })} title={t('trips.detail.assignModalTitle', { trip: trip.tripNumber })}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">{t('trips.detail.selectDriverLabel', { region: trip.regionName })}</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableDrivers.filter((d) => !d.regionName || d.regionName === trip.regionName).map((driver) => (
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
                      {driver.regionName} · {driver.isAvailable ? <span className="text-green-600 font-bold">{t('trips.detail.available')}</span> : <span className="text-amber-600 font-bold">{t('trips.detail.onTrip')}</span>}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setAssignModal({ ...assignModal, open: false })}>{t('trips.detail.cancel')}</Button>
            <Button variant="primary" size="sm" disabled={!assignModal.driverId} isLoading={assignDriver.isPending} onClick={() => {
              if (!assignModal.driverId) return;
              assignDriver.mutate({ tripId: trip.id, driverId: assignModal.driverId });
              setAssignModal({ ...assignModal, open: false });
            }}>{t('trips.detail.assignButton')}</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
