import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ServiceRegionFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { code: string; name_ar: string; name_en?: string; country_code?: string; display_order?: number; is_active?: boolean }) => void;
  isSaving: boolean;
  editing?: { code: string; name_ar: string; name_en: string | null; country_code: string | null; display_order: number; is_active: boolean } | null;
}

export function ServiceRegionForm({ open, onClose, onSave, isSaving, editing }: ServiceRegionFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    code: '',
    name_ar: '',
    name_en: '',
    country_code: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (editing) {
      setForm({
        code: editing.code,
        name_ar: editing.name_ar,
        name_en: editing.name_en || '',
        country_code: editing.country_code || '',
        display_order: editing.display_order,
        is_active: editing.is_active,
      });
    } else {
      setForm({ code: '', name_ar: '', name_en: '', country_code: '', display_order: 0, is_active: true });
    }
  }, [editing, open]);

  const handleSave = () => {
    onSave({
      code: form.code.toUpperCase(),
      name_ar: form.name_ar,
      ...(form.name_en ? { name_en: form.name_en } : {}),
      ...(form.country_code ? { country_code: form.country_code.toUpperCase() } : {}),
      display_order: form.display_order,
      is_active: form.is_active,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t('locations.serviceRegions.form.editTitle') : t('locations.serviceRegions.form.createTitle')}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('locations.serviceRegions.form.code')} *</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary font-mono uppercase"
              placeholder="SR-01"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('locations.serviceRegions.form.countryCode')}</label>
            <input
              value={form.country_code}
              onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary font-mono uppercase"
              placeholder="SA"
              maxLength={2}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('locations.serviceRegions.form.nameAr')} *</label>
            <input
              value={form.name_ar}
              onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              dir="rtl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('locations.serviceRegions.form.nameEn')}</label>
            <input
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('locations.serviceRegions.form.displayOrder')}</label>
          <input
            type="number"
            min={0}
            value={form.display_order}
            onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
          />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-border-default text-brand-primary focus:ring-brand-primary"
            />
            <span className="text-sm font-bold text-text-primary font-body">{t('common.active')}</span>
          </label>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave} disabled={!form.code.trim() || !form.name_ar.trim()}>
            {editing ? t('common.save') : t('locations.serviceRegions.form.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
