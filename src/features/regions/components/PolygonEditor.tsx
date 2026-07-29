import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleMap, Marker, Polygon, useJsApiLoader } from '@react-google-maps/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { GOOGLE_MAPS_LOADER_OPTIONS, DEFAULT_MAP_CENTER, MAP_CONTAINER_STYLE } from '@/config/googleMaps';
import { Map, Undo2, Trash2, Save } from 'lucide-react';

interface PolygonEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (boundaries: { lat: number; lng: number }[][]) => void;
  initialBoundaries?: { lat: number; lng: number }[][] | null;
}

const POLYGON_OPTIONS: google.maps.PolygonOptions = {
  fillColor: '#7c3aed',
  fillOpacity: 0.25,
  strokeColor: '#7c3aed',
  strokeOpacity: 0.8,
  strokeWeight: 2,
  editable: false,
};

export function PolygonEditor({ open, onClose, onSave, initialBoundaries }: PolygonEditorProps) {
  const { t } = useTranslation();
  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_LOADER_OPTIONS);
  const mapRef = useRef<google.maps.Map | null>(null);

  const [points, setPoints] = useState<{ lat: number; lng: number }[]>(() => {
    if (initialBoundaries && initialBoundaries.length > 0) {
      return initialBoundaries[0];
    }
    return [];
  });

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    setPoints((prev) => [...prev, { lat: e.latLng!.lat(), lng: e.latLng!.lng() }]);
  }, []);

  const handleUndo = useCallback(() => {
    setPoints((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setPoints([]);
  }, []);

  const handleSave = useCallback(() => {
    if (points.length < 3) return;
    onSave([points]);
    onClose();
  }, [points, onSave, onClose]);

  const polyCenter = points.length > 0
    ? { lat: points[Math.floor(points.length / 2)].lat, lng: points[Math.floor(points.length / 2)].lng }
    : DEFAULT_MAP_CENTER;

  return (
    <Modal open={open} onClose={onClose} size="full" title={t('regions.zoneForm.boundaryTitle', 'Define Zone Boundary')}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <Map size={16} className="text-purple-600" />
            <span>
              {points.length === 0
                ? t('regions.zoneForm.clickToAdd', 'Click on the map to add boundary points')
                : t('regions.zoneForm.pointsCount', '{{count}} points', { count: points.length })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" leftIcon={<Undo2 size={14} />} onClick={handleUndo} disabled={points.length === 0}>
              {t('common.undo', 'Undo')}
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} />} onClick={handleClear} disabled={points.length === 0}>
              {t('common.clear', 'Clear')}
            </Button>
          </div>
        </div>

        <div className="h-96 rounded-xl overflow-hidden border border-border-default">
          {!isLoaded ? (
            <div className="h-full flex items-center justify-center bg-gray-100 text-sm text-text-secondary">
              {t('common.loading', 'Loading...')}
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ ...MAP_CONTAINER_STYLE, height: '100%' }}
              center={polyCenter}
              zoom={12}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                draggableCursor: points.length < 50 ? 'crosshair' : 'default',
              }}
              onClick={points.length < 50 ? handleMapClick : undefined}
              onLoad={(map) => { mapRef.current = map; }}
            >
              {points.map((point, i) => (
                <Marker
                  key={i}
                  position={point}
                  label={{
                    text: String(i + 1),
                    color: '#7c3aed',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
              ))}
              {points.length >= 3 && (
                <Polygon paths={points} options={POLYGON_OPTIONS} />
              )}
            </GoogleMap>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSave} disabled={points.length < 3}>
            {t('common.save', 'Save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
