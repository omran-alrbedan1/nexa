import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { tripsApi, type DashboardTrip } from '../api/tripsApi';
import { useAssignDriver, useStartTrip, useCompleteTrip, tripKeys } from '../hooks/useTrips';
import { deliveryMonitorApi } from '@/features/delivery-monitor/api/deliveryMonitorApi';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { useFormatPrice } from '@/hooks/useFormatPrice';
import { useToastStore } from '@/stores/toastStore';
import { extractErrorMessage } from '@/lib/apiHelpers';
import {
  ArrowLeft, Truck, User, Calendar, Clock, MapPin, Navigation,
  CheckCircle2, ShoppingCart, Warehouse, Send, ChevronDown, ChevronRight,
} from 'lucide-react';

const STATUS_BADGE: Record<string, 'green' | 'teal' | 'yellow' | 'purple' | 'red'> = {
  scheduled: 'purple', assigned: 'yellow', accepted: 'teal',
  in_progress: 'teal', completed: 'green', cancelled: 'red', failed: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled', assigned: 'Assigned', accepted: 'Accepted',
  in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled', failed: 'Failed',
};

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const id = parseInt(tripId || '0', 10);
  const { t } = useTranslation();
  const formatPrice = useFormatPrice();

  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const assignDriver = useAssignDriver();
  const startTrip = useStartTrip();
  const completeTrip = useCompleteTrip();

  const [simOpen, setSimOpen] = useState(false);
  const [simLat, setSimLat] = useState('24.713552');
  const [simLng, setSimLng] = useState('46.675297');
  const [simLoading, setSimLoading] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const locationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doSimAction = async (key: string, fn: () => Promise<unknown>) => {
    setSimLoading(key);
    try {
      await fn();
      queryClient.invalidateQueries({ queryKey: [...tripKeys.all, 'detail', id] });
      if (key === 'location') {
        setLastSent(new Date().toLocaleTimeString());
      }
    } catch (err: unknown) {
      addToast('error', extractErrorMessage(err));
    } finally {
      setSimLoading(null);
    }
  };

  const sendLocation = () => {
    const lat = parseFloat(simLat);
    const lng = parseFloat(simLng);
    if (isNaN(lat) || isNaN(lng)) {
      addToast('error', 'Invalid coordinates');
      return;
    }
    doSimAction('location', () => deliveryMonitorApi.simulateLocation(id, { latitude: lat, longitude: lng }));
  };

  const simulateStartTrip = () => doSimAction('start-trip', () => deliveryMonitorApi.startTrip(id));
  const simulateStartDelivery = (orderId: number) => doSimAction(`start-${orderId}`, () => deliveryMonitorApi.startDelivery(orderId));
  const simulateDeliver = (orderId: number) => doSimAction(`deliver-${orderId}`, () => deliveryMonitorApi.deliver(orderId));
  const simulateFail = (orderId: number) => doSimAction(`fail-${orderId}`, () => deliveryMonitorApi.fail(orderId));

  const sendLocationContinuously = () => {
    if (locationTimerRef.current) return;
    sendLocation();
    locationTimerRef.current = setInterval(sendLocation, 3000);
    addToast('info', 'Sending location every 3s. Click again to stop.');
  };

  const stopContinuousLocation = () => {
    if (locationTimerRef.current) {
      clearInterval(locationTimerRef.current);
      locationTimerRef.current = null;
      addToast('info', 'Continuous location stopped.');
    }
  };

  useEffect(() => {
    return () => {
      if (locationTimerRef.current) clearInterval(locationTimerRef.current);
    };
  }, []);

  const { data: trip, isLoading, isError, error, refetch } = useQuery<DashboardTrip>({
    queryKey: [...tripKeys.all, 'detail', id],
    queryFn: () => tripsApi.getTrip(id),
    enabled: id > 0,
    staleTime: 30_000,
    retry: 1,
  });

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
                <Badge variant={STATUS_BADGE[trip.status] || 'purple'} size="sm">{STATUS_LABELS[trip.status]}</Badge>
              </div>
              <p className="text-sm text-text-secondary font-body mt-1 truncate">
                {trip.regionName}{trip.clusterName ? ` · ${trip.clusterName}` : ''} · {trip.scheduledDate} · {trip.timeSlot}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
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
              {trip.status === 'in_progress' && (
                <Button variant="primary" size="sm" leftIcon={<CheckCircle2 size={14} />} isLoading={completeTrip.isPending} onClick={() => completeTrip.mutate(trip.id)}>
                  {t('trips.list.complete')}
                </Button>
              )}
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
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('trips.detail.ordersOnTrip')}</h3>
          <span className="text-xs text-text-tertiary">{t('trips.detail.total', { count: trip.orderCount })}</span>
        </div>
        <p className="text-sm text-text-secondary font-body">
          {t('trips.detail.orderDetailsPlaceholder')}
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-text-tertiary font-body">
          <span className="font-bold text-text-primary">{t('trips.detail.delivered', { count: trip.completedOrders })}</span>
          <span>{t('trips.detail.failed', { count: trip.failedOrders })}</span>
          <span>{t('trips.detail.pending', { count: trip.orderCount - trip.completedOrders - trip.failedOrders })}</span>
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
            ...(trip.completedAt ? [{ status: 'Completed', time: trip.completedAt, actor: trip.driverName || 'System' }] : []),
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
                <span className="text-xs text-text-tertiary font-body ml-2">
                  {new Date(step.time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <p className="text-xs text-text-secondary font-body mt-0.5">{t('trips.detail.by', { actor: step.actor })}</p>
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

      {/* Simulate Driver */}
      <Card padding="none" className="overflow-hidden">
        <button
          onClick={() => setSimOpen(!simOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-bg-section-alt transition-colors"
        >
          <div className="flex items-center gap-2">
            <Navigation size={16} className="text-brand-accent" />
            <h3 className="text-sm font-bold text-text-primary font-display">Simulate Driver</h3>
            {lastSent && (
              <span className="text-[10px] text-green-600 font-medium">Last sent: {lastSent}</span>
            )}
          </div>
          {simOpen ? <ChevronDown size={16} className="text-text-tertiary" /> : <ChevronRight size={16} className="text-text-tertiary" />}
        </button>

        {simOpen && (
          <div className="px-4 pb-4 space-y-4 border-t border-border-default/60 pt-4">
            {/* Location Simulator */}
            <div className="bg-bg-section-alt p-3 rounded-xl space-y-2">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Location Simulator</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.000001"
                  value={simLat}
                  onChange={(e) => setSimLat(e.target.value)}
                  placeholder="Latitude"
                  className="w-full px-2 py-1.5 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
                />
                <input
                  type="number"
                  step="0.000001"
                  value={simLng}
                  onChange={(e) => setSimLng(e.target.value)}
                  placeholder="Longitude"
                  className="w-full px-2 py-1.5 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="accent"
                  size="sm"
                  isLoading={simLoading === 'location'}
                  onClick={sendLocation}
                  leftIcon={<Send size={12} />}
                >
                  Send Location
                </Button>
                <Button
                  variant={locationTimerRef.current ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={locationTimerRef.current ? stopContinuousLocation : sendLocationContinuously}
                >
                  {locationTimerRef.current ? 'Stop Continuous' : 'Continuous'}
                </Button>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                <MapPin size={10} />
                <span>Broadcasts to <code className="font-mono bg-gray-100 px-1 rounded">order.tracking.*</code> channels via <code className="font-mono bg-gray-100 px-1 rounded">.location.updated</code></span>
              </div>
            </div>

            {/* Start Trip */}
            {['assigned', 'accepted', 'scheduled'].includes(trip.status) && (
              <Button
                variant="primary"
                size="sm"
                isLoading={simLoading === 'start-trip'}
                onClick={simulateStartTrip}
                leftIcon={<Navigation size={12} />}
              >
                Start Trip
              </Button>
            )}

            {/* Order Actions */}
            {trip.tripOrders.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Orders</p>
                {trip.tripOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-border-default/60"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary truncate">{order.orderNumber}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-text-secondary truncate">{order.customerName || '—'}</p>
                        <Badge
                          variant={
                            order.deliveryStatus === 'delivered' ? 'green'
                            : order.deliveryStatus === 'failed' ? 'red'
                            : 'yellow'
                          }
                          size="sm"
                        >
                          {order.deliveryStatus.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {order.deliveryStatus === 'pending' && trip.status === 'in_progress' && (
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={simLoading === `start-${order.id}`}
                          onClick={() => simulateStartDelivery(order.orderId)}
                        >
                          Start Delivery
                        </Button>
                      )}
                      {order.deliveryStatus === 'out_for_delivery' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={simLoading === `deliver-${order.id}`}
                            onClick={() => simulateDeliver(order.orderId)}
                          >
                            Deliver
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            isLoading={simLoading === `fail-${order.id}`}
                            onClick={() => simulateFail(order.orderId)}
                          >
                            Fail
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

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
