import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleMap, Marker, Polygon, useJsApiLoader } from '@react-google-maps/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { GOOGLE_MAPS_LOADER_OPTIONS, DEFAULT_MAP_CENTER, MAP_CONTAINER_STYLE } from '@/config/googleMaps';
import { regionsApi, type Region } from '../api/regionsApi';
import { Map, MapPin, Square, Undo2, Trash2, Save } from 'lucide-react';

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

const OTHER_ZONE_OPTIONS: google.maps.PolygonOptions = {
  fillColor: '#94a3b8',
  fillOpacity: 0.12,
  strokeColor: '#64748b',
  strokeOpacity: 0.6,
  strokeWeight: 1.5,
  editable: false,
  clickable: false,
  zIndex: 0,
};

type ToolMode = 'points' | 'rectangle';

interface LatLng {
  lat: number;
  lng: number;
}

// Min drag distance (~15m) so a plain click in rectangle mode doesn't create a degenerate ring.
const MIN_DRAG_DEGREES = 0.00015;

const isShiftDown = (e: google.maps.MapMouseEvent): boolean =>
  e.domEvent && typeof e.domEvent === 'object' && 'shiftKey' in e.domEvent
    ? Boolean((e.domEvent as MouseEvent).shiftKey)
    : false;

function rectFromCorners(a: LatLng, b: LatLng, square: boolean): LatLng[] {
  const minLat = Math.min(a.lat, b.lat);
  const maxLat = Math.max(a.lat, b.lat);
  const minLng = Math.min(a.lng, b.lng);
  const maxLng = Math.max(a.lng, b.lng);

  let south = minLat;
  let north = maxLat;
  let west = minLng;
  let east = maxLng;

  if (square) {
    const latSpan = north - south;
    const lngSpan = east - west;
    const side = Math.max(latSpan, lngSpan);
    const dirLat = latSpan >= lngSpan ? 1 : b.lat >= a.lat ? 1 : -1;
    const dirLng = lngSpan >= latSpan ? 1 : b.lng >= a.lng ? 1 : -1;
    if (latSpan >= lngSpan) {
      south = a.lat;
      north = a.lat + dirLat * side;
    } else {
      west = a.lng;
      east = a.lng + dirLng * side;
    }
  }

  return [
    { lat: Math.min(south, north), lng: Math.min(west, east) },
    { lat: Math.min(south, north), lng: Math.max(west, east) },
    { lat: Math.max(south, north), lng: Math.max(west, east) },
    { lat: Math.max(south, north), lng: Math.min(west, east) },
  ];
}

