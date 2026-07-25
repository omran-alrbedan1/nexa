import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface CountryFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name_ar: string; name_en?: string; code: string; dial_code?: string; is_active?: boolean }) => void;
  isSaving: boolean;
  editing?: { name_ar: string; name_en: string | null; code: string; dial_code: string | null; is_active: boolean } | null;
}

export function CountryForm({ open, onClose, onSave, isSaving, editing }: CountryFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name_ar: '', name_en: '', code: '', dial_code: '', is_active: true });

  useEffect(() => {
    if (editing) {
      setForm({
        name_ar: editing.name_ar,
        name_en: editing.name_en || '',
        code: editing.code,
        dial_code: editing.dial_code || '',
        is_active: editing.is_active,
      });
    } else {
      setForm({ name_ar: '', name_en: '', code: '', dial_code: '', is_active: true });
    }
  }, [editing, open]);

  const handleSave = () => {
    onSave({
      name_ar: form.name_ar,
      ...(form.name_en ? { name_en: form.name_en } : {}),
      code: form.code.toUpperCase(),
      ...(form.dial_code ? { dial_code: form.dial_code } : {}),
      is_active: form.is_active,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t('locations.countries.form.editTitle') : t('locations.countries.form.createTitle')}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('locations.countries.form.nameAr')} *</label>
            <input
              value={form.name_ar}
              onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              dir="rtl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('locations.countries.form.nameEn')}</label>
            <input
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('locations.countries.form.code')} *</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary font-mono uppercase"
              placeholder="SA"
              maxLength={2}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1 font-body">{t('locations.countries.form.dialCode')}</label>
            <input
              value={form.dial_code}
              onChange={(e) => setForm({ ...form, dial_code: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-lg bg-bg-input outline-none focus:border-brand-primary"
              placeholder="966"
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
          <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave} disabled={!form.name_ar.trim() || !form.code.trim()}>
            {editing ? t('common.save') : t('locations.countries.form.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
