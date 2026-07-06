import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { driversApi } from '../api/driversApi';
import { driverKeys, useToggleDriverAvailability } from '../hooks/useDrivers';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/routes/routes';
import { ArrowLeft, User, Phone, Mail, Truck, Star, Route, Package, Calendar } from 'lucide-react';

export function DriverDetailPage() {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const id = parseInt(driverId || '0', 10);
  const { t } = useTranslation();
  const toggleAvailability = useToggleDriverAvailability();

  const { data: driver, isLoading, isError, error, refetch } = useQuery({
    queryKey: driverKeys.detail(id),
    queryFn: () => driversApi.getDriver(id),
    enabled: id > 0,
    staleTime: 30_000,
    retry: 1,
  });

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-up">
        <button onClick={() => navigate(ROUTES.DRIVERS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
          <ArrowLeft size={16} /> {t('drivers.detail.back')}
        </button>
        <ErrorState title={t('drivers.detail.errorTitle')} message={error instanceof Error ? error.message : ''} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !driver) {
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
      <button onClick={() => navigate(ROUTES.DRIVERS)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('drivers.detail.back')}
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-amber-500/10 via-amber-50 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center shadow-sm">
              <User size={28} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display truncate">{driver.name}</h1>
                <Badge variant={driver.isAvailable ? 'green' : 'red'} size="sm">
                  {driver.isAvailable ? t('drivers.list.available') : t('drivers.list.onTrip')}
                </Badge>
                {driver.rating > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                    <Star size={12} fill="currentColor" />
                    {driver.rating.toFixed(1)}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary font-body mt-1.5 flex-wrap">
                <span className="flex items-center gap-1"><Phone size={14} /> {driver.phone}</span>
                {driver.email && <span className="flex items-center gap-1 truncate"><Mail size={14} /> {driver.email}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant={driver.isAvailable ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => toggleAvailability.mutate(driver.id)}
                isLoading={toggleAvailability.isPending}
              >
                {driver.isAvailable ? t('drivers.list.setUnavailable') : t('drivers.list.setAvailable')}
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-amber-500 via-brand-primary to-amber-500 rounded-full opacity-30" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600"><Route size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('drivers.detail.totalTrips')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{driver.totalTrips}</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-green-50 text-green-600"><Package size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('drivers.detail.ordersDelivered')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{driver.totalOrders}</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600"><Star size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('drivers.detail.rating')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{driver.rating ? driver.rating.toFixed(1) : '—'}</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-brand-primary-light text-brand-primary"><Calendar size={16} /></div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-body">{t('drivers.detail.joinedDate')}</p>
              <p className="text-xl font-extrabold text-text-primary font-display">{new Date(driver.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Personal & Vehicle Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-amber-600" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('drivers.detail.personalInfo')}</h3>
          </div>
          <div className="space-y-3 text-sm font-body">
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-section-alt">
              <span className="text-text-secondary">{t('drivers.detail.fullName')}</span>
              <span className="font-bold text-text-primary">{driver.name}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-section-alt">
              <span className="text-text-secondary">{t('drivers.detail.phone')}</span>
              <span className="font-bold text-text-primary" dir="ltr">{driver.phone}</span>
            </div>
            {driver.email && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-bg-section-alt">
                <span className="text-text-secondary">{t('drivers.detail.email')}</span>
                <span className="font-bold text-text-primary">{driver.email}</span>
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-section-alt">
              <span className="text-text-secondary">{t('drivers.detail.status')}</span>
              <Badge variant={driver.isAvailable ? 'green' : 'red'} size="sm">
                {driver.isAvailable ? t('drivers.list.available') : t('drivers.list.onTrip')}
              </Badge>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={16} className="text-amber-600" />
            <h3 className="text-sm font-bold text-text-primary font-display">{t('drivers.detail.vehicleInfo')}</h3>
          </div>
          <div className="space-y-3 text-sm font-body">
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-section-alt">
              <span className="text-text-secondary">{t('drivers.detail.vehicleType')}</span>
              <span className="font-bold text-text-primary">{driver.vehicleType || '—'}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-section-alt">
              <span className="text-text-secondary">{t('drivers.detail.plateNumber')}</span>
              <span className="font-bold text-text-primary font-mono">{driver.vehiclePlate || '—'}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-section-alt">
              <span className="text-text-secondary">{t('drivers.detail.licenseNumber')}</span>
              <span className="font-bold text-text-primary">—</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-section-alt">
              <span className="text-text-secondary">{t('drivers.detail.revenue')}</span>
              <span className="font-bold text-text-primary">—</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Trips */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Route size={16} className="text-amber-600" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('drivers.detail.recentTrips')}</h3>
        </div>
        <div className="flex items-center justify-center py-10 text-text-tertiary">
          <div className="text-center">
            <Route size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-body">{t('drivers.detail.noTripsYet')}</p>
            <p className="text-xs text-text-tertiary mt-1">{t('drivers.detail.noTripsDescription')}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