export function PolygonEditor({ open, onClose, onSave, initialBoundaries }: PolygonEditorProps) {
  const { t } = useTranslation();
  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_LOADER_OPTIONS);
  const mapRef = useRef<google.maps.Map | null>(null);

  const [mode, setMode] = useState<ToolMode>('points');
  const [points, setPoints] = useState<LatLng[]>(() => {
    if (initialBoundaries && initialBoundaries.length > 0) {
      return initialBoundaries[0];
    }
    return [];
  });
  const [dragStart, setDragStart] = useState<LatLng | null>(null);
  const [dragCurrent, setDragCurrent] = useState<LatLng | null>(null);
  const [squareLock, setSquareLock] = useState(false);
  const [otherZones, setOtherZones] = useState<Region[]>([]);

  useEffect(() => {
    if (!open) return;
    regionsApi
      .getPageData({ perPage: 200 })
      .then((d) => setOtherZones(d.regions.filter((z) => z.boundaries && z.boundaries.length > 0)))
      .catch(() => setOtherZones([]));
  }, [open]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (mode !== 'points') return;
    if (!e.latLng) return;
    setPoints((prev) => (prev.length < 50 ? [...prev, { lat: e.latLng!.lat(), lng: e.latLng!.lng() }] : prev));
  }, [mode]);

  const handleMouseDown = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (mode !== 'rectangle') return;
      if (!e.latLng) return;
      setSquareLock(isShiftDown(e));
      setDragStart({ lat: e.latLng!.lat(), lng: e.latLng!.lng() });
      setDragCurrent({ lat: e.latLng!.lat(), lng: e.latLng!.lng() });
    },
    [mode],
  );

  const handleMouseMove = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      if (!dragStart && !dragCurrent) return;
      setSquareLock(isShiftDown(e));
      setDragCurrent({ lat: e.latLng!.lat(), lng: e.latLng!.lng() });
    },
    [dragStart, dragCurrent],
  );

  const commitDrag = useCallback(() => {
    if (!dragStart || !dragCurrent) return;
    const dLat = Math.abs(dragCurrent.lat - dragStart.lat);
    const dLng = Math.abs(dragCurrent.lng - dragStart.lng);
    if (dLat < MIN_DRAG_DEGREES && dLng < MIN_DRAG_DEGREES) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }
    const rect = rectFromCorners(dragStart, dragCurrent, squareLock);
    setPoints((prev) => [...prev, ...rect]);
    setDragStart(null);
    setDragCurrent(null);
    setSquareLock(false);
  }, [dragStart, dragCurrent, squareLock]);

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

  const pendingRect = dragStart && dragCurrent ? rectFromCorners(dragStart, dragCurrent, squareLock) : null;

  const polyCenter = points.length > 0
    ? { lat: points[Math.floor(points.length / 2)].lat, lng: points[Math.floor(points.length / 2)].lng }
    : DEFAULT_MAP_CENTER;

  const maxPointsReached = points.length >= 50;

  return (
    <Modal open={open} onClose={onClose} size="full" title={t('regions.zoneForm.boundaryTitle', 'Define Zone Boundary')}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <Map size={16} className="text-purple-600" />
            {mode === 'points' ? (
              <span>
                {points.length === 0
                  ? t('regions.zoneForm.clickToAdd', 'Click on the map to add boundary points')
                  : t('regions.zoneForm.pointsCount', '{{count}} points', { count: points.length })}
              </span>
            ) : (
              <span>
                {t('regions.zoneForm.dragForRect', 'Drag on the map to draw a rectangle')}
                {squareLock && ' · ' + t('regions.zoneForm.squareLocked', 'Square locked (Shift)')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-border-default p-1">
              <Button
                variant={mode === 'points' ? 'primary' : 'ghost'}
                size="sm"
                leftIcon={<MapPin size={14} />}
                onClick={() => setMode('points')}
              >
                {t('regions.zoneForm.pointsTool', 'Points')}
              </Button>
              <Button
                variant={mode === 'rectangle' ? 'primary' : 'ghost'}
                size="sm"
                leftIcon={<Square size={14} />}
                onClick={() => setMode('rectangle')}
              >
                {t('regions.zoneForm.rectangleTool', 'Rectangle')}
              </Button>
            </div>
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
                draggableCursor: !maxPointsReached ? 'crosshair' : 'default',
              }}
              onClick={!maxPointsReached ? handleMapClick : undefined}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={commitDrag}
              onLoad={(map) => {
                mapRef.current = map;
              }}
            >
              {otherZones.map((zone) =>
                zone.boundaries!.map((ring, ringIdx) => (
                  <Polygon key={`other-${zone.id}-${ringIdx}`} paths={ring} options={OTHER_ZONE_OPTIONS} />
                )),
              )}
              {points.map((point, i) => (
                <Marker
                  key={`${i}-${point.lat.toFixed(6)}-${point.lng.toFixed(6)}`}
                  position={point}
                  label={{
                    text: String(i + 1),
                    color: '#7c3aed',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                  zIndex={2}
                />
              ))}
              {pendingRect && <Polygon paths={pendingRect} options={{ ...POLYGON_OPTIONS, fillOpacity: 0.15, zIndex: 3 }} />}
              {points.length >= 3 && (
                <Polygon paths={points} options={{ ...POLYGON_OPTIONS, zIndex: 2 }} />
              )}
            </GoogleMap>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-text-secondary font-body">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-3 rounded-sm" style={{ backgroundColor: 'rgba(124,58,237,0.25)', border: '1.5px solid #7c3aed' }} />
              {t('regions.zoneForm.currentZone', 'This zone')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-3 rounded-sm" style={{ backgroundColor: 'rgba(148,163,184,0.12)', border: '1.5px solid #64748b' }} />
              {t('regions.zoneForm.otherZones', 'Existing zones')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSave} disabled={points.length < 3}>
              {t('common.save', 'Save')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}