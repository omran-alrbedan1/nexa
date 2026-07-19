import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { DeliverySlot } from '../api/deliverySlotsApi';

interface DeliverySlotFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    zone_id: number;
    trip_date: string;
    departure_time: string;
    cutoff_time?: string;
    max_capacity?: number;
    delivery_fee?: number;
  }) => void;
  isSaving: boolean;
  editSlot?: DeliverySlot | null;
}

const defaultForm = {
  zone_id: 1,
  trip_date: '',
  departure_time: '',
  cutoff_time: '23:59',
  max_capacity: 50,
  delivery_fee: 0,
};

export function DeliverySlotForm({ open, onClose, onSave, isSaving, editSlot }: DeliverySlotFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (editSlot) {
      setForm({
        zone_id: editSlot.zone?.id || 1,
        trip_date: editSlot.trip_date,
        departure_time: editSlot.departure_time,
        cutoff_time: editSlot.cutoff_time || '23:59',
        max_capacity: editSlot.max_capacity,
        delivery_fee: editSlot.delivery_fee,
      });
    } else {
      setForm(defaultForm);
    }
  }, [editSlot, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editSlot ? t('deliverySlots.form.editTitle') : t('deliverySlots.form.createTitle')}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('deliverySlots.form.date')}</label>
          <input
            type="date"
            value={form.trip_date}
            onChange={(e) => setForm({ ...form, trip_date: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('deliverySlots.form.departure')}</label>
            <input
              type="time"
              value={form.departure_time}
              onChange={(e) => setForm({ ...form, departure_time: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('deliverySlots.form.cutoff')}</label>
            <input
              type="time"
              value={form.cutoff_time}
              onChange={(e) => setForm({ ...form, cutoff_time: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('deliverySlots.form.maxCapacity')}</label>
            <input
              type="number"
              min={1}
              value={form.max_capacity}
              onChange={(e) => setForm({ ...form, max_capacity: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('deliverySlots.form.deliveryFee')}</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={form.delivery_fee}
              onChange={(e) => setForm({ ...form, delivery_fee: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isSaving}
            onClick={() => onSave(form)}
          >
            {editSlot ? t('common.save') : t('deliverySlots.form.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
