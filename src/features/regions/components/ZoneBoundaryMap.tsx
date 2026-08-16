import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleMap, InfoWindow, Polygon, useJsApiLoader } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { GOOGLE_MAPS_LOADER_OPTIONS, DEFAULT_MAP_CENTER, MAP_CONTAINER_STYLE } from '@/config/googleMaps';
import { ROUTES } from '@/routes/routes';
import type { Region } from '../api/regionsApi';

interface ZoneBoundaryMapProps {
  zones: Region[];
}

const ZONE_COLORS = [
  '#7c3aed',
  '#0d9488',
  '#e11d48',
  '#d97706',
  '#2563eb',
  '#16a34a',
  '#9333ea',
  '#db2777',
];

export function ZoneBoundaryMap({ zones }: ZoneBoundaryMapProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_LOADER_OPTIONS);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const zoneList = useMemo(() => zones.filter((z) => Array.isArray(z.boundaries) && z.boundaries.length > 0), [zones]);
  const withoutBoundaries = useMemo(() => zones.filter((z) => !Array.isArray(z.boundaries) || z.boundaries.length === 0), [zones]);

  const center = useMemo(() => {
    const first = zoneList[0];
    if (first && first.boundaries) {
      const firstRing = first.boundaries[0];
      const mid = firstRing[Math.floor(firstRing.length / 2)];
      return { lat: mid.lat, lng: mid.lng };
    }
    return DEFAULT_MAP_CENTER;
  }, [zoneList]);

  const zoneLabel = (zone: Region) => {
    const lang = i18n.language?.startsWith('he') ? 'he' : i18n.language?.startsWith('ru') ? 'ru' : null;
    if (lang === 'he' && zone.nameHe) return zone.nameHe;
    if (lang === 'ru' && zone.nameRu) return zone.nameRu;
    return zone.name;
  };

  if (!isLoaded) {
    return (
      <div className="h-96 rounded-xl overflow-hidden border border-border-default flex items-center justify-center bg-gray-100 text-sm text-text-secondary">
        {t('common.loading', 'Loading...')}
      </div>
    );
  }

  if (zoneList.length === 0) {
    return (
      <div className="h-96 rounded-xl overflow-hidden border border-border-default flex items-center justify-center bg-gray-100 text-sm text-text-secondary">
        {t('regions.map.noBoundaries', 'No zones with drawn boundaries yet — open a zone and draw its boundary first.')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-96 rounded-xl overflow-hidden border border-border-default">
        <GoogleMap
          mapContainerStyle={{ ...MAP_CONTAINER_STYLE, height: '100%' }}
          center={center}
          zoom={11}
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
        >
          {zoneList.map((zone, i) => {
            const color = ZONE_COLORS[i % ZONE_COLORS.length];
            return (
              <Polygon
                key={zone.id}
                paths={zone.boundaries!}
                options={{
                  fillColor: color,
                  fillOpacity: 0.25,
                  strokeColor: color,
                  strokeOpacity: 0.9,
                  strokeWeight: 2,
                  clickable: true,
                  zIndex: zone.isActive ? 1 : 0,
                }}
                onClick={() => setSelectedId(zone.id)}
              />
            );
          })}
          {zoneList.map((zone, i) => {
            if (selectedId !== zone.id || !zone.boundaries) return null;
            const firstRing = zone.boundaries[0];
            const mid = firstRing[Math.floor(firstRing.length / 2)];
            return (
              <InfoWindow
                key={`info-${zone.id}`}
                position={mid}
                onCloseClick={() => setSelectedId(null)}
              >
                <div className="text-sm">
                  <p className="font-bold" style={{ color: ZONE_COLORS[i % ZONE_COLORS.length] }}>{zoneLabel(zone)}</p>
                  <p className="text-text-secondary">{zone.code}</p>
                  <button
                    className="mt-1 text-brand-primary font-semibold underline"
                    onClick={() => navigate(ROUTES.REGION_DETAIL(zone.id))}
                  >
                    {t('regions.map.openZone', 'Open zone')}
                  </button>
                </div>
              </InfoWindow>
            );
          })}
        </GoogleMap>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {zones.map((zone, i) => (
          <button
            key={zone.id}
            onClick={() => zone.boundaries ? navigate(ROUTES.REGION_DETAIL(zone.id)) : undefined}
            className="flex items-center gap-2 rounded-lg border border-border-default px-3 py-2 text-left hover:bg-gray-50 transition-colors"
          >
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: zone.boundaries ? ZONE_COLORS[i % ZONE_COLORS.length] : '#d1d5db' }}
            />
            <span className="text-sm font-semibold text-text-primary font-body truncate">{zoneLabel(zone)}</span>
            <span className="text-xs text-text-tertiary font-body">
              {zone.boundaries ? t('regions.map.drawn', 'drawn') : t('regions.map.notDrawn', 'no boundary')}
            </span>
          </button>
        ))}
      </div>

      {withoutBoundaries.length > 0 && (
        <p className="text-xs text-text-secondary font-body">
          {t('regions.map.withoutBoundaries', '{{count}} zones have no drawn boundary yet.', { count: withoutBoundaries.length })}
        </p>
      )}
    </div>
  );
}