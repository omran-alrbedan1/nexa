import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWarehouse, useCreateWarehouse, useUpdateWarehouse } from '../hooks/useWarehouses';
import { regionsApi } from '@/features/regions/api/regionsApi';
import { useToastStore } from '@/stores/toastStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TranslatedField, type TranslatedLang } from '@/components/ui/TranslatedField';
import { ROUTES } from '@/routes/routes';
import { ArrowLeft, Warehouse, Save, MapPin, Clock, Map } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_LOADER_OPTIONS, DEFAULT_MAP_CENTER } from '@/config/googleMaps';

export function WarehouseFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const warehouseId = parseInt(id || '0', 10);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const { data: existing, isLoading: loadingExisting } = useWarehouse(warehouseId);
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();

  const { data: zonesData } = useQuery({
    queryKey: ['zones-for-warehouse-form'],
    queryFn: () => regionsApi.getPageData(),
    staleTime: 60_000,
  });
  const availableZones = zonesData?.regions ?? [];

  const [form, setForm] = useState({
    code: '',
    name: '',
    names: {} as Partial<Record<TranslatedLang, string>>,
    zoneId: 0,
    address: '',
    capacity: '',
    isActive: true,
    openingTime: '07:00',
    closingTime: '23:00',
    latitude: '',
    longitude: '',
  });
  const [selectedZones, setSelectedZones] = useState<number[]>([]);

  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_LOADER_OPTIONS);

  const mapCenter = form.latitude && form.longitude
    ? { lat: Number(form.latitude), lng: Number(form.longitude) }
    : DEFAULT_MAP_CENTER;

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat();
    const lng = e.latLng?.lng();
    if (lat !== undefined && lng !== undefined) {
      setForm((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng) }));
    }
  }, []);

  useEffect(() => {
    if (isEdit && existing) {
      setForm({
        code: existing.code,
        name: existing.name,
        names: { en: existing.name, ar: existing.nameAr, he: existing.nameHe, ru: existing.nameRu },
        zoneId: existing.zone?.id || 0,
        address: existing.address || '',
        capacity: String(existing.capacity || ''),
        isActive: existing.isActive,
        openingTime: existing.workingHours?.opening || '07:00',
        closingTime: existing.workingHours?.closing || '23:00',
        latitude: existing.latitude ? String(existing.latitude) : '',
        longitude: existing.longitude ? String(existing.longitude) : '',
      });
      setSelectedZones(existing.zones.map((z) => z.id));
    }
  }, [isEdit, existing]);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleZone = (zoneId: number) => {
    setSelectedZones((prev) => prev.includes(zoneId) ? prev.filter((z) => z !== zoneId) : [...prev, zoneId]);
  };

  const handleSave = () => {
    if (!form.code.trim()) { addToast('error', t('warehouses.form.codeRequired')); return; }
    if (!form.name.trim()) { addToast('error', t('warehouses.form.nameRequired')); return; }
    if (!form.zoneId) { addToast('error', t('warehouses.form.zoneRequired')); return; }

    const data = {
      code: form.code.trim(),
      name: form.name.trim(),
      nameAr: form.names.ar?.trim() || undefined,
      nameHe: form.names.he?.trim() || undefined,
      nameRu: form.names.ru?.trim() || undefined,
      zoneId: form.zoneId,
      address: form.address.trim() || undefined,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      isActive: form.isActive,
      workingHours: { opening: form.openingTime, closing: form.closingTime },
      zoneIds: selectedZones,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    };

    if (isEdit) {
      updateWarehouse.mutate({ id: warehouseId, data }, {
        onSuccess: () => {
          addToast('success', t('warehouses.toast.updated'));
          navigate(ROUTES.WAREHOUSES);
        },
        onError: () => addToast('error', t('warehouses.toast.updateFailed')),
      });
    } else {
      createWarehouse.mutate(data, {
        onSuccess: () => {
          addToast('success', t('warehouses.toast.created'));
          navigate(ROUTES.WAREHOUSES);
        },
        onError: () => addToast('error', t('warehouses.toast.createFailed')),
      });
    }
  };

  if (isEdit && loadingExisting) {
    return (
      <div className="space-y-6 animate-fade-up max-w-3xl">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <button onClick={() => navigate(ROUTES.WAREHOUSES)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('warehouses.form.backToList')}
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-purple-500/10 via-purple-50 to-transparent">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Warehouse size={22} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">
              {isEdit ? t('warehouses.form.editTitle') : t('warehouses.form.createTitle')}
            </h1>
            <p className="text-sm text-text-secondary font-body">{t('warehouses.form.description')}</p>
          </div>
        </div>
      </div>

      <Card padding="lg">
        <h3 className="text-sm font-bold text-text-primary font-display mb-4">{t('warehouses.form.warehouseInfo')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">{t('warehouses.form.code')} *</label>
            <input value={form.code} onChange={(e) => handleChange('code', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary font-mono" placeholder={t('warehouses.form.codePlaceholder')} />
          </div>
          <TranslatedField
            label={`${t('warehouses.form.nameEn')} *`}
            values={form.names}
            onChange={(key, value) => {
              const next = { ...form.names, [key]: value };
              setForm({ ...form, names: next, name: next.en || form.name });
            }}
            required
          />

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">{t('warehouses.form.zone')} *</label>
            <select
              value={form.zoneId}
              onChange={(e) => handleChange('zoneId', Number(e.target.value))}
              className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary"
            >
              <option value={0}>{t('warehouses.form.selectZone')}</option>
              {availableZones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">{t('warehouses.form.address')}</label>
            <textarea value={form.address} onChange={(e) => handleChange('address', e.target.value)} rows={2} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary resize-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-2 flex items-center gap-1.5">
              <Map size={14} className="text-purple-600" />
              {t('warehouses.form.location')}
            </label>
            {isLoaded ? (
              <div className="rounded-xl overflow-hidden border border-border-default/60 mb-3" style={{ height: '260px' }}>
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={mapCenter}
                  zoom={12}
                  options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
                  onClick={handleMapClick}
                >
                  {form.latitude && form.longitude && (
                    <Marker
                      position={{ lat: Number(form.latitude), lng: Number(form.longitude) }}
                      draggable
                      onDragEnd={(e) => {
                        const lat = e.latLng?.lat();
                        const lng = e.latLng?.lng();
                        if (lat !== undefined && lng !== undefined) {
                          setForm((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng) }));
                        }
                      }}
                    />
                  )}
                </GoogleMap>
              </div>
            ) : (
              <div className="h-[260px] bg-gray-100 rounded-xl flex items-center justify-center text-sm text-text-secondary mb-3">
                {t('warehouses.form.loadingMap')}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">{t('warehouses.form.latitude')}</label>
                <input type="number" step="any" value={form.latitude} onChange={(e) => handleChange('latitude', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder={t('warehouses.form.latitudePlaceholder')} />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">{t('warehouses.form.longitude')}</label>
                <input type="number" step="any" value={form.longitude} onChange={(e) => handleChange('longitude', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" placeholder={t('warehouses.form.longitudePlaceholder')} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('warehouses.form.capacity')}</label>
              <input type="number" min="0" value={form.capacity} onChange={(e) => handleChange('capacity', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => handleChange('isActive', e.target.checked)} className="w-4 h-4 rounded border-border-default text-brand-primary focus:ring-brand-primary" />
                <span className="text-sm font-bold text-text-primary font-body">{t('warehouses.form.active')}</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={16} className="text-purple-600" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('warehouses.form.zoneAssignments')}</h3>
        </div>
        <p className="text-xs text-text-secondary font-body mb-4">{t('warehouses.form.zoneAssignmentsDesc')}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {availableZones.map((zone) => (
            <label key={zone.id} className="flex items-center gap-3 p-3 rounded-xl border border-border-default/60 hover:border-brand-primary/20 cursor-pointer transition-all">
              <input type="checkbox" checked={selectedZones.includes(zone.id)} onChange={() => toggleZone(zone.id)} className="w-4 h-4 rounded border-border-default text-brand-primary focus:ring-brand-primary" />
              <span className="text-sm font-bold text-text-primary font-body">{zone.name}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-purple-600" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('warehouses.form.workingHours')}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xs">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">{t('warehouses.form.openingTime')}</label>
            <input type="time" value={form.openingTime} onChange={(e) => handleChange('openingTime', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">{t('warehouses.form.closingTime')}</label>
            <input type="time" value={form.closingTime} onChange={(e) => handleChange('closingTime', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSave} isLoading={createWarehouse.isPending || updateWarehouse.isPending}>
          {t('warehouses.form.save')}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.WAREHOUSES)}>
          {t('warehouses.form.cancel')}
        </Button>
      </div>
    </div>
  );
}
