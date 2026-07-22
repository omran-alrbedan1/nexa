import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';
import { useDriversPage, useToggleDriverAvailability, useApproveDriver, useRejectDriver } from '../hooks/useDrivers';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListItem } from '@/components/ui/ListItem';
import {
  Users, Truck, CheckCircle2, XCircle, Clock, Search, Filter, Star, Phone, MapPin, ThumbsUp, ThumbsDown, AlertTriangle,
} from 'lucide-react';
import type { DriverApprovalStatus } from '../api/driversApi';

const STATUS_BADGE: Record<DriverApprovalStatus, 'green' | 'yellow' | 'red' | 'purple'> = {
  pending: 'purple',
  approved: 'green',
  rejected: 'red',
};

const VEHICLE_ICONS: Record<string, string> = {
  Van: '🚐', Truck: '🚛', Motorcycle: '🏍️', Car: '🚗',
};

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function DriversPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<DriverApprovalStatus | ''>('');
  const { data, isLoading, isError, error, refetch } = useDriversPage(statusFilter ? { approval_status: statusFilter as DriverApprovalStatus } : undefined);
  const toggleAvailability = useToggleDriverAvailability();
  const approveDriver = useApproveDriver();
  const rejectDriver = useRejectDriver();
  const [search, setSearch] = useState('');
  const [rejectModal, setRejectModal] = useState<{ open: boolean; driverId: number; driverName: string; reason: string }>({ open: false, driverId: 0, driverName: '', reason: '' });

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('drivers.title')}</h1>
          <p className="text-sm text-text-secondary font-body mt-1">{t('drivers.description')}</p>
        </div>
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
          <div className="flex items-center gap-3 mb-1">
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
        {[
          { key: 'total', label: t('drivers.stats.totalDrivers'), icon: Users, variant: 'teal' as const },
          { key: 'available', label: t('drivers.stats.available'), icon: CheckCircle2, variant: 'success' as const },
          { key: 'onTrip', label: t('drivers.stats.onTrip'), icon: Truck, variant: 'coral' as const },
          { key: 'inactive', label: t('drivers.stats.inactive'), icon: XCircle, variant: 'coral' as const },
          { key: 'pendingApproval', label: t('drivers.stats.pendingApproval'), icon: Clock, variant: 'warning' as const },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.key} padding="md" hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{s.label}</p>
                  <p className="text-xl font-extrabold text-text-primary font-display mt-1">
                    {isLoading ? (
                      <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      stats?.[s.key as keyof typeof stats] ?? '—'
                    )}
                  </p>
                </div>
                <div
                  className={cn(
                    'p-2.5 rounded-lg flex-shrink-0',
                    s.variant === 'teal' ? 'bg-brand-primary-light text-brand-primary' :
                    s.variant === 'success' ? 'bg-green-50 text-green-600' :
                    s.variant === 'warning' ? 'bg-amber-50 text-amber-600' :
                    'bg-brand-accent-light text-brand-accent'
                  )}
                >
                  <Icon size={18} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Drivers List */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <h3 className="text-sm font-bold text-text-primary font-display">{t('drivers.list.allDrivers')}</h3>
            <p className="text-xs text-text-secondary font-body mt-0.5">{t('drivers.list.count', { count: drivers.length })}</p>
          </div>
        </CardHeader>

        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="w-full sm:flex-1 sm:max-w-xs relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('drivers.list.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DriverApprovalStatus | '')}
              className="pl-9 pr-8 py-2 bg-bg-input border border-border-default rounded-lg text-sm font-body text-text-primary outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light transition-all appearance-none"
            >
              <option value="">{t('drivers.list.allStatuses')}</option>
              <option value="pending">{t('drivers.list.pending')}</option>
              <option value="approved">{t('drivers.list.approved')}</option>
              <option value="rejected">{t('drivers.list.rejected')}</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-xl" />
            ))}
          </div>
        ) : drivers.length === 0 ? (
          <EmptyState
            title={t('drivers.list.noDrivers')}
            description={search ? t('drivers.list.tryDifferentSearch') : t('drivers.list.addFirst')}
          />
        ) : (
          <div className="space-y-3">
            {drivers.map((driver) => (
              <ListItem
                key={driver.id}
                onClick={() => navigate(ROUTES.DRIVER_DETAIL(driver.id))}
                icon={<span className="text-sm font-bold text-brand-primary">{driver.name.charAt(0)}</span>}
                iconClassName="bg-brand-primary-light rounded-full"
                title={<span className="text-sm font-bold text-text-primary font-body truncate">{driver.name}</span>}
                badges={<>
                  <Badge variant={STATUS_BADGE[driver.approvalStatus]} size="sm">{t('drivers.status.' + driver.approvalStatus)}</Badge>
                  {driver.approvalStatus === 'approved' && (
                    <>
                      <div className={`w-2 h-2 rounded-full ${driver.isAvailable ? 'bg-green-500' : 'bg-amber-500'} flex-shrink-0`} />
                      <span className={`text-xs font-bold ${driver.isAvailable ? 'text-green-600' : 'text-amber-600'}`}>
                        {driver.isAvailable ? t('drivers.list.available') : t('drivers.list.onTrip')}
                      </span>
                    </>
                  )}
                </>}
                actions={<>
                  {driver.approvalStatus === 'pending' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<ThumbsUp size={12} />}
                        isLoading={approveDriver.isPending}
                        onClick={(e) => { e.stopPropagation(); approveDriver.mutate(driver.id); }}
                      >
                        {t('drivers.pendingApproval.approve')}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<ThumbsDown size={12} />}
                        onClick={(e) => { e.stopPropagation(); setRejectModal({ open: true, driverId: driver.id, driverName: driver.name, reason: '' }); }}
                      >
                        {t('drivers.pendingApproval.reject')}
                      </Button>
                    </>
                  )}
                  {driver.approvalStatus === 'approved' && (
                    <Button
                      variant={driver.isAvailable ? 'secondary' : 'primary'}
                      size="sm"
                      isLoading={toggleAvailability.isPending}
                      onClick={(e) => { e.stopPropagation(); toggleAvailability.mutate(driver.id); }}
                    >
                      {driver.isAvailable ? t('drivers.list.setUnavailable') : t('drivers.list.setAvailable')}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(ROUTES.DRIVER_DETAIL(driver.id)); }}>
                    {t('drivers.list.view')}
                  </Button>
                </>}
              >
                <div className="flex items-center gap-4 text-xs text-text-secondary font-body flex-wrap">
                  <span>{VEHICLE_ICONS[driver.vehicleType] || '🚗'} {driver.vehicleType} · {driver.vehiclePlate}</span>
                  <span className="flex items-center gap-1"><MapPin size={10} />{driver.zoneName}</span>
                  <span className="flex items-center gap-1"><Phone size={10} />{driver.phone}</span>
                  <span className="flex items-center gap-1"><Star size={10} className="text-amber-500" />{driver.rating ? driver.rating.toFixed(1) : '—'}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary font-body flex-wrap">
                  <span>{driver.totalTrips ? t('drivers.list.trips', { count: driver.totalTrips }) : t('drivers.list.trips', { count: '—' })}</span>
                  <span>{driver.totalOrders ? t('drivers.list.ordersDelivered', { count: driver.totalOrders }) : t('drivers.list.ordersDelivered', { count: '—' })}</span>
                </div>
              </ListItem>
            ))}
          </div>
        )}
      </Card>

      {/* Reject Modal */}
      <Modal
        open={rejectModal.open}
        onClose={() => setRejectModal({ ...rejectModal, open: false })}
        title={t('drivers.reject.title', { name: rejectModal.driverName })}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary font-body">{t('drivers.reject.description')}</p>
          </div>
          <textarea
            rows={3}
            value={rejectModal.reason}
            onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border-default rounded-lg font-body outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary-light resize-none bg-bg-input"
            placeholder={t('drivers.reject.placeholder')}
          />
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setRejectModal({ ...rejectModal, open: false })}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!rejectModal.reason.trim()}
              isLoading={rejectDriver.isPending}
              onClick={() => {
                rejectDriver.mutate({ id: rejectModal.driverId, reason: rejectModal.reason });
                setRejectModal({ ...rejectModal, open: false });
              }}
            >
              {t('drivers.reject.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
