import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { tripsApi } from '@/features/trips/api/tripsApi';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { env } from '@/config/env';
import { ROUTES } from '@/routes/routes';
import { MapPin, Navigation, Truck } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem',
};

const defaultCenter = { lat: 24.713552, lng: 46.675297 };

export default function DriverMonitorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['trips', 'active'],
    queryFn: () => tripsApi.getPageData(),
    refetchInterval: 30_000,
  });

  const activeTrips = useMemo(
    () => (pageData?.trips ?? []).filter((t) =>
      ['assigned', 'accepted', 'in_progress'].includes(t.status)
    ),
    [pageData],
  );

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: env.GOOGLE_MAPS_API_KEY,
  });

  const selectedTrip = activeTrips.find((t) => t.id === selectedTripId);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">
            {t('nav.driverMonitor')}
          </h1>
          <p className="text-sm text-text-secondary font-body mt-1">
            {t('drivers.monitor.description')}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : activeTrips.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary font-body">
            {t('drivers.monitor.noActiveTrips')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trip List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Truck size={16} className="text-brand-primary" />
              <h3 className="text-sm font-bold text-text-primary font-display">
                {t('drivers.monitor.activeTrips', { count: activeTrips.length })}
              </h3>
            </div>
            {activeTrips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => {
                  setSelectedTripId(trip.id);
                  navigate(`${ROUTES.TRIPS}/${trip.id}`);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedTripId === trip.id
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-border-default/60 bg-white hover:bg-bg-section-alt'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-text-primary font-mono">#{trip.tripNumber}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-primary-light text-brand-primary font-bold">
                    {trip.status}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-1 truncate">
                  {trip.driverName || t('drivers.monitor.unassigned')}
                </p>
                <p className="text-[10px] text-text-tertiary mt-0.5">
                  {t('drivers.monitor.ordersCount', { count: trip.orderCount })}
                </p>
              </button>
            ))}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="rounded-xl overflow-hidden border border-border-default/60" style={{ height: '500px' }}>
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={defaultCenter}
                  zoom={11}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                  }}
                >
                  {activeTrips.map((trip) => (
                    <Marker
                      key={trip.id}
                      position={defaultCenter}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: selectedTripId === trip.id ? 12 : 8,
                        fillColor: selectedTripId === trip.id ? '#2563EB' : '#6B7280',
                        fillOpacity: 1,
                        strokeColor: '#FFFFFF',
                        strokeWeight: 3,
                      }}
                      onClick={() => {
                        setSelectedTripId(trip.id);
                        navigate(`${ROUTES.TRIPS}/${trip.id}`);
                      }}
                    >
                      {selectedTripId === trip.id && (
                        <InfoWindow onCloseClick={() => setSelectedTripId(null)}>
                          <div className="text-xs">
                            <p className="font-bold text-sm mb-1">#{trip.tripNumber}</p>
                            <p>{trip.driverName || '—'}</p>
                            <p className="text-text-secondary mt-1">{trip.status}</p>
                          </div>
                        </InfoWindow>
                      )}
                    </Marker>
                  ))}
                </GoogleMap>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <div className="flex items-center gap-2 text-text-tertiary">
                    <Navigation size={16} className="animate-pulse" />
                    <span className="text-sm">{t('orders.tracking.loadingMap')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
