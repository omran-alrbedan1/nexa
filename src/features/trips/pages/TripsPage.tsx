import { useState } from 'react';
import { useTripsPage, useAssignDriver, useStartTrip, useCompleteTrip } from '../hooks/useTrips';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToastStore } from '@/stores/toastStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { Truck, Calendar, Zap, Users, CheckCircle2, ShoppingCart, Plus, Filter, Navigation, UserPlus } from 'lucide-react';
import type { DashboardTrip } from '../api/tripsApi';
import type { TripStatus } from '@/types/marketplace';

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled', assigned: 'Assigned', accepted: 'Accepted', in_progress: 'In Progress',
  completed: 'Completed', cancelled: 'Cancelled', failed: 'Failed',
};

function getStatusVariant(status: string): 'green' | 'teal' | 'yellow' | 'purple' | 'red' {
  switch (status) {
    case 'completed': return 'green';
    case 'in_progress': return 'teal';
    case 'assigned': return 'yellow';
    case 'scheduled': return 'purple';
    default: return 'red';
  }
}

const STAT_CONFIG = [
  { key: 'total', label: 'Total Trips', icon: Truck, variant: 'teal' as const },
  { key: 'scheduled', label: 'Scheduled', icon: Calendar, variant: 'purple' as const },
  { key: 'inProgress', label: 'In Progress', icon: Zap, variant: 'coral' as const },
  { key: 'assigned', label: 'Assigned', icon: Users, variant: 'warning' as const },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, variant: 'success' as const },
  { key: 'totalOrders', label: 'Orders', icon: ShoppingCart, variant: 'teal' as const },
];

export function TripsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useTripsPage();
  const assignDriver = useAssignDriver();
  const startTrip = useStartTrip();
  const completeTrip = useCompleteTrip();

  const [assignModal, setAssignModal] = useState<{
    open: boolean; trip: DashboardTrip | null; driverId: number; driverName: string;
  }>({ open: false, trip: null, driverId: 0, driverName: '' });
  const [statusFilter, setStatusFilter] = useState<TripStatus | ''>('');

  if (isError) return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary font-display">Trips</h1>
        <p className="text-sm text-text-secondary font-body mt-1">Manage delivery trips, driver assignments, and tracking</p>
      </div>
      <ErrorState title="Failed to load trips" message={error instanceof Error ? error.message : 'An error occurred'} onRetry={() => refetch()} />
    </div>
  );

  const stats = data?.stats;
  const trips = (data?.trips ?? []).filter((t) => !statusFilter || t.status === statusFilter);
  const availableDrivers = data?.availableDrivers ?? [];

  const getActions = (trip: DashboardTrip) => {
    const actions: Array<{ label: string; onClick: () => void; variant: 'primary' | 'danger' | 'secondary'; icon?: React.ReactNode }> = [];
    if (trip.status === 'scheduled') {
      if (trip.driverId) actions.push({ label: 'Start Trip', onClick: () => startTrip.mutate(trip.id), variant: 'primary', icon: <Navigation size={12} /> });
      else actions.push({ label: 'Assign Driver', onClick: () => setAssignModal({ open: true, trip, driverId: 0, driverName: '' }), variant: 'primary', icon: <UserPlus size={12} /> });
    }
    if (trip.status === 'assigned') {
      actions.push({ label: 'Start Trip', onClick: () => startTrip.mutate(trip.id), variant: 'primary', icon: <Navigation size={12} /> });
      actions.push({ label: 'Reassign', onClick: () => setAssignModal({ open: true, trip, driverId: trip.driverId || 0, driverName: trip.driverName || '' }), variant: 'secondary', icon: <UserPlus size={12} /> });
    }
    if (trip.status === 'in_progress') {
      actions.push({ label: 'Complete', onClick: () => completeTrip.mutate(trip.id), variant: 'primary', icon: <CheckCircle2 size={12} /> });
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
              <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">Trips</h1>
              <p className="text-sm text-text-secondary font-body">Manage delivery trips, driver assignments, and tracking</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
        {STAT_CONFIG.map((s) => {
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
              <Button variant="secondary" size="sm" onClick={() => useToastStore.getState().addToast('info', 'Trip schedule view coming soon')}>Schedule View</Button>
              <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreateTrip}>New Trip</Button>
            </div>
          }
        >
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">Delivery Trips</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{stats?.totalValue?.toLocaleString()} SAR total value · {stats?.avgCompletionRate}% avg completion</p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-5">
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TripStatus | '')}
              className="pl-9 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">{[1,2,3,4].map((i) => <div key={i} className="h-22 bg-gray-100 rounded-xl" />)}</div>
        ) : trips.length === 0 ? (
          <EmptyState title="No trips" description={statusFilter ? 'No trips match the filter' : 'Create your first delivery trip'} />
        ) : (
          <div className="space-y-2">
            {trips.map((trip) => (
              <div key={trip.id} onClick={() => navigate(ROUTES.TRIP_DETAIL(trip.id))} className="flex items-center justify-between py-3.5 px-4 rounded-xl border border-border-default/60 hover:border-brand-primary/20 hover:bg-bg-section-alt transition-all group cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary-light flex items-center justify-center flex-shrink-0">
                      <Truck size={14} className="text-brand-primary" />
                    </div>
                    <span className="text-sm font-bold text-text-primary font-body group-hover:text-brand-primary transition-colors">{trip.tripNumber}</span>
                    <Badge variant={getStatusVariant(trip.status)} size="sm">{STATUS_LABELS[trip.status]}</Badge>
                  </div>
                  <p className="text-xs text-text-secondary font-body mt-1.5 ml-10">
                    {trip.regionName} · {trip.clusterName} · {trip.scheduledDate} · {trip.timeSlot}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary font-body ml-10">
                    <span>Driver: {trip.driverName ? <span className="font-bold text-text-primary">{trip.driverName}</span> : <span className="text-status-error font-bold">Unassigned</span>}</span>
                    <span>{trip.orderCount} orders · <span className="font-bold text-text-primary">{trip.totalValue.toLocaleString()} SAR</span></span>
                    {trip.status === 'in_progress' && <span>{trip.completedOrders}/{trip.orderCount} delivered</span>}
                    {trip.notes && <span className="text-amber-600 truncate max-w-[200px]">{trip.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {getActions(trip).map((action, i) => (
                    <Button key={i} variant={action.variant} size="sm" leftIcon={action.icon} onClick={(e) => { e.stopPropagation(); action.onClick(); }}>
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Assign Driver Modal */}
      <Modal open={assignModal.open} onClose={() => setAssignModal({ ...assignModal, open: false })} title={`Assign Driver — ${assignModal.trip?.tripNumber}`}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-body">Select a driver for {assignModal.trip?.regionName} ({assignModal.trip?.timeSlot})</p>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {availableDrivers.filter((d) => !assignModal.trip || !d.regionName || d.regionName === assignModal.trip.regionName).map((driver) => (
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
                    <p className="text-xs text-text-secondary">{driver.regionName} · {driver.isAvailable ? <span className="text-status-success font-bold">Available</span> : <span className="text-status-error font-bold">On Trip</span>}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setAssignModal({ ...assignModal, open: false })}>Cancel</Button>
            <Button variant="primary" size="sm" disabled={!assignModal.driverId} isLoading={assignDriver.isPending} onClick={() => {
              if (!assignModal.trip || !assignModal.driverId) return;
              assignDriver.mutate({ tripId: assignModal.trip.id, driverId: assignModal.driverId, driverName: assignModal.driverName });
              setAssignModal({ ...assignModal, open: false });
            }}>Assign Driver</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
