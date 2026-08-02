import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeliverySlots, useCreateDeliverySlot, useUpdateDeliverySlot, useWarehouseOptions, useZoneOptions } from '../hooks/useRegions';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Clock, Plus, CalendarDays, Truck, Users } from 'lucide-react';
import { useFormatPrice } from '@/hooks/useFormatPrice';

interface DeliverySlotsSectionProps {
  zoneId: number;
}

export function DeliverySlotsSection({ zoneId }: DeliverySlotsSectionProps) {
  const { t } = useTranslation();
  const formatPrice = useFormatPrice();
  const { data: slots, isLoading } = useDeliverySlots(zoneId);
  const createSlot = useCreateDeliverySlot();
  const updateSlot = useUpdateDeliverySlot();
  const { data: warehouses = [] } = useWarehouseOptions();
  const { data: zones = [] } = useZoneOptions();

  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({
    warehouse_id: 0,
    zone_id: 0,
    trip_date: '',
    departure_time: '',
    cutoff_time: '23:59',
    max_capacity: 50,
    delivery_fee: 0,
  });

  useEffect(() => {
    if (warehouses.length > 0 && zones.length > 0) {
      setForm((prev) => ({
        ...prev,
        warehouse_id: warehouses[0].id,
        zone_id: zones[0].id,
      }));
    }
  }, [warehouses, zones]);

  const handleCreate = () => {
    createSlot.mutate(form, {
      onSuccess: () => setCreateModal(false),
    });
  };

  const toggleAvailability = (slot: any) => {
    updateSlot.mutate({ id: slot.id, data: { is_available: !slot.is_available } });
  };

  if (isLoading) {
    return <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />;
  }

  const zoneSlots = slots || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-brand-primary" />
          <h3 className="text-sm font-bold text-text-primary font-display">{t('regions.slots.title')}</h3>
          <span className="text-xs text-text-tertiary">({zoneSlots.length})</span>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setCreateModal(true)}>
          {t('regions.slots.addSlot')}
        </Button>
      </div>

      {zoneSlots.length === 0 ? (
        <EmptyState title={t('regions.slots.noSlots')} description={t('regions.slots.addFirst')} />
      ) : (
        <div className="space-y-2">
          {zoneSlots.map((slot: any) => (
            <div key={slot.id} className={`p-3 rounded-xl border transition-all ${slot.is_available ? 'border-border-default/60' : 'border-border-default/30 opacity-60'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CalendarDays size={16} className="text-text-tertiary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary font-body">
                        {new Date(slot.trip_date).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-text-primary font-body">{slot.departure_time}–{slot.cutoff_time}</span>
                      <Badge variant={slot.is_available ? 'green' : 'red'} size="sm">
                        {slot.is_available ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-tertiary font-body mt-1">
                      <span className="flex items-center gap-1"><Truck size={12} /> {t('regions.slots.capacity', { count: slot.max_capacity })}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {t('regions.slots.booked', { count: slot.booked_count || 0 })}</span>
                      {slot.warehouse && <span>{slot.warehouse.name}</span>}
                      <span>{formatPrice(slot.delivery_fee)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleAvailability(slot)}
                    className="text-xs text-text-secondary hover:text-brand-primary px-2 py-1 rounded-lg hover:bg-bg-section-alt transition-all font-body"
                  >
                    {slot.is_available ? t('common.deactivate') : t('common.activate')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Slot Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title={t('regions.slots.createTitle')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('regions.slots.warehouse')}</label>
              <select
                value={form.warehouse_id}
                onChange={(e) => setForm({ ...form, warehouse_id: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              >
                <option value={0} disabled>{t('common.select')}</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('regions.slots.zone')}</label>
              <select
                value={form.zone_id}
                onChange={(e) => setForm({ ...form, zone_id: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              >
                <option value={0} disabled>{t('common.select')}</option>
                {zones.map((z: any) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('regions.slots.date')}</label>
            <input type="date" value={form.trip_date} onChange={(e) => setForm({ ...form, trip_date: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('regions.slots.departure')}</label>
              <input type="time" value={form.departure_time} onChange={(e) => setForm({ ...form, departure_time: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('regions.slots.cutoff')}</label>
              <input type="time" value={form.cutoff_time} onChange={(e) => setForm({ ...form, cutoff_time: e.target.value })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('regions.slots.maxCapacity')}</label>
              <input type="number" min={1} value={form.max_capacity} onChange={(e) => setForm({ ...form, max_capacity: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('regions.slots.deliveryFee')}</label>
              <input type="number" min={0} step={0.5} value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setCreateModal(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" isLoading={createSlot.isPending} onClick={handleCreate}>{t('regions.slots.create')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
