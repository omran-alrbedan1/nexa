import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ProvinceFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name_ar: string; name_en?: string; is_active?: boolean }) => void;
  isSaving: boolean;
  countryCode?: string;
  editing?: { name_ar: string; name_en: string | null; is_active: boolean } | null;
}

export function ProvinceForm({ open, onClose, onSave, isSaving, countryCode, editing }: ProvinceFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name_ar: '', name_en: '', is_active: true });

  useEffect(() => {
    if (editing) {
      setForm({
        name_ar: editing.name_ar,
        name_en: editing.name_en || '',
        is_active: editing.is_active,
      });
    } else {
      setForm({ name_ar: '', name_en: '', is_active: true });
    }
  }, [editing, open]);

  const handleSave = () => {
    onSave({
      name_ar: form.name_ar,
      ...(form.name_en ? { name_en: form.name_en } : {}),
      is_active: form.is_active,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t('locations.provinces.form.editTitle') : t('locations.provinces.form.createTitle')}
    >
      <div className="space-y-4">
        {countryCode && (
          <div className="text-xs text-text-tertiary bg-bg-section-alt rounded-lg px-3 py-2">
            {t('locations.provinces.form.country')}: <span className="font-bold uppercase">{countryCode}</span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('locations.provinces.form.nameAr')} *</label>
            <input
              value={form.name_ar}
              onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              dir="rtl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('locations.provinces.form.nameEn')}</label>
            <input
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            />
          </div>
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
          <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave} disabled={!form.name_ar.trim()}>
            {editing ? t('common.save') : t('locations.provinces.form.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
