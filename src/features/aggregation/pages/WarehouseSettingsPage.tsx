import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/routes/routes';
import { useToastStore } from '@/stores/toastStore';
import { aggregationApi } from '../api/aggregationApi';
import { regionsApi } from '@/features/regions/api/regionsApi';
import { ArrowLeft, Warehouse, Save, MapPin, Clock } from 'lucide-react';

export function WarehouseSettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => aggregationApi.getWarehouses(),
    staleTime: 60_000,
  });

  const [form, setForm] = useState({
    name: 'Riyadh Main Warehouse',
    nameAr: 'مستودع الرياض الرئيسي',
    address: 'Riyadh, Industrial Zone, Warehouse District',
    capacity: '500',
    isActive: true,
  });
  const { data: zonesData } = useQuery({
    queryKey: ['zones-for-warehouse'],
    queryFn: () => regionsApi.getPageData(),
    staleTime: 60_000,
  });
  const availableZones = zonesData?.regions ?? [];

  const [selectedZones, setSelectedZones] = useState<number[]>([]);

  // Populate form with first warehouse data when loaded
  useEffect(() => {
    if (warehouses && warehouses.length > 0) {
      const w = warehouses[0];
      setForm({
        name: w.name,
        nameAr: '',
        address: w.address,
        capacity: String(w.capacity),
        isActive: w.isActive,
      });
    }
  }, [warehouses]);

  const updateWarehouse = useMutation({
    mutationFn: (data: { name: string; address: string; capacity: number; isActive: boolean; zoneIds: number[] }) =>
      aggregationApi.updateWarehouse(warehouses?.[0]?.id || 1, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      addToast('success', 'Warehouse settings saved');
    },
    onError: () => addToast('error', 'Failed to save warehouse settings'),
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleZone = (zoneId: number) => {
    setSelectedZones((prev) => prev.includes(zoneId) ? prev.filter((z) => z !== zoneId) : [...prev, zoneId]);
  };

  const handleSave = () => {
    if (!form.name) {
      addToast('error', 'Warehouse name is required');
      return;
    }
    updateWarehouse.mutate({
      name: form.name,
      address: form.address,
      capacity: Number(form.capacity) || 0,
      isActive: form.isActive,
      zoneIds: selectedZones,
    });
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <button onClick={() => navigate(ROUTES.AGGREGATION)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors font-body">
        <ArrowLeft size={16} /> {t('aggregation.warehouseSettings.back')}
      </button>

      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-purple-500/10 via-purple-50 to-transparent">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Warehouse size={22} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary font-display">{t('aggregation.warehouseSettings.title')}</h1>
            <p className="text-sm text-text-secondary font-body">{t('aggregation.warehouseSettings.description')}</p>
          </div>
        </div>
      </div>

      <Card padding="lg">
        <h3 className="text-sm font-bold text-text-primary font-display mb-4">{t('aggregation.warehouseSettings.warehouseInfo')}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('aggregation.warehouseSettings.nameEn')}</label>
              <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('aggregation.warehouseSettings.nameAr')}</label>
              <input value={form.nameAr} onChange={(e) => handleChange('nameAr', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" dir="rtl" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">{t('aggregation.warehouseSettings.address')}</label>
            <textarea value={form.address} onChange={(e) => handleChange('address', e.target.value)} rows={2} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">{t('aggregation.warehouseSettings.capacity')}</label>
              <input type="number" min="0" value={form.capacity} onChange={(e) => handleChange('capacity', e.target.value)} className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} className="w-4 h-4 rounded border-border-default text-brand-primary focus:ring-brand-primary" />
                <span className="text-sm font-bold text-text-primary font-body">{t('aggregation.warehouseSettings.active')}</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={16} className="text-purple-600" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('aggregation.warehouseSettings.zoneAssignments')}</h3>
        </div>
        <p className="text-xs text-text-secondary font-body mb-4">{t('aggregation.warehouseSettings.zoneAssignmentsDesc')}</p>
        <div className="space-y-2">
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
          <h3 className="text-sm font-bold text-text-primary font-display">{t('aggregation.warehouseSettings.workingHours')}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">{t('aggregation.warehouseSettings.openingTime')}</label>
            <input type="time" defaultValue="07:00" className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">{t('aggregation.warehouseSettings.closingTime')}</label>
            <input type="time" defaultValue="23:00" className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-brand-primary" />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSave} isLoading={updateWarehouse.isPending}>{t('aggregation.warehouseSettings.save')}</Button>
        <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.AGGREGATION)}>{t('aggregation.warehouseSettings.cancel')}</Button>
      </div>
    </div>
  );
}
